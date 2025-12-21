<?php
// api/controllers/verify_access.php
// Verify if user has access to a specific club

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode([
        "status" => "error",
        "message" => "User ID é obrigatório"
    ]);
    exit();
}

// Get client ID from header
$clientSlug = isset($_SERVER['HTTP_X_CLIENT_ID'])
    ? strtolower($_SERVER['HTTP_X_CLIENT_ID'])
    : 'vr';

try {
    // Connect to GLOBAL database
    $database = new Database();
    $db = $database->getGlobalConnection();

    if (!$db) {
        echo json_encode([
            "status" => "error",
            "message" => "Erro de conexão à base de dados"
        ]);
        exit();
    }

    // Get club ID from slug
    $stmt = $db->prepare("SELECT id, name FROM clubs WHERE slug = ?");
    $stmt->execute([$clientSlug]);
    $club = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$club) {
        echo json_encode([
            "status" => "error",
            "message" => "Clube não encontrado",
            "has_access" => false
        ]);
        exit();
    }

    // Check if user has access to this club
    $stmt = $db->prepare("
        SELECT * FROM user_club_access 
        WHERE user_id = ? AND club_id = ?
    ");
    $stmt->execute([$data->user_id, $club['id']]);
    $access = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($access) {
        echo json_encode([
            "status" => "success",
            "message" => "Acesso permitido",
            "has_access" => true,
            "club" => [
                "id" => $club['id'],
                "name" => $club['name'],
                "slug" => $clientSlug
            ],
            "role" => $access['role'],
            "joined_at" => $access['joined_at']
        ]);
    } else {
        // IMPORTANT: Include club name even when access is denied!
        echo json_encode([
            "status" => "error",
            "message" => "Não tens acesso a este clube",
            "has_access" => false,
            "club" => [
                "id" => $club['id'],
                "name" => $club['name'],
                "slug" => $clientSlug
            ]
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Erro ao verificar acesso: " . $e->getMessage(),
        "has_access" => false
    ]);
}
?>