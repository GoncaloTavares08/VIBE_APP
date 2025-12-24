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

// Helper function to ensure upload directory exists
function ensureRPUploadDirectory($userId)
{
    $baseDir = '../uploads/profiles/rps/' . $userId;
    if (!file_exists($baseDir)) {
        mkdir($baseDir, 0755, true);
    }
    return $baseDir;
}

// Helper function to get web-accessible path
function getWebPath($filepath)
{
    return str_replace('../', '', $filepath);
}

// Helper function to validate image file
function validateImageFile($file, &$error)
{
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $error = "Erro no upload do ficheiro.";
        return false;
    }

    if ($file['size'] > $maxSize) {
        $error = "Ficheiro muito grande. Máximo: 5MB";
        return false;
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        $error = "Formato inválido. Use: JPG, PNG ou WebP";
        return false;
    }

    return true;
}

// Get user ID from request or session
$userId = isset($data->user_id) ? (int) $data->user_id : (isset($_POST['user_id']) ? (int) $_POST['user_id'] : null);

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

        case 'upload_profile_photo':
            // Upload RP profile photo
            $userId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] === UPLOAD_ERR_NO_FILE) {
                echo json_encode(array("status" => "error", "message" => "Nenhum ficheiro enviado."));
                exit();
            }

            $error = '';
            if (!validateImageFile($_FILES['photo'], $error)) {
                echo json_encode(array("status" => "error", "message" => $error));
                exit();
            }

            // Create directory
            $uploadDir = ensureRPUploadDirectory($userId);

            // Get existing profile to delete old photo
            $stmt = $db->prepare("SELECT id, profile_image_url FROM rp_profiles WHERE user_id = ?");
            $stmt->execute([$userId]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($profile && $profile['profile_image_url']) {
                $oldPath = '../' . $profile['profile_image_url'];
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            // Generate unique filename
            $extension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
            $filename = 'profile_' . time() . '_' . uniqid() . '.' . $extension;
            $filepath = $uploadDir . '/' . $filename;

            if (!move_uploaded_file($_FILES['photo']['tmp_name'], $filepath)) {
                echo json_encode(array("status" => "error", "message" => "Erro ao guardar ficheiro."));
                exit();
            }

            // Store web path
            $webPath = getWebPath($filepath);

            // Update or create profile
            if ($profile) {
                $stmt = $db->prepare("
                    UPDATE rp_profiles 
                    SET profile_image_url = ?, updated_at = NOW()
                    WHERE user_id = ?
                ");
                $stmt->execute([$webPath, $userId]);
            } else {
                // Create minimal profile if doesn't exist
                $stmt = $db->prepare("
                    INSERT INTO rp_profiles (user_id, username, profile_image_url, is_public) 
                    VALUES (?, ?, ?, 0)
                ");
                $tempUsername = 'rp_' . $userId; // Temporary username
                $stmt->execute([$userId, $tempUsername, $webPath]);
            }

            echo json_encode(array(
                "status" => "success",
                "message" => "Foto de perfil atualizada!",
                "photo_path" => $webPath
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