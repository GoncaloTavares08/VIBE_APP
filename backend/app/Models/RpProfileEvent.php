<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RpProfileEvent extends Model
{
    protected $fillable = [
        'rp_user_id',
        'event_id',
    ];
}
