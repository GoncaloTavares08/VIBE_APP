<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    // Get user_id from query parameter
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

    if (!$userId) {
        echo json_encode([
            'status' => 'error',
            'message' => 'user_id é obrigatório'
        ]);
        exit;
    }

    // Get database connections
    $database = new Database();

    // Get club database connection
    $clubResult = $database->getClientConnection();
    if (!$clubResult || !isset($clubResult['conn'])) {
        throw new Exception('Erro ao conectar à base de dados do clube');
    }
    $clubDb = $clubResult['conn'];

    // Get global database connection
    $globalDb = $database->getGlobalConnection();
    if (!$globalDb) {
        throw new Exception('Erro ao conectar à base de dados global');
    }

    // STEP 1: Find which event the current user is checked into
    $eventStmt = $clubDb->prepare("
        SELECT event_id, e.name as event_name
        FROM guestlist gl
        INNER JOIN events e ON e.id = gl.event_id
        WHERE gl.client_id = ? AND gl.status = 'checked_in'
        ORDER BY gl.checked_in_at DESC
        LIMIT 1
    ");
    $eventStmt->execute([$userId]);
    $userEvent = $eventStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userEvent) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Não estás em nenhuma festa no momento',
            'data' => []
        ]);
        exit;
    }

    $eventId = $userEvent['event_id'];
    $eventName = $userEvent['event_name'];

    // STEP 2: Get users already swiped by current user (to exclude them)
    $swipedStmt = $clubDb->prepare("
        SELECT liked_id FROM event_likes 
        WHERE event_id = ? AND liker_id = ?
    ");
    $swipedStmt->execute([$eventId, $userId]);
    $alreadySwiped = $swipedStmt->fetchAll(PDO::FETCH_COLUMN);

    // STEP 3: Get all other clients checked into the SAME event
    $clientsStmt = $clubDb->prepare("
        SELECT DISTINCT gl.client_id
        FROM guestlist gl
        WHERE gl.event_id = ? 
          AND gl.status = 'checked_in'
          AND gl.client_id != ?
    ");
    $clientsStmt->execute([$eventId, $userId]);
    $checkedInClients = $clientsStmt->fetchAll(PDO::FETCH_COLUMN);

    // Filter out already swiped users
    $checkedInClients = array_values(array_diff($checkedInClients, $alreadySwiped));

    // Remove duplicates (in case same user has multiple guestlist entries)
    $checkedInClients = array_values(array_unique($checkedInClients));

    if (empty($checkedInClients)) {
        echo json_encode([
            'status' => 'success',
            'event_id' => $eventId,
            'event_name' => $eventName,
            'total_people' => 0,
            'data' => []
        ]);
        exit;
    }

    // STEP 3: Filter by visibility (ghost_mode = 0) and get profile data
    $placeholders = implode(',', array_fill(0, count($checkedInClients), '?'));

    $profileStmt = $globalDb->prepare("
        SELECT DISTINCT
            u.id,
            u.name,
            cp.bio,
            cp.instagram,
            cp.ghost_mode,
            COALESCE(uca.points, 0) as points
        FROM users u
        LEFT JOIN client_profiles cp ON cp.user_id = u.id
        LEFT JOIN user_club_access uca ON uca.user_id = u.id AND uca.club_id = (
            SELECT club_id FROM user_club_access WHERE user_id = ? LIMIT 1
        )
        WHERE u.id IN ($placeholders)
          AND (cp.ghost_mode = 0 OR cp.ghost_mode IS NULL)
    ");

    // Execute with userId first, then checkedInClients
    $params = array_merge([$userId], $checkedInClients);
    $profileStmt->execute($params);
    $profiles = $profileStmt->fetchAll(PDO::FETCH_ASSOC);

    // STEP 4: Get photos for each profile
    $result = [];
    foreach ($profiles as $profile) {
        $clientId = $profile['id'];

        // Get profile photos
        $photosStmt = $globalDb->prepare("
            SELECT cpp.photo_path
            FROM client_profile_photos cpp
            INNER JOIN client_profiles cp ON cp.id = cpp.client_profile_id
            WHERE cp.user_id = ?
            ORDER BY cpp.photo_order ASC
        ");
        $photosStmt->execute([$clientId]);
        $photos = $photosStmt->fetchAll(PDO::FETCH_COLUMN);

        // Convert relative paths to absolute URLs
        if (!empty($photos)) {
            $photos = array_map(function ($path) {
                $path = "https://vibe.infinityfree.me/api/" . $path;
                return $path;
            }, $photos);
        }

        // Skip this person if they don't have photos
        if (empty($photos)) {
            continue;
        }

        // Mock age (18-30) - can be replaced with real birthdate calculation later
        $age = rand(18, 30);

        // Calculate Vibes (Total LIKES received)
        $vibesStmt = $clubDb->prepare("
            SELECT COUNT(*) 
            FROM event_likes 
            WHERE liked_id = ? AND action = 'like'
        ");
        $vibesStmt->execute([$clientId]);
        $vibes = $vibesStmt->fetchColumn();

        // Mock distance
        $distances = ['5m away', '8m away', '12m away', '15m away', '20m away'];
        $distance = $distances[array_rand($distances)];

        $result[] = [
            'id' => $clientId,
            'name' => $profile['name'],
            'age' => $age,
            'bio' => $profile['bio'] ?? 'Adoro boas vibes ✨',
            'vibes' => $vibes,
            'instagram' => $profile['instagram'] ?? '',
            'photos' => $photos,
            'distance' => $distance
        ];
    }

    // Shuffle to randomize order
    shuffle($result);

    echo json_encode([
        'status' => 'success',
        'event_id' => $eventId,
        'event_name' => $eventName,
        'total_people' => count($result),
        'data' => $result
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
