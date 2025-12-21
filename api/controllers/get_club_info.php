<?php
// api/controllers/get_club_info.php
// Get club information from global database

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

// Get client ID from header
$clientSlug = isset($_SERVER['HTTP_X_CLIENT_ID'])
    ? strtolower($_SERVER['HTTP_X_CLIENT_ID'])
    : null;

if (!$clientSlug) {
    echo json_encode([
        "status" => "error",
        "message" => "Client ID não fornecido"
    ]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getGlobalConnection();

    if (!$db) {
        throw new Exception("Erro ao conectar à BD global");
    }

    // Get club info from database
    $stmt = $db->prepare("SELECT id, name, slug, location FROM clubs WHERE slug = ?");
    $stmt->execute([$clientSlug]);
    $club = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($club) {
        echo json_encode([
            "status" => "success",
            "club" => [
                "id" => $club['id'],
                "name" => $club['name'],
                "slug" => $club['slug'],
                "location" => $club['location']
            ]
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Clube não encontrado"
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Erro ao obter informações do clube: " . $e->getMessage()
    ]);
}
?>