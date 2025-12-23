<?php
// api/utils/ClubValidator.php
// Validate club slugs against whitelist

class ClubValidator
{

    // Whitelist of allowed club slugs
    private static $allowedSlugs = ['vr', 'eskada'];

    /**
     * Validate if club slug is allowed
     * @param string $slug
     * @return array ['valid' => bool, 'message' => string]
     */
    public static function validate($slug)
    {
        if (empty($slug)) {
            return [
                'valid' => true,
                'message' => 'No club specified'
            ];
        }

        $slug = strtolower(trim($slug));

        if (!in_array($slug, self::$allowedSlugs)) {
            return [
                'valid' => false,
                'message' => "Clube '{$slug}' não é válido",
                'allowed_clubs' => self::$allowedSlugs
            ];
        }

        return [
            'valid' => true,
            'slug' => $slug
        ];
    }

    /**
     * Get list of allowed clubs
     */
    public static function getAllowedSlugs()
    {
        return self::$allowedSlugs;
    }

    /**
     * Check if slug is in whitelist
     */
    public static function isAllowed($slug)
    {
        return in_array(strtolower(trim($slug)), self::$allowedSlugs);
    }

    /**
     * Sanitize club slug
     */
    public static function sanitize($slug)
    {
        // Remove any non-alphanumeric characters except hyphen
        $slug = preg_replace('/[^a-z0-9\-]/', '', strtolower($slug));
        return $slug;
    }
}
?>