<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventFeedback extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
        'rating',
        'comment',
    ];
}
