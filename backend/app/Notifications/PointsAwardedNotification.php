<?php

namespace App\Notifications;

use App\Notifications\Channels\FcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PointsAwardedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public int $pointsAwarded,
        public int $newTotalPoints
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', FcmChannel::class];
    }

    public function toFcm(object $notifiable): array
    {
        return [
            'title' => 'Pontos Recebidos! ⭐',
            'body' => "+{$this->pointsAwarded} pontos adicionados. Total: {$this->newTotalPoints}",
            'data' => [
                'type' => 'points_awarded',
                'points_awarded' => $this->pointsAwarded,
            ],
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'points_awarded',
            'points_awarded' => $this->pointsAwarded,
            'new_total_points' => $this->newTotalPoints,
            'message' => "+{$this->pointsAwarded} pontos adicionados!",
        ];
    }
}
