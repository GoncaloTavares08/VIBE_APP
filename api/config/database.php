<?php
include_once __DIR__ . '/../utils/load_env.php';

loadEnv(__DIR__ . '/../../.env');

class Database
{
    private $host;
    private $username;
    private $password;
    public $conn;

    public function __construct()
    {
        $this->host = $_ENV['DB_HOST'] ?? getenv('DB_HOST');
        $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER');
        $this->password = $_ENV['DB_PASS'] ?? getenv('DB_PASS');
    }

    /**
     * Get connection to GLOBAL database (for authentication, users table)
     */
    public function getGlobalConnection()
    {
        $global_db = $_ENV['GLOBAL_DB_NAME'] ?? getenv('GLOBAL_DB_NAME');

        try {
            $conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $global_db,
                $this->username,
                $this->password
            );
            $conn->exec("set names utf8mb4");
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $conn;
        } catch (PDOException $exception) {
            error_log("Global DB Connection error: " . $exception->getMessage());
            return null;
        }
    }

    /**
     * Get connection to CLIENT-SPECIFIC database based on X-Client-ID header
     */
    public function getClientConnection()
    {
        // Get client ID from header - InfinityFree compatible way
        $clientId = ''; // default

        // Try to get from $_SERVER (works on InfinityFree)
        if (isset($_SERVER['HTTP_X_CLIENT_ID'])) {
            $clientId = strtolower($_SERVER['HTTP_X_CLIENT_ID']);
        }

        // Map client IDs to database names from .env
        $databaseMap = [
            'vr' => $_ENV['VR_DB_NAME'] ?? getenv('VR_DB_NAME'),
            'eskada' => $_ENV['ESKADA_DB_NAME'] ?? getenv('ESKADA_DB_NAME'),
        ];

        $client_db = $databaseMap[$clientId] ?? $databaseMap['default'];

        try {
            $conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $client_db,
                $this->username,
                $this->password
            );
            $conn->exec("set names utf8mb4");
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return [
                'conn' => $conn,
                'client_id' => $clientId,
                'db_name' => $client_db
            ];
        } catch (PDOException $exception) {
            error_log("Client DB Connection error: " . $exception->getMessage());
            return null;
        }
    }

    /**
     * Get connection to CLIENT-SPECIFIC database by club slug
     * @param string $slug Club slug (e.g., 'vr', 'eskada')
     */
    public function getClientConnectionBySlug($slug)
    {
        // Map client IDs to database names from .env
        $databaseMap = [
            'vr' => $_ENV['VR_DB_NAME'] ?? getenv('VR_DB_NAME'),
            'eskada' => $_ENV['ESKADA_DB_NAME'] ?? getenv('ESKADA_DB_NAME'),
        ];

        $client_db = $databaseMap[strtolower($slug)] ?? null;
        
        if (!$client_db) {
            error_log("Invalid club slug: " . $slug);
            return null;
        }

        try {
            $conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $client_db,
                $this->username,
                $this->password
            );
            $conn->exec("set names utf8mb4");
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $conn;
        } catch (PDOException $exception) {
            error_log("Client DB Connection error for slug '$slug': " . $exception->getMessage());
            return null;
        }
    }

    /**
     * Legacy method for backward compatibility
     * Defaults to global connection
     */
    public function getConnection()
    {
        return $this->getGlobalConnection();
    }
}
?>