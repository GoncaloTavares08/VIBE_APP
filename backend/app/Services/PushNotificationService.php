<?php

namespace App\Services;

use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;

class PushNotificationService
{
    /**
     * Send a push notification to every device registered for this user,
     * pruning any tokens Firebase reports as invalid/unregistered.
     *
     * Resolves the Firebase Messaging client lazily (instead of via constructor
     * injection) so that notifying a user with no device tokens — the common
     * case until push is actually configured/adopted — never needs a working
     * Firebase project.
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): void
    {
        $tokens = $user->deviceTokens()->pluck('token')->all();
        if (empty($tokens)) {
            return;
        }

        $message = CloudMessage::new()
            ->withNotification(['title' => $title, 'body' => $body])
            ->withData(array_map('strval', $data));

        try {
            $report = app(Messaging::class)->sendMulticast($message, $tokens);
        } catch (\Throwable $e) {
            Log::warning('Push notification send failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            return;
        }

        $staleTokens = array_merge($report->invalidTokens(), $report->unknownTokens());
        if (!empty($staleTokens)) {
            DeviceToken::where('user_id', $user->id)->whereIn('token', $staleTokens)->delete();
        }
    }
}
