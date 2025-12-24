<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the file path from query parameter
$file = isset($_GET['file']) ? $_GET['file'] : '';

if (empty($file)) {
    http_response_code(400);
    echo json_encode(array("error" => "No file specified"));
    exit();
}

// Security: prevent directory traversal
$file = str_replace(['../', '..\\'], '', $file);

// Build full path - $file already includes 'uploads/' prefix
$fullPath = '../' . $file;

// DEBUG: Log the paths being checked
error_log("serve_image.php - Requested file: " . $file);
error_log("serve_image.php - Full path: " . $fullPath);
error_log("serve_image.php - File exists: " . (file_exists($fullPath) ? 'YES' : 'NO'));
error_log("serve_image.php - Is file: " . (is_file($fullPath) ? 'YES' : 'NO'));

// Check if file exists
if (!file_exists($fullPath) || !is_file($fullPath)) {
    http_response_code(404);
    echo json_encode(array(
        "error" => "File not found",
        "requested" => $file,
        "full_path" => $fullPath,
        "exists" => file_exists($fullPath),
        "is_file" => is_file($fullPath)
    ));
    exit();
}

// Get file info
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $fullPath);
finfo_close($finfo);

// Only serve images
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(403);
    echo json_encode(array("error" => "Invalid file type"));
    exit();
}

// Set headers and serve file
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($fullPath));
header('Cache-Control: public, max-age=31536000'); // Cache for 1 year
readfile($fullPath);
exit();
?>