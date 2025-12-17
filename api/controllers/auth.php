<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';
include_once '../models/User.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro de conexão à base de dados."));
    exit();
}

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->action)) {
    echo json_encode(array("status" => "error", "message" => "Ação não especificada."));
    exit();
}

// REGISTER
if ($data->action == 'register') {
    if (
        !empty($data->name) &&
        !empty($data->email) &&
        !empty($data->password)
    ) {
        $user->name = $data->name;
        $user->email = $data->email;
        $user->password = $data->password;

        // Default role logic based on client request or hardcoded default
        $user->role = isset($data->role) ? $data->role : 'CLIENT';

        if ($user->emailExists()) {
            echo json_encode(array("status" => "error", "message" => "Este email já está registado."));
        } else {
            if ($user->create()) {
                echo json_encode(array("status" => "success", "message" => "Conta criada com sucesso!"));
            } else {
                echo json_encode(array("status" => "error", "message" => "Erro ao criar conta."));
            }
        }
    } else {
        echo json_encode(array("status" => "error", "message" => "Dados incompletos."));
    }
}
// LOGIN
elseif ($data->action == 'login') {
    if (!empty($data->email) && !empty($data->password)) {
        $user->email = $data->email;
        $email_exists = $user->emailExists();

        if ($email_exists && password_verify($data->password, $user->password)) {
            echo json_encode(array(
                "status" => "success",
                "message" => "Login efetuado com sucesso.",
                "user" => array(
                    "id" => $user->id,
                    "name" => $user->name,
                    "email" => $user->email,
                    "role" => $user->role
                )
            ));
        } else {
            echo json_encode(array("status" => "error", "message" => "Email ou password incorretos."));
        }
    } else {
        echo json_encode(array("status" => "error", "message" => "Dados incompletos."));
    }
}
?>