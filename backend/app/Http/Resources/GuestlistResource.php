<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Crypt;

class GuestlistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $prefix = $this->status === 'checked_in' ? 'BAR:' : 'ENTRY:';

        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'client_id' => $this->client_id,
            'rp_id' => $this->rp_id,
            'status' => $this->status,
            // Static encrypted QR for ENTRY or BAR scanning - rotated every 30s by frontend
            'qr_code' => Crypt::encryptString($prefix . $this->qr_code . '|' . time()),
            'event_name' => $this->event->name ?? 'Unknown Event',
            'event_date' => $this->event->date ?? 'N/A',
            'start_time' => $this->event->start_time ?? '00:00:00',
            'end_time' => $this->event->end_time ?? '00:00:00',
        ];
    }
}
