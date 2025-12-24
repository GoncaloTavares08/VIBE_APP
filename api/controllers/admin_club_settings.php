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

// Get club slug from header
$clubSlug = isset($_SERVER['HTTP_X_CLIENT_ID']) ? $_SERVER['HTTP_X_CLIENT_ID'] : '';
if (empty($clubSlug)) {
    echo json_encode(array("success" => false, "message" => "Club slug não fornecido."));
    exit();
}

// Connect to GLOBAL database to get club info
$globalDb = $database->getGlobalConnection();

if (!$globalDb) {
    echo json_encode(array("success" => false, "message" => "Erro ao conectar à base de dados global."));
    exit();
}

// Get action
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'get':
            // Get club settings by slug
            $stmt = $globalDb->prepare("
                SELECT 
                    id,
                    name,
                    slug,
                    location,
                    address,
                    max_capacity,
                    opening_time,
                    closing_time,
                    contact_phone
                FROM clubs
                WHERE slug = ?
            ");
            $stmt->execute([$clubSlug]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$settings) {
                echo json_encode(array("success" => false, "message" => "Clube não encontrado."));
                exit();
            }

            // Add default values for fields not in DB
            $settings['city'] = $settings['location']; // Use location as city for frontend
            $settings['language'] = 'pt';
            $settings['timezone'] = 'lisbon';
            $settings['dark_mode'] = 1;
            $settings['notifications'] = array(
                'eventSoldOut' => true,
                'capacityWarning' => true,
                'revenueGoals' => true,
                'securityAlerts' => true,
                'rpPerformance' => false,
                'systemIssues' => true
            );

            echo json_encode(array(
                "success" => true,
                "data" => $settings
            ));
            break;

        case 'update':
            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                echo json_encode(array("success" => false, "message" => "Dados inválidos."));
                exit();
            }

            // Validate and sanitize inputs (map city from frontend to location in DB)
            $name = isset($input['name']) ? trim($input['name']) : '';
            $address = isset($input['address']) ? trim($input['address']) : '';
            $location = isset($input['city']) ? trim($input['city']) : ''; // city from UI -> location in DB
            $maxCapacity = isset($input['max_capacity']) ? (int) $input['max_capacity'] : 800;
            $openingTime = isset($input['opening_time']) ? $input['opening_time'] : '23:00:00';
            $closingTime = isset($input['closing_time']) ? $input['closing_time'] : '06:00:00';
            $contactPhone = isset($input['contact_phone']) ? trim($input['contact_phone']) : '';

            // Validate required fields
            if (empty($name)) {
                echo json_encode(array("success" => false, "message" => "Nome do clube é obrigatório."));
                exit();
            }

            if ($maxCapacity < 1) {
                echo json_encode(array("success" => false, "message" => "Capacidade máxima inválida."));
                exit();
            }

            // Update club settings (map fields to DB columns)
            $stmt = $globalDb->prepare("
                UPDATE clubs 
                SET 
                    name = ?,
                    location = ?,
                    address = ?,
                    max_capacity = ?,
                    opening_time = ?,
                    closing_time = ?,
                    contact_phone = ?
                WHERE slug = ?
            ");

            $result = $stmt->execute([
                $name,
                $location,
                $address,
                $maxCapacity,
                $openingTime,
                $closingTime,
                $contactPhone,
                $clubSlug
            ]);

            if ($result) {
                echo json_encode(array(
                    "success" => true,
                    "message" => "Configurações atualizadas com sucesso!"
                ));
            } else {
                echo json_encode(array("success" => false, "message" => "Erro ao atualizar configurações."));
            }
            break;

        default:
            echo json_encode(array("success" => false, "message" => "Ação inválida."));
    }
} catch (Exception $e) {
    echo json_encode(array(
        "success" => false,
        "message" => "Erro: " . $e->getMessage()
    ));
}
?>