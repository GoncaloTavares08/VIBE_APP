<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Guestlist;
use App\Models\ClientProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class NetworkingController extends Controller
{
    private function getCurrentEventId($userId)
    {
        $now = Carbon::now('Europe/Lisbon');

        $gl = Guestlist::with('event')
            ->where('client_id', $userId)
            ->where('status', 'checked_in')
            ->orderBy('checked_in_at', 'desc')
            ->get()
            ->first(function ($guestlist) use ($now) {
                $event = $guestlist->event;
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
            });

        return $gl ? $gl->event_id : null;
    }

    private function resolvePhotoUrl($path)
    {
        if (!$path) return null;
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            if (preg_match('#https?://(localhost|127\.0\.0\.1):8000/(.*)#', $path, $matches)) {
                return '/' . $matches[2];
            }
            return $path;
        }
        $cleanPath = ltrim(str_replace('storage/', '', $path), '/');
        return '/storage/' . $cleanPath;
    }

    public function whoIsHere(Request $request)
    {
        $user = $request->user();
        $eventId = $this->getCurrentEventId($user->id);

        if (!$eventId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Não estás em nenhuma festa no momento',
                'data' => []
            ]);
        }

        $myProfile = ClientProfile::where('user_id', $user->id)->first();
        $myGender = $myProfile->gender ?? null;
        $myPreference = $myProfile->gender_preference ?? 'everyone';

        $alreadySwiped = DB::table('event_likes')
            ->where('event_id', $eventId)
            ->where('liker_id', $user->id)
            ->pluck('liked_id')
            ->toArray();

        $allCheckedInClients = \Illuminate\Support\Facades\Cache::remember("event:{$eventId}:checked_in_clients", 30, function () use ($eventId) {
            return Guestlist::where('event_id', $eventId)
                ->where('status', 'checked_in')
                ->pluck('client_id')
                ->toArray();
        });
        
        $checkedInClients = array_filter($allCheckedInClients, function($id) use ($user) {
            return $id !== $user->id;
        });

        $likers = DB::table('event_likes')
            ->where('event_id', $eventId)
            ->where('liked_id', $user->id)
            ->where('action', 'like')
            ->pluck('liker_id')
            ->toArray();

        $allCandidates = array_unique(array_merge($checkedInClients, $likers));
        $candidates = array_values(array_diff($allCandidates, $alreadySwiped));

        if (empty($candidates)) {
            return response()->json([
                'status' => 'success',
                'event_id' => $eventId,
                'total_people' => 0,
                'data' => []
            ]);
        }

        foreach ($candidates as $cId) {
            ClientProfile::firstOrCreate(
                ['user_id' => $cId],
                [
                    'bio' => 'A curtir a noite no VIBE! 🎉',
                    'gender' => 'everyone',
                    'gender_preference' => 'everyone',
                    'ghost_mode' => 0
                ]
            );
        }

        $profiles = ClientProfile::with(['user', 'gallery_photos' => function ($query) {
            $query->orderBy('photo_order');
        }])
        ->whereIn('user_id', $candidates)
        ->where(function ($query) {
            $query->where('ghost_mode', 0)->orWhereNull('ghost_mode');
        })
        ->get();

        $result = [];
        foreach ($profiles as $profile) {
            $candidateGender = $profile->gender ?? null;
            $candidatePreference = $profile->gender_preference ?? 'everyone';

            if ($myPreference !== 'everyone' && $candidateGender && $candidateGender !== $myPreference) {
                continue;
            }

            if ($candidatePreference !== 'everyone' && $myGender && $myGender !== $candidatePreference) {
                continue;
            }

            $photos = $profile->gallery_photos->map(function ($p) {
                return $this->resolvePhotoUrl($p->photo_path);
            })->filter()->values()->toArray();

            if (empty($photos) && !empty($profile->profile_photo_path)) {
                $resolved = $this->resolvePhotoUrl($profile->profile_photo_path);
                if ($resolved) {
                    $photos = [$resolved];
                }
            }

            // Exige obrigatoriamente que o utilizador tenha foto: se não tiver, NÃO aparece no radar
            if (empty($photos)) {
                continue;
            }

            $age = 18;
            if ($profile->birthdate) {
                $age = Carbon::parse($profile->birthdate)->age;
            }

            $vibes = DB::table('event_likes')
                ->where('liked_id', $profile->user_id)
                ->where('action', 'like')
                ->count();

            $result[] = [
                'id' => $profile->user_id,
                'name' => $profile->user->name,
                'age' => $age,
                'bio' => $profile->bio ?? 'Adoro boas vibes ✨',
                'vibes' => $vibes,
                'instagram' => $profile->instagram ?? '',
                'photos' => $photos,
            ];
        }

        $likersFinal = [];
        $othersFinal = [];

        foreach ($result as $person) {
            if (in_array($person['id'], $likers)) {
                $likersFinal[] = $person;
            } else {
                $othersFinal[] = $person;
            }
        }

        shuffle($likersFinal);
        shuffle($othersFinal);

        $merged = array_merge($likersFinal, $othersFinal);

        return response()->json([
            'status' => 'success',
            'event_id' => $eventId,
            'total_people' => count($merged),
            'data' => $merged
        ]);
    }

    public function swipe(Request $request)
    {
        $validated = $request->validate([
            'liked_id' => 'required|integer',
            'action' => 'required|in:like,pass'
        ]);

        $user = $request->user();
        $eventId = $this->getCurrentEventId($user->id);

        if (!$eventId) {
            return response()->json(['status' => 'error', 'message' => 'Não estás em nenhum evento'], 400);
        }

        DB::table('event_likes')->updateOrInsert(
            ['event_id' => $eventId, 'liker_id' => $user->id, 'liked_id' => $validated['liked_id']],
            ['action' => $validated['action'], 'is_match' => false, 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()]
        );

        $isMatch = false;
        $matchedUser = null;

        if ($validated['action'] === 'like') {
            $mutual = DB::table('event_likes')
                ->where('event_id', $eventId)
                ->where('liker_id', $validated['liked_id'])
                ->where('liked_id', $user->id)
                ->where('action', 'like')
                ->first();

            if ($mutual) {
                $isMatch = true;
                DB::table('event_likes')->where('event_id', $eventId)
                    ->whereIn('liker_id', [$user->id, $validated['liked_id']])
                    ->whereIn('liked_id', [$user->id, $validated['liked_id']])
                    ->update(['is_match' => 1]);

                $p = ClientProfile::with('user')->firstOrCreate(['user_id' => $validated['liked_id']]);
                $matchedUser = [
                    'id' => $p->user_id,
                    'name' => $p->user->name,
                    'instagram' => $p->instagram,
                    'bio' => $p->bio
                ];

                // Notify both users via Database Notifications for Smart Polling
                $userA = User::find($user->id);
                $userB = User::find($validated['liked_id']);
                
                if ($userB) {
                    $userB->notify(new \App\Notifications\MatchNotification($userA->id, $userA->name, $eventId));
                }
                if ($userA) {
                    $userA->notify(new \App\Notifications\MatchNotification($userB->id, $userB->name, $eventId));
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'is_match' => $isMatch,
            'matched_user' => $matchedUser
        ]);
    }

    public function myMatches(Request $request)
    {
        $user = $request->user();
        $eventId = $this->getCurrentEventId($user->id);

        if (!$eventId) {
            return response()->json(['status' => 'success', 'matches' => []]);
        }

        $matchedIds = DB::table('event_likes')
            ->where('event_id', $eventId)
            ->where('liker_id', $user->id)
            ->where('is_match', 1)
            ->pluck('liked_id');

        $profiles = ClientProfile::with(['user', 'gallery_photos' => function($q) {
            $q->orderBy('photo_order');
        }])->whereIn('user_id', $matchedIds)->get();

        $matches = [];
        foreach ($profiles as $profile) {
            $photos = $profile->gallery_photos->map(function ($p) {
                return $this->resolvePhotoUrl($p->photo_path);
            })->filter()->values()->toArray();

            if (empty($photos) && !empty($profile->profile_photo_path)) {
                $resolved = $this->resolvePhotoUrl($profile->profile_photo_path);
                if ($resolved) {
                    $photos = [$resolved];
                }
            }

            $vibes = DB::table('event_likes')
                ->where('liked_id', $profile->user_id)
                ->where('action', 'like')
                ->count();

            $age = 18;
            if ($profile->birthdate) {
                $age = Carbon::parse($profile->birthdate)->age;
            }

            $matches[] = [
                'id' => $profile->user_id,
                'name' => $profile->user->name,
                'instagram' => $profile->instagram,
                'bio' => $profile->bio,
                'age' => $age,
                'vibes' => $vibes,
                'photos' => $photos
            ];
        }

        return response()->json([
            'status' => 'success',
            'matches' => $matches
        ]);
    }

    public function checkUpdates(Request $request)
    {
        $user = $request->user();
        
        $unreadNotifications = $user->unreadNotifications()
            ->where('type', \App\Notifications\MatchNotification::class)
            ->get();

        $hasMatches = $unreadNotifications->isNotEmpty();
        $newMatchData = null;

        if ($hasMatches) {
            $latest = $unreadNotifications->first();
            $newMatchData = $latest->data;
            // Mark them as read so we don't notify again
            $unreadNotifications->markAsRead();
        }

        return response()->json([
            'status' => 'success',
            'has_new_matches' => $hasMatches,
            'match_data' => $newMatchData
        ]);
    }
}
