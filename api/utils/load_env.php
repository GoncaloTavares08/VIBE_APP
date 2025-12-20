<?php
function loadEnv($path) {
    if (!file_exists($path)) {
        // If file is missing, we can't connect.
        // For debugging, we can print this path, but let's just return false
        // The calling script should handle it.
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        if (strpos($line, '=') === false) {
             continue;
        }

        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        // Remove quotes if present
        $value = trim($value, '"\'');

        // FORCE SET vars
        putenv(sprintf('%s=%s', $name, $value));
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}
?>
