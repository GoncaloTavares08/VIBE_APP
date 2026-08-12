<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Guestlist extends Model
{
    protected $table = 'guestlist';
    protected $fillable = ['event_id', 'client_id', 'rp_id', 'status', 'qr_code', 'checked_in_at'];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function rp()
    {
        return $this->belongsTo(User::class, 'rp_id');
    }
}
