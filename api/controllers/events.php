<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../utils/SessionHelper.php';

$database = new Database();
$clientData = $database->getClientConnection();

if (!$clientData) {
    echo json_encode(array(
        "status" => "error",
        "message" => "Falha na conexão com a base de dados do clube."
    ));
    exit();
}

$db = $clientData['conn'];
$method = $_SERVER['REQUEST_METHOD'];

// Use SessionHelper instead of hardcoded values
if (!SessionHelper::isLoggedIn()) {
    // Allow GET requests without login (public events)
    if ($method !== 'GET') {
        echo json_encode(array("status" => "error", "message" => "Autenticação necessária"));
        exit();
    }
    $userId = null;
    $userRole = null;
} else {
    $userId = SessionHelper::getUserId();
    $userRole = SessionHelper::getUserRole();
}

switch ($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        handlePost($db, $userId);
        break;
    case 'PUT':
        handlePut($db, $userId);
        break;
    case 'DELETE':
        handleDelete($db);
        break;
    default:
        echo json_encode(array("status" => "error", "message" => "Método não suportado."));
        http_response_code(405);
        break;
}

function handleGet($db)
{
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($id) {
        // Get single event
        $stmt = $db->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([$id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($event) {
            echo json_encode(array("status" => "success", "data" => $event));
        } else {
            echo json_encode(array("status" => "error", "message" => "Evento não encontrado."));
            http_response_code(404);
        }
    } else {
        // Get all events
        $status = isset($_GET['status']) ? $_GET['status'] : null;

        if ($status) {
            $stmt = $db->prepare("SELECT * FROM events WHERE status = ? ORDER BY date DESC, start_time DESC");
            $stmt->execute([$status]);
        } else {
            $stmt = $db->query("SELECT * FROM events ORDER BY date DESC, start_time DESC");
        }

        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(array("status" => "success", "data" => $events));
    }
}

function handlePost($db, $userId)
{
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->name) || !isset($data->date) || !isset($data->start_time) || !isset($data->end_time) || !isset($data->capacity)) {
        echo json_encode(array("status" => "error", "message" => "Dados obrigatórios em falta."));
        http_response_code(400);
        return;
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO events (name, description, date, start_time, end_time, capacity, organizer_name, status, image_url, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $status = isset($data->status) ? $data->status : 'upcoming';
        $description = isset($data->description) ? $data->description : null;
        $organizer = isset($data->organizer_name) ? $data->organizer_name : null;
        $imageUrl = isset($data->image_url) ? $data->image_url : null;

        $stmt->execute([
            $data->name,
            $description,
            $data->date,
            $data->start_time,
            $data->end_time,
            $data->capacity,
            $organizer,
            $status,
            $imageUrl,
            $userId
        ]);

        $eventId = $db->lastInsertId();

        echo json_encode(array(
            "status" => "success",
            "message" => "Evento criado com sucesso!",
            "event_id" => $eventId
        ));
        http_response_code(201);
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => "Erro ao criar evento: " . $e->getMessage()));
        http_response_code(500);
    }
}

function handlePut($db, $userId)
{
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id)) {
        echo json_encode(array("status" => "error", "message" => "ID do evento não fornecido."));
        http_response_code(400);
        return;
    }

    try {
        // Build dynamic update query
        $fields = [];
        $values = [];

        if (isset($data->name)) {
            $fields[] = "name = ?";
            $values[] = $data->name;
        }
        if (isset($data->description)) {
            $fields[] = "description = ?";
            $values[] = $data->description;
        }
        if (isset($data->date)) {
            $fields[] = "date = ?";
            $values[] = $data->date;
        }
        if (isset($data->start_time)) {
            $fields[] = "start_time = ?";
            $values[] = $data->start_time;
        }
        if (isset($data->end_time)) {
            $fields[] = "end_time = ?";
            $values[] = $data->end_time;
        }
        if (isset($data->capacity)) {
            $fields[] = "capacity = ?";
            $values[] = $data->capacity;
        }
        if (isset($data->organizer_name)) {
            $fields[] = "organizer_name = ?";
            $values[] = $data->organizer_name;
        }
        if (isset($data->status)) {
            $fields[] = "status = ?";
            $values[] = $data->status;
        }
        if (isset($data->image_url)) {
            $fields[] = "image_url = ?";
            $values[] = $data->image_url;
        }

        if (empty($fields)) {
            echo json_encode(array("status" => "error", "message" => "Nenhum campo para atualizar."));
            http_response_code(400);
            return;
        }

        $values[] = $data->id;

        $sql = "UPDATE events SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($values);

        echo json_encode(array("status" => "success", "message" => "Evento atualizado com sucesso!"));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => "Erro ao atualizar evento: " . $e->getMessage()));
        http_response_code(500);
    }
}

function handleDelete($db)
{
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id)) {
        echo json_encode(array("status" => "error", "message" => "ID do evento não fornecido."));
        http_response_code(400);
        return;
    }

    try {
        $stmt = $db->prepare("DELETE FROM events WHERE id = ?");
        $stmt->execute([$data->id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(array("status" => "success", "message" => "Evento eliminado com sucesso!"));
        } else {
            echo json_encode(array("status" => "error", "message" => "Evento não encontrado."));
            http_response_code(404);
        }
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => "Erro ao eliminar evento: " . $e->getMessage()));
        http_response_code(500);
    }
}
?>