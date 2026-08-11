<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    protected $fillable = [
        'club_id',
        'name',
        'description',
        'points',
        'stock',
        'available',
        'image_path',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }
}
