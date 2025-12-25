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

$database = new Database();
$globalDb = $database->getGlobalConnection();

$data = json_decode(file_get_contents("php://input"));
$clubSlug = isset($_SERVER['HTTP_X_CLIENT_ID']) ? $_SERVER['HTTP_X_CLIENT_ID'] : '';
$userId = isset($data->user_id) ? (int) $data->user_id : null;

if (!$userId) {
    echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
    exit();
}

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

try {
    // Debug logging
    $debugMsg = date('Y-m-d H:i:s') . " - Fetching for RP ID: " . $userId . " Club: " . $clubSlug . "\n";
    file_put_contents('debug_rp_log.txt', $debugMsg, FILE_APPEND);

    $stmt = $clubDb->prepare("
        SELECT 
            gl.id as guestlist_id,
            gl.client_id as guest_user_id,
            gl.status,
            gl.created_at as added_date,
            gl.checked_in_at as checkin_time,
            COALESCE(e.name, 'Unknown Event') as event_name,
            COALESCE(e.date, 'Unknown Date') as event_date
        FROM guestlist gl
        LEFT JOIN events e ON gl.event_id = e.id
        WHERE gl.rp_id = ? 
        AND (
            CASE 
                WHEN e.end_time < e.start_time THEN TIMESTAMP(DATE_ADD(e.date, INTERVAL 1 DAY), e.end_time)
                ELSE TIMESTAMP(e.date, e.end_time)
            END
        ) > NOW()
        ORDER BY gl.created_at DESC
    ");
    $stmt->execute([$userId]);
    $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    file_put_contents('debug_rp_log.txt', "Found entries: " . count($entries) . "\n", FILE_APPEND);

    if (empty($entries)) {
        echo json_encode(array("status" => "success", "data" => []));
        exit();
    }

    // 2. Collect Guest User IDs to fetch their details from Global DB
    $guestUserIds = array_unique(array_column($entries, 'guest_user_id'));

    // 3. Fetch user details (name, phone) from Global DB
    if (!empty($guestUserIds)) {
        $placeholders = str_repeat('?,', count($guestUserIds) - 1) . '?';
        $userStmt = $globalDb->prepare("
            SELECT id, name 
            FROM users 
            WHERE id IN ($placeholders)
        ");
        $userStmt->execute(array_values($guestUserIds));
        $users = $userStmt->fetchAll(PDO::FETCH_ASSOC);

        // Create lookup map [id => user_data]
        $userMap = [];
        foreach ($users as $u) {
            $userMap[$u['id']] = $u;
        }

        // 4. Merge data
        foreach ($entries as &$entry) {
            $gUserId = $entry['guest_user_id'];
            if (isset($userMap[$gUserId])) {
                $entry['name'] = $userMap[$gUserId]['name'];
            } else {
                $entry['name'] = 'Unknown User';
            }
            // Format status for frontend if needed, or keep raw
        }
    }

    // Debug: Check total rows in guestlist
    $countStmt = $clubDb->query("SELECT count(*) as total, GROUP_CONCAT(DISTINCT rp_id) as known_rps FROM guestlist");
    $debugInfo = $countStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(array(
        "status" => "success",
        "data" => $entries,
        "debug" => [
            "received_userId" => $userId,
            "club_slug" => $clubSlug,
            "total_guestlist_entries_in_db" => $debugInfo['total'],
            "known_rp_ids_in_guestlist" => $debugInfo['known_rps'],
            "entries_found_for_this_user" => count($entries)
        ]
    ));

} catch (Exception $e) {
    echo json_encode(array("status" => "error", "message" => "Erro: " . $e->getMessage()));
}
?>