<?php

namespace App\Http\Controllers;

use App\Http\Requests\JoinGuestlistRequest;
use App\Http\Resources\GuestlistResource;
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
        if ($slug) {
            $club = Club::where('slug', $slug)->first();
            if ($club) return $club->id;
        }

        $user = $request->user();
        if ($user) {
            $userClub = \Illuminate\Support\Facades\DB::table('user_club_access')
                ->where('user_id', $user->id)
                ->first();
            if ($userClub) return $userClub->club_id;
        }
        
        return null;
    }

    private function ensureRpOnGuestlist($user, $clubId)
    {
        if (!$user) return;

        $isRp = \Illuminate\Support\Facades\DB::table('user_club_access')
            ->where('user_id', $user->id)
            ->whereIn('role', ['RP', 'TEAM_LEADER', 'STAFF', 'rp', 'team_leader', 'staff'])
            ->exists() || in_array(strtolower($user->role ?? ''), ['rp', 'team_leader', 'staff']);

        if ($isRp) {
            $today = Carbon::now('Europe/Lisbon')->format('Y-m-d');
            $yesterday = Carbon::now('Europe/Lisbon')->subDay()->format('Y-m-d');

            $eventsQuery = Event::where('status', '!=', 'cancelled')
                ->where(function($q) use ($today, $yesterday) {
                    $q->where('date', '>=', $today)
                      ->orWhere('status', 'ongoing')
                      ->orWhere(function($sub) use ($yesterday) {
                          $sub->where('date', $yesterday)
                              ->where('end_time', '<', '12:00:00');
                      });
                });

            if ($clubId) {
                $eventsQuery->where('club_id', $clubId);
            }
            $events = $eventsQuery->get();
            foreach ($events as $ev) {
                $exists = Guestlist::where('event_id', $ev->id)->where('client_id', $user->id)->first();
                if (!$exists) {
                    Guestlist::create([
                        'event_id' => $ev->id,
                        'client_id' => $user->id,
                        'rp_id' => $user->id,
                        'status' => 'confirmed',
                        'qr_code' => (string) Str::uuid()
                    ]);
                }
            }
        }
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $clubId = $this->getClubId($request);
        $this->ensureRpOnGuestlist($user, $clubId);

        $now = Carbon::now('Europe/Lisbon');
        
        // Return guestlists only for active/future events (never expired/finished ones)
        $guestlists = Guestlist::with('event')
            ->where('client_id', $user->id)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->whereHas('event', function ($query) use ($clubId) {
                $query->whereNotIn('status', ['cancelled', 'ended']);
                if ($clubId) {
                    $query->where('club_id', $clubId);
                }
            })
            ->get()
            ->filter(function ($gl) use ($now) {
                $event = $gl->event;
                if (!$event) return false;
                $start = Carbon::parse($event->date . ' ' . ($event->start_time ?: '00:00'), 'Europe/Lisbon');
                if ($event->end_time) {
                    $end = Carbon::parse($event->date . ' ' . $event->end_time, 'Europe/Lisbon');
                    if ($end->lte($start)) {
                        $end->addDay();
                    }
                } else {
                    $end = (clone $start)->addHours(12);
                }
                return $now->lte($end);
            })
            ->sortBy(function ($gl) {
                return $gl->event ? ($gl->event->date . ' ' . $gl->event->start_time) : '9999';
            })
            ->values();

        return response()->json([
            'status' => 'success',
            'data' => GuestlistResource::collection($guestlists)
        ]);
    }

    public function join(JoinGuestlistRequest $request)
    {
        $validated = $request->validated();

        $user = $request->user();

        $event = Event::where('id', $validated['event_id'])
            ->whereIn('status', ['upcoming', 'ongoing'])
            ->first();

        if (!$event) {
            return response()->json(['status' => 'error', 'message' => 'Evento não encontrado ou já passou.'], 400);
        }

        $now = \Carbon\Carbon::now('Europe/Lisbon');
        $start = \Carbon\Carbon::parse($event->date . ' ' . ($event->start_time ?: '00:00'), 'Europe/Lisbon');
        if ($event->end_time) {
            $end = \Carbon\Carbon::parse($event->date . ' ' . $event->end_time, 'Europe/Lisbon');
            if ($end->lte($start)) $end->addDay();
        } else {
            $end = (clone $start)->addHours(12);
        }

        if ($now->gt($end)) {
            return response()->json(['status' => 'error', 'message' => 'Este evento já encerrou. Já não podes aderir à Guestlist.'], 400);
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

        $user->notify(new \App\Notifications\GuestlistJoinedNotification($event->id, $event->name));

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
        $this->ensureRpOnGuestlist($user, $clubId);
        
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

        $nextEvent = $nextEventQuery->where(function($q) use ($now) {
            $dateOnly = $now->format('Y-m-d');
            $q->where('date', '>=', $dateOnly)
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
        $now = Carbon::now('Europe/Lisbon');
        
        $activeGuestlist = Guestlist::with('event')
            ->where('client_id', $user->id)
            ->where('status', 'checked_in')
            ->whereHas('event', function ($query) {
                $query->whereNotIn('status', ['cancelled', 'ended']);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(function ($gl) use ($now) {
                $event = $gl->event;
                $start = Carbon::parse($event->date . ' ' . ($event->start_time ?: '00:00'), 'Europe/Lisbon');
                if ($event->end_time) {
                    $end = Carbon::parse($event->date . ' ' . $event->end_time, 'Europe/Lisbon');
                    if ($end->lte($start)) {
                        $end->addDay();
                    }
                } else {
                    $end = (clone $start)->addHours(12);
                }
                return $now->lte($end);
            })
            ->first();

        if ($activeGuestlist && $activeGuestlist->qr_code) {
            $timestamp = time();
            // Prefix with BAR: so staff scan knows this is for bar points, not entry
            $dynamicToken = \Illuminate\Support\Facades\Crypt::encryptString('BAR:' . $activeGuestlist->qr_code . '|' . $timestamp);
            
            return response()->json([
                'status' => 'success',
                'qr_code' => $dynamicToken,
                'event_name' => $activeGuestlist->event->name,
                'event_id' => $activeGuestlist->event->id
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Nenhum evento ativo de momento.'
        ], 404);
    }
}
