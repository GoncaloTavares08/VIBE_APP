<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
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

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Helper function to validate and create upload directory
function ensureUploadDirectory($userId)
{
    $baseDir = '../uploads/profiles/clients/' . $userId;
    if (!file_exists($baseDir)) {
        mkdir($baseDir, 0755, true);
    }
    return $baseDir;
}

// Helper to get web-accessible path (removes '../')
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

try {
    switch ($action) {
        case 'get':
            // Get client profile with all photos
            $data = json_decode(file_get_contents("php://input"));
            $userId = isset($data->user_id) ? (int) $data->user_id : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            // Get profile
            $stmt = $db->prepare("
                SELECT id, bio, instagram, profile_photo_path, ghost_mode, birthdate, gender, gender_preference
                FROM client_profiles
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($profile) {
                // Get gallery photos
                $stmt = $db->prepare("
                    SELECT id, photo_path, photo_order
                    FROM client_profile_photos
                    WHERE client_profile_id = ?
                    ORDER BY photo_order ASC
                ");
                $stmt->execute([$profile['id']]);
                $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $profile['gallery_photos'] = $photos;
            }

            // Fetch points if club context is provided
            $clientSlug = isset($_SERVER['HTTP_X_CLIENT_ID']) ? strtolower($_SERVER['HTTP_X_CLIENT_ID']) : null;
            if ($clientSlug && $profile) {
                $stmt = $db->prepare("SELECT id FROM clubs WHERE slug = ?");
                $stmt->execute([$clientSlug]);
                $club = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($club) {
                    $stmt = $db->prepare("SELECT points, role FROM user_club_access WHERE user_id = ? AND club_id = ?");
                    $stmt->execute([$userId, $club['id']]);
                    $access = $stmt->fetch(PDO::FETCH_ASSOC);

                    if ($access) {
                        $profile['points'] = (int) $access['points'];
                        $profile['role'] = $access['role'];
                    }
                }
            }

            echo json_encode(array(
                "status" => "success",
                "data" => $profile
            ));
            break;

        case 'save_profile':
            // Save profile fields (bio, instagram, ghost_mode, birthdate)
            $data = json_decode(file_get_contents("php://input"));
            $userId = isset($data->user_id) ? (int) $data->user_id : null;
            // Check if profile exists
            $stmt = $db->prepare("SELECT id, bio, instagram, ghost_mode, birthdate, gender, gender_preference FROM client_profiles WHERE user_id = ?");
            $stmt->execute([$userId]);
            $existingProfile = $stmt->fetch(PDO::FETCH_ASSOC);

            // Prepare values (Input > Existing DB > Default)
            $bio = isset($data->bio) ? trim($data->bio) : ($existingProfile['bio'] ?? '');
            $instagram = isset($data->instagram) ? trim(str_replace('@', '', $data->instagram)) : ($existingProfile['instagram'] ?? '');

            if (isset($data->ghost_mode)) {
                $ghostMode = (int) $data->ghost_mode;
            } else {
                $ghostMode = isset($existingProfile['ghost_mode']) ? (int) $existingProfile['ghost_mode'] : 0;
            }

            $birthdate = isset($data->birthdate) ? $data->birthdate : ($existingProfile['birthdate'] ?? null);
            $gender = isset($data->gender) ? $data->gender : ($existingProfile['gender'] ?? null);
            $genderPreference = isset($data->gender_preference) ? $data->gender_preference : ($existingProfile['gender_preference'] ?? 'everyone');

            // Validations
            if (strlen($bio) > 500) {
                echo json_encode(array("status" => "error", "message" => "Bio muito longa (máximo 500 caracteres)."));
                exit();
            }

            if (strlen($instagram) > 30) {
                echo json_encode(array("status" => "error", "message" => "Instagram muito longo (máximo 30 caracteres)."));
                exit();
            }

            if ($gender && !in_array($gender, ['male', 'female'])) {
                echo json_encode(array("status" => "error", "message" => "Género inválido."));
                exit();
            }

            if ($genderPreference && !in_array($genderPreference, ['male', 'female', 'everyone'])) {
                echo json_encode(array("status" => "error", "message" => "Preferência inválida."));
                exit();
            }

            if ($existingProfile) {
                // Update
                $stmt = $db->prepare("
                    UPDATE client_profiles 
                    SET bio = ?, instagram = ?, ghost_mode = ?, birthdate = ?, gender = ?, gender_preference = ?, updated_at = NOW()
                    WHERE user_id = ?
                ");
                $stmt->execute([$bio, $instagram, $ghostMode, $birthdate, $gender, $genderPreference, $userId]);
            } else {
                // Insert
                $stmt = $db->prepare("
                    INSERT INTO client_profiles (user_id, bio, instagram, ghost_mode, birthdate, gender, gender_preference) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$userId, $bio, $instagram, $ghostMode, $birthdate, $gender, $genderPreference]);
            }

            echo json_encode(array(
                "status" => "success",
                "message" => "Perfil atualizado com sucesso!"
            ));
            break;

        case 'upload_profile_photo':
            // Upload profile photo
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
            $uploadDir = ensureUploadDirectory($userId);

            // Delete old profile photo if exists
            $stmt = $db->prepare("SELECT id, profile_photo_path FROM client_profiles WHERE user_id = ?");
            $stmt->execute([$userId]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($profile && $profile['profile_photo_path']) {
                $oldPath = '../' . $profile['profile_photo_path'];
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

            // Update or create profile (store web path)
            $webPath = getWebPath($filepath);
            if ($profile) {
                $stmt = $db->prepare("
                    UPDATE client_profiles 
                    SET profile_photo_path = ?, updated_at = NOW()
                    WHERE user_id = ?
                ");
                $stmt->execute([$webPath, $userId]);
            } else {
                $stmt = $db->prepare("
                    INSERT INTO client_profiles (user_id, profile_photo_path) 
                    VALUES (?, ?)
                ");
                $stmt->execute([$userId, $webPath]);
            }

            echo json_encode(array(
                "status" => "success",
                "message" => "Foto de perfil atualizada!",
                "photo_path" => getWebPath($filepath)
            ));
            break;

        case 'upload_gallery_photo':
            // Upload gallery photo (max 6)
            $userId = isset($_POST['user_id']) ? (int) $_POST['user_id'] : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] === UPLOAD_ERR_NO_FILE) {
                echo json_encode(array("status" => "error", "message" => "Nenhum ficheiro enviado."));
                exit();
            }

            // Get or create profile
            $stmt = $db->prepare("SELECT id FROM client_profiles WHERE user_id = ?");
            $stmt->execute([$userId]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$profile) {
                // Create profile first
                $stmt = $db->prepare("INSERT INTO client_profiles (user_id) VALUES (?)");
                $stmt->execute([$userId]);
                $profileId = $db->lastInsertId();
            } else {
                $profileId = $profile['id'];
            }

            // Check current photo count
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM client_profile_photos WHERE client_profile_id = ?");
            $stmt->execute([$profileId]);
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            if ($count >= 6) {
                echo json_encode(array("status" => "error", "message" => "Máximo de 6 fotos atingido."));
                exit();
            }

            $error = '';
            if (!validateImageFile($_FILES['photo'], $error)) {
                echo json_encode(array("status" => "error", "message" => $error));
                exit();
            }

            // Create directory
            $uploadDir = ensureUploadDirectory($userId);

            // Generate unique filename
            $extension = pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION);
            $filename = 'gallery_' . time() . '_' . uniqid() . '.' . $extension;
            $filepath = $uploadDir . '/' . $filename;

            if (!move_uploaded_file($_FILES['photo']['tmp_name'], $filepath)) {
                echo json_encode(array("status" => "error", "message" => "Erro ao guardar ficheiro."));
                exit();
            }

            // Insert photo with next order (store web path)
            $webPath = getWebPath($filepath);
            $stmt = $db->prepare("
                INSERT INTO client_profile_photos (client_profile_id, photo_path, photo_order) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$profileId, $webPath, $count]);

            echo json_encode(array(
                "status" => "success",
                "message" => "Foto adicionada!",
                "photo" => array(
                    "id" => $db->lastInsertId(),
                    "photo_path" => $webPath,
                    "photo_order" => $count
                )
            ));
            break;

        case 'delete_gallery_photo':
            // Delete gallery photo
            $data = json_decode(file_get_contents("php://input"));
            $photoId = isset($data->photo_id) ? (int) $data->photo_id : null;
            $userId = isset($data->user_id) ? (int) $data->user_id : null;

            if (!$photoId || !$userId) {
                echo json_encode(array("status" => "error", "message" => "Dados inválidos."));
                exit();
            }

            // Get photo and verify ownership
            $stmt = $db->prepare("
                SELECT cpp.id, cpp.photo_path, cpp.photo_order, cp.user_id
                FROM client_profile_photos cpp
                JOIN client_profiles cp ON cpp.client_profile_id = cp.id
                WHERE cpp.id = ?
            ");
            $stmt->execute([$photoId]);
            $photo = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$photo) {
                echo json_encode(array("status" => "error", "message" => "Foto não encontrada."));
                exit();
            }

            if ($photo['user_id'] != $userId) {
                echo json_encode(array("status" => "error", "message" => "Não autorizado."));
                exit();
            }

            // Delete file (convert web path back to filesystem path)
            $filesystemPath = '../' . $photo['photo_path'];
            if (file_exists($filesystemPath)) {
                unlink($filesystemPath);
            }

            // Delete from database
            $stmt = $db->prepare("DELETE FROM client_profile_photos WHERE id = ?");
            $stmt->execute([$photoId]);

            // Reorder remaining photos
            $stmt = $db->prepare("
                SELECT id FROM client_profile_photos 
                WHERE client_profile_id = (SELECT client_profile_id FROM client_profile_photos WHERE id = ? LIMIT 1)
                ORDER BY photo_order ASC
            ");
            $stmt->execute([$photoId]);
            $remainingPhotos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($remainingPhotos as $index => $rPhoto) {
                $updateStmt = $db->prepare("UPDATE client_profile_photos SET photo_order = ? WHERE id = ?");
                $updateStmt->execute([$index, $rPhoto['id']]);
            }

            echo json_encode(array(
                "status" => "success",
                "message" => "Foto removida!"
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