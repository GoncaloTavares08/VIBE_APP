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

        $manager = new ImageManager(new Driver());
        $image = $manager->decode($file->getRealPath());
        $encoded = $image->encode(new \Intervention\Image\Encoders\WebpEncoder(85));

        $datePath = date('Y/m/d');
        $filename = uniqid('rp_profile_') . '.webp';
        $fullPath = "profiles/rps/{$user->id}/{$datePath}/{$filename}";

        Storage::disk('public')->put($fullPath, (string) $encoded);
        $webPath = 'storage/' . $fullPath;

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

        $today = \Carbon\Carbon::today('Europe/Lisbon');
        $startOfMonth = \Carbon\Carbon::now('Europe/Lisbon')->startOfMonth();

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
            // Guests checked in this month
            $monthlyEntries = \Illuminate\Support\Facades\DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('g.rp_id', $rp->id)
                ->where('e.club_id', $club->id)
                ->where('g.status', 'checked_in')
                ->whereDate('e.date', '>=', $startOfMonth)
                ->count();

            // Revenue generated by this RP's guests this month
            // Find all client IDs in this RP's guestlists this month
            $clientIds = \Illuminate\Support\Facades\DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('g.rp_id', $rp->id)
                ->where('e.club_id', $club->id)
                ->where('g.status', 'checked_in')
                ->whereDate('e.date', '>=', $startOfMonth)
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

            $leaderboard[] = [
                'id' => $rp->id,
                'name' => $rp->name,
                'avatar' => $rp->profile_image_url ? url($rp->profile_image_url) : null,
                'initials' => $initials,
                'entries' => $monthlyEntries,
                'revenue' => (float)$monthlyRevenue,
                // Simple trend logic for now
                'trend' => $monthlyEntries > 10 ? 'up' : 'down'
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
            // Guests checked in this month
            $monthlyEntries = \Illuminate\Support\Facades\DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('g.rp_id', $rp->id)
                ->where('e.club_id', $club->id)
                ->where('g.status', 'checked_in')
                ->whereDate('e.date', '>=', $startOfMonth)
                ->count();

            // Revenue generated by this RP's guests this month
            $clientIds = \Illuminate\Support\Facades\DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('g.rp_id', $rp->id)
                ->where('e.club_id', $club->id)
                ->where('g.status', 'checked_in')
                ->whereDate('e.date', '>=', $startOfMonth)
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
}
