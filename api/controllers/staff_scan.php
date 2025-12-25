<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';
include_once '../utils/SessionHelper.php';

$database = new Database();
// We need global connection for Users table
$db = $database->getGlobalConnection();

// Check if staff is authenticated
if (!SessionHelper::isLoggedIn()) {
    echo json_encode(array("status" => "error", "message" => "Utilizador não autenticado."));
    exit();
}

$staffUserId = SessionHelper::getUserId();

$data = json_decode(file_get_contents("php://input"));
$clubSlug = isset($_SERVER['HTTP_X_CLIENT_ID']) ? $_SERVER['HTTP_X_CLIENT_ID'] : '';

if (empty($clubSlug)) {
    echo json_encode(array("status" => "error", "message" => "Club ID não fornecido."));
    exit();
}

// Connect to club database
$clubDb = $database->getClientConnectionBySlug($clubSlug);

if (!$clubDb) {
    echo json_encode(array("status" => "error", "message" => "Erro ao conectar à base de dados do clube."));
    exit();
}

// Action router
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'validate_qr') {
    if (empty($data->qr_code)) {
        echo json_encode(array("status" => "error", "message" => "QR Code não fornecido."));
        exit();
    }

    $qrCode = $data->qr_code;
    $confirm = isset($data->confirm) && $data->confirm === true;

    // DECODE ENCRYPTED/BASE64 QR
    // Frontend encodes as: btoa('VIBE_SECURE:' + code)
    $decoded = base64_decode($qrCode, true);
    if ($decoded !== false && strpos($decoded, 'VIBE_SECURE:') === 0) {
        $qrCode = substr($decoded, 12); // Remove "VIBE_SECURE:" prefix
    }

    try {
        // DETECT TYPE
        if (strpos($qrCode, 'GUEST-') === 0) {
            // --- GUESTLIST LOGIC ---
            handleGuestlistScan($clubDb, $db, $qrCode, $confirm, $staffUserId);

        } elseif (strpos($qrCode, 'REWARD-') === 0 || strpos($qrCode, 'TEMP-') === 0) {
            // --- REWARD LOGIC ---
            // 'TEMP-' handles the "Temporary" QRs if any legacy, but we should aim for REWARD-
            handleRewardScan($clubDb, $db, $qrCode, $confirm, $staffUserId);

        } else {
            echo json_encode(array("status" => "error", "message" => "Formato de QR Code desconhecido."));
            exit();
        }

    } catch (Exception $e) {
        echo json_encode(array("status" => "error", "message" => "Erro: " . $e->getMessage()));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Ação inválida."));
}

// --- HELPER FUNCTIONS ---

// Set timezone for Portugal
date_default_timezone_set('Europe/Lisbon');

function handleGuestlistScan($clubDb, $globalDb, $qrCode, $confirm, $staffUserId)
{
    // 1. Lookup in Guestlist
    $stmt = $clubDb->prepare("
        SELECT 
            gl.id, gl.client_id, gl.event_id, gl.status, gl.checked_in_at, gl.qr_code, gl.rp_id,
            e.name as event_name, e.date as event_date, e.start_time, e.end_time
        FROM guestlist gl
        JOIN events e ON gl.event_id = e.id
        WHERE gl.qr_code = ?
        LIMIT 1
    ");
    $stmt->execute([$qrCode]);
    $guest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$guest) {
        echo json_encode(array("status" => "error", "message" => "Bilhete não encontrado na guestlist."));
        exit();
    }

    // 2. Fetch User Details (Global DB)
    // Photo is in client_profiles table, not users table
    $userStmt = $globalDb->prepare("
        SELECT u.name, u.email, cp.profile_photo_path as photo 
        FROM users u 
        LEFT JOIN client_profiles cp ON u.id = cp.user_id 
        WHERE u.id = ?
    ");
    $userStmt->execute([$guest['client_id']]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    // Fix photo path to be absolute URL
    if ($user && !empty($user['photo'])) {
        // If it's already an absolute URL (http/https), leave it alone
        if (strpos($user['photo'], 'http') !== 0) {
            // It's a relative path. Clean it up.
            // Remove ../ and ./ to avoid path traversal junk if distinct
            $cleanPath = str_replace(array('../', './'), '', $user['photo']);
            // Remove leading slash
            $cleanPath = ltrim($cleanPath, '/');

            // Construct full URL - ALWAYS return URL, don't check file_exists
            // (Browser will handle 404, better than false negative)
            $user['photo'] = 'https://vibe.infinityfree.me/api/' . $cleanPath;
        }
    }

    // 3. Fetch RP Details if exists
    $rpName = 'Direto (Sem RP)';
    if ($guest['rp_id']) {
        $rpStmt = $globalDb->prepare("SELECT name FROM users WHERE id = ?");
        $rpStmt->execute([$guest['rp_id']]);
        $rp = $rpStmt->fetch(PDO::FETCH_ASSOC);
        if ($rp)
            $rpName = $rp['name'];
    }

    $responsePayload = [
        'type' => 'guestlist',
        'client' => $user, // {name, photo, etc}
        'event' => [
            'name' => $guest['event_name'],
            'date' => $guest['event_date']
        ],
        'rp_name' => $rpName,
        'guestlist_status' => $guest['status'],
        'checked_in_at' => $guest['checked_in_at']
    ];

    // 4. Validate Event Date/Time
    try {
        $lisbonTz = new DateTimeZone('Europe/Lisbon');
        $nowDate = new DateTime('now', $lisbonTz);
        $timestamp = $nowDate->format('Y-m-d H:i:s');

        $eventString = $guest['event_date'] . ' ' . $guest['start_time'];
        $eventStart = new DateTime($eventString, $lisbonTz);

        // Check if event hasn't started yet
        if ($nowDate < $eventStart) {
            $formattedStart = $eventStart->format('H:i');
            echo json_encode(array(
                "status" => "error", // Strict block
                "message" => "O evento ainda não começou. (Início: {$formattedStart})",
                "data" => $responsePayload
            ));
            exit();
        }

        // IF CHECKING IN:
        if ($confirm) {
            if ($guest['status'] === 'checked_in') {
                echo json_encode(array(
                    "status" => "warning",
                    "message" => "AVISO: Este bilhete já entrou às " . $guest['checked_in_at'],
                    "data" => $responsePayload
                ));
                exit();
            }

            // Update status
            $upd = $clubDb->prepare("UPDATE guestlist SET status = 'checked_in', checked_in_at = ?, updated_at = ? WHERE id = ?");
            if ($upd->execute([$timestamp, $timestamp, $guest['id']])) {
                $responsePayload['guestlist_status'] = 'checked_in';
                $responsePayload['checked_in_at'] = $timestamp;

                echo json_encode(array(
                    "status" => "success",
                    "message" => "Entrada Confirmada!",
                    "data" => $responsePayload
                ));
            } else {
                echo json_encode(array("status" => "error", "message" => "Erro ao registar entrada na base de dados."));
            }
        } else {
            // PREVIEW MODE
            if ($guest['status'] === 'checked_in') {
                echo json_encode(array(
                    "status" => "warning",
                    "message" => "JÁ ENTROU! Entrada registada às " . $guest['checked_in_at'] . " (Lisboa: " . $nowDate->format('H:i') . ")",
                    "data" => $responsePayload
                ));
            } else {
                echo json_encode(array(
                    "status" => "info",
                    "message" => "Bilhete Válido. Pode entrar.",
                    "data" => $responsePayload
                ));
            }
        }
    } catch (Exception $e) {
        // Fallback if DateTime fails
        echo json_encode(array("status" => "error", "message" => "Erro de Data/Hora: " . $e->getMessage()));
        exit();
    }
}

function handleRewardScan($clubDb, $globalDb, $qrCode, $confirm, $staffUserId)
{
    // 1. Lookup Redemption
    $stmt = $clubDb->prepare("
        SELECT 
            rr.*,
            r.name as reward_original_name
        FROM reward_redemptions rr
        LEFT JOIN rewards r ON rr.reward_id = r.id
        WHERE rr.qr_code = ?
        LIMIT 1
    ");
    $stmt->execute([$qrCode]);
    $redemption = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$redemption) {
        echo json_encode(array("status" => "error", "message" => "Prémio não encontrado."));
        exit();
    }

    // 2. Fetch User Details (Global DB)
    $userStmt = $globalDb->prepare("
        SELECT u.name, u.email, cp.profile_photo_path as photo 
        FROM users u 
        LEFT JOIN client_profiles cp ON u.id = cp.user_id 
        WHERE u.id = ?
    ");
    $userStmt->execute([$redemption['user_id']]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    // Fix photo path to be absolute URL
    if ($user && !empty($user['photo'])) {
        if (strpos($user['photo'], 'http') !== 0) {
            $cleanPath = str_replace(array('../', './'), '', $user['photo']);
            $cleanPath = ltrim($cleanPath, '/');
            // User fix: added /api prefix
            $user['photo'] = 'https://vibe.infinityfree.me/api/' . $cleanPath;
        }
    }

    $responsePayload = [
        'type' => 'reward',
        'client' => $user,
        'reward' => [
            'name' => $redemption['reward_name'],
            'points_spent' => $redemption['points_spent']
        ],
        'redemption_status' => $redemption['status']
    ];

    // 3. Validation
    // Check if ALREADY USED (status 'used' or 'delivered')
    if ($redemption['status'] === 'used') {
        $responsePayload['used_at'] = $redemption['used_at'];
        echo json_encode(array(
            "status" => "warning",
            "message" => "PRÉMIO JÁ ENTREGUE em " . $redemption['used_at'],
            "data" => $responsePayload
        ));
        exit();
    }

    // Check expiration
    if (strtotime($redemption['expires_at']) < time()) {
        echo json_encode(array(
            "status" => "error",
            "message" => "QR Code Expirou em " . $redemption['expires_at'],
            "data" => $responsePayload
        ));
        exit();
    }

    // 4. Confirm logic
    if ($confirm) {
        try {
            $lisbonTz = new DateTimeZone('Europe/Lisbon');
            $nowDate = new DateTime('now', $lisbonTz);
            $timestamp = $nowDate->format('Y-m-d H:i:s');
        } catch (Exception $e) {
            $timestamp = date('Y-m-d H:i:s');
        }

        // Update status to 'used' and set used_at
        // activated_by = staff user ID who scanned the QR code
        $upd = $clubDb->prepare("UPDATE reward_redemptions SET status = 'used', used_at = ?, activated_by = ? WHERE id = ?");
        if ($upd->execute([$timestamp, $staffUserId, $redemption['id']])) {
            $responsePayload['redemption_status'] = 'used'; // Changed from status to redemption_status for consistency
            $responsePayload['used_at'] = $timestamp;

            echo json_encode(array(
                "status" => "success",
                "message" => "Prémio Entregue com Sucesso!",
                "data" => $responsePayload
            ));
        } else {
            echo json_encode(array("status" => "error", "message" => "Erro ao registar entrega do prémio."));
        }
    } else {
        // Preview
        echo json_encode(array(
            "status" => "info",
            "message" => "Prémio Válido. Entregar?",
            "data" => $responsePayload
        ));
    }
}
?>