<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointsTransaction extends Model
{
    protected $fillable = [
        'club_id',
        'user_id',
        'points',
        'transaction_type',
        'amount_spent',
        'event_id',
        'staff_id',
    ];
}
