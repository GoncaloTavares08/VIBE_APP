<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Club extends Model
{
    protected $fillable = [
        'name', 'logo_url', 'slug', 'location', 'address', 'city', 
        'max_capacity', 'opening_time', 'closing_time', 
        'contact_phone', 'language', 'timezone', 
        'dark_mode', 'notifications', 'is_active'
    ];
    
    protected $casts = [
        'notifications' => 'array',
        'is_active' => 'boolean',
        'dark_mode' => 'boolean'
    ];

    public function events()
    {
        return $this->hasMany(Event::class);
    }
    
    public function userClubAccess()
    {
        return $this->hasMany(UserClubAccess::class);
    }
}
