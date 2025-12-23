<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/SessionHelper.php';

// Validate session
if (!SessionHelper::isLoggedIn()) {
    echo json_encode(['status' => 'error', 'message' => 'Autenticação necessária']);
    exit();
}

$userId = SessionHelper::getUserId();

// Get club-specific database
$database = new Database();
$clientData = $database->getClientConnection(); // DB do clube, não global!

if (!$clientData) {
    echo json_encode(['status' => 'error', 'message' => 'Erro de conexão à base de dados do clube']);
    exit();
}

$db = $clientData['conn'];

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGet($db, $userId);
            break;
        case 'POST':
            handlePost($db, $userId);
            break;
        case 'DELETE':
            handleDelete($db, $userId);
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Método não suportado']);
            break;
    }
} catch (PDOException $e) {
    error_log("RP Profile Events Error: " . $e->getMessage());
    // TEMPORARY: Return actual error message for debugging
    echo json_encode(['status' => 'error', 'message' => 'Erro no servidor: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("RP Profile Events Error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Erro: ' . $e->getMessage()]);
}

// GET: List all upcoming events with selection status for the RP
function handleGet($db, $userId)
{
    // Check if requesting available events (for management modal)
    // Using query parameter instead of path for better reliability
    $isAvailable = isset($_GET['all']) && $_GET['all'] === 'true';

    if ($isAvailable) {
        // Get all upcoming events with selection status
        $query = "
            SELECT 
                e.id,
                e.name,
                e.description,
                e.date,
                e.start_time,
                e.end_time,
                e.capacity,
                e.organizer_name,
                e.image_url,
                e.status,
                CASE WHEN rpe.id IS NOT NULL THEN 1 ELSE 0 END as is_selected
            FROM events e
            LEFT JOIN rp_profile_events rpe ON e.id = rpe.event_id AND rpe.rp_user_id = ?
            WHERE e.status = 'upcoming'
            ORDER BY e.date ASC, e.start_time ASC
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([$userId]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convert is_selected to boolean
        foreach ($events as &$event) {
            $event['is_selected'] = (bool) $event['is_selected'];
        }

        echo json_encode(['status' => 'success', 'data' => $events]);
    } else {
        // Get only selected events for profile display
        $query = "
            SELECT 
                e.id,
                e.name,
                e.description,
                e.date,
                e.start_time,
                e.end_time,
                e.capacity,
                e.organizer_name,
                e.image_url,
                e.status
            FROM events e
            INNER JOIN rp_profile_events rpe ON e.id = rpe.event_id
            WHERE rpe.rp_user_id = ? AND e.status = 'upcoming'
            ORDER BY e.date ASC, e.start_time ASC
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([$userId]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['status' => 'success', 'data' => $events]);
    }
}

// POST: Add event to RP profile
function handlePost($db, $userId)
{
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->event_id)) {
        echo json_encode(['status' => 'error', 'message' => 'ID do evento é obrigatório']);
        return;
    }

    // Check if event exists and is upcoming
    $stmt = $db->prepare("SELECT id FROM events WHERE id = ? AND status = 'upcoming'");
    $stmt->execute([$data->event_id]);

    if (!$stmt->fetch()) {
        echo json_encode(['status' => 'error', 'message' => 'Evento não encontrado ou não está upcoming']);
        return;
    }

    // Insert (ignore if already exists due to UNIQUE constraint)
    $query = "INSERT IGNORE INTO rp_profile_events (rp_user_id, event_id) VALUES (?, ?)";
    $stmt = $db->prepare($query);
    $stmt->execute([$userId, $data->event_id]);

    echo json_encode(['status' => 'success', 'message' => 'Evento adicionado ao perfil']);
}

// DELETE: Remove event from RP profile
function handleDelete($db, $userId)
{
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->event_id)) {
        echo json_encode(['status' => 'error', 'message' => 'ID do evento é obrigatório']);
        return;
    }

    $query = "DELETE FROM rp_profile_events WHERE rp_user_id = ? AND event_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$userId, $data->event_id]);

    echo json_encode(['status' => 'success', 'message' => 'Evento removido do perfil']);
}
?>