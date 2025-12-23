<?php
// api/utils/PasswordValidator.php
// Password strength validation

class PasswordValidator
{

    /**
     * Validate password strength
     * @param string $password
     * @return array ['valid' => bool, 'message' => string, 'errors' => array]
     */
    public static function validate($password)
    {
        $errors = [];

        // Minimum length
        if (strlen($password) < 8) {
            $errors[] = "Password deve ter no mínimo 8 caracteres";
        }

        // At least one uppercase letter
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = "Password deve conter pelo menos 1 letra maiúscula";
        }

        // At least one lowercase letter
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = "Password deve conter pelo menos 1 letra minúscula";
        }

        // At least one number
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = "Password deve conter pelo menos 1 número";
        }

        // At least one special character
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
            $errors[] = "Password deve conter pelo menos 1 caracter especial (!@#$%^&*...)";
        }

        // Check if password is too common
        $commonPasswords = [
            'password',
            '12345678',
            'qwerty',
            'abc123',
            'monkey',
            '1234567890',
            'password123',
            'admin',
            'letmein'
        ];

        if (in_array(strtolower($password), $commonPasswords)) {
            $errors[] = "Password demasiado comum. Escolhe uma password mais segura";
        }

        if (empty($errors)) {
            return [
                'valid' => true,
                'message' => 'Password forte'
            ];
        }

        return [
            'valid' => false,
            'message' => 'Password fraca',
            'errors' => $errors
        ];
    }

    /**
     * Get password strength score (0-100)
     */
    public static function getStrength($password)
    {
        $score = 0;

        // Length bonus
        $score += min(strlen($password) * 4, 40);

        // Uppercase
        if (preg_match('/[A-Z]/', $password))
            $score += 10;

        // Lowercase
        if (preg_match('/[a-z]/', $password))
            $score += 10;

        // Numbers
        if (preg_match('/[0-9]/', $password))
            $score += 10;

        // Special chars
        if (preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password))
            $score += 15;

        // Variety bonus
        $uniqueChars = count(array_unique(str_split($password)));
        $score += min($uniqueChars * 2, 15);

        return min($score, 100);
    }
}
?>