<?php

namespace App\Policies;

use App\Models\Club;
use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function update(User $user, Event $event): bool
    {
        return $this->manage($user, $event);
    }

    public function delete(User $user, Event $event): bool
    {
        return $this->manage($user, $event);
    }

    private function manage(User $user, Event $event): bool
    {
        $club = Club::find($event->club_id);

        return $club && app(ClubPolicy::class)->manage($user, $club);
    }
}
