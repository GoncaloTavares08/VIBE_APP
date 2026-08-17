<?php

namespace App\Notifications;

use App\Notifications\Channels\FcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class GuestlistJoinedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public int $eventId,
        public string $eventName
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', FcmChannel::class];
    }

    public function toFcm(object $notifiable): array
    {
        return [
            'title' => 'Já estás na Guestlist! ✅',
            'body' => "Confirmado para {$this->eventName}.",
            'data' => [
                'type' => 'guestlist_joined',
                'event_id' => $this->eventId,
            ],
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'guestlist_joined',
            'event_id' => $this->eventId,
            'event_name' => $this->eventName,
            'message' => "Adicionado à guestlist de {$this->eventName}!",
        ];
    }
}
