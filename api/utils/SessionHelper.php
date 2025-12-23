<?php
/**
 * SessionHelper - Gestão simplificada de sessões PHP
 * Substitui JWT para autenticação mais simples e robusta
 */
class SessionHelper
{
    /**
     * Inicia a sessão se ainda não estiver ativa
     */
    public static function start()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    /**
     * Verifica se o utilizador está autenticado
     */
    public static function isLoggedIn()
    {
        self::start();
        return isset($_SESSION['user_id']);
    }

    /**
     * Obtém o ID do utilizador autenticado
     */
    public static function getUserId()
    {
        self::start();
        return $_SESSION['user_id'] ?? null;
    }

    /**
     * Obtém o email do utilizador autenticado
     */
    public static function getUserEmail()
    {
        self::start();
        return $_SESSION['user_email'] ?? null;
    }

    /**
     * Obtém o nome do utilizador autenticado
     */
    public static function getUserName()
    {
        self::start();
        return $_SESSION['user_name'] ?? null;
    }

    /**
     * Obtém o role do utilizador no clube atual
     */
    public static function getUserRole()
    {
        self::start();
        return $_SESSION['user_role'] ?? null;
    }

    /**
     * Obtém o slug do clube atual
     */
    public static function getClubSlug()
    {
        self::start();
        return $_SESSION['club_slug'] ?? null;
    }

    /**
     * Define os dados do utilizador na sessão após login
     */
    public static function setUser($userData)
    {
        self::start();
        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['user_email'] = $userData['email'];
        $_SESSION['user_name'] = $userData['name'];
        $_SESSION['user_role'] = $userData['role'] ?? null;
        $_SESSION['club_slug'] = $userData['club_slug'] ?? null;
    }

    /**
     * Obtém todos os dados do utilizador
     */
    public static function getUser()
    {
        self::start();
        if (!self::isLoggedIn()) {
            return null;
        }

        return [
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'],
            'name' => $_SESSION['user_name'],
            'role' => $_SESSION['user_role'] ?? null,
            'club_slug' => $_SESSION['club_slug'] ?? null,
        ];
    }

    /**
     * Destrói a sessão (logout)
     */
    public static function destroy()
    {
        self::start();
        $_SESSION = [];

        // Deletar cookie da sessão
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/');
        }

        session_destroy();
    }

    /**
     * Atualiza o role do utilizador (quando muda de clube)
     */
    public static function updateRole($role, $clubSlug = null)
    {
        self::start();
        $_SESSION['user_role'] = $role;
        if ($clubSlug !== null) {
            $_SESSION['club_slug'] = $clubSlug;
        }
    }
}
?>