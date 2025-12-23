<?php
// api/utils/RateLimiter.php
// Rate limiting for login attempts

class RateLimiter
{
    private $db;
    private $maxAttempts = 5;
    private $lockoutMinutes = 10;

    public function __construct($database)
    {
        $this->db = $database;
    }

    /**
     * Check if user/IP is rate limited
     * @param string $email
     * @param string $ipAddress
     * @return array ['allowed' => bool, 'message' => string]
     */
    public function isAllowed($email, $ipAddress = null)
    {
        // Clean old attempts (older than lockout period)
        $this->cleanOldAttempts();

        // Count recent failed attempts
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as attempts 
            FROM login_attempts 
            WHERE email = ? 
            AND successful = FALSE 
            AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ");
        $stmt->execute([$email, $this->lockoutMinutes]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        $attempts = $result['attempts'];

        if ($attempts >= $this->maxAttempts) {
            return [
                'allowed' => false,
                'message' => "Demasiadas tentativas falhadas. Tenta novamente em {$this->lockoutMinutes} minutos.",
                'retry_after' => $this->lockoutMinutes * 60
            ];
        }

        return [
            'allowed' => true,
            'remaining' => $this->maxAttempts - $attempts
        ];
    }

    /**
     * Record a login attempt
     * @param string $email
     * @param bool $successful
     * @param string $ipAddress
     */
    public function recordAttempt($email, $successful = false, $ipAddress = null)
    {
        $stmt = $this->db->prepare("
            INSERT INTO login_attempts (email, ip_address, successful, attempted_at) 
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$email, $ipAddress, $successful ? 1 : 0]);

        // If successful, clear all failed attempts for this email
        if ($successful) {
            $this->clearFailedAttempts($email);
        }
    }

    /**
     * Clear failed attempts for an email (after successful login)
     */
    private function clearFailedAttempts($email)
    {
        $stmt = $this->db->prepare("
            DELETE FROM login_attempts 
            WHERE email = ? AND successful = FALSE
        ");
        $stmt->execute([$email]);
    }

    /**
     * Clean attempts older than lockout period
     */
    private function cleanOldAttempts()
    {
        $stmt = $this->db->prepare("
            DELETE FROM login_attempts 
            WHERE attempted_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
        ");
        $stmt->execute([$this->lockoutMinutes * 2]); // Keep double the lockout period
    }

    /**
     * Get client IP address
     */
    public static function getClientIP()
    {
        $ipAddress = '';
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ipAddress = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
        }
        return $ipAddress;
    }
}
?>