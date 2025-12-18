<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once './config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($db) {
    try {
        $sql = "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'CLIENT',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        $db->exec($sql);

        echo json_encode(array("status" => "success", "message" => "Tabela 'users' criada ou já existe com sucesso!"));
    } catch (PDOException $e) {
        echo json_encode(array("status" => "error", "message" => "Erro ao criar tabela: " . $e->getMessage()));
    }
} else {
    echo json_encode(array("status" => "error", "message" => "Falha na conexão com a base de dados."));
}
?>