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
include_once '../utils/SessionHelper.php';

// Use GLOBAL database for user management
$database = new Database();
$db = $database->getGlobalConnection();

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro de conexão à base de dados."));
    exit();
}

// Verify admin authentication
$userSession = SessionHelper::getUser();
if (!$userSession || $userSession['role'] !== 'ADMIN') {
    echo json_encode(array("status" => "error", "message" => "Acesso negado. Apenas administradores."));
    http_response_code(403);
    exit();
}

// Get club ID from session
$clubSlug = $userSession['club_slug'];
if (!$clubSlug) {
    echo json_encode(array("status" => "error", "message" => "Club não identificado."));
    http_response_code(400);
    exit();
}

// Get club ID from slug
$stmt = $db->prepare("SELECT id FROM clubs WHERE slug = ?");
$stmt->execute([$clubSlug]);
$club = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$club) {
    echo json_encode(array("status" => "error", "message" => "Club não encontrado."));
    http_response_code(404);
    exit();
}

$clubId = $club['id'];

// Handle different actions
$action = $_GET['action'] ?? null;

// LIST ALL RPs AND TEAM LEADERS
if ($action === 'list' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get all users with RP or TEAM_LEADER role for this club
        $stmt = $db->prepare("
            SELECT 
                u.id,
                u.name,
                u.email,
                uca.role,
                uca.team_leader_id,
                tl.name as team_leader_name
            FROM users u
            INNER JOIN user_club_access uca ON u.id = uca.user_id
            LEFT JOIN users tl ON uca.team_leader_id = tl.id
            WHERE uca.club_id = ? 
            AND uca.role IN ('RP', 'TEAM_LEADER')
            ORDER BY 
                CASE uca.role 
                    WHEN 'TEAM_LEADER' THEN 1 
                    WHEN 'RP' THEN 2 
                END,
                u.name
        ");
        $stmt->execute([$clubId]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Generate avatar initials
        foreach ($users as &$user) {
            $nameParts = explode(' ', $user['name']);
            $user['avatar'] = strtoupper(
                substr($nameParts[0], 0, 1) .
                (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : '')
            );

            // TODO: Replace with real data from events/reservations
            $user['guestsTonight'] = rand(15, 50);
            $user['totalRevenue'] = $user['guestsTonight'] * 20;
        }

        echo json_encode(array(
            "status" => "success",
            "data" => $users
        ));
    } catch (Exception $e) {
        echo json_encode(array("status" => "error", "message" => "Erro ao listar utilizadores: " . $e->getMessage()));
        http_response_code(500);
    }
}

// SEARCH CLIENT BY EMAIL
elseif ($action === 'search_client' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->email)) {
        echo json_encode(array("status" => "error", "message" => "Email é obrigatório."));
        http_response_code(400);
        exit();
    }

    try {
        $stmt = $db->prepare("
            SELECT 
                u.id,
                u.name,
                u.email,
                uca.role
            FROM users u
            INNER JOIN user_club_access uca ON u.id = uca.user_id
            WHERE uca.club_id = ? 
            AND u.email = ?
            AND uca.role = 'CLIENT'
        ");
        $stmt->execute([$clubId, $data->email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Generate avatar
            $nameParts = explode(' ', $user['name']);
            $user['avatar'] = strtoupper(
                substr($nameParts[0], 0, 1) .
                (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : '')
            );

            echo json_encode(array(
                "status" => "success",
                "data" => $user
            ));
        } else {
            echo json_encode(array("status" => "error", "message" => "Cliente não encontrado com esse email."));
            http_response_code(404);
        }
    } catch (Exception $e) {
        echo json_encode(array("status" => "error", "message" => "Erro ao pesquisar cliente: " . $e->getMessage()));
        http_response_code(500);
    }
}

// UPDATE USER ROLE
elseif ($action === 'update_role' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->user_id) || empty($data->new_role)) {
        echo json_encode(array("status" => "error", "message" => "user_id e new_role são obrigatórios."));
        http_response_code(400);
        exit();
    }

    // Validate role
    $allowedRoles = ['CLIENT', 'RP', 'TEAM_LEADER'];
    if (!in_array($data->new_role, $allowedRoles)) {
        echo json_encode(array("status" => "error", "message" => "Role inválido."));
        http_response_code(400);
        exit();
    }

    // Validate team_leader_id is provided for RP role
    if ($data->new_role === 'RP' && empty($data->team_leader_id)) {
        echo json_encode(array("status" => "error", "message" => "Team leader é obrigatório para RPs."));
        http_response_code(400);
        exit();
    }

    try {
        $db->beginTransaction();

        // Update role and team_leader_id
        if ($data->new_role === 'RP') {
            // Prevent self-assignment
            if ($data->team_leader_id == $data->user_id) {
                $db->rollBack();
                echo json_encode(array("status" => "error", "message" => "Um utilizador não pode ser team leader de si mesmo."));
                http_response_code(400);
                exit();
            }

            // Verify team leader exists and is actually a TEAM_LEADER
            $stmt = $db->prepare("
                SELECT uca.role 
                FROM user_club_access uca 
                WHERE uca.user_id = ? AND uca.club_id = ?
            ");
            $stmt->execute([$data->team_leader_id, $clubId]);
            $teamLeader = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$teamLeader || $teamLeader['role'] !== 'TEAM_LEADER') {
                $db->rollBack();
                echo json_encode(array("status" => "error", "message" => "Team leader inválido."));
                http_response_code(400);
                exit();
            }

            $stmt = $db->prepare("
                UPDATE user_club_access 
                SET role = ?, team_leader_id = ?
                WHERE user_id = ? AND club_id = ?
            ");
            $stmt->execute([$data->new_role, $data->team_leader_id, $data->user_id, $clubId]);
        } else {
            // For CLIENT or TEAM_LEADER conversion, check if current user is a TEAM_LEADER with RPs
            // First, get current role
            $stmt = $db->prepare("
                SELECT role 
                FROM user_club_access 
                WHERE user_id = ? AND club_id = ?
            ");
            $stmt->execute([$data->user_id, $clubId]);
            $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

            // If currently a TEAM_LEADER and converting to CLIENT or RP, check for associated RPs
            if ($currentUser && $currentUser['role'] === 'TEAM_LEADER' && $data->new_role !== 'TEAM_LEADER') {
                $stmt = $db->prepare("
                    SELECT COUNT(*) as rp_count
                    FROM user_club_access
                    WHERE team_leader_id = ? AND club_id = ? AND role = 'RP'
                ");
                $stmt->execute([$data->user_id, $clubId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($result['rp_count'] > 0) {
                    $db->rollBack();
                    echo json_encode(array(
                        "status" => "error",
                        "message" => "Não pode converter este Team Leader porque tem " . $result['rp_count'] . " RP(s) associado(s). Reassocie os RPs primeiro."
                    ));
                    http_response_code(400);
                    exit();
                }
            }

            // For CLIENT or TEAM_LEADER, set team_leader_id to NULL
            $stmt = $db->prepare("
                UPDATE user_club_access 
                SET role = ?, team_leader_id = NULL
                WHERE user_id = ? AND club_id = ?
            ");
            $stmt->execute([$data->new_role, $data->user_id, $clubId]);
        }

        $db->commit();

        echo json_encode(array(
            "status" => "success",
            "message" => "Role atualizado com sucesso."
        ));
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(array("status" => "error", "message" => "Erro ao atualizar role: " . $e->getMessage()));
        http_response_code(500);
    }
}

// PROMOTE CLIENT TO RP
elseif ($action === 'promote_to_rp' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->user_id) || empty($data->team_leader_id)) {
        echo json_encode(array("status" => "error", "message" => "user_id e team_leader_id são obrigatórios."));
        http_response_code(400);
        exit();
    }

    try {
        $db->beginTransaction();

        // Verify user is currently a CLIENT
        $stmt = $db->prepare("
            SELECT role 
            FROM user_club_access 
            WHERE user_id = ? AND club_id = ?
        ");
        $stmt->execute([$data->user_id, $clubId]);
        $currentRole = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$currentRole || $currentRole['role'] !== 'CLIENT') {
            $db->rollBack();
            echo json_encode(array("status" => "error", "message" => "Utilizador não é um cliente."));
            http_response_code(400);
            exit();
        }

        // Prevent self-assignment
        if ($data->team_leader_id == $data->user_id) {
            $db->rollBack();
            echo json_encode(array("status" => "error", "message" => "Um utilizador não pode ser team leader de si mesmo."));
            http_response_code(400);
            exit();
        }

        // Verify team leader exists and is actually a TEAM_LEADER
        $stmt = $db->prepare("
            SELECT role 
            FROM user_club_access 
            WHERE user_id = ? AND club_id = ?
        ");
        $stmt->execute([$data->team_leader_id, $clubId]);
        $teamLeader = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$teamLeader || $teamLeader['role'] !== 'TEAM_LEADER') {
            $db->rollBack();
            echo json_encode(array("status" => "error", "message" => "Team leader inválido."));
            http_response_code(400);
            exit();
        }

        // Update to RP role with team_leader_id
        $stmt = $db->prepare("
            UPDATE user_club_access 
            SET role = 'RP', team_leader_id = ?
            WHERE user_id = ? AND club_id = ?
        ");
        $stmt->execute([$data->team_leader_id, $data->user_id, $clubId]);

        $db->commit();

        echo json_encode(array(
            "status" => "success",
            "message" => "Cliente promovido a RP com sucesso."
        ));
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(array("status" => "error", "message" => "Erro ao promover cliente: " . $e->getMessage()));
        http_response_code(500);
    }
}

// INVALID ACTION
else {
    echo json_encode(array("status" => "error", "message" => "Ação inválida."));
    http_response_code(400);
}
?>