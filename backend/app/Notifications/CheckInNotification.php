<?php

namespace App\Notifications;

use App\Notifications\Channels\FcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CheckInNotification extends Notification
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
            'title' => 'Entrada Confirmada! 🎉',
            'body' => "Já estás dentro de {$this->eventName}. Boa noite!",
            'data' => [
                'type' => 'check_in',
                'event_id' => $this->eventId,
            ],
        ];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'check_in',
            'event_id' => $this->eventId,
            'event_name' => $this->eventName,
            'message' => "Entrada confirmada em {$this->eventName}!",
        ];
    }
}
