<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'club_id' => $this->club_id,
            'name' => $this->name,
            'description' => $this->description,
            'date' => $this->date,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'capacity' => $this->capacity,
            'organizer_name' => $this->organizer_name,
            'status' => $this->status,
            'image_url' => $this->image_url,
        ];
    }
}
