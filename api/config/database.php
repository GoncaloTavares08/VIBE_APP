<?php
include_once __DIR__ . '/../utils/load_env.php';
class Database
{
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct()
    {
        loadEnv(__DIR__ . '/../../.env');

        $this->host = $_ENV['DB_HOST'] ?? getenv('DB_HOST');
        $this->db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME');
        $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER');
        $this->password = $_ENV['DB_PASS'] ?? getenv('DB_PASS');
    }

    public function getConnection()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
        } catch (PDOException $exception) {
            // error_log("Connection error: " . $exception->getMessage());
            // Do not echo here, it breaks JSON
        }

        return $this->conn;
    }
}
?>