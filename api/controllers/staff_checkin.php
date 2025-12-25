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
$db = $database->getGlobalConnection(); // Start with global for user/auth check if needed, or go straight to club DB

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

    try {
        // Find guestlist entry by QR code
        // Join with events to ensure it's a valid event
        // Join with users to get guest details
        $query = "
            SELECT 
                gl.id as guestlist_id,
                gl.status,
                gl.checkin_time,
                gl.qr_code,
                u.name as user_name,
                u.photo as user_photo,
                e.name as event_name,
                e.date as event_date,
                rp.username as rp_name,
                u.id as user_id
            FROM guestlist gl
            INNER JOIN events e ON gl.event_id = e.id
            INNER JOIN users u ON gl.user_id = u.id -- Note: users table might be in Global DB, not Club DB. This JOIN might fail if cross-database.
            LEFT JOIN rp_profiles rp ON gl.rp_id = rp.user_id -- Assuming RP info is needed
            WHERE gl.qr_code = ?
            LIMIT 1
        ";

        // PROBLEM: 'users' table is usually global. 'guestlist' is local.
        // If users table is NOT in club DB, we can't JOIN directly unless we use federated tables or separate queries.
        // Assuming current architecture: 'users' table is replicated or accessible?
        // Let's check schema first. If users is global, passed $userId must be used to fetch from global.

        // Simpler approach: Fetch from guestlist first without user join if strictly local
        $stmt = $clubDb->prepare("
            SELECT 
                gl.id, gl.user_id, gl.event_id, gl.status, gl.checkin_time, gl.qr_code,
                e.name as event_name, e.date as event_date
            FROM guestlist gl
            JOIN events e ON gl.event_id = e.id
            WHERE gl.qr_code = ?
            LIMIT 1
        ");

        $stmt->execute([$data->qr_code]);
        $guest = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$guest) {
            echo json_encode(array("status" => "error", "message" => "QR Code inválido ou não encontrado."));
            exit();
        }

        // Fetch User details from Global DB
        $userStmt = $db->prepare("SELECT name, email, photo FROM users WHERE id = ?");
        $userStmt->execute([$guest['user_id']]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);

        $guestData = array_merge($guest, $user ? $user : ['name' => 'Unknown', 'photo' => null]);

        // Check Logic
        if ($guest['status'] === 'checked_in') {
            echo json_encode(array(
                "status" => "warning",
                "message" => "Este bilhete JÁ foi validado!",
                "data" => $guestData,
                "checkin_time" => $guest['checkin_time']
            ));
            exit();
        }

        // Perform Check-in
        if (isset($data->confirm) && $data->confirm === true) {
            $updateStmt = $clubDb->prepare("
                UPDATE guestlist 
                SET status = 'checked_in', checkin_time = NOW() 
                WHERE id = ?
            ");
            if ($updateStmt->execute([$guest['id']])) {
                // Update User Stats (e.g. points) could happen here

                // Re-fetch updated data
                $guestData['status'] = 'checked_in';
                $guestData['checkin_time'] = date('Y-m-d H:i:s');

                echo json_encode(array(
                    "status" => "success",
                    "message" => "Entrada validada com sucesso!",
                    "data" => $guestData
                ));
            } else {
                echo json_encode(array("status" => "error", "message" => "Erro ao atualizar status."));
            }
        } else {
            // Just returning info for preview before confirmation
            echo json_encode(array(
                "status" => "info", // Ready to check in
                "message" => "Bilhete válido. Confirmar entrada?",
                "data" => $guestData
            ));
        }

    } catch (Exception $e) {
        echo json_encode(array("status" => "error", "message" => "Erro: " . $e->getMessage()));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Ação inválida."));
}
?>