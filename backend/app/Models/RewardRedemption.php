<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RewardRedemption extends Model
{
    protected $table = 'reward_redemptions';
    protected $guarded = [];

    public function reward()
    {
        return $this->belongsTo(Reward::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
