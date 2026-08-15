<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Club;
use App\Models\User;
use App\Models\Reward;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class AdminController extends Controller
{
    private function checkAdminAccess(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
        if (!$clubSlug) {
            abort(400, 'Club slug missing');
        }

        $club = Club::where('slug', $clubSlug)->first();
        if (!$club) {
            abort(404, 'Club not found');
        }

        $access = DB::table('user_club_access')
            ->where('user_id', $request->user()->id)
            ->where('club_id', $club->id)
            ->first();

        if (!$access || !in_array($access->role, ['ADMIN', 'OWNER', 'MANAGER'])) {
            abort(403, 'Acesso negado.');
        }

        return $club;
    }

    public function getSettings(Request $request)
    {
        $club = $this->checkAdminAccess($request);

        $settings = [
            'id' => $club->id,
            'name' => $club->name,
            'logo_url' => $club->logo_url,
            'slug' => $club->slug,
            'location' => $club->location,
            'address' => $club->address,
            'city' => $club->location,
            'max_capacity' => $club->max_capacity,
            'opening_time' => $club->opening_time,
            'closing_time' => $club->closing_time,
            'contact_phone' => $club->contact_phone,
            'language' => 'pt',
            'timezone' => 'lisbon',
            'dark_mode' => 1,
            'notifications' => [
                'eventSoldOut' => true,
                'capacityWarning' => true,
                'revenueGoals' => true,
                'securityAlerts' => true,
                'rpPerformance' => false,
                'systemIssues' => true
            ]
        ];

        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    public function updateSettings(Request $request)
    {
        $club = $this->checkAdminAccess($request);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'logo_url' => 'nullable|string|max:1000',
            'logo_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,svg,gif|max:10240',
            'city' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'max_capacity' => 'required|integer|min:1',
            'opening_time' => 'required',
            'closing_time' => 'required',
            'contact_phone' => 'nullable|string|max:20'
        ]);

        $logoUrl = $club->logo_url;
        if ($request->hasFile('logo_file')) {
            $file = $request->file('logo_file');
            $filename = 'club_' . $club->id . '_logo_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('clubs/logos', $filename, 'public');
            $logoUrl = '/storage/' . $path;
        } elseif ($request->has('logo_url')) {
            $logoUrl = $request->input('logo_url');
        }

        $club->update([
            'name' => $validated['name'],
            'logo_url' => $logoUrl,
            'location' => $validated['city'] ?? $club->location,
            'address' => $validated['address'],
            'max_capacity' => $validated['max_capacity'],
            'opening_time' => $validated['opening_time'],
            'closing_time' => $validated['closing_time'],
            'contact_phone' => $validated['contact_phone']
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Configurações atualizadas com sucesso!',
            'data' => [
                'logo_url' => $logoUrl
            ]
        ]);
    }

    public function getNightMetrics(Request $request)
    {
        $club = $this->checkAdminAccess($request);
        $now = \Carbon\Carbon::now('Europe/Lisbon');
        $today = $now->copy()->startOfDay();

        $selectedEventId = $request->query('event_id');

        // Available events for this club (for quick selector)
        $availableEvents = DB::table('events')
            ->where('club_id', $club->id)
            ->orderBy('date', 'desc')
            ->select('id', 'name', 'date', 'start_time', 'end_time', 'status', 'capacity')
            ->get();

        $event = null;
        if ($selectedEventId) {
            $event = DB::table('events')
                ->where('club_id', $club->id)
                ->where('id', $selectedEventId)
                ->first();
        }

        if (!$event) {
            // Priority 1: Ongoing event
            $event = DB::table('events')
                ->where('club_id', $club->id)
                ->where('status', 'ongoing')
                ->first();

            // Priority 2: Event today or most recent past event
            if (!$event) {
                $event = DB::table('events')
                    ->where('club_id', $club->id)
                    ->whereDate('date', '<=', $today)
                    ->orderBy('date', 'desc')
                    ->orderBy('start_time', 'desc')
                    ->first();
            }

            // Priority 3: Upcoming event
            if (!$event) {
                $event = DB::table('events')
                    ->where('club_id', $club->id)
                    ->orderBy('date', 'asc')
                    ->first();
            }
        }

        $capacity = $club->max_capacity ?: 1000;
        $totalEntries = 0;
        $totalRevenue = 0;
        $hourlyFlow = [];
        $demographics = ['male' => 0, 'female' => 0];
        $entriesLast30Min = 0;
        $lastEventEntries = 0;
        $lastEventName = null;
        $vsLastEventPercent = null;

        if ($event) {
            $capacity = $event->capacity ?: $capacity;

            // Total Entries (check-ins) for this event
            $totalEntries = DB::table('guestlist')
                ->where('event_id', $event->id)
                ->where('status', 'checked_in')
                ->count();

            // Total Bar Revenue (purchases)
            $totalRevenue = DB::table('points_transactions')
                ->where('event_id', $event->id)
                ->where('transaction_type', 'purchase')
                ->sum('amount_spent');

            // Entries in the last 30 minutes
            $thirtyMinAgo = $now->copy()->subMinutes(30);
            $entriesLast30Min = DB::table('guestlist')
                ->where('event_id', $event->id)
                ->where('status', 'checked_in')
                ->where('checked_in_at', '>=', $thirtyMinAgo)
                ->count();

            // Previous event of this club to compare (the event immediately before this one)
            $lastEvent = DB::table('events')
                ->where('club_id', $club->id)
                ->where('id', '!=', $event->id)
                ->where('date', '<=', $event->date)
                ->orderBy('date', 'desc')
                ->first();

            if ($lastEvent) {
                $lastEventName = $lastEvent->name;
                $lastEventEntries = DB::table('guestlist')
                    ->where('event_id', $lastEvent->id)
                    ->where('status', 'checked_in')
                    ->count();

                if ($lastEventEntries > 0) {
                    $diff = $totalEntries - $lastEventEntries;
                    $vsLastEventPercent = (int) round(($diff / $lastEventEntries) * 100);
                } elseif ($totalEntries > 0) {
                    $vsLastEventPercent = 100;
                } else {
                    $vsLastEventPercent = 0;
                }
            }

            // Hourly Flow
            $flowData = DB::table('guestlist')
                ->where('event_id', $event->id)
                ->where('status', 'checked_in')
                ->whereNotNull('checked_in_at')
                ->select(DB::raw('HOUR(checked_in_at) as hour'), DB::raw('count(*) as count'))
                ->groupBy('hour')
                ->orderBy('hour')
                ->get();
            
            foreach ($flowData as $row) {
                $time = sprintf('%02d:00', $row->hour);
                $hourlyFlow[] = ['time' => $time, 'entries' => $row->count];
            }

            // Demographics
            $demoData = DB::table('guestlist as g')
                ->join('client_profiles as p', 'g.client_id', '=', 'p.user_id')
                ->where('g.event_id', $event->id)
                ->where('g.status', 'checked_in')
                ->select('p.gender', DB::raw('count(*) as count'))
                ->groupBy('p.gender')
                ->get();

            foreach ($demoData as $row) {
                if ($row->gender === 'M') {
                    $demographics['male'] = $row->count;
                } elseif ($row->gender === 'F') {
                    $demographics['female'] = $row->count;
                }
            }
        }

        // Dynamic Flow Status relative to maximum capacity percentage in last 30 minutes
        $capacityPercent30m = $capacity > 0 ? ($entriesLast30Min / $capacity) * 100 : 0;
        
        $flowState = 'slow';
        $flowLabel = 'Calmo';
        $flowEmoji = '❄️';
        $flowDescription = 'Estável';

        if ($capacityPercent30m >= 25) {
            $flowState = 'fire';
            $flowLabel = 'Ao Rubro';
            $flowEmoji = '💥';
            $flowDescription = 'Pico Máximo';
        } elseif ($capacityPercent30m >= 15) {
            $flowState = 'hot';
            $flowLabel = 'Intenso';
            $flowEmoji = '🔥';
            $flowDescription = 'Acelerado';
        } elseif ($capacityPercent30m >= 5) {
            $flowState = 'moderate';
            $flowLabel = 'Moderado';
            $flowEmoji = '⚡';
            $flowDescription = 'Constante';
        } else {
            $flowState = 'slow';
            $flowLabel = 'Calmo';
            $flowEmoji = '❄️';
            $flowDescription = 'Estável';
        }

        // Live Activity Feed (Check-ins, Bar purchases, Reward Redemptions)
        $recentActivity = [];
        if ($event) {
            $checkInActivities = DB::table('guestlist as g')
                ->join('users as u', 'g.client_id', '=', 'u.id')
                ->leftJoin('client_profiles as cp', 'u.id', '=', 'cp.user_id')
                ->leftJoin('rp_profiles as rp', 'u.id', '=', 'rp.user_id')
                ->leftJoin('users as rpu', 'g.rp_id', '=', 'rpu.id')
                ->where('g.event_id', $event->id)
                ->where('g.status', 'checked_in')
                ->whereNotNull('g.checked_in_at')
                ->select(
                    'g.id',
                    'u.id as user_id',
                    'u.name as user_name',
                    'cp.profile_photo_path',
                    'rp.profile_image_url',
                    'rpu.name as rp_name',
                    'g.checked_in_at as timestamp',
                    DB::raw("'check_in' as type")
                )
                ->orderBy('g.checked_in_at', 'desc')
                ->limit(10)
                ->get();

            $purchaseActivities = DB::table('points_transactions as pt')
                ->join('users as u', 'pt.user_id', '=', 'u.id')
                ->leftJoin('client_profiles as cp', 'u.id', '=', 'cp.user_id')
                ->leftJoin('rp_profiles as rp', 'u.id', '=', 'rp.user_id')
                ->where('pt.event_id', $event->id)
                ->where('pt.transaction_type', 'purchase')
                ->select(
                    'pt.id',
                    'u.id as user_id',
                    'u.name as user_name',
                    'cp.profile_photo_path',
                    'rp.profile_image_url',
                    'pt.amount_spent',
                    'pt.points as points_earned',
                    'pt.created_at as timestamp',
                    DB::raw("'purchase' as type")
                )
                ->orderBy('pt.created_at', 'desc')
                ->limit(10)
                ->get();

            $redemptionActivities = DB::table('reward_redemptions as rr')
                ->join('users as u', 'rr.user_id', '=', 'u.id')
                ->join('rewards as rw', 'rr.reward_id', '=', 'rw.id')
                ->leftJoin('client_profiles as cp', 'u.id', '=', 'cp.user_id')
                ->leftJoin('rp_profiles as rp', 'u.id', '=', 'rp.user_id')
                ->where('rw.club_id', $club->id)
                ->where('rr.status', 'completed')
                ->select(
                    'rr.id',
                    'u.id as user_id',
                    'u.name as user_name',
                    'cp.profile_photo_path',
                    'rp.profile_image_url',
                    'rr.reward_name',
                    'rr.points_spent',
                    'rr.redeemed_at as timestamp',
                    DB::raw("'reward_redemption' as type")
                )
                ->orderBy('rr.redeemed_at', 'desc')
                ->limit(5)
                ->get();

            $allActivities = collect([])
                ->concat($checkInActivities)
                ->concat($purchaseActivities)
                ->concat($redemptionActivities)
                ->sortByDesc(fn($a) => $a->timestamp)
                ->values()
                ->take(15);

            $recentActivity = $allActivities->map(function ($act) {
                $nameParts = explode(' ', trim($act->user_name ?? 'Cliente'));
                $avatar = mb_strtoupper(mb_substr($nameParts[0], 0, 1, 'UTF-8') . (isset($nameParts[1]) ? mb_substr($nameParts[1], 0, 1, 'UTF-8') : ''), 'UTF-8');

                $photo = $act->profile_image_url ?: $act->profile_photo_path;
                $profilePhoto = null;
                if ($photo) {
                    if (str_contains($photo, 'pravatar.cc') || str_contains($photo, 'placeholder')) {
                        $profilePhoto = null;
                    } elseif (str_starts_with($photo, 'http://') || str_starts_with($photo, 'https://')) {
                        $profilePhoto = $photo;
                    } else {
                        $cleanPath = ltrim(str_replace('storage/', '', $photo), '/');
                        $profilePhoto = '/api/serve-image?file=' . urlencode($cleanPath);
                    }
                }

                $timeStr = \Carbon\Carbon::parse($act->timestamp, 'Europe/Lisbon')->format('H:i');

                $title = '';
                $subtitle = '';
                if ($act->type === 'check_in') {
                    $title = "Entrou no clube";
                    $subtitle = !empty($act->rp_name) ? "Promotor: {$act->rp_name}" : "Check-in na porta";
                } elseif ($act->type === 'purchase') {
                    $amountFormatted = number_format((float) ($act->amount_spent ?? 0), 2);
                    $title = "Consumiu €{$amountFormatted} no bar";
                    $subtitle = "+{$act->points_earned} pontos acumulados";
                } elseif ($act->type === 'reward_redemption') {
                    $title = "Resgatou prémio";
                    $subtitle = "{$act->reward_name} (-{$act->points_spent} pts)";
                }

                return [
                    'id' => $act->id . '-' . $act->type,
                    'type' => $act->type,
                    'user_name' => $act->user_name,
                    'avatar' => $avatar,
                    'profile_photo' => $profilePhoto,
                    'title' => $title,
                    'subtitle' => $subtitle,
                    'amount' => $act->amount_spent ?? null,
                    'points' => $act->points_earned ?? $act->points_spent ?? null,
                    'time' => $timeStr,
                    'raw_timestamp' => $act->timestamp
                ];
            })->all();
        }

        // Default empty state for hourly flow if no data
        if (empty($hourlyFlow)) {
            $hourlyFlow = [
                ['time' => '23:00', 'entries' => 0],
                ['time' => '00:00', 'entries' => 0],
                ['time' => '01:00', 'entries' => 0]
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'event_id' => $event ? $event->id : null,
                'event_name' => $event ? $event->name : 'Nenhum Evento',
                'event_date' => $event ? $event->date : null,
                'event_start_time' => $event ? $event->start_time : null,
                'event_end_time' => $event ? $event->end_time : null,
                'event_status' => $event ? $event->status : 'none',
                'capacity' => $capacity,
                'total_entries' => $totalEntries,
                'last_event_entries' => $lastEventEntries,
                'last_event_name' => $lastEventName,
                'vs_last_event_percent' => $vsLastEventPercent,
                'entries_last_30_min' => $entriesLast30Min,
                'flow_state' => $flowState,
                'flow_label' => $flowLabel,
                'flow_emoji' => $flowEmoji,
                'flow_description' => $flowDescription,
                'capacity_percent_30m' => round($capacityPercent30m, 1),
                'total_revenue' => round((float) $totalRevenue, 2),
                'hourly_flow' => $hourlyFlow,
                'demographics' => [
                    ['name' => 'Feminino', 'value' => $demographics['female']],
                    ['name' => 'Masculino', 'value' => $demographics['male']]
                ],
                'recent_activity' => $recentActivity,
                'available_events' => $availableEvents
            ]
        ]);
    }

    public function getNightsHistory(Request $request)
    {
        $club = $this->checkAdminAccess($request);

        $events = DB::table('events')
            ->where('club_id', $club->id)
            ->orderBy('date', 'desc')
            ->get();

        $eventsWithStats = $events->map(function ($event) use ($club) {
            // Real Total Pax (Checked-in clients at this event)
            $totalPax = DB::table('guestlist')
                ->where('event_id', $event->id)
                ->where('status', 'checked_in')
                ->count();

            // Real Bar Revenue (Sum of purchases from points_transactions for this event)
            $totalRevenue = (float) DB::table('points_transactions')
                ->where('event_id', $event->id)
                ->where('transaction_type', 'purchase')
                ->sum('amount_spent');

            // Top Performers for this specific night
            $rps = DB::table('guestlist as g')
                ->join('users as u', 'g.rp_id', '=', 'u.id')
                ->leftJoin('client_profiles as cp', 'u.id', '=', 'cp.user_id')
                ->leftJoin('rp_profiles as rp', 'u.id', '=', 'rp.user_id')
                ->where('g.event_id', $event->id)
                ->select(
                    'u.id',
                    'u.name',
                    'cp.profile_photo_path',
                    'rp.profile_image_url',
                    DB::raw('count(g.id) as guest_count'),
                    DB::raw("sum(case when g.status = 'checked_in' then 1 else 0 end) as checked_in_count")
                )
                ->groupBy('u.id', 'u.name', 'cp.profile_photo_path', 'rp.profile_image_url')
                ->get();

            $topPerformers = $rps->map(function ($rpUser) use ($event) {
                // Bar spend by this RP's guests in this event
                $barSpend = (float) DB::table('points_transactions as pt')
                    ->join('guestlist as g', function ($join) use ($rpUser, $event) {
                        $join->on('pt.user_id', '=', 'g.client_id')
                             ->where('g.event_id', '=', $event->id)
                             ->where('g.rp_id', '=', $rpUser->id);
                    })
                    ->where('pt.event_id', $event->id)
                    ->where('pt.transaction_type', 'purchase')
                    ->sum('pt.amount_spent');

                $nameParts = explode(' ', trim($rpUser->name));
                $avatar = mb_strtoupper(mb_substr($nameParts[0], 0, 1, 'UTF-8') . (isset($nameParts[1]) ? mb_substr($nameParts[1], 0, 1, 'UTF-8') : ''), 'UTF-8');

                $photo = $rpUser->profile_image_url ?: $rpUser->profile_photo_path;
                $profilePhoto = null;
                if ($photo) {
                    $profilePhoto = (str_starts_with($photo, 'http://') || str_starts_with($photo, 'https://'))
                        ? $photo
                        : '/api/serve-image?file=' . urlencode(ltrim(str_replace('storage/', '', $photo), '/'));
                }

                return [
                    'id' => $rpUser->id,
                    'name' => $rpUser->name,
                    'avatar' => $avatar,
                    'profile_photo' => $profilePhoto,
                    'points' => (int) $rpUser->checked_in_count,
                    'guest_count' => (int) $rpUser->guest_count,
                    'revenue' => round($barSpend, 2)
                ];
            })
            ->sortByDesc('revenue')
            ->values()
            ->map(function ($item, $idx) {
                $item['rank'] = $idx + 1;
                return $item;
            })
            ->take(5);

            return [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date,
                'start_time' => $event->start_time,
                'end_time' => $event->end_time,
                'capacity' => $event->capacity,
                'organizer_name' => $event->organizer_name,
                'status' => $event->status,
                'image_url' => $event->image_url,
                'totalPax' => $totalPax,
                'totalRevenue' => round($totalRevenue, 2),
                'topPerformers' => $topPerformers
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $eventsWithStats
        ]);
    }

    // RP Management
    public function listRps(Request $request)
    {
        $club = $this->checkAdminAccess($request);

        $users = DB::table('users as u')
            ->join('user_club_access as uca', 'u.id', '=', 'uca.user_id')
            ->leftJoin('users as tl', 'uca.team_leader_id', '=', 'tl.id')
            ->leftJoin('client_profiles as cp', 'u.id', '=', 'cp.user_id')
            ->leftJoin('rp_profiles as rp', 'u.id', '=', 'rp.user_id')
            ->where('uca.club_id', $club->id)
            ->whereIn('uca.role', ['RP', 'TEAM_LEADER'])
            ->select(
                'u.id',
                'u.name',
                'u.email',
                'uca.role',
                'uca.points',
                'uca.team_leader_id',
                'tl.name as team_leader_name',
                'cp.profile_photo_path',
                'rp.profile_image_url',
                'rp.username'
            )
            ->orderBy('u.name')
            ->get();

        // Sort PHP-side: TEAM_LEADER first, then RP
        $users = $users->sortBy(fn($u) => $u->role === 'TEAM_LEADER' ? 0 : 1)->values();

        $now = \Carbon\Carbon::now('Europe/Lisbon');
        $today = $now->copy()->startOfDay();

        // Detect latest or ongoing event of this club
        $latestEvent = DB::table('events')
            ->where('club_id', $club->id)
            ->where('status', 'ongoing')
            ->first() ?: DB::table('events')
            ->where('club_id', $club->id)
            ->whereDate('date', '<=', $today)
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->first() ?: DB::table('events')
            ->where('club_id', $club->id)
            ->orderBy('date', 'desc')
            ->first();

        $users = $users->map(function ($u) use ($club, $latestEvent) {
            $nameParts = explode(' ', trim($u->name));
            $u->avatar = mb_strtoupper(mb_substr($nameParts[0], 0, 1, 'UTF-8') . (isset($nameParts[1]) ? mb_substr($nameParts[1], 0, 1, 'UTF-8') : ''), 'UTF-8');
            
            // Real Profile Photo URL
            $photo = $u->profile_image_url ?: $u->profile_photo_path;
            if ($photo) {
                if (str_contains($photo, 'pravatar.cc') || str_contains($photo, 'placeholder')) {
                    $u->profile_photo = null;
                } elseif (str_starts_with($photo, 'http://') || str_starts_with($photo, 'https://')) {
                    $u->profile_photo = $photo;
                } else {
                    $cleanPath = ltrim(str_replace('storage/', '', $photo), '/');
                    $u->profile_photo = '/api/serve-image?file=' . urlencode($cleanPath);
                }
            } else {
                $u->profile_photo = null;
            }

            // Real Guests in Last / Ongoing Event
            $guestsLastEvent = 0;
            $checkedInLastEvent = 0;
            $revenueLastEvent = 0.0;

            if ($latestEvent) {
                $guestsLastEvent = DB::table('guestlist')
                    ->where('event_id', $latestEvent->id)
                    ->where('rp_id', $u->id)
                    ->count();

                $checkedInLastEvent = DB::table('guestlist')
                    ->where('event_id', $latestEvent->id)
                    ->where('rp_id', $u->id)
                    ->where('status', 'checked_in')
                    ->count();

                $revenueLastEvent = (float) DB::table('points_transactions as pt')
                    ->join('guestlist as g', function($join) use ($u) {
                        $join->on('pt.user_id', '=', 'g.client_id')
                             ->where('g.rp_id', '=', $u->id);
                    })
                    ->where('pt.event_id', $latestEvent->id)
                    ->where('pt.transaction_type', 'purchase')
                    ->sum('pt.amount_spent');
            }

            // Real All-Time Stats for this Club
            $totalGuests = DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('e.club_id', $club->id)
                ->where('g.rp_id', $u->id)
                ->count();

            $totalCheckedIn = DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('e.club_id', $club->id)
                ->where('g.rp_id', $u->id)
                ->where('g.status', 'checked_in')
                ->count();

            // Real Bar Revenue generated by this RP's guests (all-time)
            $totalRevenueAllTime = (float) DB::table('points_transactions as pt')
                ->join('guestlist as g', function($join) use ($u) {
                    $join->on('pt.user_id', '=', 'g.client_id')
                         ->where('g.rp_id', '=', $u->id);
                })
                ->join('events as e', 'pt.event_id', '=', 'e.id')
                ->where('e.club_id', $club->id)
                ->where('pt.transaction_type', 'purchase')
                ->sum('pt.amount_spent');

            $u->guestsTonight = $guestsLastEvent;
            $u->guestsLastEvent = $guestsLastEvent;
            $u->checkedInLastEvent = $checkedInLastEvent;
            $u->checkedInTonight = $checkedInLastEvent;
            $u->totalGuests = $totalGuests;
            $u->totalCheckedIn = $totalCheckedIn;
            $u->totalRevenue = round($totalRevenueAllTime, 2);
            $u->revenueLastEvent = round($revenueLastEvent, 2);
            $u->last_event_name = $latestEvent ? $latestEvent->name : null;

            return $u;
        });

        return response()->json([
            'status' => 'success',
            'data' => $users,
            'last_event' => $latestEvent ? [
                'id' => $latestEvent->id,
                'name' => $latestEvent->name,
                'date' => $latestEvent->date,
                'status' => $latestEvent->status
            ] : null
        ]);
    }

    public function searchClient(Request $request)
    {
        $club = $this->checkAdminAccess($request);
        $query = $request->input('query') ?: $request->input('email');

        if (!$query) {
            return response()->json(['status' => 'error', 'message' => 'Termo de pesquisa é obrigatório.'], 400);
        }

        $users = DB::table('users as u')
            ->join('user_club_access as uca', 'u.id', '=', 'uca.user_id')
            ->leftJoin('client_profiles as cp', 'u.id', '=', 'cp.user_id')
            ->leftJoin('rp_profiles as rp', 'u.id', '=', 'rp.user_id')
            ->where('uca.club_id', $club->id)
            ->where(function ($q) use ($query) {
                $q->where('u.email', 'like', "%{$query}%")
                  ->orWhere('u.name', 'like', "%{$query}%");
            })
            ->where('uca.role', 'CLIENT')
            ->select(
                'u.id',
                'u.name',
                'u.email',
                'uca.role',
                'cp.profile_photo_path',
                'rp.profile_image_url'
            )
            ->limit(10)
            ->get();

        $formattedUsers = $users->map(function ($user) {
            $nameParts = explode(' ', trim($user->name));
            $user->avatar = mb_strtoupper(mb_substr($nameParts[0], 0, 1, 'UTF-8') . (isset($nameParts[1]) ? mb_substr($nameParts[1], 0, 1, 'UTF-8') : ''), 'UTF-8');
            
            $photo = $user->profile_image_url ?: $user->profile_photo_path;
            if ($photo) {
                if (str_contains($photo, 'pravatar.cc') || str_contains($photo, 'placeholder')) {
                    $user->profile_photo = null;
                } elseif (str_starts_with($photo, 'http://') || str_starts_with($photo, 'https://')) {
                    $user->profile_photo = $photo;
                } else {
                    $cleanPath = ltrim(str_replace('storage/', '', $photo), '/');
                    $user->profile_photo = '/api/serve-image?file=' . urlencode($cleanPath);
                }
            } else {
                $user->profile_photo = null;
            }

            return $user;
        });

        if ($formattedUsers->isNotEmpty()) {
            return response()->json([
                'status' => 'success',
                'data' => $formattedUsers->first(),
                'results' => $formattedUsers
            ]);
        }

        return response()->json(['status' => 'error', 'message' => 'Nenhum cliente encontrado com esse nome ou email.'], 404);
    }

    public function updateRole(Request $request)
    {
        $club = $this->checkAdminAccess($request);
        
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'new_role' => 'required|in:CLIENT,RP,TEAM_LEADER',
            'team_leader_id' => 'nullable|integer'
        ]);

        if ($validated['new_role'] === 'RP' && empty($validated['team_leader_id'])) {
            return response()->json(['status' => 'error', 'message' => 'Team leader é obrigatório para RPs.'], 400);
        }

        DB::beginTransaction();
        try {
            if ($validated['new_role'] === 'RP') {
                if ($validated['team_leader_id'] == $validated['user_id']) {
                    throw new \Exception('Um utilizador não pode ser team leader de si mesmo.');
                }

                $tl = DB::table('user_club_access')
                    ->where('user_id', $validated['team_leader_id'])
                    ->where('club_id', $club->id)
                    ->first();

                if (!$tl || $tl->role !== 'TEAM_LEADER') {
                    throw new \Exception('Team leader inválido.');
                }

                DB::table('user_club_access')
                    ->where('user_id', $validated['user_id'])
                    ->where('club_id', $club->id)
                    ->update(['role' => 'RP', 'team_leader_id' => $validated['team_leader_id']]);
            } else {
                $current = DB::table('user_club_access')
                    ->where('user_id', $validated['user_id'])
                    ->where('club_id', $club->id)
                    ->first();

                if ($current && $current->role === 'TEAM_LEADER' && $validated['new_role'] !== 'TEAM_LEADER') {
                    $rpCount = DB::table('user_club_access')
                        ->where('team_leader_id', $validated['user_id'])
                        ->where('club_id', $club->id)
                        ->where('role', 'RP')
                        ->count();

                    if ($rpCount > 0) {
                        throw new \Exception("Não pode converter este Team Leader porque tem {$rpCount} RP(s) associado(s).");
                    }
                }

                DB::table('user_club_access')
                    ->where('user_id', $validated['user_id'])
                    ->where('club_id', $club->id)
                    ->update(['role' => $validated['new_role'], 'team_leader_id' => null]);
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Role atualizado com sucesso.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 400);
        }
    }

    public function promoteToRp(Request $request)
    {
        $club = $this->checkAdminAccess($request);
        
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'team_leader_id' => 'required|integer'
        ]);

        DB::beginTransaction();
        try {
            $current = DB::table('user_club_access')
                ->where('user_id', $validated['user_id'])
                ->where('club_id', $club->id)
                ->first();

            if (!$current || $current->role !== 'CLIENT') {
                throw new \Exception('Utilizador não é um cliente.');
            }

            if ($validated['team_leader_id'] == $validated['user_id']) {
                throw new \Exception('Um utilizador não pode ser team leader de si mesmo.');
            }

            $tl = DB::table('user_club_access')
                ->where('user_id', $validated['team_leader_id'])
                ->where('club_id', $club->id)
                ->first();

            if (!$tl || $tl->role !== 'TEAM_LEADER') {
                throw new \Exception('Team leader inválido.');
            }

            DB::table('user_club_access')
                ->where('user_id', $validated['user_id'])
                ->where('club_id', $club->id)
                ->update(['role' => 'RP', 'team_leader_id' => $validated['team_leader_id']]);

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Cliente promovido a RP com sucesso.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 400);
        }
    }

    // Rewards Management
    public function listRewards(Request $request)
    {
        $club = $this->checkAdminAccess($request);
        $rewards = Reward::where('club_id', $club->id)->orderBy('points', 'asc')->get();
        return response()->json(['status' => 'success', 'data' => $rewards]);
    }

    public function createReward(Request $request)
    {
        $club = $this->checkAdminAccess($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|max:5120'
        ]);

        $reward = Reward::create([
            'club_id' => $club->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'points' => $validated['points'],
            'stock' => $validated['stock'],
            'available' => 1
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $datePath = date('Y/m/d');
            $filename = 'reward_' . time() . '_' . uniqid() . '.webp';
            $finalPath = "rewards/{$datePath}/{$filename}";
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $tempPath = "temp/" . uniqid('reward_') . ".{$ext}";
            
            Storage::disk('public')->put($tempPath, file_get_contents($file->getRealPath()));
            $tempUrl = 'storage/' . $tempPath;
            $reward->update(['image_path' => $tempUrl]);

            \App\Jobs\ProcessImageJob::dispatch($tempPath, $finalPath, \App\Models\Reward::class, $reward->id, 'image_path');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Prémio criado com sucesso!',
            'data' => ['id' => $reward->id, 'image_path' => $reward->image_path]
        ]);
    }

    public function updateReward(Request $request)
    {
        $this->checkAdminAccess($request);

        $validated = $request->validate([
            'id' => 'required|integer|exists:rewards,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'points' => 'required|integer|min:1',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|max:5120'
        ]);

        $reward = Reward::findOrFail($validated['id']);

        $reward->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'points' => $validated['points'],
            'stock' => $validated['stock']
        ]);

        if ($request->hasFile('image')) {
            if ($reward->image_path) {
                Storage::disk('public')->delete(str_replace('storage/', '', $reward->image_path));
            }

            $file = $request->file('image');
            $datePath = date('Y/m/d');
            $filename = 'reward_' . time() . '_' . uniqid() . '.webp';
            $finalPath = "rewards/{$datePath}/{$filename}";
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            $tempPath = "temp/" . uniqid('reward_') . ".{$ext}";
            
            Storage::disk('public')->put($tempPath, file_get_contents($file->getRealPath()));
            $tempUrl = 'storage/' . $tempPath;
            $reward->update(['image_path' => $tempUrl]);

            \App\Jobs\ProcessImageJob::dispatch($tempPath, $finalPath, \App\Models\Reward::class, $reward->id, 'image_path');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Prémio atualizado com sucesso!',
            'data' => ['image_path' => $reward->image_path]
        ]);
    }

    public function deleteReward(Request $request)
    {
        $this->checkAdminAccess($request);
        $rewardId = $request->input('id');

        if (!$rewardId) {
            return response()->json(['status' => 'error', 'message' => 'Reward ID não fornecido.'], 400);
        }

        $reward = Reward::findOrFail($rewardId);

        if ($reward->image_path) {
            Storage::disk('public')->delete(str_replace('storage/', '', $reward->image_path));
        }
        
        $reward->delete();

        return response()->json(['status' => 'success', 'message' => 'Prémio removido com sucesso!']);
    }

    public function toggleRewardAvailability(Request $request)
    {
        $this->checkAdminAccess($request);
        $rewardId = $request->input('id');

        if (!$rewardId) {
            return response()->json(['status' => 'error', 'message' => 'Reward ID não fornecido.'], 400);
        }

        $reward = Reward::findOrFail($rewardId);
        $reward->update(['available' => !$reward->available]);

        return response()->json(['status' => 'success', 'message' => 'Disponibilidade atualizada!']);
    }
}
