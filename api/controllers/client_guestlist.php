<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, X-Client-ID");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$database = new Database();

// Get club slug from header
$clubSlug = isset($_SERVER['HTTP_X_CLIENT_ID']) ? $_SERVER['HTTP_X_CLIENT_ID'] : '';
if (empty($clubSlug)) {
    echo json_encode(array("status" => "error", "message" => "Club slug não fornecido."));
    exit();
}

// Connect to club database
$db = $database->getClientConnectionBySlug($clubSlug);

if (!$db) {
    echo json_encode(array("status" => "error", "message" => "Erro ao conectar à base de dados do clube."));
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// AUTO-UPDATE STATUS
try {
    $lisbonTz = new DateTimeZone('Europe/Lisbon');
    $now = new DateTime('now', $lisbonTz);
    $currentTimestamp = $now->format('Y-m-d H:i:s');

    $updUpcoming = $db->prepare("
        UPDATE events 
        SET status = 'ongoing' 
        WHERE status = 'upcoming' 
        AND CONCAT(date, ' ', start_time) <= ?
    ");
    $updUpcoming->execute([$currentTimestamp]);

    $updCompleted = $db->prepare("
        UPDATE events 
        SET status = 'completed' 
        WHERE status = 'ongoing' 
        AND (
            CASE 
                WHEN end_time < start_time THEN CONCAT(DATE_ADD(date, INTERVAL 1 DAY), ' ', end_time)
                ELSE CONCAT(date, ' ', end_time)
            END
        ) <= ?
    ");
    $updCompleted->execute([$currentTimestamp]);

    // FIX: Revert 'completed' events to 'ongoing' if they are still running (fixes premature completion)
    $revertCompleted = $db->prepare("
        UPDATE events 
        SET status = 'ongoing' 
        WHERE status = 'completed' 
        AND (
            CASE 
                WHEN end_time < start_time THEN CONCAT(DATE_ADD(date, INTERVAL 1 DAY), ' ', end_time)
                ELSE CONCAT(date, ' ', end_time)
            END
        ) > ?
    ");
    $revertCompleted->execute([$currentTimestamp]);

    // Cleanup likes from completed events
    if ($updCompleted->rowCount() > 0) {
        $cleanupStmt = $db->prepare("
            DELETE FROM event_likes 
            WHERE event_id IN (
                SELECT id FROM events WHERE status = 'completed'
            )
        ");
        $cleanupStmt->execute();
    }
} catch (Exception $e) {
}

try {
    switch ($action) {
        case 'list':
            // Get user's guestlists
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = isset($input['user_id']) ? (int) $input['user_id'] : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            // Get guestlists with event details
            $stmt = $db->prepare("
                SELECT 
                    g.id,
                    g.event_id,
                    g.status,
                    g.qr_code,
                    g.checked_in_at,
                    g.created_at,
                    e.name as event_name,
                    e.description as event_description,
                    e.date as event_date,
                    e.start_time,
                    e.end_time,
                    e.image_url as event_image
                FROM guestlist g
                INNER JOIN events e ON g.event_id = e.id
                WHERE g.client_id = ?
                AND g.status IN ('confirmed', 'checked_in')
                AND e.status IN ('upcoming', 'ongoing')
                ORDER BY e.date ASC, e.start_time ASC
            ");
            $stmt->execute([$userId]);
            $guestlists = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(array(
                "status" => "success",
                "data" => $guestlists
            ));
            break;

        case 'join':
            // Join a guestlist (automatic, no approval needed)
            $input = json_decode(file_get_contents('php://input'), true);

            $userId = isset($input['user_id']) ? (int) $input['user_id'] : null;
            $eventId = isset($input['event_id']) ? (int) $input['event_id'] : null;
            $rpId = isset($input['rp_id']) ? (int) $input['rp_id'] : null;

            if (!$userId || !$eventId || !$rpId) {
                echo json_encode(array("status" => "error", "message" => "Dados incompletos."));
                exit();
            }

            // Check if already in guestlist
            $checkStmt = $db->prepare("
                SELECT id FROM guestlist 
                WHERE event_id = ? AND client_id = ?
            ");
            $checkStmt->execute([$eventId, $userId]);

            if ($checkStmt->fetch()) {
                echo json_encode(array("status" => "error", "message" => "Já estás nesta guestlist."));
                exit();
            }

            // Check if event exists and is upcoming or ongoing
            $eventStmt = $db->prepare("
                SELECT id, date FROM events 
                WHERE id = ? AND date >= CURDATE() AND status IN ('upcoming', 'ongoing')
            ");
            $eventStmt->execute([$eventId]);
            $event = $eventStmt->fetch(PDO::FETCH_ASSOC);

            if (!$event) {
                echo json_encode(array("status" => "error", "message" => "Evento não encontrado ou já passou."));
                exit();
            }

            // Connect to GLOBAL database to check/create user_club_access
            $globalDb = $database->getGlobalConnection();

            // Get club_id from club_slug
            $clubStmt = $globalDb->prepare("SELECT id FROM clubs WHERE slug = ?");
            $clubStmt->execute([$clubSlug]);
            $club = $clubStmt->fetch(PDO::FETCH_ASSOC);

            if (!$club) {
                echo json_encode(array("status" => "error", "message" => "Clube não encontrado."));
                exit();
            }

            $clubId = $club['id'];

            // Check if user has access to this club (in global user_club_access table)
            $accessStmt = $globalDb->prepare("
                SELECT id FROM user_club_access 
                WHERE user_id = ? AND club_id = ?
            ");
            $accessStmt->execute([$userId, $clubId]);

            // If user doesn't have access, add them automatically
            if (!$accessStmt->fetch()) {
                $addAccessStmt = $globalDb->prepare("
                    INSERT INTO user_club_access (user_id, club_id, points, joined_at) 
                    VALUES (?, ?, 0, NOW())
                ");
                $addAccessStmt->execute([$userId, $clubId]);
            }

            // Generate unique QR code (Temporary, will be updated with ID)
            $tempQrCode = 'TEMP-' . uniqid();

            // Set timezone and get current time
            date_default_timezone_set('Europe/Lisbon');
            $createdAt = date('Y-m-d H:i:s');

            // Add to guestlist
            $insertStmt = $db->prepare("
                INSERT INTO guestlist (event_id, client_id, rp_id, status, qr_code, created_at)
                VALUES (?, ?, ?, 'confirmed', ?, ?)
            ");
            $insertStmt->execute([$eventId, $userId, $rpId, $tempQrCode, $createdAt]);

            $guestlistId = $db->lastInsertId();

            // Generate FINAL QR code with Guestlist ID
            // Format: GUEST-{GuestlistID}-{EventID}-{ClientID}-{RPID}-{Hash}
            $finalQrCode = 'GUEST-' . $guestlistId . '-' . $eventId . '-' . $userId . '-' . $rpId . '-' . substr(md5(uniqid(rand(), true)), 0, 8);

            // Update with final QR
            $updateStmt = $db->prepare("UPDATE guestlist SET qr_code = ? WHERE id = ?");
            $updateStmt->execute([$finalQrCode, $guestlistId]);

            echo json_encode(array(
                "status" => "success",
                "message" => "Adicionado à guestlist com sucesso!",
                "data" => array(
                    "guestlist_id" => $guestlistId,
                    "qr_code" => $finalQrCode
                )
            ));
            break;

        case 'next_event_status':
            // Determine the user's status for the most relevant event
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = isset($input['user_id']) ? (int) $input['user_id'] : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            // Set timezone
            date_default_timezone_set('Europe/Lisbon');
            $now = date('Y-m-d H:i:s');
            $curDate = date('Y-m-d');

            // 1. PRIORITY: Check if user is checked in to an ONGOING event (Live Party)
            // Even if the event date was yesterday (e.g. started at 23:00), we care about end_time.
            // We look for events where the user is 'checked_in' and the event hasn't finished yet.
            // Since events often cross midnight, logic is tricky.
            // Simplified: Look for guestlist entry 'checked_in' where event end_time > NOW
            // For now, we'll join events. We assume 'active' means: 
            // - Date is today OR yesterday
            // - NOW is between start_time (on date) and end_time (possibly next day)

            // To handle cross-midnight correctly in SQL is complex without full timestamps in DB.
            // But we can check: Is there a guestlist entry with status='checked_in' linked to an event that hasn't "expired" (e.g. 24h window)?
            // Let's rely on the user's specific requirement: "so pode sair desse ecra quando terminar a festa mesmo"

            // Query for ANY checked_in active event.
            // Optimization: Just get the latest checked_in event and see if it's still running.
            $liveStmt = $db->prepare("
                SELECT 
                    e.*, 
                    g.status as guest_status
                FROM guestlist g
                JOIN events e ON g.event_id = e.id
                WHERE g.client_id = ? 
                AND g.status = 'checked_in'
                ORDER BY e.date DESC, e.start_time DESC
                LIMIT 1
            ");
            $liveStmt->execute([$userId]);
            $liveEvent = $liveStmt->fetch(PDO::FETCH_ASSOC);

            if ($liveEvent) {
                // Check if event is still "live"
                // Construct Date objects
                $startDateStr = $liveEvent['date'] . ' ' . $liveEvent['start_time'];
                $endDateStr = $liveEvent['date'] . ' ' . $liveEvent['end_time'];

                // If end_time < start_time, it ends the next day
                if ($liveEvent['end_time'] < $liveEvent['start_time']) {
                    $endDateObj = new DateTime($endDateStr);
                    $endDateObj->modify('+1 day');
                    $endDateStr = $endDateObj->format('Y-m-d H:i:s');
                }

                $nowObj = new DateTime($now);
                $endObj = new DateTime($endDateStr);

                // If check-in is valid and event hasn't ended: LIVE PARTY
                if ($nowObj < $endObj) {
                    echo json_encode(array(
                        "status" => "success",
                        "computed_status" => "live-party",
                        "event" => $liveEvent
                    ));
                    exit();
                }
                // If it ended, we fall through to finding the NEXT event.
            }

            // 2. Determine CURRENT or NEXT event
            $foundEvent = null;

            // A. Check for "Ongoing" event from YESTERDAY (Cross-midnight)
            // e.g. Started 23:00 yesterday, Ends 06:00 today. Current time 02:00.
            // Condition: date = Yesterday AND end_time > CurTime (assuming end_time belongs to today)
            // Note: This relies on the convention that events ending in early morning have 'end_time' < 'start_time' usually, 
            // but here we just check if it ends after right now.
            // If end_time < start_time (e.g. 06:00 < 23:00), it definitely crosses midnight.
            // Only strictly valid if we interpret end_time as "time on the day it ends".
            $yesterdayStmt = $db->prepare("
                SELECT * FROM events 
                WHERE date = DATE_SUB(?, INTERVAL 1 DAY) 
                AND end_time > ?
                AND status != 'cancelled'
                LIMIT 1
            ");
            $currentTime = date('H:i:s');
            $yesterdayStmt->execute([$curDate, $currentTime]);
            $ongoingYesterday = $yesterdayStmt->fetch(PDO::FETCH_ASSOC);

            if ($ongoingYesterday) {
                // Determine if it really is a cross-midnight event
                if ($ongoingYesterday['end_time'] < $ongoingYesterday['start_time']) {
                    // Yes, it ends next day (today). And end_time > currentTime. 
                    // So it is Active.
                    $foundEvent = $ongoingYesterday;
                }
            }

            // B. Check for "Ongoing" event from TODAY
            // Case 1: Started active today (Start < Now) and Ends Today (End > Now) and End > Start.
            // Case 2: Started active today (Start < Now) and Ends Tomorrow (End < Start).
            if (!$foundEvent) {
                $todayStmt = $db->prepare("
                    SELECT * FROM events 
                    WHERE date = ? 
                    AND start_time <= ?
                    AND status != 'cancelled'
                    ORDER BY start_time DESC
                    LIMIT 1
                ");
                $todayStmt->execute([$curDate, $currentTime]);
                $ongoingToday = $todayStmt->fetch(PDO::FETCH_ASSOC);

                if ($ongoingToday) {
                    // Check if it has ended
                    $isOngoing = false;
                    if ($ongoingToday['end_time'] > $ongoingToday['start_time']) {
                        // Ends same day. Check if end_time > now
                        if ($ongoingToday['end_time'] > $currentTime) {
                            $isOngoing = true;
                        }
                    } else {
                        // Ends tomorrow. Since it started already (start <= now), it's definitely ongoing.
                        $isOngoing = true;
                    }

                    if ($isOngoing) {
                        $foundEvent = $ongoingToday;
                    }
                }
            }

            // C. If no ongoing event, find NEXT UPCOMING event
            if (!$foundEvent) {
                $nextStmt = $db->prepare("
                    SELECT * FROM events 
                    WHERE (date > ? OR (date = ? AND start_time > ?))
                    AND status != 'cancelled'
                    ORDER BY date ASC, start_time ASC
                    LIMIT 1
                ");
                $nextStmt->execute([$curDate, $curDate, $currentTime]);
                $foundEvent = $nextStmt->fetch(PDO::FETCH_ASSOC);
            }

            if (!$foundEvent) {
                // No future events found
                echo json_encode(array(
                    "status" => "success",
                    "computed_status" => "no-guestlist",
                    "event" => null
                ));
                exit();
            }

            $nextEvent = $foundEvent; // Use the found event (Active or Next)

            // 3. Check if user has guestlist for this event
            $glStmt = $db->prepare("
                SELECT status FROM guestlist 
                WHERE event_id = ? AND client_id = ?
            ");
            $glStmt->execute([$nextEvent['id'], $userId]);
            $guestlistEntry = $glStmt->fetch(PDO::FETCH_ASSOC);

            if ($guestlistEntry) {
                // User has an entry. Check status.
                // If 'confirmed' -> has-guestlist
                // If 'checked_in' (but event not started yet?) -> live-party (rare, but possible if early entry) -> handled by step 1 usually.
                echo json_encode(array(
                    "status" => "success",
                    "computed_status" => "has-guestlist",
                    "event" => $nextEvent
                ));
            } else {
                // No entry
                echo json_encode(array(
                    "status" => "success",
                    "computed_status" => "no-guestlist",
                    "event" => $nextEvent
                ));
            }
            break;

        case 'get_qr_code':
            // Get QR code for user's current checked-in guestlist
            $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;

            if (!$userId) {
                echo json_encode(array("status" => "error", "message" => "User ID não fornecido."));
                exit();
            }

            // Get the QR code from the most recent checked_in guestlist
            // This ensures we always get the QR for the party the user is currently at
            $qrStmt = $db->prepare("
                SELECT g.qr_code, e.name as event_name, e.id as event_id
                FROM guestlist g
                JOIN events e ON g.event_id = e.id
                WHERE g.client_id = ? 
                AND g.status = 'checked_in'
                ORDER BY e.date DESC, e.start_time DESC
                LIMIT 1
            ");
            $qrStmt->execute([$userId]);
            $result = $qrStmt->fetch(PDO::FETCH_ASSOC);

            if ($result && $result['qr_code']) {
                echo json_encode(array(
                    "status" => "success",
                    "qr_code" => $result['qr_code'],
                    "event_name" => $result['event_name'],
                    "event_id" => $result['event_id']
                ));
            } else {
                echo json_encode(array(
                    "status" => "error",
                    "message" => "Nenhuma guestlist ativa encontrada."
                ));
            }
            break;

        default:
            echo json_encode(array("status" => "error", "message" => "Ação inválida."));
    }
} catch (Exception $e) {
    echo json_encode(array(
        "status" => "error",
        "message" => "Erro: " . $e->getMessage()
    ));
}
?>