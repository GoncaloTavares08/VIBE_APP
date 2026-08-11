<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RpProfile extends Model
{
    protected $table = 'rp_profiles';
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
