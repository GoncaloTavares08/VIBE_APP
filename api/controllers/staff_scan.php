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
} elseif ($action === 'search_guestlist') {
    // --- SEARCH GUESTLIST ---
    $query = isset($_GET['query']) ? trim($_GET['query']) : '';

    if (strlen($query) < 2) {
        echo json_encode(array("status" => "success", "data" => []));
        exit();
    }

    try {
        // 1. Find ACTIVE events (happening NOW or VERY SOON/RECENTLY)
        // Logic: Events today, yesterday (late night), or tomorrow (early access)
        // User feedback: "Resultados apareçam a medida que vou escrevendo" -> Already handled by frontend debounce + LIKE %%
        // Feedback: "Nao aparece nenhum convidado... talvez hora de fim" -> Relax the time check.

        $lisbonTz = new DateTimeZone('Europe/Lisbon');
        $now = new DateTime('now', $lisbonTz);
        $todayStr = $now->format('Y-m-d');

        // Strategy: Get IDs of active events (broad window: yesterday to tomorrow)
        // We trust staff to pick the right person, so showing guests for tomorrow's event is better than showing nothing.
        $evtStmt = $clubDb->prepare("
            SELECT id, name, date, start_time, end_time 
            FROM events 
            WHERE date >= DATE_SUB(?, INTERVAL 1 DAY) 
              AND date <= DATE_ADD(?, INTERVAL 1 DAY)
            ORDER BY date DESC, start_time DESC
        ");
        $evtStmt->execute([$todayStr, $todayStr]);
        $activeEvents = $evtStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($activeEvents)) {
            echo json_encode(array("status" => "success", "data" => [])); // No events running
            exit();
        }

        $eventIds = array_column($activeEvents, 'id');
        $eventIdList = implode(',', $eventIds);

        // 2. Search Users Global using the query
        // "ah medida que vou escrevendo" -> use wildcards before and after
        $userStmt = $db->prepare("SELECT id FROM users WHERE name LIKE ? LIMIT 20");
        $searchTerm = "%{$query}%";
        $userStmt->execute([$searchTerm]);
        $matchingUsers = $userStmt->fetchAll(PDO::FETCH_COLUMN); // Array of USER IDs

        if (empty($matchingUsers)) {
            echo json_encode(array("status" => "success", "data" => []));
            exit();
        }

        $userIdList = implode(',', $matchingUsers);

        // 3. Query Guestlist matching these users AND active events
        // Logic: client_id IN matched_users OR rp_id IN matched_users (search by RP name too?)
        // User requested: "Search by name or RP"
        // If query matches RP name, we should find guests added by that RP.

        // Complex query:
        // Find guests where (client_id matches query OR rp_id matches query) AND event_id IN active_events

        $sql = "
            SELECT 
                gl.id as guest_id, gl.status, gl.checked_in_at,
                u_client.name as client_name, u_client.email as client_email, cp.profile_photo_path as client_photo,
                u_rp.name as rp_name,
                e.name as event_name, e.start_time, e.end_time
            FROM guestlist gl
            JOIN events e ON gl.event_id = e.id
            JOIN " . $database->getGlobalConnection()->query("SELECT DATABASE()")->fetchColumn() . ".users u_client ON gl.client_id = u_client.id
            LEFT JOIN " . $database->getGlobalConnection()->query("SELECT DATABASE()")->fetchColumn() . ".client_profiles cp ON u_client.id = cp.user_id
            LEFT JOIN " . $database->getGlobalConnection()->query("SELECT DATABASE()")->fetchColumn() . ".users u_rp ON gl.rp_id = u_rp.id
            WHERE gl.event_id IN ($eventIdList)
            AND (
                u_client.name LIKE ? 
                OR u_rp.name LIKE ?
            )
            LIMIT 50
        ";

        // NOTE: Cross-database join using fully qualified names is tricky with PDO if users on different host, 
        // but here they are likely same host since Database class shares credentials.
        // If separate connection objects are strictly separate, we must do app-side join.
        // Given existing code does separate queries, let's stick to SAFE app-side join approach to avoid permission/host issues.

        // REVISED SAFE STRATEGY (No Cross-DB Joins):

        // A. Find matching user IDs (Done above: $matchingUsers)
        // B. Query Guestlist for these Client IDs OR RP IDs

        $placeholders = str_repeat('?,', count($matchingUsers) - 1) . '?';
        $inParams = $matchingUsers;

        // We need to pass params twice: once for client_id, once for rp_id checking
        $params = array_merge($inParams, $inParams);

        // We filter mainly by User ID matches on Client OR RP
        $glStmt = $clubDb->prepare("
            SELECT id, client_id, rp_id, event_id, status, checked_in_at
            FROM guestlist 
            WHERE event_id IN ($eventIdList)
            AND (client_id IN ($placeholders) OR rp_id IN ($placeholders))
            LIMIT 50
        ");
        $glStmt->execute($params);
        $guests = $glStmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];

        foreach ($guests as $g) {
            // Fetch names manually (could optimize with bulk fetch but IDK if worth complexity yet)

            // Client Fetch
            $cStmt = $db->prepare("SELECT u.name, cp.profile_photo_path as photo FROM users u LEFT JOIN client_profiles cp ON u.id = cp.user_id WHERE u.id = ?");
            $cStmt->execute([$g['client_id']]);
            $client = $cStmt->fetch(PDO::FETCH_ASSOC);

            // Skip if name doesn't match query (if we found this via RP match) AND RP name doesn't match query
            // Actually, we found this row because EITHER client OR RP ID was in our matched name list. So it's valid.

            // Photo fix
            $photoUrl = null;
            if ($client && !empty($client['photo'])) {
                $clean = ltrim(str_replace(['../', './'], '', $client['photo']), '/');
                $photoUrl = 'https://vibe.infinityfree.me/api/' . $clean;
            }

            // RP Fetch
            $rpName = 'Direto';
            if ($g['rp_id']) {
                $rStmt = $db->prepare("SELECT name FROM users WHERE id = ?");
                $rStmt->execute([$g['rp_id']]);
                $rp = $rStmt->fetch(PDO::FETCH_ASSOC);
                if ($rp)
                    $rpName = $rp['name'];
            }

            // Event Name
            $evtName = '';
            foreach ($activeEvents as $ae) {
                if ($ae['id'] == $g['event_id']) {
                    $evtName = $ae['name'];
                    break;
                }
            }

            $results[] = [
                'id' => $g['id'],
                'name' => $client['name'],
                'photo' => $photoUrl,
                'rpName' => $rpName,
                'ticketType' => 'Guestlist', // Default for now
                'status' => $g['status'] == 'checked_in' ? 'checked-in' : 'pending',
                'checkInTime' => $g['checked_in_at'] ? date('H:i', strtotime($g['checked_in_at'])) : null,
                'eventName' => $evtName
            ];
        }

        echo json_encode(array("status" => "success", "data" => $results));

    } catch (Exception $e) {
        echo json_encode(array("status" => "error", "message" => $e->getMessage()));
    }

} elseif ($action === 'manual_checkin') {
    // --- MANUAL CHECK-IN ---
    if (empty($data->guest_id)) {
        echo json_encode(array("status" => "error", "message" => "Guest ID required"));
        exit();
    }

    $guestId = $data->guest_id;

    try {
        // 1. Get Guest Info
        $stmt = $clubDb->prepare("SELECT * FROM guestlist WHERE id = ? LIMIT 1");
        $stmt->execute([$guestId]);
        $guest = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$guest) {
            echo json_encode(array("status" => "error", "message" => "Convidado não encontrado"));
            exit();
        }

        if ($guest['status'] === 'checked_in') {
            echo json_encode(array("status" => "error", "message" => "Já se encontra dentro do clube!"));
            exit();
        }

        // 2. Validate Event Time
        $evtStmt = $clubDb->prepare("SELECT * FROM events WHERE id = ?");
        $evtStmt->execute([$guest['event_id']]);
        $event = $evtStmt->fetch(PDO::FETCH_ASSOC);

        if (!$event) {
            echo json_encode(array("status" => "error", "message" => "Evento não encontrado"));
            exit();
        }

        $lisbonTz = new DateTimeZone('Europe/Lisbon');
        $now = new DateTime('now', $lisbonTz);
        $timestamp = $now->format('Y-m-d H:i:s');

        // Validation: Check if event started
        $eventString = $event['date'] . ' ' . $event['start_time'];
        $eventStart = new DateTime($eventString, $lisbonTz);

        if ($now < $eventStart) {
            $formattedStart = $eventStart->format('H:i');
            echo json_encode(array(
                "status" => "error",
                "message" => "O evento ainda não começou. (Início: {$formattedStart})"
            ));
            exit();
        }

        // Auto-update Event Status if 'upcoming' and time passed
        if ($event['status'] === 'upcoming' && $now >= $eventStart) {
            $updEvt = $clubDb->prepare("UPDATE events SET status = 'ongoing' WHERE id = ?");
            $updEvt->execute([$event['id']]);
        }

        // 3. Update Status

        $upd = $clubDb->prepare("UPDATE guestlist SET status = 'checked_in', checked_in_at = ?, updated_at = ? WHERE id = ?");

        if ($upd->execute([$timestamp, $timestamp, $guestId])) {
            echo json_encode(array(
                "status" => "success",
                "message" => "Check-in manual confirmado",
                "checkInTime" => $now->format('H:i')
            ));
        } else {
            echo json_encode(array("status" => "error", "message" => "Erro de base de dados"));
        }

    } catch (Exception $e) {
        echo json_encode(array("status" => "error", "message" => $e->getMessage()));
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
            e.name as event_name, e.date as event_date, e.start_time, e.end_time, e.status as event_status
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

        // Auto-update Event Status if 'upcoming' and time passed
        if ($guest['event_status'] === 'upcoming' && $nowDate >= $eventStart) {
            $updEvt = $clubDb->prepare("UPDATE events SET status = 'ongoing' WHERE id = ?");
            $updEvt->execute([$guest['event_id']]);
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