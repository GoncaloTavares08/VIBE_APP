<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Guestlist;
use App\Models\ClientProfile;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LeaderboardController extends Controller
{
    public function getLeaderboard(Request $request)
    {
        $user = $request->user();
        $sort = $request->query('sort', 'points');

        $gl = Guestlist::with('event')->where('client_id', $user->id)
            ->where('status', 'checked_in')
            ->orderBy('checked_in_at', 'desc')
            ->first();

        if (!$gl) {
            return response()->json([
                'status' => 'success',
                'data' => [],
                'message' => 'Not checked in'
            ]);
        }

        $eventId = $gl->event_id;
        $clubId = $gl->event->club_id;

        $leaderboard = \Illuminate\Support\Facades\Cache::remember("leaderboard_{$eventId}", 30, function () use ($eventId, $clubId) {
            $checkedInIds = Guestlist::where('event_id', $eventId)
                ->where('status', 'checked_in')
                ->pluck('client_id')
                ->toArray();

            if (empty($checkedInIds)) {
                return [];
            }

            $profiles = ClientProfile::with(['user', 'gallery_photos' => function ($q) {
                    $q->orderBy('photo_order');
                }])
                ->whereIn('user_id', $checkedInIds)
                ->get();

            $lb = [];

            foreach ($profiles as $profile) {
                $uid = $profile->user_id;

                if ($profile->ghost_mode == 1) {
                    continue;
                }

                $photos = $profile->gallery_photos->map(function ($p) {
                    return str_starts_with($p->photo_path, 'http') ? $p->photo_path : url('storage/' . str_replace('storage/', '', $p->photo_path));
                })->toArray();

                $profilePhoto = $profile->profile_photo_path
                    ? (str_starts_with($profile->profile_photo_path, 'http') ? $profile->profile_photo_path : url('storage/' . str_replace('storage/', '', $profile->profile_photo_path)))
                    : null;

                $age = 18;
                if ($profile->birthdate) {
                    $age = Carbon::parse($profile->birthdate)->age;
                }

                $vibes = DB::table('event_likes')
                    ->where('event_id', $eventId)
                    ->where('liked_id', $uid)
                    ->where('action', 'like')
                    ->count();

                $points = DB::table('user_club_access')
                    ->where('user_id', $uid)
                    ->where('club_id', $clubId)
                    ->value('points') ?? 0;

                $lb[] = [
                    'id' => $uid,
                    'name' => $profile->user->name ?? 'Unknown',
                    'points' => (int) $points,
                    'vibes' => (int) $vibes,
                    'instagram' => $profile->instagram ?? '',
                    'bio' => $profile->bio ?? '',
                    'age' => $age,
                    'photo' => $profilePhoto ?? ($photos[0] ?? null),
                    'photos' => $photos,
                    'rank' => 0,
                    'is_me' => false
                ];
            }
            
            return $lb;
        });

        // Add the user to the leaderboard if they have ghost mode enabled but want to see themselves
        if (!in_array($user->id, array_column($leaderboard, 'id'))) {
            $myProfile = ClientProfile::with(['user', 'gallery_photos' => function ($q) {
                $q->orderBy('photo_order');
            }])->where('user_id', $user->id)->first();
            
            if ($myProfile) {
                $photos = $myProfile->gallery_photos->map(function ($p) {
                    return str_starts_with($p->photo_path, 'http') ? $p->photo_path : url('storage/' . str_replace('storage/', '', $p->photo_path));
                })->toArray();

                $profilePhoto = $myProfile->profile_photo_path
                    ? (str_starts_with($myProfile->profile_photo_path, 'http') ? $myProfile->profile_photo_path : url('storage/' . str_replace('storage/', '', $myProfile->profile_photo_path)))
                    : null;

                $vibes = DB::table('event_likes')->where('event_id', $eventId)->where('liked_id', $user->id)->where('action', 'like')->count();
                $points = DB::table('user_club_access')->where('user_id', $user->id)->where('club_id', $clubId)->value('points') ?? 0;
                
                $leaderboard[] = [
                    'id' => $user->id,
                    'name' => $myProfile->user->name ?? 'Unknown',
                    'points' => (int) $points,
                    'vibes' => (int) $vibes,
                    'instagram' => $myProfile->instagram ?? '',
                    'bio' => $myProfile->bio ?? '',
                    'age' => $myProfile->birthdate ? Carbon::parse($myProfile->birthdate)->age : 18,
                    'photo' => $profilePhoto ?? ($photos[0] ?? null),
                    'photos' => $photos,
                    'rank' => 0,
                    'is_me' => true
                ];
            }
        }

        // Set is_me dynamically
        foreach ($leaderboard as &$entry) {
            $entry['is_me'] = ($entry['id'] == $user->id);
        }

        usort($leaderboard, function ($a, $b) use ($sort) {
            if ($sort === 'vibes') {
                $cmp = $b['vibes'] <=> $a['vibes'];
                return $cmp === 0 ? $b['points'] <=> $a['points'] : $cmp;
            }
            $cmp = $b['points'] <=> $a['points'];
            return $cmp === 0 ? $b['vibes'] <=> $a['vibes'] : $cmp;
        });

        $myEntry = null;
        foreach ($leaderboard as $i => &$p) {
            $p['rank'] = $i + 1;
            if ($p['id'] == $user->id) {
                $myEntry = $p;
            }
        }

        $top10 = array_slice($leaderboard, 0, 10);

        return response()->json([
            'status' => 'success',
            'data' => $top10,
            'my_entry' => $myEntry
        ]);
    }
}
