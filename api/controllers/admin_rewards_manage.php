<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$database = new Database();

// Get club ID from header
$clubSlug = isset($_SERVER['HTTP_X_CLIENT_ID']) ? $_SERVER['HTTP_X_CLIENT_ID'] : '';
if (empty($clubSlug)) {
    echo json_encode(array("status" => "error", "message" => "Club ID não fornecido."));
    exit();
}

$db = $database->getClientConnectionBySlug($clubSlug);

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro de conexão à base de dados do clube."));
    exit();
}


$action = isset($_GET['action']) ? $_GET['action'] : '';

// Helper function to ensure upload directory exists
function ensureRewardUploadDirectory($rewardId)
{
    $baseDir = '../uploads/rewards/' . $rewardId;
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

try {
    switch ($action) {
        case 'list':
            // Get all rewards
            $stmt = $db->prepare("
                SELECT id, name, description, points, stock, available, image_path, created_at, updated_at
                FROM rewards
                ORDER BY points ASC
            ");
            $stmt->execute();
            $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(array(
                "status" => "success",
                "data" => $rewards
            ));
            break;

        case 'get':
            // Get single reward
            $data = json_decode(file_get_contents("php://input"));
            $rewardId = isset($data->id) ? (int) $data->id : null;

            if (!$rewardId) {
                echo json_encode(array("status" => "error", "message" => "Reward ID não fornecido."));
                exit();
            }

            $stmt = $db->prepare("
                SELECT id, name, description, points, stock, available, image_path, created_at, updated_at
                FROM rewards
                WHERE id = ?
            ");
            $stmt->execute([$rewardId]);
            $reward = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($reward) {
                echo json_encode(array("status" => "success", "data" => $reward));
            } else {
                echo json_encode(array("status" => "error", "message" => "Prémio não encontrado."));
            }
            break;

        case 'create':
            // Create new reward
            $name = isset($_POST['name']) ? trim($_POST['name']) : '';
            $description = isset($_POST['description']) ? trim($_POST['description']) : '';
            $points = isset($_POST['points']) ? (int) $_POST['points'] : 0;
            $stock = isset($_POST['stock']) ? (int) $_POST['stock'] : 0;

            if (empty($name) || $points <= 0) {
                echo json_encode(array("status" => "error", "message" => "Nome e pontos são obrigatórios."));
                exit();
            }

            // Insert reward first to get ID
            $stmt = $db->prepare("
                INSERT INTO rewards (name, description, points, stock, available)
                VALUES (?, ?, ?, ?, 1)
            ");
            $stmt->execute([$name, $description, $points, $stock]);
            $rewardId = $db->lastInsertId();

            // Handle image upload if provided
            $imagePath = null;
            if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
                $error = '';
                if (!validateImageFile($_FILES['image'], $error)) {
                    echo json_encode(array("status" => "error", "message" => $error));
                    exit();
                }

                $uploadDir = ensureRewardUploadDirectory($rewardId);
                $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
                $filename = 'reward_' . time() . '_' . uniqid() . '.' . $extension;
                $filepath = $uploadDir . '/' . $filename;

                if (move_uploaded_file($_FILES['image']['tmp_name'], $filepath)) {
                    $imagePath = getWebPath($filepath);

                    // Update reward with image path
                    $stmt = $db->prepare("UPDATE rewards SET image_path = ? WHERE id = ?");
                    $stmt->execute([$imagePath, $rewardId]);
                }
            }

            echo json_encode(array(
                "status" => "success",
                "message" => "Prémio criado com sucesso!",
                "data" => array("id" => $rewardId, "image_path" => $imagePath)
            ));
            break;

        case 'update':
            // Update existing reward
            $rewardId = isset($_POST['id']) ? (int) $_POST['id'] : null;
            $name = isset($_POST['name']) ? trim($_POST['name']) : '';
            $description = isset($_POST['description']) ? trim($_POST['description']) : '';
            $points = isset($_POST['points']) ? (int) $_POST['points'] : 0;
            $stock = isset($_POST['stock']) ? (int) $_POST['stock'] : 0;

            if (!$rewardId || empty($name) || $points <= 0) {
                echo json_encode(array("status" => "error", "message" => "Dados inválidos."));
                exit();
            }

            // Get current reward
            $stmt = $db->prepare("SELECT image_path FROM rewards WHERE id = ?");
            $stmt->execute([$rewardId]);
            $currentReward = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$currentReward) {
                echo json_encode(array("status" => "error", "message" => "Prémio não encontrado."));
                exit();
            }

            $imagePath = $currentReward['image_path'];

            // Handle new image upload
            if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
                $error = '';
                if (!validateImageFile($_FILES['image'], $error)) {
                    echo json_encode(array("status" => "error", "message" => $error));
                    exit();
                }

                // Delete old image if exists
                if ($imagePath) {
                    $oldPath = '../' . $imagePath;
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }

                $uploadDir = ensureRewardUploadDirectory($rewardId);
                $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
                $filename = 'reward_' . time() . '_' . uniqid() . '.' . $extension;
                $filepath = $uploadDir . '/' . $filename;

                if (move_uploaded_file($_FILES['image']['tmp_name'], $filepath)) {
                    $imagePath = getWebPath($filepath);
                }
            }

            // Update reward
            $stmt = $db->prepare("
                UPDATE rewards
                SET name = ?, description = ?, points = ?, stock = ?, image_path = ?
                WHERE id = ?
            ");
            $stmt->execute([$name, $description, $points, $stock, $imagePath, $rewardId]);

            echo json_encode(array(
                "status" => "success",
                "message" => "Prémio atualizado com sucesso!",
                "data" => array("image_path" => $imagePath)
            ));
            break;

        case 'delete':
            // Delete reward
            $data = json_decode(file_get_contents("php://input"));
            $rewardId = isset($data->id) ? (int) $data->id : null;

            if (!$rewardId) {
                echo json_encode(array("status" => "error", "message" => "Reward ID não fornecido."));
                exit();
            }

            // Get reward to delete image
            $stmt = $db->prepare("SELECT image_path FROM rewards WHERE id = ?");
            $stmt->execute([$rewardId]);
            $reward = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($reward && $reward['image_path']) {
                $imagePath = '../' . $reward['image_path'];
                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }
                // Try to remove directory
                $dir = dirname($imagePath);
                if (is_dir($dir) && count(scandir($dir)) == 2) { // Only . and ..
                    rmdir($dir);
                }
            }

            // Delete reward
            $stmt = $db->prepare("DELETE FROM rewards WHERE id = ?");
            $stmt->execute([$rewardId]);

            echo json_encode(array(
                "status" => "success",
                "message" => "Prémio removido com sucesso!"
            ));
            break;

        case 'toggle_availability':
            // Toggle availability
            $data = json_decode(file_get_contents("php://input"));
            $rewardId = isset($data->id) ? (int) $data->id : null;

            if (!$rewardId) {
                echo json_encode(array("status" => "error", "message" => "Reward ID não fornecido."));
                exit();
            }

            $stmt = $db->prepare("
                UPDATE rewards
                SET available = NOT available
                WHERE id = ?
            ");
            $stmt->execute([$rewardId]);

            echo json_encode(array(
                "status" => "success",
                "message" => "Disponibilidade atualizada!"
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