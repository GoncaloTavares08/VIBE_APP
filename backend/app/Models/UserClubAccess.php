<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserClubAccess extends Model
{
    protected $table = 'user_club_access';
    public $timestamps = false;
    protected $fillable = ['user_id', 'club_id', 'role', 'points', 'joined_at', 'team_leader_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function club()
    {
        return $this->belongsTo(Club::class);
    }
}
