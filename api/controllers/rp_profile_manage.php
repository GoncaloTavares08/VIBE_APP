<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getGlobalConnection();

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro de conexão à base de dados."));
    exit();
}

// Get user from localStorage (sent in request)
$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Get user ID from request or session
$userId = isset($data->user_id) ? (int) $data->user_id : null;

if (!$userId && $action !== 'check_username') {
    echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
    exit();
}

try {
    switch ($action) {
        case 'get':
            // Get RP profile
            $stmt = $db->prepare("
                SELECT username, bio, instagram, profile_image_url, is_public
                FROM rp_profiles
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($profile) {
                echo json_encode(array(
                    "status" => "success",
                    "data" => $profile
                ));
            } else {
                echo json_encode(array(
                    "status" => "success",
                    "data" => null
                ));
            }
            break;

        case 'check_username':
            // Check if username is available
            $username = isset($data->username) ? trim($data->username) : '';
            $currentUserId = isset($data->user_id) ? (int) $data->user_id : null;

            if (empty($username)) {
                echo json_encode(array("status" => "error", "message" => "Username é obrigatório."));
                exit();
            }

            // Validate format
            if (!preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username)) {
                echo json_encode(array(
                    "status" => "error",
                    "available" => false,
                    "message" => "Username deve ter 3-50 caracteres (letras, números, underscore)."
                ));
                exit();
            }

            // Check if username exists (case-insensitive)
            $stmt = $db->prepare("
                SELECT user_id 
                FROM rp_profiles 
                WHERE LOWER(username) = LOWER(?)
            ");
            $stmt->execute([$username]);
            $existingProfile = $stmt->fetch(PDO::FETCH_ASSOC);

            // Available if doesn't exist OR belongs to current user
            $available = !$existingProfile || ($currentUserId && $existingProfile['user_id'] == $currentUserId);

            echo json_encode(array(
                "status" => "success",
                "available" => $available,
                "message" => $available ? "Username disponível" : "Username já está em uso"
            ));
            break;

        case 'save':
            // Create or update profile
            $username = isset($data->username) ? trim($data->username) : '';
            $bio = isset($data->bio) ? trim($data->bio) : '';
            $instagram = isset($data->instagram) ? trim(str_replace('@', '', $data->instagram)) : '';
            $profileImageUrl = isset($data->profile_image_url) ? trim($data->profile_image_url) : '';

            // Validations
            if (empty($username)) {
                echo json_encode(array("status" => "error", "message" => "Username é obrigatório."));
                exit();
            }

            if (!preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username)) {
                echo json_encode(array("status" => "error", "message" => "Username inválido."));
                exit();
            }

            if (strlen($bio) > 500) {
                echo json_encode(array("status" => "error", "message" => "Bio muito longa (máximo 500 caracteres)."));
                exit();
            }

            if (strlen($instagram) > 30) {
                echo json_encode(array("status" => "error", "message" => "Instagram muito longo (máximo 30 caracteres)."));
                exit();
            }

            // Check if username is taken by another user
            $stmt = $db->prepare("
                SELECT user_id 
                FROM rp_profiles 
                WHERE LOWER(username) = LOWER(?) AND user_id != ?
            ");
            $stmt->execute([$username, $userId]);
            if ($stmt->fetch()) {
                echo json_encode(array("status" => "error", "message" => "Username já está em uso."));
                exit();
            }

            // Check if profile exists
            $stmt = $db->prepare("SELECT id FROM rp_profiles WHERE user_id = ?");
            $stmt->execute([$userId]);
            $existingProfile = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existingProfile) {
                // Update
                $stmt = $db->prepare("
                    UPDATE rp_profiles 
                    SET username = ?, bio = ?, instagram = ?, profile_image_url = ?, updated_at = NOW()
                    WHERE user_id = ?
                ");
                $stmt->execute([$username, $bio, $instagram, $profileImageUrl, $userId]);
            } else {
                // Insert
                $stmt = $db->prepare("
                    INSERT INTO rp_profiles (user_id, username, bio, instagram, profile_image_url, is_public) 
                    VALUES (?, ?, ?, ?, ?, 1)
                ");
                $stmt->execute([$userId, $username, $bio, $instagram, $profileImageUrl]);
            }

            echo json_encode(array(
                "status" => "success",
                "message" => "Perfil atualizado com sucesso!",
                "data" => array(
                    "username" => $username,
                    "public_url" => "/guest/" . $username
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