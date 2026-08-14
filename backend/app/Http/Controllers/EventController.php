<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Carbon\Carbon;

class EventController extends Controller
{
    private function autoUpdateStatuses()
    {
        $now = Carbon::now('Europe/Lisbon');

        // Upcoming -> Ongoing
        $upcomingEvents = Event::where('status', 'upcoming')->get();
        foreach ($upcomingEvents as $event) {
            $startStr = $event->date . ' ' . $event->start_time;
            $startObj = Carbon::parse($startStr, 'Europe/Lisbon');
            if ($now->gte($startObj)) {
                $event->update(['status' => 'ongoing']);
            }
        }

        // Ongoing -> Completed (handling cross-midnight)
        $ongoingEvents = Event::where('status', 'ongoing')->get();
        foreach ($ongoingEvents as $event) {
            $endStr = $event->date . ' ' . $event->end_time;
            $endObj = Carbon::parse($endStr, 'Europe/Lisbon');
            if ($event->end_time < $event->start_time) {
                $endObj->addDay();
            }
            
            if ($now->gte($endObj)) {
                $event->update(['status' => 'completed']);
            }
        }
    }

    public function index(Request $request)
    {
        $this->autoUpdateStatuses();

        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : 'all';

        $query = Event::with('club')->orderBy('date', 'desc')->orderBy('start_time', 'desc');

        if ($clubSlug !== 'all') {
            $query->whereHas('club', function ($q) use ($clubSlug) {
                $q->where('slug', $clubSlug);
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $events = $query->get();

        // Calculate real per-event stats
        $totalEntriesClub = 0;
        $totalGuestlistClub = 0;
        $totalBarRevenueClub = 0.0;
        $occupancySum = 0;
        $occupancyCount = 0;
        $ongoingCount = 0;
        $upcomingCount = 0;
        $completedCount = 0;

        $enrichedEvents = $events->map(function ($event) use (
            &$totalEntriesClub,
            &$totalGuestlistClub,
            &$totalBarRevenueClub,
            &$occupancySum,
            &$occupancyCount,
            &$ongoingCount,
            &$upcomingCount,
            &$completedCount
        ) {
            if ($event->status === 'ongoing') $ongoingCount++;
            elseif ($event->status === 'upcoming') $upcomingCount++;
            elseif ($event->status === 'completed') $completedCount++;

            $guestlistCount = \Illuminate\Support\Facades\DB::table('guestlist')
                ->where('event_id', $event->id)
                ->count();

            $checkedInCount = \Illuminate\Support\Facades\DB::table('guestlist')
                ->where('event_id', $event->id)
                ->where('status', 'checked_in')
                ->count();

            $barRevenue = (float) \Illuminate\Support\Facades\DB::table('points_transactions')
                ->where('event_id', $event->id)
                ->where('transaction_type', 'purchase')
                ->sum('amount_spent');

            $occupancyPercent = $event->capacity > 0 ? (int) round(($checkedInCount / $event->capacity) * 100) : 0;

            $totalEntriesClub += $checkedInCount;
            $totalGuestlistClub += $guestlistCount;
            $totalBarRevenueClub += $barRevenue;

            if ($event->capacity > 0 && in_array($event->status, ['completed', 'ongoing'])) {
                $occupancySum += $occupancyPercent;
                $occupancyCount++;
            }

            $arr = $event->toArray();
            $arr['guestlist_count'] = $guestlistCount;
            $arr['checked_in_count'] = $checkedInCount;
            $arr['bar_revenue'] = round($barRevenue, 2);
            $arr['occupancy_percent'] = min($occupancyPercent, 100);

            return $arr;
        });

        $now = Carbon::now('Europe/Lisbon');
        $today = $now->copy()->startOfDay();

        // Identify most recent past or ongoing event
        $latestEvent = $events->first(fn($e) => $e->status === 'ongoing')
            ?: $events->filter(fn($e) => Carbon::parse($e->date)->lte($today))->sortByDesc('date')->first()
            ?: $events->first();

        // Identify next upcoming event
        $nextEvent = $events->filter(fn($e) => $e->status === 'upcoming' && Carbon::parse($e->date)->gte($today))
            ->sortBy('date')
            ->first();

        $lastEventEntries = 0;
        $lastEventRevenue = 0.0;
        $lastEventOccupancy = 0;

        if ($latestEvent) {
            $lastEventEntries = (int) \Illuminate\Support\Facades\DB::table('guestlist')
                ->where('event_id', $latestEvent->id)
                ->where('status', 'checked_in')
                ->count();

            $lastEventRevenue = (float) \Illuminate\Support\Facades\DB::table('points_transactions')
                ->where('event_id', $latestEvent->id)
                ->where('transaction_type', 'purchase')
                ->sum('amount_spent');

            $lastEventOccupancy = $latestEvent->capacity > 0 ? (int) round(($lastEventEntries / $latestEvent->capacity) * 100) : 0;
        }

        $avgOccupancy = $occupancyCount > 0 ? (int) round($occupancySum / $occupancyCount) : 0;
        $avgEntriesPerEvent = $occupancyCount > 0 ? (int) round($totalEntriesClub / $occupancyCount) : 0;

        return response()->json([
            'status' => 'success',
            'data' => $enrichedEvents,
            'stats' => [
                'upcoming_count' => $upcomingCount,
                'ongoing_count' => $ongoingCount,
                'completed_count' => $completedCount,
                'total_events' => $events->count(),
                'total_entries' => $totalEntriesClub,
                'total_guestlist' => $totalGuestlistClub,
                'total_bar_revenue' => round($totalBarRevenueClub, 2),
                'average_occupancy' => $avgOccupancy,
                'avg_entries_per_event' => $avgEntriesPerEvent,
                'last_event_name' => $latestEvent ? $latestEvent->name : null,
                'last_event_date' => $latestEvent ? $latestEvent->date : null,
                'last_event_entries' => $lastEventEntries,
                'last_event_bar_revenue' => round($lastEventRevenue, 2),
                'last_event_occupancy' => $lastEventOccupancy,
                'next_event_name' => $nextEvent ? $nextEvent->name : null,
                'next_event_date' => $nextEvent ? $nextEvent->date : null,
            ]
        ]);
    }

    public function show($id)
    {
        $this->autoUpdateStatuses();

        $event = \Illuminate\Support\Facades\Cache::remember("event_{$id}", 60, function () use ($id) {
            $model = Event::find($id);
            return $model ? $model->toArray() : null;
        });

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Evento não encontrado.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $event
        ]);
    }

    public function getEventRps($id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Evento não encontrado.'
            ], 404);
        }

        $rps = \Illuminate\Support\Facades\DB::table('rp_profile_events as rpe')
            ->join('users as u', 'rpe.rp_user_id', '=', 'u.id')
            ->join('user_club_access as uca', function($join) use ($event) {
                $join->on('u.id', '=', 'uca.user_id')
                     ->where('uca.club_id', '=', $event->club_id)
                     ->where('uca.role', '=', 'RP');
            })
            ->join('rp_profiles as p', 'u.id', '=', 'p.user_id')
            ->where('rpe.event_id', $event->id)
            ->select(
                'u.id as user_id',
                'u.name',
                'p.username',
                'p.profile_image_url as avatar',
                'uca.points'
            )
            ->orderBy('uca.points', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $rps
        ]);
    }

    public function getEventGuestlistSummary($id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Evento não encontrado.'
            ], 404);
        }

        // Total people on guestlist for this event
        $totalCount = \App\Models\Guestlist::where('event_id', $event->id)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->count();

        // Get up to 5 random profile photos of attendees (excluding ghost mode)
        $attendeePhotos = \Illuminate\Support\Facades\DB::table('guestlist as g')
            ->join('client_profiles as cp', 'g.client_id', '=', 'cp.user_id')
            ->join('client_profile_photos as cpp', 'cp.id', '=', 'cpp.client_profile_id')
            ->where('g.event_id', $event->id)
            ->whereIn('g.status', ['confirmed', 'checked_in'])
            ->where(function($q) {
                $q->where('cp.ghost_mode', 0)->orWhereNull('cp.ghost_mode');
            })
            ->where('cpp.photo_order', 0)
            ->inRandomOrder()
            ->limit(5)
            ->pluck('cpp.photo_path')
            ->map(function ($path) {
                return str_starts_with($path, 'http') ? $path : url('storage/' . str_replace('storage/', '', $path));
            })
            ->toArray();

        // Fallback photos if database is empty for demo purposes, so the UI doesn't look broken
        if (empty($attendeePhotos) && $totalCount > 0) {
            $attendeePhotos = [
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
            ];
            // Only take up to $totalCount fallback photos
            $attendeePhotos = array_slice($attendeePhotos, 0, min($totalCount, 5));
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_count' => max($totalCount, 0),
                'photos' => $attendeePhotos
            ]
        ]);
    }

    public function uploadBanner(Request $request)
    {
        $request->validate([
            'banner' => 'required|image|max:10240' // up to 10MB
        ]);

        $file = $request->file('banner');
        $datePath = date('Y/m/d');
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = uniqid('event_banner_') . '.' . $ext;
        $fullPath = "events/banners/{$datePath}/{$filename}";

        \Illuminate\Support\Facades\Storage::disk('public')->put($fullPath, file_get_contents($file->getRealPath()));
        $webPath = 'storage/' . $fullPath;

        return response()->json([
            'status' => 'success',
            'image_url' => $webPath,
            'full_url' => url($webPath)
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'capacity' => 'required|integer',
            'organizer_name' => 'nullable|string',
            'status' => 'nullable|in:upcoming,ongoing,completed,cancelled',
            'image_url' => 'nullable|string'
        ]);

        $validated['created_by'] = $request->user()->id ?? null;
        
        if ($request->hasHeader('X-Client-ID')) {
            $rawSlug = $request->header('X-Client-ID');
            $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
            if ($clubSlug) {
                $club = \App\Models\Club::where('slug', $clubSlug)->first();
                if ($club) {
                    $validated['club_id'] = $club->id;
                }
            }
        }

        if (empty($validated['club_id'])) {
            return response()->json(['status' => 'error', 'message' => 'Club ID é obrigatório para criar um evento.'], 400);
        }

        $event = Event::create($validated);
        \Illuminate\Support\Facades\Cache::flush();

        return response()->json([
            'status' => 'success',
            'message' => 'Evento criado com sucesso!',
            'event_id' => $event->id
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Evento não encontrado.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'date' => 'sometimes|date',
            'start_time' => 'sometimes',
            'end_time' => 'sometimes',
            'capacity' => 'sometimes|integer',
            'organizer_name' => 'nullable|string',
            'status' => 'nullable|in:upcoming,ongoing,completed,cancelled',
            'image_url' => 'nullable|string'
        ]);

        $event->update($validated);
        \Illuminate\Support\Facades\Cache::flush();

        return response()->json([
            'status' => 'success',
            'message' => 'Evento atualizado com sucesso!'
        ]);
    }

    public function destroy($id)
    {
        $event = Event::find($id);

        if (!$event) {
            return response()->json([
                'status' => 'error',
                'message' => 'Evento não encontrado.'
            ], 404);
        }

        $event->delete();
        \Illuminate\Support\Facades\Cache::flush();

        return response()->json([
            'status' => 'success',
            'message' => 'Evento eliminado com sucesso!'
        ]);
    }
}
