<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'club_id', 'name', 'description', 'date', 'start_time', 'end_time', 
        'capacity', 'organizer_name', 'status', 'image_url', 'created_by'
    ];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function guestlists()
    {
        return $this->hasMany(Guestlist::class);
    }
}
