<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RpProfile;
use App\Models\Guestlist;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class RpController extends Controller
{
    public function showProfile(Request $request)
    {
        $user = $request->user();
        $profile = RpProfile::where('user_id', $user->id)->first();

        return response()->json([
            'status' => 'success',
            'data' => $profile
        ]);
    }

    public function checkUsername(Request $request)
    {
        $username = $request->input('username');
        if (!$username || !preg_match('/^[a-zA-Z0-9_]{3,50}$/', $username)) {
            return response()->json(['status' => 'error', 'message' => 'Username inválido.'], 400);
        }

        $exists = RpProfile::whereRaw('LOWER(username) = ?', [strtolower($username)])
            ->where('user_id', '!=', $request->user()->id ?? 0)
            ->exists();

        return response()->json([
            'status' => 'success',
            'available' => !$exists
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'username' => 'required|string|regex:/^[a-zA-Z0-9_]{3,50}$/|unique:rp_profiles,username,' . $user->id . ',user_id',
            'bio' => 'nullable|string|max:500',
            'instagram' => 'nullable|string|max:30',
        ]);

        $profile = RpProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'username' => $validated['username'],
                'bio' => $validated['bio'] ?? '',
                'instagram' => str_replace('@', '', $validated['instagram'] ?? ''),
                'is_public' => 1
            ]
        );

        // Synchronize bio and instagram with client_profiles
        \App\Models\ClientProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'bio' => $validated['bio'] ?? '',
                'instagram' => str_replace('@', '', $validated['instagram'] ?? ''),
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Perfil atualizado com sucesso!',
            'data' => $profile
        ]);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|max:5120'
        ]);

        $user = $request->user();
        $file = $request->file('photo');
        $datePath = date('Y/m/d');
        $uniqid = uniqid('rp_profile_');
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        
        $tempPath = "temp/{$uniqid}.{$ext}";
        \Illuminate\Support\Facades\Storage::disk('public')->put($tempPath, file_get_contents($file->getRealPath()));
        
        $finalPath = "profiles/rps/{$datePath}/{$uniqid}.webp";
        $webPath = 'storage/' . $tempPath;

        $profile = RpProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['username' => 'rp_' . $user->id, 'is_public' => 0]
        );

        // Delete old photo if exists
        if ($profile->profile_image_url) {
            $oldPath = str_replace('storage/', '', $profile->profile_image_url);
            Storage::disk('public')->delete($oldPath);
        }

        $profile->update(['profile_image_url' => $webPath]);
        \App\Jobs\ProcessImageJob::dispatch($tempPath, $finalPath, \App\Models\RpProfile::class, $profile->id, 'profile_image_url');

        return response()->json([
            'status' => 'success',
            'message' => 'Foto de perfil atualizada!',
            'photo_path' => $webPath
        ]);
    }

    public function myGuestlists(Request $request)
    {
        $user = $request->user();
        
        $guestlists = Guestlist::with(['event', 'client'])
            ->where('rp_id', $user->id)
            ->whereHas('event', function($query) {
                $query->whereIn('status', ['upcoming', 'ongoing']);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $formatted = $guestlists->map(function ($gl) {
            return [
                'guestlist_id' => $gl->id,
                'guest_user_id' => $gl->client_id,
                'name' => $gl->client->name ?? 'Unknown User',
                'status' => $gl->status,
                'added_date' => $gl->created_at,
                'checkin_time' => $gl->checked_in_at,
                'event_name' => $gl->event->name,
                'event_date' => $gl->event->date
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    public function myEvents(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
        $userId = $request->query('user_id', $request->user()->id ?? null);
        $isAll = $request->query('all') === 'true';
        
        $query = \App\Models\Event::orderBy('date', 'desc')->orderBy('start_time', 'desc');

        if ($clubSlug) {
            $query->whereHas('club', function ($q) use ($clubSlug) {
                $q->where('slug', $clubSlug);
            });
        }
        
        $events = $query->get();
        
        // Get the IDs of events the RP is participating in
        $selectedEventIds = \Illuminate\Support\Facades\DB::table('rp_profile_events')
            ->where('rp_user_id', $userId)
            ->pluck('event_id')
            ->toArray();

        $formattedEvents = $events->map(function($event) use ($selectedEventIds) {
            $event->is_selected = in_array($event->id, $selectedEventIds);
            return $event;
        });

        if (!$isAll) {
            $formattedEvents = $formattedEvents->filter(function($event) {
                return $event->is_selected;
            })->values();
        }

        return response()->json([
            'status' => 'success',
            'data' => $formattedEvents
        ]);
    }

    public function addEvent(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|integer|exists:events,id',
            'user_id' => 'required|integer|exists:users,id'
        ]);

        \Illuminate\Support\Facades\DB::table('rp_profile_events')->updateOrInsert(
            ['rp_user_id' => $validated['user_id'], 'event_id' => $validated['event_id']],
            ['created_at' => now(), 'updated_at' => now()]
        );

        return response()->json(['status' => 'success']);
    }

    public function removeEvent(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|integer',
            'user_id' => 'required|integer'
        ]);

        \Illuminate\Support\Facades\DB::table('rp_profile_events')
            ->where('rp_user_id', $validated['user_id'])
            ->where('event_id', $validated['event_id'])
            ->delete();

        return response()->json(['status' => 'success']);
    }

    public function getLeaderboard(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
        
        if (!$clubSlug) {
            return response()->json(['status' => 'error', 'message' => 'Club slug missing'], 400);
        }

        $club = \App\Models\Club::where('slug', $clubSlug)->first();
        if (!$club) {
            return response()->json(['status' => 'error', 'message' => 'Club not found'], 404);
        }

        $period = $request->query('period', 'all_time');
        $now = \Carbon\Carbon::now('Europe/Lisbon');

        $startDate = null;
        if ($period === 'this_month') {
            $startDate = $now->copy()->startOfMonth();
        } elseif ($period === 'this_year') {
            $startDate = $now->copy()->startOfYear();
        }

        // Get all RPs for this club
        $rps = \Illuminate\Support\Facades\DB::table('users as u')
            ->join('user_club_access as uca', 'u.id', '=', 'uca.user_id')
            ->leftJoin('rp_profiles as p', 'u.id', '=', 'p.user_id')
            ->where('uca.club_id', $club->id)
            ->where('uca.role', 'RP')
            ->select('u.id', 'u.name', 'p.profile_image_url')
            ->get();

        $leaderboard = [];

        foreach ($rps as $rp) {
            $guestlistQuery = \Illuminate\Support\Facades\DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('g.rp_id', $rp->id)
                ->where('e.club_id', $club->id);

            if ($startDate) {
                $guestlistQuery->where('g.created_at', '>=', $startDate);
            }

            $entries = (clone $guestlistQuery)->count();

            // Revenue generated by this RP's guests
            $clientIds = (clone $guestlistQuery)->pluck('g.client_id');

            $revenue = 0;
            if ($clientIds->count() > 0) {
                $revQuery = \Illuminate\Support\Facades\DB::table('points_transactions as pt')
                    ->join('events as e', 'pt.event_id', '=', 'e.id')
                    ->whereIn('pt.user_id', $clientIds)
                    ->where('e.club_id', $club->id)
                    ->where('pt.transaction_type', 'purchase');

                if ($startDate) {
                    $revQuery->where('e.date', '>=', $startDate->toDateString());
                }

                $revenue = $revQuery->sum('pt.amount_spent');
            }

            $nameParts = explode(' ', $rp->name);
            $initials = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));

            $avatarUrl = null;
            if ($rp->profile_image_url) {
                $avatarUrl = str_starts_with($rp->profile_image_url, 'http')
                    ? $rp->profile_image_url
                    : url('storage/' . str_replace('storage/', '', $rp->profile_image_url));
            }

            $leaderboard[] = [
                'id' => $rp->id,
                'name' => $rp->name,
                'avatar' => $avatarUrl,
                'initials' => $initials,
                'entries' => (int)$entries,
                'revenue' => (float)$revenue,
                'trend' => $entries > 10 ? 'up' : 'down'
            ];
        }

        // Sort by entries descending, then revenue
        usort($leaderboard, function($a, $b) {
            if ($a['entries'] == $b['entries']) {
                return $b['revenue'] <=> $a['revenue'];
            }
            return $b['entries'] <=> $a['entries'];
        });

        // Add rank
        foreach ($leaderboard as $index => &$item) {
            $item['rank'] = $index + 1;
        }

        return response()->json([
            'status' => 'success',
            'period' => $period,
            'data' => $leaderboard
        ]);
    }

    public function getTeam(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
        $user = $request->user();

        if (!$clubSlug) {
            return response()->json(['status' => 'error', 'message' => 'Club slug missing'], 400);
        }

        $club = \App\Models\Club::where('slug', $clubSlug)->first();
        if (!$club) {
            return response()->json(['status' => 'error', 'message' => 'Club not found'], 404);
        }

        // Get user's club access
        $access = \Illuminate\Support\Facades\DB::table('user_club_access')
            ->where('user_id', $user->id)
            ->where('club_id', $club->id)
            ->first();

        if (!$access) {
            return response()->json(['status' => 'error', 'message' => 'Access denied'], 403);
        }

        $teamLeaderId = null;
        if ($access->role === 'TEAM_LEADER') {
            $teamLeaderId = $user->id;
        } elseif ($access->role === 'RP' && $access->team_leader_id) {
            $teamLeaderId = $access->team_leader_id;
        }

        if (!$teamLeaderId) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'teamGoal' => 500,
                    'teamMembers' => [],
                    'myRank' => 1,
                    'myEntries' => 0,
                    'myGoal' => 150
                ]
            ]);
        }

        $today = \Carbon\Carbon::today('Europe/Lisbon');
        $startOfMonth = \Carbon\Carbon::now('Europe/Lisbon')->startOfMonth();
        $month = $startOfMonth->month;
        $year = $startOfMonth->year;

        // Fetch team goal from team_goals table
        $teamGoalRecord = \Illuminate\Support\Facades\DB::table('team_goals')
            ->where('team_leader_id', $teamLeaderId)
            ->where('club_id', $club->id)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        $teamGoal = $teamGoalRecord ? $teamGoalRecord->goal : 500;

        // Get team members (team leader + RPs)
        $members = \Illuminate\Support\Facades\DB::table('users as u')
            ->join('user_club_access as uca', 'u.id', '=', 'uca.user_id')
            ->leftJoin('rp_profiles as p', 'u.id', '=', 'p.user_id')
            ->where('uca.club_id', $club->id)
            ->where(function($query) use ($teamLeaderId) {
                $query->where('uca.team_leader_id', $teamLeaderId)
                      ->orWhere('uca.user_id', $teamLeaderId);
            })
            ->select('u.id', 'u.name', 'p.profile_image_url')
            ->get();

        $teamMembers = [];

        foreach ($members as $rp) {
            // Guests in guestlist this month
            $monthlyEntries = \Illuminate\Support\Facades\DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('g.rp_id', $rp->id)
                ->where('e.club_id', $club->id)
                ->whereDate('g.created_at', '>=', $startOfMonth)
                ->count();

            // Revenue generated by this RP's guests this month
            $clientIds = \Illuminate\Support\Facades\DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('g.rp_id', $rp->id)
                ->where('e.club_id', $club->id)
                ->whereDate('g.created_at', '>=', $startOfMonth)
                ->pluck('g.client_id');

            $monthlyRevenue = 0;
            if ($clientIds->count() > 0) {
                $monthlyRevenue = \Illuminate\Support\Facades\DB::table('points_transactions as pt')
                    ->join('events as e', 'pt.event_id', '=', 'e.id')
                    ->whereIn('pt.user_id', $clientIds)
                    ->where('e.club_id', $club->id)
                    ->where('pt.transaction_type', 'purchase')
                    ->whereDate('e.date', '>=', $startOfMonth)
                    ->sum('pt.amount_spent');
            }

            $nameParts = explode(' ', $rp->name);
            $initials = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));

            $teamMembers[] = [
                'id' => $rp->id,
                'name' => $rp->name,
                'avatar' => $rp->profile_image_url ? url($rp->profile_image_url) : null,
                'initials' => $initials,
                'entries' => $monthlyEntries,
                'revenue' => (float)$monthlyRevenue
            ];
        }

        // Sort by entries descending
        usort($teamMembers, function($a, $b) {
            if ($a['entries'] == $b['entries']) {
                return $b['revenue'] <=> $a['revenue'];
            }
            return $b['entries'] <=> $a['entries'];
        });

        $myRank = 1;
        $myEntries = 0;

        foreach ($teamMembers as $index => &$item) {
            $item['rank'] = $index + 1;
            if ($item['id'] == $user->id) {
                $myRank = $item['rank'];
                $myEntries = $item['entries'];
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'teamGoal' => $teamGoal,
                'teamMembers' => $teamMembers,
                'myRank' => $myRank,
                'myEntries' => $myEntries
            ]
        ]);
    }

    public function setTeamGoal(Request $request)
    {
        $request->validate([
            'goal' => 'required|integer|min:1'
        ]);

        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
        $user = $request->user();

        if (!$clubSlug) {
            return response()->json(['status' => 'error', 'message' => 'Club slug missing'], 400);
        }

        $club = \App\Models\Club::where('slug', $clubSlug)->first();
        if (!$club) {
            return response()->json(['status' => 'error', 'message' => 'Club not found'], 404);
        }

        $access = \Illuminate\Support\Facades\DB::table('user_club_access')
            ->where('user_id', $user->id)
            ->where('club_id', $club->id)
            ->where('role', 'TEAM_LEADER')
            ->first();

        if (!$access) {
            return response()->json(['status' => 'error', 'message' => 'Access denied. Must be Team Leader.'], 403);
        }

        $startOfMonth = \Carbon\Carbon::now('Europe/Lisbon')->startOfMonth();
        
        \Illuminate\Support\Facades\DB::table('team_goals')->updateOrInsert(
            [
                'team_leader_id' => $user->id,
                'club_id' => $club->id,
                'month' => $startOfMonth->month,
                'year' => $startOfMonth->year
            ],
            [
                'goal' => $request->goal,
                'updated_at' => \Carbon\Carbon::now()
            ]
        );

        return response()->json(['status' => 'success']);
    }

    public function getOverview(Request $request)
    {
        $user = $request->user();
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
        
        $club = null;
        if ($clubSlug) {
            $club = \App\Models\Club::where('slug', $clubSlug)->first();
        }

        $now = \Carbon\Carbon::now('Europe/Lisbon');
        $startOfMonth = $now->copy()->startOfMonth();

        // Base query for RP's guestlists in this club
        $guestlistQuery = \Illuminate\Support\Facades\DB::table('guestlist as g')
            ->join('events as e', 'g.event_id', '=', 'e.id')
            ->where('g.rp_id', $user->id);

        if ($club) {
            $guestlistQuery->where('e.club_id', $club->id);
        }

        // 1. Core Metrics
        $totalGuestlistEntries = (clone $guestlistQuery)->count();
        $checkedInEntries = (clone $guestlistQuery)->where('g.status', 'checked_in')->count();
        $thisMonthEntries = (clone $guestlistQuery)->whereDate('g.created_at', '>=', $startOfMonth)->count();
        $thisMonthCheckedIn = (clone $guestlistQuery)->where('g.status', 'checked_in')->whereDate('g.created_at', '>=', $startOfMonth)->count();

        // Calculate Revenue from clients invited by this RP
        $clientIds = (clone $guestlistQuery)->pluck('g.client_id')->unique();
        $revenueQuery = \Illuminate\Support\Facades\DB::table('points_transactions as pt')
            ->whereIn('pt.user_id', $clientIds)
            ->where('pt.transaction_type', 'purchase');

        if ($club) {
            $revenueQuery->whereHasEventClub($club->id); // or join events
        }

        $totalRevenue = \Illuminate\Support\Facades\DB::table('points_transactions as pt')
            ->join('events as e', 'pt.event_id', '=', 'e.id')
            ->whereIn('pt.user_id', $clientIds)
            ->where('pt.transaction_type', 'purchase')
            ->when($club, function($q) use ($club) {
                $q->where('e.club_id', $club->id);
            })
            ->sum('pt.amount_spent');

        // Get Real Clicks from rp_profiles
        $rpProfile = \Illuminate\Support\Facades\DB::table('rp_profiles')->where('user_id', $user->id)->first();
        $realClicks = $rpProfile ? (int)$rpProfile->clicks_count : 0;

        // Conversion rate: Link Clicks -> Guestlist Entries (or Check-ins if entries > clicks)
        if ($realClicks > 0 && $totalGuestlistEntries > 0) {
            $conversionRate = min(round(($totalGuestlistEntries / $realClicks) * 100, 1), 100.0);
        } elseif ($totalGuestlistEntries > 0 && $checkedInEntries > 0) {
            $conversionRate = min(round(($checkedInEntries / $totalGuestlistEntries) * 100, 1), 100.0);
        } elseif ($totalGuestlistEntries > 0) {
            // When entries exist but clicks are 0 (e.g. added before clicks tracking), show 100% or based on checkins
            $conversionRate = $checkedInEntries > 0 ? min(round(($checkedInEntries / $totalGuestlistEntries) * 100, 1), 100.0) : 100.0;
        } else {
            $conversionRate = 0.0;
        }

        // 2. Trend for 7, 30, 90 days (Grouped by the date the person joined the guestlist)
        $ranges = [7, 30, 90];
        $performanceGraphs = [];

        foreach ($ranges as $days) {
            $startDate = $now->copy()->subDays($days - 1)->startOfDay();
            
            // Fetch raw counts grouped by date joined (g.created_at)
            $countsByDate = (clone $guestlistQuery)
                ->where('g.created_at', '>=', $startDate)
                ->select(\Illuminate\Support\Facades\DB::raw('DATE(g.created_at) as join_date'), \Illuminate\Support\Facades\DB::raw('COUNT(*) as total'))
                ->groupBy('join_date')
                ->pluck('total', 'join_date')
                ->toArray();

            $dayData = [];
            for ($i = 0; $i < $days; $i++) {
                $dateObj = $startDate->copy()->addDays($i);
                $dateKey = $dateObj->format('Y-m-d');
                $label = $days === 7 ? $dateObj->translatedFormat('D') : $dateObj->format('d/m');
                
                $dayData[] = [
                    'date' => $label,
                    'fullDate' => $dateKey,
                    'entries' => isset($countsByDate[$dateKey]) ? (int)$countsByDate[$dateKey] : 0,
                ];
            }
            $performanceGraphs[(string)$days] = $dayData;
        }

        // 3. Dynamic Weekly Progress in Current Month (Starting from Day 1, by join date g.created_at)
        $weeklyData = [];
        $monthDays = $now->daysInMonth;
        $monthShort = $now->translatedFormat('M');
        $monthName = $now->translatedFormat('F Y');
        $totalWeeks = ceil($monthDays / 7);

        for ($w = 1; $w <= $totalWeeks; $w++) {
            $startDay = ($w - 1) * 7 + 1;
            $endDay = min($w * 7, $monthDays);
            
            $wStart = $startOfMonth->copy()->day($startDay)->startOfDay();
            $wEnd = $startOfMonth->copy()->day($endDay)->endOfDay();

            $wEntries = (clone $guestlistQuery)
                ->whereBetween('g.created_at', [$wStart->toDateTimeString(), $wEnd->toDateTimeString()])
                ->count();

            $isCurrent = ($now->day >= $startDay && $now->day <= $endDay);
            $isPast = ($now->day > $endDay);

            $weeklyData[] = [
                'weekNumber' => $w,
                'week' => "Semana {$w}",
                'dateRange' => "{$startDay} - {$endDay} {$monthShort}",
                'entries' => (int)$wEntries,
                'isCurrent' => $isCurrent,
                'isPast' => $isPast
            ];
        }

        // 4. Dynamic Achievements
        $achievements = [];
        if ($totalGuestlistEntries >= 100) {
            $achievements[] = [
                'id' => 'century',
                'title' => 'Top Performer (100+ Entradas)',
                'description' => 'Ultrapassaste a marca das 100 entradas registadas',
                'icon' => '🏆',
                'unlocked' => true,
            ];
        } elseif ($totalGuestlistEntries >= 25) {
            $achievements[] = [
                'id' => 'rising',
                'title' => 'Promotor em Ascensão',
                'description' => 'Mais de 25 convidados adicionados à guestlist',
                'icon' => '⚡',
                'unlocked' => true,
            ];
        } else {
            $achievements[] = [
                'id' => 'starter',
                'title' => 'Primeiros Passos',
                'description' => 'Começa a convidar pessoas para desbloquear troféus',
                'icon' => '🌟',
                'unlocked' => true,
            ];
        }

        if ($checkedInEntries > 0) {
            $achievements[] = [
                'id' => 'streak',
                'title' => 'Hot Streak',
                'description' => "{$checkedInEntries} convidados confirmados na porta",
                'icon' => '🔥',
                'unlocked' => true,
            ];
        }

        if ($totalRevenue > 500) {
            $achievements[] = [
                'id' => 'vip_rev',
                'title' => 'VIP Club Generator',
                'description' => 'Mais de €500 gerados em consumos no clube',
                'icon' => '⭐',
                'unlocked' => true,
            ];
        } else {
            $achievements[] = [
                'id' => 'vip_status',
                'title' => 'Nível RP Ativo',
                'description' => 'Acesso total aos eventos e campanhas ativas',
                'icon' => '🎯',
                'unlocked' => true,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'name' => $user->name,
                'stats' => [
                    'clicks' => $realClicks,
                    'guestlistEntries' => $totalGuestlistEntries,
                    'thisMonthEntries' => $thisMonthEntries,
                    'checkedInEntries' => $checkedInEntries,
                    'revenue' => (float)$totalRevenue,
                    'conversionRate' => $conversionRate
                ],
                'performanceGraphs' => $performanceGraphs,
                'monthName' => ucfirst($monthName),
                'weeklyProgress' => $weeklyData,
                'achievements' => $achievements
            ]
        ]);
    }

    public function getChallenges(Request $request)
    {
        $user = $request->user();
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;

        $club = null;
        if ($clubSlug) {
            $club = \App\Models\Club::where('slug', $clubSlug)->first();
        }

        if (!$club) {
            // Find first club user has access to
            $userClub = \Illuminate\Support\Facades\DB::table('user_club_access')
                ->where('user_id', $user->id)
                ->first();
            if ($userClub) {
                $club = \App\Models\Club::find($userClub->club_id);
            }
        }

        if (!$club) {
            return response()->json([
                'status' => 'success',
                'data' => []
            ]);
        }

        $challenges = \App\Models\RpChallenge::where('club_id', $club->id)
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate current progress for each challenge for this RP based on the challenge start_date & end_date
        $formatted = $challenges->map(function($ch) use ($user, $club) {
            $startDate = $ch->start_date 
                ? \Carbon\Carbon::parse($ch->start_date)->startOfDay() 
                : ($ch->created_at ? $ch->created_at->startOfDay() : \Carbon\Carbon::now('Europe/Lisbon')->startOfMonth());

            $endDate = $ch->end_date 
                ? \Carbon\Carbon::parse($ch->end_date)->endOfDay() 
                : null;

            $query = \Illuminate\Support\Facades\DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('g.rp_id', $user->id)
                ->where('e.club_id', $club->id)
                ->where('g.status', 'checked_in')
                ->where(function($q) use ($startDate, $endDate) {
                    $q->where(function($sq) use ($startDate, $endDate) {
                        $sq->whereNotNull('g.checked_in_at')
                           ->where('g.checked_in_at', '>=', $startDate);
                        if ($endDate) {
                            $sq->where('g.checked_in_at', '<=', $endDate);
                        }
                    })->orWhere(function($sq) use ($startDate, $endDate) {
                        $sq->whereNull('g.checked_in_at')
                           ->where('g.created_at', '>=', $startDate);
                        if ($endDate) {
                            $sq->where('g.created_at', '<=', $endDate);
                        }
                    });
                });

            $rpEntries = $query->count();

            return [
                'id' => $ch->id,
                'name' => $ch->title,
                'target' => (int)$ch->target,
                'current' => min($rpEntries, (int)$ch->target),
                'reward' => $ch->reward,
                'startDate' => $ch->start_date ? \Carbon\Carbon::parse($ch->start_date)->translatedFormat('d M, Y') : ($ch->created_at ? $ch->created_at->translatedFormat('d M, Y') : ''),
                'endDate' => $ch->end_date ? \Carbon\Carbon::parse($ch->end_date)->translatedFormat('d M, Y') : 'Sem data',
                'status' => $ch->status
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    public function createChallenge(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'target' => 'required|integer|min:1',
            'reward' => 'required|string|max:150',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $user = $request->user();
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;

        $club = null;
        if ($clubSlug) {
            $club = \App\Models\Club::where('slug', $clubSlug)->first();
        }

        if (!$club) {
            $userClub = \Illuminate\Support\Facades\DB::table('user_club_access')
                ->where('user_id', $user->id)
                ->first();
            if ($userClub) {
                $club = \App\Models\Club::find($userClub->club_id);
            }
        }

        if (!$club) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado'], 404);
        }

        $challenge = \App\Models\RpChallenge::create([
            'club_id' => $club->id,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'target' => $validated['target'],
            'reward' => $validated['reward'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'status' => 'active'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Desafio criado com sucesso!',
            'data' => $challenge
        ]);
    }

    public function deleteChallenge(Request $request, $id)
    {
        $challenge = \App\Models\RpChallenge::find($id);
        if ($challenge) {
            $challenge->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Desafio removido com sucesso!'
        ]);
    }

    public function sendTeamMessage(Request $request)
    {
        $validated = $request->validate([
            'recipient_id' => 'required|integer|exists:users,id',
            'message' => 'required|string|min:1|max:1000'
        ]);

        $sender = $request->user();
        $recipient = \App\Models\User::findOrFail($validated['recipient_id']);

        $senderProfile = \Illuminate\Support\Facades\DB::table('rp_profiles')->where('user_id', $sender->id)->first();
        $avatar = $senderProfile && $senderProfile->profile_image_url ? url($senderProfile->profile_image_url) : null;

        $recipient->notify(new \App\Notifications\TeamMessageNotification(
            $sender->id,
            $sender->name,
            $validated['message'],
            $avatar
        ));

        return response()->json([
            'status' => 'success',
            'message' => 'Notificação enviada com sucesso!'
        ]);
    }
}


