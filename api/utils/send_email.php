<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Manually include PHPMailer classes since we don't have composer autoload
require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';
require_once __DIR__ . '/load_env.php';

// Load .env from root (adjust path as needed)
// Assuming API is in /api/utils, root is ../../
if (function_exists('loadEnv')) {
    loadEnv(__DIR__ . '/../../.env');
}

function sendEmail($to, $subject, $body) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = $_ENV['SMTP_HOST'] ?? getenv('SMTP_HOST');
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['SMTP_USERNAME'] ?? getenv('SMTP_USERNAME');
        $mail->Password   = $_ENV['SMTP_PASSWORD'] ?? getenv('SMTP_PASSWORD');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; 
        $mail->Port       = $_ENV['SMTP_PORT'] ?? getenv('SMTP_PORT');
        
        // Character encoding
        $mail->CharSet = 'UTF-8';

        // Recipients
        $mail->setFrom($_ENV['SMTP_FROM_EMAIL'] ?? getenv('SMTP_FROM_EMAIL'), $_ENV['SMTP_FROM_NAME'] ?? getenv('SMTP_FROM_NAME'));
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags($body);

        $mail->send();
        return true;
    } catch (Exception $e) {
        // Return the error message instead of just false
        return "Erro Mailer: " . $mail->ErrorInfo;
    }
}
?>
