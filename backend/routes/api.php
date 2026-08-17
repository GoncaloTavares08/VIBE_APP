<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ClientProfileController;
use App\Http\Controllers\RewardController;
use App\Http\Controllers\GuestlistController;
use App\Http\Controllers\StaffScanController;
use App\Http\Controllers\RpController;
use App\Http\Controllers\NetworkingController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\AdminController;

// Internal route for processing queues on Shared Hosting (Cron Job)
Route::middleware('throttle:10,1')->get('/internal/run-queue', function (Request $request) {
    $expectedToken = env('QUEUE_SECRET_TOKEN');

    if (!$expectedToken || !hash_equals($expectedToken, (string) $request->token)) {
        return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
    }

    // Stop when empty so the cron doesn't hang the PHP process indefinitely
    \Illuminate\Support\Facades\Artisan::call('queue:work', ['--stop-when-empty' => true]);

    return response()->json(['status' => 'success', 'message' => 'Queue processed.']);
});

// Auth Routes (Rate Limited)
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/password/reset-request', [AuthController::class, 'resetRequest']);
    Route::post('/password/verify-code', [AuthController::class, 'verifyCode']);
    Route::post('/password/reset', [AuthController::class, 'resetPassword']);
    Route::post('/login/google', [AuthController::class, 'googleLogin']);
});

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return new \App\Http\Resources\UserResource($request->user());
    });
    Route::post('/user/verify-access', [App\Http\Controllers\ClubController::class, 'verifyAccess']);
    Route::get('/user/clubs/{userId}', [App\Http\Controllers\ClubController::class, 'getUserClubs']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/user/password', [AuthController::class, 'changePassword']);
    
    // Protected Event Routes
    Route::post('/events/upload-banner', [EventController::class, 'uploadBanner']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);

    // Profile Routes
    Route::get('/profile', [\App\Http\Controllers\ClientProfileController::class, 'show']);
    Route::post('/profile', [\App\Http\Controllers\ClientProfileController::class, 'update']); // Using POST with _method=PUT or just POST for file uploads
    Route::post('/profile/gallery', [\App\Http\Controllers\ClientProfileController::class, 'uploadGallery']);
    Route::delete('/profile/gallery/{id}', [\App\Http\Controllers\ClientProfileController::class, 'deleteGallery']);
    Route::delete('/profile/photo', [\App\Http\Controllers\ClientProfileController::class, 'deletePhoto']);
    Route::get('/client/wallet/points', [\App\Http\Controllers\ClientProfileController::class, 'getPoints']);
    Route::post('/profile/check-username', [\App\Http\Controllers\ClientProfileController::class, 'checkUsername']);

    // Reward Routes
    Route::get('/rewards', [\App\Http\Controllers\RewardController::class, 'index']);
    Route::post('/rewards/redeem', [\App\Http\Controllers\RewardController::class, 'redeem'])->middleware('throttle:5,1');
    Route::get('/rewards/my-redemptions', [\App\Http\Controllers\RewardController::class, 'myRedemptions']);

    // Guestlist Routes
    Route::get('/guestlist', [\App\Http\Controllers\GuestlistController::class, 'index']);
    Route::post('/guestlist/join', [\App\Http\Controllers\GuestlistController::class, 'join'])->middleware('throttle:5,1');
    Route::get('/guestlist/status', [\App\Http\Controllers\GuestlistController::class, 'status']);
    Route::get('/guestlist/qr-code', [\App\Http\Controllers\GuestlistController::class, 'qrCode']);

    // Phase 3: Staff & RP Management
    Route::post('/staff/scan', [StaffScanController::class, 'validateQr']);
    Route::post('/staff/purchase', [StaffScanController::class, 'processPurchase']);
    Route::get('/staff/scan/search', [StaffScanController::class, 'searchGuestlist']);
    Route::post('/staff/scan/manual-checkin', [StaffScanController::class, 'manualCheckin']);
    Route::get('/staff/statistics', [StaffScanController::class, 'getStatistics']);

    Route::get('/rp/overview', [RpController::class, 'getOverview']);
    Route::get('/rp/challenges', [RpController::class, 'getChallenges']);
    Route::post('/rp/challenges', [RpController::class, 'createChallenge']);
    Route::delete('/rp/challenges/{id}', [RpController::class, 'deleteChallenge']);
    Route::get('/rp/profile', [RpController::class, 'showProfile']);
    Route::post('/rp/profile/check-username', [RpController::class, 'checkUsername']);
    Route::post('/rp/profile', [RpController::class, 'updateProfile']);
    Route::post('/rp/profile/photo', [RpController::class, 'uploadPhoto']);
    Route::get('/rp/guestlists', [RpController::class, 'myGuestlists']);
    Route::get('/rp/events', [RpController::class, 'myEvents']);
    Route::post('/rp/events', [RpController::class, 'addEvent']);
    Route::post('/rp/events/remove', [RpController::class, 'removeEvent']);
    Route::get('/rp/leaderboard', [RpController::class, 'getLeaderboard']);
    Route::get('/rp/team', [RpController::class, 'getTeam']);
    Route::put('/rp/team/goal', [RpController::class, 'setTeamGoal']);
    Route::post('/rp/team/message', [RpController::class, 'sendTeamMessage']);

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::post('/notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/mark-read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);

    // Phase 3: Networking & Leaderboard
    Route::get('/networking/who-is-here', [NetworkingController::class, 'whoIsHere']);
    Route::post('/networking/swipe', [NetworkingController::class, 'swipe'])->middleware('throttle:30,1');
    Route::get('/networking/matches', [NetworkingController::class, 'myMatches']);
    Route::get('/networking/check-updates', [NetworkingController::class, 'checkUpdates']);
    
    Route::get('/leaderboard', [LeaderboardController::class, 'getLeaderboard']);
    
    Route::get('/client/history', [App\Http\Controllers\ClientHistoryController::class, 'getHistory']);

    // Phase 4: Admin Management
    Route::get('/admin/night-metrics', [AdminController::class, 'getNightMetrics']);
    Route::get('/admin/nights-history', [AdminController::class, 'getNightsHistory']);
    Route::get('/admin/settings', [AdminController::class, 'getSettings']);
    Route::match(['put', 'post'], '/admin/settings', [AdminController::class, 'updateSettings']);
    
    Route::get('/admin/rps', [AdminController::class, 'listRps']);
    Route::post('/admin/rps/search', [AdminController::class, 'searchClient']);
    Route::post('/admin/rps/update-role', [AdminController::class, 'updateRole']);
    Route::post('/admin/rps/promote', [AdminController::class, 'promoteToRp']);
    
    Route::get('/admin/rewards', [AdminController::class, 'listRewards']);
    Route::post('/admin/rewards', [AdminController::class, 'createReward']);
    Route::post('/admin/rewards/update', [AdminController::class, 'updateReward']);
    Route::post('/admin/rewards/delete', [AdminController::class, 'deleteReward']);
    Route::post('/admin/rewards/toggle-availability', [AdminController::class, 'toggleRewardAvailability']);
    // Phase 5: SuperAdmin Management (Global Platform & Multi-Club)
    Route::get('/superadmin/overview', [\App\Http\Controllers\SuperAdminController::class, 'overview']);
    Route::get('/superadmin/clubs', [\App\Http\Controllers\SuperAdminController::class, 'getClubs']);
    Route::post('/superadmin/clubs', [\App\Http\Controllers\SuperAdminController::class, 'createClub']);
    Route::match(['put', 'post'], '/superadmin/clubs/{id}', [\App\Http\Controllers\SuperAdminController::class, 'updateClub']);
    Route::post('/superadmin/clubs/{id}/toggle-status', [\App\Http\Controllers\SuperAdminController::class, 'toggleClubStatus']);
    Route::get('/superadmin/users', [\App\Http\Controllers\SuperAdminController::class, 'getUsers']);
    Route::post('/superadmin/users/assign-role', [\App\Http\Controllers\SuperAdminController::class, 'assignRole']);
    Route::post('/superadmin/users/remove-access', [\App\Http\Controllers\SuperAdminController::class, 'removeClubAccess']);
    Route::post('/superadmin/users/toggle-superadmin', [\App\Http\Controllers\SuperAdminController::class, 'toggleSuperAdmin']);
    Route::post('/superadmin/users/create-admin', [\App\Http\Controllers\SuperAdminController::class, 'createAdminUser']);
});

// Public Endpoints
Route::get('/events', [App\Http\Controllers\EventController::class, 'index']);
Route::get('/rp/{username}', [App\Http\Controllers\RpPublicController::class, 'getPublicProfile']);
Route::get('/clubs/info', [App\Http\Controllers\ClubController::class, 'getClubInfo']);
Route::get('/clubs/active', [App\Http\Controllers\ClubController::class, 'getActiveClubs']);
Route::get('/clubs/{slug}/rps', [App\Http\Controllers\ClubController::class, 'getPublicRps']);
Route::get('/events/{id}/rps', [App\Http\Controllers\EventController::class, 'getEventRps']);
Route::get('/events/{id}/guestlist-summary', [App\Http\Controllers\EventController::class, 'getEventGuestlistSummary']);
Route::get('/serve-image', [App\Http\Controllers\ServeImageController::class, 'serve']);
Route::get('/events/{id}', [App\Http\Controllers\EventController::class, 'show']);
