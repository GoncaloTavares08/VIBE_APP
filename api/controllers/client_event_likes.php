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
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    // Get database connections
    $database = new Database();
    $clubResult = $database->getClientConnection();
    if (!$clubResult || !isset($clubResult['conn'])) {
        throw new Exception('Erro ao conectar à base de dados do clube');
    }
    $clubDb = $clubResult['conn'];
    $globalDb = $database->getGlobalConnection();

    switch ($action) {
        case 'swipe':
            // Handle like/pass action
            $input = json_decode(file_get_contents('php://input'), true);

            $userId = isset($input['user_id']) ? intval($input['user_id']) : null;
            $likedId = isset($input['liked_id']) ? intval($input['liked_id']) : null;
            $swipeAction = isset($input['action']) ? $input['action'] : null;

            if (!$userId || !$likedId || !in_array($swipeAction, ['like', 'pass'])) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Dados inválidos'
                ]);
                exit;
            }

            // Get user's current event
            $eventStmt = $clubDb->prepare("
                SELECT event_id FROM guestlist 
                WHERE client_id = ? AND status = 'checked_in' 
                ORDER BY checked_in_at DESC LIMIT 1
            ");
            $eventStmt->execute([$userId]);
            $userEvent = $eventStmt->fetch(PDO::FETCH_ASSOC);

            if (!$userEvent) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Não estás em nenhum evento'
                ]);
                exit;
            }

            $eventId = $userEvent['event_id'];

            // Insert or update like/pass
            $insertStmt = $clubDb->prepare("
                INSERT INTO event_likes (event_id, liker_id, liked_id, action, created_at)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE action = VALUES(action), created_at = NOW()
            ");
            $insertStmt->execute([$eventId, $userId, $likedId, $swipeAction]);

            // Check for mutual match (only if action is 'like')
            $isMatch = false;
            $matchedUserData = null;

            if ($swipeAction === 'like') {
                // Check if the other person already liked this user
                $checkStmt = $clubDb->prepare("
                    SELECT id FROM event_likes 
                    WHERE event_id = ? 
                      AND liker_id = ? 
                      AND liked_id = ? 
                      AND action = 'like'
                ");
                $checkStmt->execute([$eventId, $likedId, $userId]);
                $mutualLike = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if ($mutualLike) {
                    $isMatch = true;

                    // Update both rows to mark as match
                    $updateMatch1 = $clubDb->prepare("
                        UPDATE event_likes SET is_match = 1 
                        WHERE event_id = ? AND liker_id = ? AND liked_id = ?
                    ");
                    $updateMatch1->execute([$eventId, $userId, $likedId]);

                    $updateMatch2 = $clubDb->prepare("
                        UPDATE event_likes SET is_match = 1 
                        WHERE event_id = ? AND liker_id = ? AND liked_id = ?
                    ");
                    $updateMatch2->execute([$eventId, $likedId, $userId]);

                    // Get matched user data
                    $userStmt = $globalDb->prepare("
                        SELECT u.id, u.name, cp.instagram, cp.bio
                        FROM users u
                        LEFT JOIN client_profiles cp ON cp.user_id = u.id
                        WHERE u.id = ?
                    ");
                    $userStmt->execute([$likedId]);
                    $matchedUserData = $userStmt->fetch(PDO::FETCH_ASSOC);
                }
            }

            echo json_encode([
                'status' => 'success',
                'is_match' => $isMatch,
                'matched_user' => $matchedUserData
            ]);
            break;

        case 'my_matches':
            // Get all matches for current user
            $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

            if (!$userId) {
                echo json_encode([
                    'status' => 'error',
                    'message' => 'user_id é obrigatório'
                ]);
                exit;
            }

            // Get user's current event
            $eventStmt = $clubDb->prepare("
                SELECT event_id FROM guestlist 
                WHERE client_id = ? AND status = 'checked_in' 
                ORDER BY checked_in_at DESC LIMIT 1
            ");
            $eventStmt->execute([$userId]);
            $userEvent = $eventStmt->fetch(PDO::FETCH_ASSOC);

            if (!$userEvent) {
                echo json_encode([
                    'status' => 'success',
                    'matches' => []
                ]);
                exit;
            }

            $eventId = $userEvent['event_id'];

            // Get all matches
            $matchesStmt = $clubDb->prepare("
                SELECT DISTINCT liked_id as user_id
                FROM event_likes 
                WHERE event_id = ? 
                  AND liker_id = ? 
                  AND is_match = 1
            ");
            $matchesStmt->execute([$eventId, $userId]);
            $matchedIds = $matchesStmt->fetchAll(PDO::FETCH_COLUMN);


            $matches = [];
            foreach ($matchedIds as $matchedId) {
                $userStmt = $globalDb->prepare("
                    SELECT u.id, u.name, cp.instagram, cp.bio, uca.points
                    FROM users u
                    LEFT JOIN client_profiles cp ON cp.user_id = u.id
                    LEFT JOIN user_club_access uca ON uca.user_id = u.id
                    WHERE u.id = ?
                ");
                $userStmt->execute([$matchedId]);
                $userData = $userStmt->fetch(PDO::FETCH_ASSOC);

                if ($userData) {
                    // Get photos
                    $photosStmt = $globalDb->prepare("
                        SELECT cpp.photo_path
                        FROM client_profile_photos cpp
                        INNER JOIN client_profiles cp ON cp.id = cpp.client_profile_id
                        WHERE cp.user_id = ?
                        ORDER BY cpp.photo_order ASC
                    ");
                    $photosStmt->execute([$matchedId]);
                    $photos = $photosStmt->fetchAll(PDO::FETCH_COLUMN);

                    // Convert to absolute URLs
                    if (!empty($photos)) {
                        $photos = array_map(function ($path) {
                            $path = "https://vibe.infinityfree.me/api/" . $path;
                            return $path;
                        }, $photos);
                    }

                    // Get total likes (VIBES) for this user
                    $vibesStmt = $clubDb->prepare("
                        SELECT COUNT(*) 
                        FROM event_likes 
                        WHERE liked_id = ? AND action = 'like'
                    ");
                    $vibesStmt->execute([$matchedId]);
                    $matchCount = $vibesStmt->fetchColumn();

                    $userData['photos'] = !empty($photos) ? $photos : [];
                    $userData['age'] = rand(18, 30); // Mock
                    $userData['vibes'] = $matchCount;
                    $userData['distance'] = 'Na festa';

                    $matches[] = $userData;
                }
            }

            echo json_encode([
                'status' => 'success',
                'matches' => $matches
            ]);
            break;

        default:
            echo json_encode([
                'status' => 'error',
                'message' => 'Ação inválida'
            ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
