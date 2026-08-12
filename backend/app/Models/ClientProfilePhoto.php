<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientProfilePhoto extends Model
{
    public $timestamps = false;
    protected $fillable = ['client_profile_id', 'photo_path', 'photo_order', 'uploaded_at'];

    public function profile()
    {
        return $this->belongsTo(ClientProfile::class, 'client_profile_id');
    }
}
