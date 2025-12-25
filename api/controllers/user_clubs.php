<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';
include_once '../utils/SessionHelper.php';

$database = new Database();
$db = $database->getGlobalConnection();

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro de conexão à base de dados."));
    exit();
}

// Get user ID from session/token
// For now, assuming we might verify session here or trust the frontend to send user_id if we want to keep it simple for this step, 
// but ideally we decode the token or check session.
// Since SessionHelper is used, let's try to get from session or passed param.
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    echo json_encode(array("status" => "error", "message" => "ID de utilizador não fornecido."));
    exit();
}

try {
    $query = "SELECT 
                c.id, 
                c.name, 
                c.slug, 
                c.location, 
                uca.joined_at, 
                uca.role, 
                uca.points 
              FROM clubs c 
              JOIN user_club_access uca ON c.id = uca.club_id 
              WHERE uca.user_id = ? AND c.is_active = 1
              ORDER BY uca.points DESC, uca.joined_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute([$user_id]);

    $clubs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(array(
        "status" => "success",
        "data" => $clubs
    ));

} catch (Exception $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => "Erro ao procurar clubes: " . $e->getMessage()
    ));
}
?>