<?php
// api/utils/get_headers.php
// InfinityFree-compatible way to get headers

function getRequestHeaders()
{
    $headers = [];

    // Method 1: Try apache_request_headers if available
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    }
    // Method 2: Parse from $_SERVER
    else {
        foreach ($_SERVER as $key => $value) {
            if (substr($key, 0, 5) == 'HTTP_') {
                $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                $headers[$header] = $value;
            }
        }
    }

    return $headers;
}

function getClientId()
{
    $headers = getRequestHeaders();

    // Try different case variations
    $clientId = $headers['X-Client-ID']
        ?? $headers['x-client-id']
        ?? $headers['X-Client-Id']
        ?? $_SERVER['HTTP_X_CLIENT_ID'];

    return strtolower($clientId);
}
?>