<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'bio' => $this->bio,
            'instagram' => $this->instagram,
            'profile_photo_path' => $this->profile_photo_path,
            'birthdate' => $this->birthdate,
            'gender' => $this->gender,
            'gender_preference' => $this->gender_preference,
            'ghost_mode' => (bool) $this->ghost_mode,
        ];
    }
}
