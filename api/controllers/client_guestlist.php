<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$database = new Database();

// Get club slug from header
$clubSlug = isset($_SERVER['HTTP_X_CLIENT_ID']) ? $_SERVER['HTTP_X_CLIENT_ID'] : '';
if (empty($clubSlug)) {
    echo json_encode(array("status" => "error", "message" => "Club slug não fornecido."));
    exit();
}

// Connect to club database
$db = $database->getClientConnectionBySlug($clubSlug);

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro ao conectar à base de dados do clube."));
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'list':
            // Get user's guestlists
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = isset($input['user_id']) ? (int) $input['user_id'] : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            // Get guestlists with event details
            $stmt = $db->prepare("
                SELECT 
                    g.id,
                    g.event_id,
                    g.status,
                    g.qr_code,
                    g.checked_in_at,
                    g.created_at,
                    e.name as event_name,
                    e.description as event_description,
                    e.date as event_date,
                    e.start_time,
                    e.end_time,
                    e.image_url as event_image
                FROM guestlist g
                INNER JOIN events e ON g.event_id = e.id
                WHERE g.client_id = ?
                AND g.status IN ('confirmed', 'checked_in')
                AND e.date >= CURDATE()
                ORDER BY e.date ASC, e.start_time ASC
            ");
            $stmt->execute([$userId]);
            $guestlists = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(array(
                "status" => "success",
                "data" => $guestlists
            ));
            break;

        case 'join':
            // Join a guestlist (automatic, no approval needed)
            $input = json_decode(file_get_contents('php://input'), true);

            $userId = isset($input['user_id']) ? (int) $input['user_id'] : null;
            $eventId = isset($input['event_id']) ? (int) $input['event_id'] : null;
            $rpId = isset($input['rp_id']) ? (int) $input['rp_id'] : null;

            if (!$userId || !$eventId || !$rpId) {
                echo json_encode(array("status" => "error", "message" => "Dados incompletos."));
                exit();
            }

            // Check if already in guestlist
            $checkStmt = $db->prepare("
                SELECT id FROM guestlist 
                WHERE event_id = ? AND client_id = ?
            ");
            $checkStmt->execute([$eventId, $userId]);

            if ($checkStmt->fetch()) {
                echo json_encode(array("status" => "error", "message" => "Já estás nesta guestlist."));
                exit();
            }

            // Check if event exists and is future
            $eventStmt = $db->prepare("
                SELECT id, date FROM events 
                WHERE id = ? AND date >= CURDATE() AND status = 'upcoming'
            ");
            $eventStmt->execute([$eventId]);
            $event = $eventStmt->fetch(PDO::FETCH_ASSOC);

            if (!$event) {
                echo json_encode(array("status" => "error", "message" => "Evento não encontrado ou já passou."));
                exit();
            }

            // Connect to GLOBAL database to check/create user_club_access
            $globalDb = $database->getGlobalConnection();

            // Get club_id from club_slug
            $clubStmt = $globalDb->prepare("SELECT id FROM clubs WHERE slug = ?");
            $clubStmt->execute([$clubSlug]);
            $club = $clubStmt->fetch(PDO::FETCH_ASSOC);

            if (!$club) {
                echo json_encode(array("status" => "error", "message" => "Clube não encontrado."));
                exit();
            }

            $clubId = $club['id'];

            // Check if user has access to this club (in global user_club_access table)
            $accessStmt = $globalDb->prepare("
                SELECT id FROM user_club_access 
                WHERE user_id = ? AND club_id = ?
            ");
            $accessStmt->execute([$userId, $clubId]);

            // If user doesn't have access, add them automatically
            if (!$accessStmt->fetch()) {
                $addAccessStmt = $globalDb->prepare("
                    INSERT INTO user_club_access (user_id, club_id, points, joined_at) 
                    VALUES (?, ?, 0, NOW())
                ");
                $addAccessStmt->execute([$userId, $clubId]);
            }

            // Generate unique QR code (Temporary, will be updated with ID)
            $tempQrCode = 'TEMP-' . uniqid();

            // Set timezone and get current time
            date_default_timezone_set('Europe/Lisbon');
            $createdAt = date('Y-m-d H:i:s');

            // Add to guestlist
            $insertStmt = $db->prepare("
                INSERT INTO guestlist (event_id, client_id, rp_id, status, qr_code, created_at)
                VALUES (?, ?, ?, 'confirmed', ?, ?)
            ");
            $insertStmt->execute([$eventId, $userId, $rpId, $tempQrCode, $createdAt]);

            $guestlistId = $db->lastInsertId();

            // Generate FINAL QR code with Guestlist ID
            // Format: GUEST-{GuestlistID}-{EventID}-{ClientID}-{RPID}-{Hash}
            $finalQrCode = 'GUEST-' . $guestlistId . '-' . $eventId . '-' . $userId . '-' . $rpId . '-' . substr(md5(uniqid(rand(), true)), 0, 8);

            // Update with final QR
            $updateStmt = $db->prepare("UPDATE guestlist SET qr_code = ? WHERE id = ?");
            $updateStmt->execute([$finalQrCode, $guestlistId]);

            echo json_encode(array(
                "status" => "success",
                "message" => "Adicionado à guestlist com sucesso!",
                "data" => array(
                    "guestlist_id" => $guestlistId,
                    "qr_code" => $finalQrCode
                )
            ));
            break;

        default:
            echo json_encode(array("status" => "error", "message" => "Ação inválida."));
    }
} catch (Exception $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => "Erro: " . $e->getMessage()
    ));
}
?>