<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Club;

class RpPublicController extends Controller
{
    public function getPublicProfile(Request $request, $username)
    {
        $cacheKey = "rp_public_profile_{$username}";

        $profileData = \Illuminate\Support\Facades\Cache::remember($cacheKey, 60, function () use ($username) {
            // 1. Get user profile
            $profile = DB::table('users as u')
                ->join('rp_profiles as rp', 'u.id', '=', 'rp.user_id')
                ->where('rp.username', $username)
                ->where('rp.is_public', 1)
                ->select('u.id', 'u.name', 'u.email', 'rp.username', 'rp.bio', 'rp.instagram', 'rp.profile_image_url')
                ->first();

            if (!$profile) {
                return null;
            }

            $rpUserId = $profile->id;

            // 2. Get ratings stats
            $ratingStats = DB::table('rp_reviews')
                ->where('rp_user_id', $rpUserId)
                ->select(
                    DB::raw('COALESCE(AVG(rating), 0) as avg_rating'),
                    DB::raw('COUNT(*) as review_count')
                )
                ->first();

            // 3. Get clubs RP has access to
            $clubs = DB::table('clubs as c')
                ->join('user_club_access as uca', 'c.id', '=', 'uca.club_id')
                ->where('uca.user_id', $rpUserId)
                ->whereIn('uca.role', ['RP', 'TEAM_LEADER'])
                ->where('c.is_active', 1)
                ->select('c.id', 'c.name', 'c.slug', 'c.location')
                ->get();

            $allEvents = [];
            $totalGuestsCount = 0;
            $totalEventsCount = 0;

            foreach ($clubs as $club) {
                // Get upcoming events for this RP in this club
                $clubEvents = DB::table('events as e')
                    ->join('rp_profile_events as rpe', 'e.id', '=', 'rpe.event_id')
                    ->where('rpe.rp_user_id', $rpUserId)
                    ->where('e.club_id', $club->id)
                    ->whereIn('e.status', ['upcoming', 'ongoing'])
                    ->where('e.date', '>=', now()->format('Y-m-d'))
                    ->orderBy('e.date', 'asc')
                    ->orderBy('e.start_time', 'asc')
                    ->select('e.id', 'e.name', 'e.date', 'e.start_time', 'e.end_time', 'e.capacity', 'e.image_url', 'e.status')
                    ->limit(10)
                    ->get();

                foreach ($clubEvents as $event) {
                    if ($event->image_url && strpos($event->image_url, 'http') !== 0) {
                        $event->image_url = '/' . ltrim(str_replace('/api/', '', $event->image_url), '/');
                    }
                    $event->club = $club->name;
                    $event->club_slug = $club->slug;
                    $event->location = $club->location;
                    $allEvents[] = $event;
                }

                $guestCount = DB::table('guestlist as g')
                    ->join('events as e', 'e.id', '=', 'g.event_id')
                    ->where('g.rp_id', $rpUserId)
                    ->where('e.club_id', $club->id)
                    ->count();
                    
                $totalGuestsCount += $guestCount;
                
                $eventsCount = DB::table('rp_profile_events as rpe')
                    ->join('events as e', 'e.id', '=', 'rpe.event_id')
                    ->where('rpe.rp_user_id', $rpUserId)
                    ->where('e.club_id', $club->id)
                    ->count();
                    
                $totalEventsCount += $eventsCount;
            }

            return [
                'id' => $profile->id,
                'name' => $profile->name,
                'username' => $profile->username,
                'bio' => $profile->bio,
                'instagram' => $profile->instagram,
                'profile_image_url' => $profile->profile_image_url,
                'stats' => [
                    'totalEvents' => $totalEventsCount,
                    'totalGuests' => $totalGuestsCount,
                    'rating' => round((float) $ratingStats->avg_rating, 1),
                    'reviewCount' => (int) $ratingStats->review_count
                ],
                'events' => $allEvents
            ];
        });

        if (!$profileData) {
            return response()->json([
                'status' => 'error',
                'message' => 'Perfil não encontrado.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $profileData
        ]);
    }
}
