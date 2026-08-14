<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TeamMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public int $senderId,
        public string $senderName,
        public string $message,
        public ?string $senderAvatar = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'team',
            'title' => "Mensagem de {$this->senderName} 💬",
            'message' => $this->message,
            'sender_id' => $this->senderId,
            'sender_name' => $this->senderName,
            'avatar' => $this->senderAvatar,
        ];
    }
}
