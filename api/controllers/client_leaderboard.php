<?php
// Prevent any HTML output for errors
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Include database config
    require_once __DIR__ . '/../config/database.php';

    $database = new Database();

    // Determine Club Slug Dynamically
    $slug = 'vr'; // Default fallback

    // 1. Try GET parameter
    if (isset($_GET['__cid']) && !empty($_GET['__cid'])) {
        $slug = $_GET['__cid'];
    }
    // 2. Try Referer Header (e.g., https://vibe.infinityfree.me/vr)
    else if (isset($_SERVER['HTTP_REFERER'])) {
        $path = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_PATH); // /vr
        $parts = explode('/', trim($path, '/'));
        if (!empty($parts[0])) {
            $slug = $parts[0];
        }
    }

    $clubDb = $database->getClientConnectionBySlug($slug);
    if (!$clubDb) {
        throw new Exception('Erro ao conectar à base de dados do clube: ' . $slug);
    }

    // Connect to Global DB
    $globalDb = $database->getGlobalConnection();
    if (!$globalDb) {
        throw new Exception('Erro ao conectar DB Global');
    }

    // Input validation
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'points';

    if (!$userId) {
        throw new Exception('User ID in missing');
    }

    // 1. Get Event
    $eventStmt = $clubDb->prepare("
        SELECT gl.event_id 
        FROM guestlist gl
        WHERE gl.client_id = ? AND gl.status = 'checked_in' 
        ORDER BY gl.checked_in_at DESC LIMIT 1
    ");
    $eventStmt->execute([$userId]);
    $userEvent = $eventStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userEvent) {
        echo json_encode(['status' => 'success', 'data' => [], 'message' => 'Not checked in']);
        exit;
    }

    $eventId = $userEvent['event_id'];

    // 2. Get Users
    $usersStmt = $clubDb->prepare("
        SELECT DISTINCT client_id 
        FROM guestlist 
        WHERE event_id = ? AND status = 'checked_in'
    ");
    $usersStmt->execute([$eventId]);
    $checkedInIds = $usersStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($checkedInIds)) {
        echo json_encode(['status' => 'success', 'data' => []]);
        exit;
    }

    // 3. Count Vibes
    $vibesMap = [];
    try {
        $likesStmt = $clubDb->prepare("
            SELECT liked_id, COUNT(*) as cnt 
            FROM event_likes 
            WHERE event_id = ? AND action = 'like'
            GROUP BY liked_id
        ");
        $likesStmt->execute([$eventId]);
        while ($row = $likesStmt->fetch(PDO::FETCH_ASSOC)) {
            $vibesMap[$row['liked_id']] = $row['cnt'];
        }
    } catch (Exception $ex) {
        // Table might be missing
    }

    // 4. Fetch Details
    $placeholders = implode(',', array_fill(0, count($checkedInIds), '?'));
    $sql = "
        SELECT u.id, u.name, cp.profile_photo_path as user_photo, cp.instagram, cp.bio, cp.ghost_mode, COALESCE(uca.points, 0) as points
        FROM users u
        LEFT JOIN client_profiles cp ON cp.user_id = u.id
        LEFT JOIN user_club_access uca ON uca.user_id = u.id AND uca.club_id = (
             SELECT club_id FROM user_club_access WHERE user_id = ? LIMIT 1
        )
        WHERE u.id IN ($placeholders)
    ";

    $params = array_merge([$userId], $checkedInIds);
    $detailsStmt = $globalDb->prepare($sql);
    $detailsStmt->execute($params);
    $usersData = $detailsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Build List
    $leaderboard = [];
    foreach ($usersData as $user) {
        $uid = $user['id'];

        // Visibility Check
        if (isset($user['ghost_mode']) && $user['ghost_mode'] == 1 && $uid != $userId) {
            continue;
        }

        // Get All Photos for the user
        $photos = [];
        try {
            $pStmt = $globalDb->prepare("
                SELECT cpp.photo_path 
                FROM client_profile_photos cpp
                INNER JOIN client_profiles cp ON cp.id = cpp.client_profile_id
                WHERE cp.user_id = ? 
                ORDER BY cpp.photo_order ASC
            ");
            $pStmt->execute([$uid]);
            $rawPhotos = $pStmt->fetchAll(PDO::FETCH_COLUMN);

            // Convert to full URLs
            foreach ($rawPhotos as $path) {
                if ($path) {
                    $photos[] = "https://vibe.infinityfree.me/api/" . $path;
                }
            }
        } catch (Exception $e) {
        }

        $leaderboard[] = [
            'id' => $uid,
            'name' => $user['name'] ?? 'Unknown',
            'points' => intval($user['points']),
            'vibes' => intval($vibesMap[$uid] ?? 0),
            'instagram' => $user['instagram'] ?? '',
            'bio' => $user['bio'] ?? '', // Include Bio
            // Use profile photo from client_profiles if available, else first album photo
            'photo' => ($user['user_photo'] ? "https://vibe.infinityfree.me/api/" . $user['user_photo'] : ($photos[0] ?? null)),
            'photos' => $photos, // All photos for modal
            'rank' => 0,
            'is_me' => ($uid == $userId)
        ];
    }

    // 6. Sort
    usort($leaderboard, function ($a, $b) use ($sort) {
        if ($sort === 'vibes') {
            $cmp = $b['vibes'] - $a['vibes'];
            return $cmp === 0 ? $b['points'] - $a['points'] : $cmp;
        }
        $cmp = $b['points'] - $a['points'];
        return $cmp === 0 ? $b['vibes'] - $a['vibes'] : $cmp;
    });

    // LIMIT TO TOP 10
    $leaderboard = array_slice($leaderboard, 0, 10);

    // Rank
    foreach ($leaderboard as $i => &$p) {
        $p['rank'] = $i + 1;
    }

    echo json_encode(['status' => 'success', 'data' => $leaderboard]);

} catch (Exception $e) {
    // Return formatted error JSON
    http_response_code(200);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage(), 'data' => []]);
}