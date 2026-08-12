<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Guestlist;
use App\Models\Event;
use App\Models\Club;
use App\Models\UserClubAccess;
use Illuminate\Support\Str;
use Carbon\Carbon;

class GuestlistController extends Controller
{
    private function getClubId(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $slug = $rawSlug ? strtolower($rawSlug) : null;
        if (!$slug) return null;
        
        $club = Club::where('slug', $slug)->first();
        return $club ? $club->id : null;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        
        // Return guestlists for upcoming or ongoing events
        $guestlists = Guestlist::with('event')
            ->where('client_id', $user->id)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->whereHas('event', function ($query) {
                $query->whereIn('status', ['upcoming', 'ongoing']);
            })
            ->get();

        $formatted = $guestlists->map(function ($gl) {
            return [
                'id' => $gl->id,
                'event_id' => $gl->event_id,
                'client_id' => $gl->client_id,
                'rp_id' => $gl->rp_id,
                'status' => $gl->status,
                'qr_code' => \Illuminate\Support\Facades\Crypt::encryptString($gl->qr_code . '|' . time()),
                'event_name' => $gl->event->name ?? 'Unknown Event',
                'event_date' => $gl->event->date ?? 'N/A',
                'start_time' => $gl->event->start_time ?? '00:00:00',
                'end_time' => $gl->event->end_time ?? '00:00:00',
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    public function join(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|integer|exists:events,id',
            'rp_id'    => 'required|integer|exists:users,id'
        ]);

        $user = $request->user();

        $event = Event::where('id', $validated['event_id'])
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->first();

        if (!$event) {
            return response()->json(['status' => 'error', 'message' => 'Evento não encontrado ou já passou.'], 400);
        }

        $clubId = $event->club_id;

        $existing = Guestlist::where('event_id', $event->id)
            ->where('client_id', $user->id)
            ->exists();

        if ($existing) {
            return response()->json(['status' => 'error', 'message' => 'Já estás nesta guestlist.'], 400);
        }

        // Check or create access
        UserClubAccess::firstOrCreate(
            ['user_id' => $user->id, 'club_id' => $clubId],
            ['points' => 0, 'role' => 'CLIENT']
        );

        $qrCode = (string) Str::uuid();

        $guestlist = Guestlist::create([
            'event_id' => $event->id,
            'client_id' => $user->id,
            'rp_id' => $validated['rp_id'],
            'status' => 'confirmed',
            'qr_code' => $qrCode
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Adicionado à guestlist com sucesso!',
            'data' => [
                'guestlist_id' => $guestlist->id,
                'qr_code' => $qrCode
            ]
        ]);
    }

    public function status(Request $request)
    {
        $user = $request->user();
        $clubId = $this->getClubId($request);
        
        $now = Carbon::now('Europe/Lisbon');

        // 1. Live Party (Checked in to an ongoing event)
        $liveEvent = Guestlist::with('event')
            ->where('client_id', $user->id)
            ->where('status', 'checked_in')
            ->whereHas('event', function ($q) use ($clubId) {
                if ($clubId) $q->where('club_id', $clubId);
            })
            ->get()
            ->filter(function ($gl) use ($now) {
                // Handle cross-midnight
                $event = $gl->event;
                $startStr = $event->date . ' ' . $event->start_time;
                $endStr = $event->date . ' ' . $event->end_time;
                
                $endObj = Carbon::parse($endStr);
                if ($event->end_time < $event->start_time) {
                    $endObj->addDay();
                }

                return $now->lt($endObj);
            })
            ->first();

        if ($liveEvent) {
            return response()->json([
                'status' => 'success',
                'computed_status' => 'live-party',
                'event' => $liveEvent->event
            ]);
        }

        // 2. Next Event Status
        $nextEventQuery = Event::where('status', '!=', 'cancelled')
            ->orderBy('date', 'asc')
            ->orderBy('start_time', 'asc');

        if ($clubId) {
            $nextEventQuery->where('club_id', $clubId);
        }

        // Simple future logic (find next event happening today or later)
        // Ignoring the complex yesterday logic for simplicity here, just looking for upcoming/ongoing
        $nextEvent = $nextEventQuery->where(function($q) use ($now) {
            $dateOnly = $now->format('Y-m-d');
            $timeOnly = $now->format('H:i:s');
            
            $q->where('date', '>', $dateOnly)
              ->orWhere(function($sub) use ($dateOnly, $timeOnly) {
                  $sub->where('date', $dateOnly)->where('start_time', '>', $timeOnly);
              })
              ->orWhere('status', 'ongoing');
        })->first();

        if (!$nextEvent) {
            return response()->json([
                'status' => 'success',
                'computed_status' => 'no-guestlist',
                'event' => null
            ]);
        }

        $hasGuestlist = Guestlist::where('event_id', $nextEvent->id)
            ->where('client_id', $user->id)
            ->exists();

        return response()->json([
            'status' => 'success',
            'computed_status' => $hasGuestlist ? 'has-guestlist' : 'no-guestlist',
            'event' => $nextEvent
        ]);
    }

    public function qrCode(Request $request)
    {
        $user = $request->user();
        
        $activeGuestlist = Guestlist::with('event')
            ->where('client_id', $user->id)
            ->where('status', 'checked_in')
            ->orderBy('created_at', 'desc')
            ->first();

        if ($activeGuestlist && $activeGuestlist->qr_code) {
            $timestamp = time();
            $dynamicToken = \Illuminate\Support\Facades\Crypt::encryptString($activeGuestlist->qr_code . '|' . $timestamp);
            
            return response()->json([
                'status' => 'success',
                'qr_code' => $dynamicToken,
                'event_name' => $activeGuestlist->event->name,
                'event_id' => $activeGuestlist->event->id
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Nenhuma guestlist ativa encontrada.'
        ], 404);
    }
}
