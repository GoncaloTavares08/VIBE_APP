<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

// Use GLOBAL database
$database = new Database();
$globalDb = $database->getGlobalConnection();

if (!$globalDb) {
    echo json_encode(array("status" => "error", "message" => "Erro de conexão à base de dados global."));
    exit();
}

// Get username from query parameter
$username = isset($_GET['username']) ? trim($_GET['username']) : '';

if (empty($username)) {
    echo json_encode(array("status" => "error", "message" => "Username é obrigatório."));
    exit();
}

try {
    // Get RP profile data
    $stmt = $globalDb->prepare("
        SELECT 
            u.id, 
            u.name, 
            u.email,
            rp.username, 
            rp.bio, 
            rp.instagram, 
            rp.profile_image_url
        FROM users u
        INNER JOIN rp_profiles rp ON u.id = rp.user_id
        WHERE rp.username = ? AND rp.is_public = 1
    ");
    $stmt->execute([$username]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$profile) {
        echo json_encode(array("status" => "error", "message" => "Perfil não encontrado."));
        exit();
    }

    $rpUserId = $profile['id'];

    // Calculate rating stats
    $stmt = $globalDb->prepare("
        SELECT 
            COALESCE(AVG(rating), 0) as avg_rating,
            COUNT(*) as review_count
        FROM rp_reviews
        WHERE rp_user_id = ?
    ");
    $stmt->execute([$rpUserId]);
    $ratingStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get all clubs where RP has access (RP or TEAM_LEADER role)
    $stmt = $globalDb->prepare("
        SELECT c.id, c.name, c.slug, c.database_name, c.location
        FROM clubs c
        INNER JOIN user_club_access uca ON c.id = uca.club_id
        WHERE uca.user_id = ? 
        AND uca.role IN ('RP', 'TEAM_LEADER')
        AND c.is_active = 1
    ");
    $stmt->execute([$rpUserId]);
    $clubs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get events from all clubs
    $allEvents = [];
    $totalGuestsCount = 0;

    foreach ($clubs as $club) {
        // Connect to club-specific database
        $clubDb = $database->getClientConnectionBySlug($club['slug']);

        if (!$clubDb) {
            continue;
        }

        // Get upcoming events for this RP in this club
        $stmt = $clubDb->prepare("
            SELECT 
                e.id, 
                e.name, 
                e.date, 
                e.start_time, 
                e.end_time,
                e.capacity,
                e.image_url,
                e.status
            FROM events e
            INNER JOIN rp_profile_events rpe ON e.id = rpe.event_id
            WHERE rpe.rp_user_id = ?
            AND e.status = 'upcoming'
            AND e.date >= CURDATE()
            ORDER BY e.date ASC, e.start_time ASC
            LIMIT 10
        ");
        $stmt->execute([$rpUserId]);
        $clubEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Add club info to each event
        foreach ($clubEvents as &$event) {
            $event['club'] = $club['name'];
            $event['club_slug'] = $club['slug'];
            $event['location'] = $club['location'];
            $allEvents[] = $event;
        }

        // Count total guests (events in rp_profile_events table)
        $stmt = $clubDb->prepare("
            SELECT COUNT(*) as count
            FROM rp_profile_events
            WHERE rp_user_id = ?
        ");
        $stmt->execute([$rpUserId]);
        $guestCount = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalGuestsCount += isset($guestCount['count']) ? (int) $guestCount['count'] : 0;
    }

    // Count total events (past + future) across all clubs
    $totalEventsCount = 0;
    foreach ($clubs as $club) {
        $clubDb = $database->getClientConnectionBySlug($club['slug']);
        if (!$clubDb)
            continue;

        $stmt = $clubDb->prepare("
            SELECT COUNT(*) as count
            FROM rp_profile_events
            WHERE rp_user_id = ?
        ");
        $stmt->execute([$rpUserId]);
        $eventCount = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalEventsCount += isset($eventCount['count']) ? (int) $eventCount['count'] : 0;
    }

    // Build response
    $response = array(
        "status" => "success",
        "data" => array(
            "id" => (int) $rpUserId,
            "name" => $profile['name'],
            "username" => $profile['username'],
            "bio" => $profile['bio'],
            "instagram" => $profile['instagram'],
            "profile_image_url" => $profile['profile_image_url'],
            "stats" => array(
                "totalEvents" => $totalEventsCount,
                "totalGuests" => $totalGuestsCount,
                "rating" => round((float) $ratingStats['avg_rating'], 1),
                "reviewCount" => (int) $ratingStats['review_count']
            ),
            "events" => $allEvents
        )
    );

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => "Erro ao buscar perfil: " . $e->getMessage()
    ));
}
?>