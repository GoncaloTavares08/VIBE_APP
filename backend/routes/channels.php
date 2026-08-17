<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Default private channel Laravel notifications broadcast on for a Notifiable
// model (App\Models\User) — only the owning user may subscribe to their own.
Broadcast::channel('App.Models.User.{id}', function (User $user, int $id) {
    return (int) $user->id === $id;
});
