<?php
// api/utils/JWTHelper.php
// JWT Token generation and validation

class JWTHelper
{

    private static function getSecret()
    {
        $secret = $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET');

        return $secret;
    }

    private static function getExpiration()
    {
        $expiration = $_ENV['JWT_EXPIRATION'] ?? getenv('JWT_EXPIRATION');

        // Default to 24 hours (86400 seconds) if not set or invalid
        if (empty($expiration) || !is_numeric($expiration)) {
            return 86400;
        }

        return (int) $expiration;
    }

    /**
     * Generate JWT token
     * @param int $userId
     * @param string $email
     * @param string $role (optional)
     * @param string $clubSlug (optional)
     * @return string JWT token
     */
    public static function generate($userId, $email, $role = null, $clubSlug = null)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

        $payload = [
            'userId' => $userId,
            'email' => $email,
            'iat' => time(),
            'exp' => time() + self::getExpiration()
        ];

        if ($role) {
            $payload['role'] = $role;
        }

        if ($clubSlug) {
            $payload['clubSlug'] = $clubSlug;
        }

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::getSecret(), true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Validate and decode JWT token
     * @param string $token
     * @return object|false Decoded payload as object or false if invalid
     */
    public static function validate($token)
    {
        if (empty($token)) {
            return false;
        }

        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            return false;
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $tokenParts;

        // Verify signature
        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::getSecret(), true);

        if (!hash_equals($signature, $expectedSignature)) {
            return false; // Invalid signature
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload));

        // Check if decoding failed
        if (!$payload) {
            return false;
        }

        // Check expiration
        if (isset($payload->exp) && $payload->exp < time()) {
            return false; // Token expired
        }

        // Convert userId to user_id for consistency
        if (isset($payload->userId) && !isset($payload->user_id)) {
            $payload->user_id = $payload->userId;
        }

        return $payload;
    }

    /**
     * Extract token from Authorization header
     * @return string|null
     */
    public static function getTokenFromHeader()
    {
        $headers = getallheaders();

        // Try different header names
        $authHeader = $headers['Authorization'] ??
            $headers['authorization'] ??
            $_SERVER['HTTP_AUTHORIZATION'] ??
            null;

        if (empty($authHeader)) {
            return null;
        }

        // Extract token from "Bearer <token>"
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($text)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
    }

    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode($text)
    {
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $text));
    }
}
?>