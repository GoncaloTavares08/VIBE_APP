<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RpReview extends Model
{
    protected $fillable = [
        'rp_user_id',
        'reviewer_user_id',
        'rating',
        'comment',
        'event_id',
        'club_id',
    ];
}
