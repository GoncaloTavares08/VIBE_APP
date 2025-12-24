<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

try {
    switch ($action) {
        case 'list':
            // Get all available rewards with stock
            $stmt = $db->prepare("
                SELECT id, name, description, points, stock, image_path
                FROM rewards
                WHERE available = 1 AND stock > 0
                ORDER BY points ASC
            ");
            $stmt->execute();
            $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format image paths to be web-accessible
            foreach ($rewards as &$reward) {
                if ($reward['image_path']) {
                    // Ensure the path starts with /api/
                    if (strpos($reward['image_path'], '/api/') !== 0) {
                        $reward['image_path'] = '/api/' . $reward['image_path'];
                    }
                }
            }

            echo json_encode(array(
                "status" => "success",
                "data" => $rewards
            ));
            break;

        case 'redeem':
            // Redeem a reward
            $data = json_decode(file_get_contents("php://input"));
            $userId = isset($data->user_id) ? (int) $data->user_id : null;
            $rewardId = isset($data->reward_id) ? (int) $data->reward_id : null;

            if (!$userId || !$rewardId) {
                echo json_encode(array("status" => "error", "message" => "Dados inválidos."));
                exit();
            }

            // Get reward details
            $stmt = $db->prepare("SELECT id, name, points, stock, available FROM rewards WHERE id = ?");
            $stmt->execute([$rewardId]);
            $reward = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$reward) {
                echo json_encode(array("status" => "error", "message" => "Prémio não encontrado."));
                exit();
            }

            if (!$reward['available'] || $reward['stock'] <= 0) {
                echo json_encode(array("status" => "error", "message" => "Prémio indisponível."));
                exit();
            }

            // Get user points from global database (user_club_access table)
            $globalDb = $database->getGlobalConnection();

            // First get club_id from slug
            $stmt = $globalDb->prepare("SELECT id FROM clubs WHERE slug = ?");
            $stmt->execute([$clubSlug]);
            $club = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$club) {
                echo json_encode(array("status" => "error", "message" => "Clube não encontrado."));
                exit();
            }

            $clubId = $club['id'];

            // Get user's points for this club
            $stmt = $globalDb->prepare("SELECT points FROM user_club_access WHERE user_id = ? AND club_id = ?");
            $stmt->execute([$userId, $clubId]);
            $userClubAccess = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$userClubAccess) {
                echo json_encode(array("status" => "error", "message" => "Acesso ao clube não encontrado."));
                exit();
            }

            if ($userClubAccess['points'] < $reward['points']) {
                echo json_encode(array("status" => "error", "message" => "Pontos insuficientes."));
                exit();
            }

            // Start transaction
            $db->beginTransaction();
            $globalDb->beginTransaction();

            try {
                // Deduct points from user in global database
                $newPoints = $userClubAccess['points'] - $reward['points'];
                $stmt = $globalDb->prepare("UPDATE user_club_access SET points = ? WHERE user_id = ? AND club_id = ?");
                $stmt->execute([$newPoints, $userId, $clubId]);

                // Decrement stock
                $stmt = $db->prepare("UPDATE rewards SET stock = stock - 1 WHERE id = ?");
                $stmt->execute([$rewardId]);

                // Generate unique QR code
                $qrCode = 'REWARD-' . $rewardId . '-' . $userId . '-' . time() . '-' . bin2hex(random_bytes(8));

                // Calculate expiration (30 days from now)
                $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

                // Create redemption record
                $stmt = $db->prepare("
                    INSERT INTO reward_redemptions 
                    (user_id, reward_id, reward_name, points_spent, qr_code, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $userId,
                    $rewardId,
                    $reward['name'],
                    $reward['points'],
                    $qrCode,
                    $expiresAt
                ]);

                $redemptionId = $db->lastInsertId();

                // Commit both transactions
                $db->commit();
                $globalDb->commit();

                echo json_encode(array(
                    "status" => "success",
                    "message" => "Prémio resgatado com sucesso!",
                    "data" => array(
                        "redemption_id" => $redemptionId,
                        "qr_code" => $qrCode,
                        "expires_at" => $expiresAt,
                        "new_points" => $newPoints
                    )
                ));
            } catch (Exception $e) {
                // Rollback both transactions
                $db->rollBack();
                $globalDb->rollBack();
                throw $e;
            }
            break;

        case 'my_redemptions':
            // Get user's active redemptions
            $data = json_decode(file_get_contents("php://input"));
            $userId = isset($data->user_id) ? (int) $data->user_id : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            // Get active redemptions (pending, not expired)
            $stmt = $db->prepare("
                SELECT 
                    rr.id,
                    rr.reward_id,
                    rr.reward_name,
                    rr.points_spent,
                    rr.status,
                    rr.qr_code,
                    rr.redeemed_at,
                    rr.expires_at,
                    rr.used_at,
                    rr.event_id,
                    r.image_path,
                    r.description
                FROM reward_redemptions rr
                LEFT JOIN rewards r ON rr.reward_id = r.id
                WHERE rr.user_id = ?
                AND rr.status IN ('pending', 'used')
                AND rr.expires_at > NOW()
                ORDER BY rr.redeemed_at DESC
            ");
            $stmt->execute([$userId]);
            $redemptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format image paths
            foreach ($redemptions as &$redemption) {
                if ($redemption['image_path']) {
                    if (strpos($redemption['image_path'], '/api/') !== 0) {
                        $redemption['image_path'] = '/api/' . $redemption['image_path'];
                    }
                }
            }

            echo json_encode(array(
                "status" => "success",
                "data" => $redemptions
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