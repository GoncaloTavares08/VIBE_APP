<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$database = new Database();

// Get club slug from header
$clubSlug = isset($_SERVER['HTTP_X_CLIENT_ID']) ? $_SERVER['HTTP_X_CLIENT_ID'] : '';
if (empty($clubSlug)) {
    echo json_encode(array("status" => "error", "message" => "Club slug não fornecido."));
    exit();
}

// Connect to club database
$db = $database->getClientConnectionBySlug($clubSlug);

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro ao conectar à base de dados do clube."));
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'get_history':
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = isset($input['user_id']) ? (int) $input['user_id'] : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            // Debug log
            error_log("History Request - User: $userId, Club: $clubSlug");

            // 1. FETCH EVENTS (Checked In only)
            // Events where the user has a guestlist entry with status 'checked_in'
            $eventStmt = $db->prepare("
                SELECT 
                    e.id,
                    e.name as event_name,
                    e.date as event_date,
                    e.image_url,
                    g.checked_in_at
                FROM guestlist g
                JOIN events e ON g.event_id = e.id
                WHERE g.client_id = ? 
                AND g.status = 'checked_in'
                ORDER BY g.checked_in_at DESC, e.date DESC
            ");
            $eventStmt->execute([$userId]);
            $events = $eventStmt->fetchAll(PDO::FETCH_ASSOC);

            // Fix event image paths if needed
            foreach ($events as &$event) {
                if ($event['image_url'] && strpos($event['image_url'], 'http') !== 0) {
                    $event['image_url'] = '/api/' . ltrim($event['image_url'], '/');
                }
            }

            // 2. FETCH POINTS HISTORY (Transactions + Redemptions)

            // A. Points Transactions (Purchases, Bonuses, etc.)
            // Table: points_transactions
            $txStmt = $db->prepare("
                SELECT 
                    id, 
                    points, 
                    transaction_type, 
                    amount_spent, 
                    created_at, 
                    event_id
                FROM points_transactions 
                WHERE user_id = ?
            ");
            $txStmt->execute([$userId]);
            $transactions = $txStmt->fetchAll(PDO::FETCH_ASSOC);

            // B. Redemptions (Spending points)
            // Table: reward_redemptions
            // We need to shape this like a transaction
            $redemptionStmt = $db->prepare("
                SELECT 
                    id, 
                    points_spent as points, 
                    'reward_redemption' as transaction_type, 
                    0.00 as amount_spent, 
                    redeemed_at as created_at, 
                    NULL as event_id,
                    reward_name
                FROM reward_redemptions 
                WHERE user_id = ?
            ");
            $redemptionStmt->execute([$userId]);
            $redemptions = $redemptionStmt->fetchAll(PDO::FETCH_ASSOC);

            // Normalize and Merge
            $history = [];

            error_log("Events found: " . count($events));
            error_log("Transactions found: " . count($transactions));
            error_log("Redemptions found: " . count($redemptions));

            foreach ($transactions as $tx) {
                $history[] = [
                    'transaction_type' => $tx['transaction_type'], // purchase, etc.
                    'points' => (int) $tx['points'],    // Usually positive for purchase
                    'amount_spent' => $tx['amount_spent'],
                    'created_at' => $tx['created_at'],
                    'event_name' => '', // Could fetch event name if desired
                    'description' => ($tx['transaction_type'] == 'purchase' ? 'Compra no Bar' : 'Ajuste')
                ];
            }

            foreach ($redemptions as $rd) {
                $history[] = [
                    'transaction_type' => $rd['transaction_type'], // reward_redemption
                    'points' => -1 * (int) $rd['points'], // Negative for spending
                    'amount_spent' => 0,
                    'created_at' => $rd['created_at'],
                    'event_name' => '',
                    'description' => 'Prémio: ' . $rd['reward_name']
                ];
            }

            // Sort by created_at DESC
            usort($history, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            echo json_encode(array(
                "status" => "success",
                "data" => array(
                    "events" => $events,
                    "transactions" => $history
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