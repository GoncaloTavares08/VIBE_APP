<?php
// ENABLE ERROR REPORTING FOR DEBUGGING
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // Correct paths using __DIR__
    $basePath = __DIR__ . '/../../'; // api/

    // Include Database
    if (!file_exists($basePath . 'config/database.php')) {
        throw new Exception("Database config not found at: " . $basePath . 'config/database.php');
    }
    require_once $basePath . 'config/database.php';

    // Include SessionHelper
    if (!file_exists($basePath . 'utils/SessionHelper.php')) {
        throw new Exception("SessionHelper not found at: " . $basePath . 'utils/SessionHelper.php');
    }
    require_once $basePath . 'utils/SessionHelper.php';

    // Get POST data
    $input = file_get_contents('php://input');
    if (!$input) {
        throw new Exception("No input received");
    }
    $data = json_decode($input, true);
    $googleToken = $data['token'] ?? null;

    if (!$googleToken) {
        throw new Exception('Token not provided');
    }

    // 1. Verify Token with Google (Using Access Token)
    $url = 'https://www.googleapis.com/oauth2/v3/userinfo?access_token=' . $googleToken;
    $response = @file_get_contents($url);

    if ($response === false) {
        throw new Exception('Failed to verify Google Access Token');
    }

    $payload = json_decode($response, true);

    if (isset($payload['error'])) {
        throw new Exception('Google API Error: ' . ($payload['error_description'] ?? $payload['error']));
    }

    $googleId = $payload['sub'];
    $email = $payload['email'];
    $name = $payload['name'];
    $pictureUrl = $payload['picture'] ?? null;

    // Connect to DB
    $database = new Database();
    $conn = $database->getGlobalConnection();

    if (!$conn) {
        throw new Exception("Database connection failed");
    }

    // 2. Check if user exists
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $userId = null;
    $created_at = date("Y-m-d H:i:s");

    if ($user) {
        $userId = $user['id'];
        $created_at = $user['created_at'];
        // User exists: Update google_id if missing
        if (!$user['google_id']) {
            $update = $conn->prepare("UPDATE users SET google_id = ? WHERE id = ?");
            $update->execute([$googleId, $userId]);
        }
    } else {
        // User does not exist: Create new user
        $conn->beginTransaction();

        $stmt = $conn->prepare("INSERT INTO users (name, email, google_id, password_hash) VALUES (?, ?, ?, NULL)");
        $stmt->execute([$name, $email, $googleId]);
        $userId = $conn->lastInsertId();

        // Construct user array for session
        $user = ['id' => $userId, 'name' => $name, 'email' => $email, 'created_at' => $created_at];

        // 3. Handle Profile Photo
        if ($pictureUrl) {
            $imageContent = @file_get_contents($pictureUrl);
            if ($imageContent !== false) {
                // Use absolute path
                $uploadDir = $basePath . 'uploads/profiles/';

                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }

                $fileName = 'google_' . $userId . '_' . time() . '.jpg';
                $filePath = $uploadDir . $fileName;

                if (file_put_contents($filePath, $imageContent)) {
                    $dbPath = '/uploads/profiles/' . $fileName;
                    $stmtProfile = $conn->prepare("INSERT INTO client_profiles (user_id, profile_photo_path) VALUES (?, ?)");
                    $stmtProfile->execute([$userId, $dbPath]);
                }
            }
        } else {
            $stmtProfile = $conn->prepare("INSERT INTO client_profiles (user_id) VALUES (?)");
            $stmtProfile->execute([$userId]);
        }

        $conn->commit();
    }

    // 5. Setup Session
    // Fetch club access
    $stmtRole = $conn->prepare("SELECT role, club_id FROM user_club_access WHERE user_id = ? LIMIT 1");
    $stmtRole->execute([$userId]);
    $access = $stmtRole->fetch(PDO::FETCH_ASSOC);

    $role = $access['role'] ?? 'CLIENT';
    $clubId = $access['club_id'] ?? null;
    $clubSlug = null;

    if ($clubId) {
        $stmtClub = $conn->prepare("SELECT slug FROM clubs WHERE id = ?");
        $stmtClub->execute([$clubId]);
        $clubRow = $stmtClub->fetch(PDO::FETCH_ASSOC);
        $clubSlug = $clubRow['slug'] ?? null;
    }

    // Fetch birthdate and gender info from client_profiles
    $stmtProfile = $conn->prepare("SELECT birthdate, gender, gender_preference FROM client_profiles WHERE user_id = ?");
    $stmtProfile->execute([$userId]);
    $profileData = $stmtProfile->fetch(PDO::FETCH_ASSOC);
    $birthdate = $profileData['birthdate'] ?? null;
    $gender = $profileData['gender'] ?? null;
    $genderPreference = $profileData['gender_preference'] ?? null;

    // Start Session via SessionHelper
    SessionHelper::setUser([
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => $role,
        'club_slug' => $clubSlug,
        'created_at' => $created_at,
        'birthdate' => $birthdate,
        'gender' => $gender,
        'gender_preference' => $genderPreference
    ]);

    // Return Success
    echo json_encode([
        'status' => 'success',
        // Return session ID if client needs it, usually browser handles cookie
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => $role,
            'club_slug' => $clubSlug,
            'birthdate' => $birthdate,
            'gender' => $gender,
            'gender_preference' => $genderPreference
        ]
    ]);

} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log("Google Login Error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Login failed: ' . $e->getMessage()]);
}