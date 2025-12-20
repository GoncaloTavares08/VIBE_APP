<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';
include_once '../models/User.php';
include_once '../utils/send_email.php';

// Use GLOBAL database for authentication
$database = new Database();
$db = $database->getGlobalConnection();

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro de conexão à base de dados global."));
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
                // Get the newly created user ID
                $newUserId = $db->lastInsertId();

                // Get client ID from header - InfinityFree compatible
                $clientSlug = isset($_SERVER['HTTP_X_CLIENT_ID'])
                    ? strtolower($_SERVER['HTTP_X_CLIENT_ID'])
                    : 'vr';

                // Get club ID from slug
                $stmt = $db->prepare("SELECT id FROM clubs WHERE slug = ?");
                $stmt->execute([$clientSlug]);
                $club = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($club) {
                    // Create user_club_access entry
                    $stmt = $db->prepare("INSERT INTO user_club_access (user_id, club_id, role) VALUES (?, ?, ?)");
                    $stmt->execute([$newUserId, $club['id'], $user->role]);
                }

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
            // Get client ID from header - InfinityFree compatible
            $clientSlug = isset($_SERVER['HTTP_X_CLIENT_ID'])
                ? strtolower($_SERVER['HTTP_X_CLIENT_ID'])
                : 'vr';

            // Get club ID from slug
            $stmt = $db->prepare("SELECT id FROM clubs WHERE slug = ?");
            $stmt->execute([$clientSlug]);
            $club = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($club) {
                // Check if user_club_access already exists
                $stmt = $db->prepare("SELECT id FROM user_club_access WHERE user_id = ? AND club_id = ?");
                $stmt->execute([$user->id, $club['id']]);
                $access = $stmt->fetch(PDO::FETCH_ASSOC);

                // If not exists, create it
                if (!$access) {
                    $stmt = $db->prepare("INSERT INTO user_club_access (user_id, club_id, role) VALUES (?, ?, ?)");
                    $stmt->execute([$user->id, $club['id'], $user->role]);
                }
            }

            echo json_encode(array(
                "status" => "success",
                "message" => "Login efetuado com sucesso.",
                "user" => array(
                    "id" => $user->id,
                    "name" => $user->name,
                    "email" => $user->email,
                    "role" => $user->role,
                    "club_slug" => $clientSlug
                )
            ));
        } else {
            echo json_encode(array("status" => "error", "message" => "Email ou password incorretos."));
        }
    } else {
        echo json_encode(array("status" => "error", "message" => "Dados incompletos."));
    }
}
// FORGOT PASSWORD
elseif ($data->action == 'reset-request') {
    if (!empty($data->email)) {
        $user->email = $data->email;
        if ($user->emailExists()) {
            // Generate a random 6 character code (Uppercase Letters + Numbers)
            $chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $code = substr(str_shuffle($chars), 0, 6);

            if ($user->setResetToken($code)) {
                // Send Email
                $subject = "VIBE App - Recuperar Password";
                $body = "
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Arial', sans-serif; color: #ffffff; }
                            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0a0a0a; }
                            .logo { color: #D4AF37; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 30px; letter-spacing: 2px; }
                            .card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; text-align: center; backdrop-filter: blur(10px); }
                            .title { color: #ffffff; font-size: 20px; margin-bottom: 20px; font-weight: normal; }
                            .token-box { background: linear-gradient(135deg, #D4AF37 0%, #FFD700 100%); color: #000000; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 12px; margin: 30px 0; letter-spacing: 5px; display: inline-block; box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); }
                            .text { color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 10px; }
                            .footer { text-align: center; margin-top: 30px; color: #4b5563; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='logo'>VIBE</div>
                            <div class='card'>
                                <h1 class='title'>Recuperar Password</h1>
                                <p class='text'>Recebemos um pedido para recuperar a password da tua conta.</p>
                                <p class='text'>Usa o código abaixo para continuar:</p>
                                
                                <div class='token-box'>$code</div>
                                
                                <p class='text'>Este código expira em 15 minutos.</p>
                                <p class='text' style='font-size: 12px; opacity: 0.7;'>Se não foste tu, por favor ignora este email.</p>
                            </div>
                            <div class='footer'>
                                &copy; " . date("Y") . " VIBE App. All rights reserved.
                            </div>
                        </div>
                    </body>
                    </html>
                ";

                $emailResult = sendEmail($data->email, $subject, $body);

                if ($emailResult === true) {
                    echo json_encode(array(
                        "status" => "success",
                        "message" => "Código enviado para o email."
                    ));
                } else {
                    // Fallback if email fails (show actual error)
                    echo json_encode(array(
                        "status" => "error",
                        "message" => "Erro de Email: " . $emailResult
                    ));
                }
            } else {
                echo json_encode(array("status" => "error", "message" => "Erro ao gerar código."));
            }
        } else {
            // Security: Don't reveal if email exists, or behave as success but do nothing.
            // For this prompt user wants "verifique se o email existe se sim segue".
            // If not exists, we should probably tell them or just not proceed.
            // User said: "quero que verifique se o email existe se sim segue"
            echo json_encode(array("status" => "error", "message" => "Email não encontrado."));
        }
    } else {
        echo json_encode(array("status" => "error", "message" => "Email é obrigatório."));
    }
}
// VERIFY CODE
elseif ($data->action == 'verify-code') {
    if (!empty($data->email) && !empty($data->code)) {
        $user->email = $data->email;
        if ($user->verifyResetToken($data->code)) {
            echo json_encode(array("status" => "success", "message" => "Código válido."));
        } else {
            echo json_encode(array("status" => "error", "message" => "Código inválido ou expirado."));
        }
    } else {
        echo json_encode(array("status" => "error", "message" => "Dados inválidos."));
    }
}
// RESET PASSWORD
elseif ($data->action == 'reset-password') {
    if (!empty($data->email) && !empty($data->password)) {
        $user->email = $data->email;
        if ($user->updatePassword($data->password)) {
            echo json_encode(array("status" => "success", "message" => "Password atualizada com sucesso!"));
        } else {
            echo json_encode(array("status" => "error", "message" => "Erro ao atualizar password."));
        }
    } else {
        echo json_encode(array("status" => "error", "message" => "Dados incompletos."));
    }
}
?>