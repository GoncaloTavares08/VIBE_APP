<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientProfile extends Model
{
    protected $table = 'client_profiles';
    protected $fillable = [
        'user_id',
        'bio',
        'instagram',
        'profile_photo_path',
        'ghost_mode',
        'birthdate',
        'gender',
        'gender_preference',
    ];

    public function gallery_photos()
    {
        return $this->hasMany(ClientProfilePhoto::class, 'client_profile_id')->orderBy('photo_order');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
