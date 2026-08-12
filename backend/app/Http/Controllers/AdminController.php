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
            'city' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'max_capacity' => 'required|integer|min:1',
            'opening_time' => 'required',
            'closing_time' => 'required',
            'contact_phone' => 'nullable|string|max:20'
        ]);

        $club->update([
            'name' => $validated['name'],
            'location' => $validated['city'] ?? $club->location,
            'address' => $validated['address'],
            'max_capacity' => $validated['max_capacity'],
            'opening_time' => $validated['opening_time'],
            'closing_time' => $validated['closing_time'],
            'contact_phone' => $validated['contact_phone']
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Configurações atualizadas com sucesso!'
        ]);
    }

    public function getNightMetrics(Request $request)
    {
        $club = $this->checkAdminAccess($request);
        $today = \Carbon\Carbon::today('Europe/Lisbon');

        // Find today's event
        $event = DB::table('events')
            ->where('club_id', $club->id)
            ->whereDate('date', $today)
            ->first();

        $capacity = $club->max_capacity ?: 1000;
        $totalEntries = 0;
        $totalRevenue = 0;
        $hourlyFlow = [];
        $demographics = ['male' => 0, 'female' => 0];
        $recentActivity = [];

        if ($event) {
            $capacity = $event->capacity ?: $capacity;

            // Total Entries (check-ins)
            $totalEntries = DB::table('guestlist')
                ->where('event_id', $event->id)
                ->where('status', 'checked_in')
                ->count();

            // Total Revenue (purchases)
            $totalRevenue = DB::table('points_transactions')
                ->where('event_id', $event->id)
                ->where('transaction_type', 'purchase')
                ->sum('amount_spent');

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
                'capacity' => $capacity,
                'total_entries' => $totalEntries,
                'total_revenue' => $totalRevenue,
                'hourly_flow' => $hourlyFlow,
                'demographics' => [
                    ['name' => 'Feminino', 'value' => $demographics['female']],
                    ['name' => 'Masculino', 'value' => $demographics['male']]
                ],
                'recent_activity' => [] // Optional: implement real activity stream if needed
            ]
        ]);
    }

    // RP Management
    public function listRps(Request $request)
    {
        $club = $this->checkAdminAccess($request);

        $users = DB::table('users as u')
            ->join('user_club_access as uca', 'u.id', '=', 'uca.user_id')
            ->leftJoin('users as tl', 'uca.team_leader_id', '=', 'tl.id')
            ->where('uca.club_id', $club->id)
            ->whereIn('uca.role', ['RP', 'TEAM_LEADER'])
            ->select('u.id', 'u.name', 'u.email', 'uca.role', 'uca.team_leader_id', 'tl.name as team_leader_name')
            ->orderBy('u.name')
            ->get();

        // Sort PHP-side: TEAM_LEADER first, then RP (avoids MySQL-specific CASE)
        $users = $users->sortBy(fn($u) => $u->role === 'TEAM_LEADER' ? 0 : 1)->values();

        $users = $users->map(function ($u) use ($club) {
            $nameParts = explode(' ', $u->name);
            $u->avatar = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));
            
            // Calculate real guests for tonight
            $guestsTonight = DB::table('guestlist as g')
                ->join('events as e', 'g.event_id', '=', 'e.id')
                ->where('e.club_id', $club->id)
                ->where('g.rp_id', $u->id)
                ->whereDate('e.date', \Carbon\Carbon::today('Europe/Lisbon'))
                ->count();
            
            $u->guestsTonight = $guestsTonight;
            $u->totalRevenue = $guestsTonight * 20;
            return $u;
        });

        return response()->json(['status' => 'success', 'data' => $users]);
    }

    public function searchClient(Request $request)
    {
        $club = $this->checkAdminAccess($request);
        $email = $request->input('email');

        if (!$email) {
            return response()->json(['status' => 'error', 'message' => 'Email é obrigatório.'], 400);
        }

        $user = DB::table('users as u')
            ->join('user_club_access as uca', 'u.id', '=', 'uca.user_id')
            ->where('uca.club_id', $club->id)
            ->where('u.email', $email)
            ->where('uca.role', 'CLIENT')
            ->select('u.id', 'u.name', 'u.email', 'uca.role')
            ->first();

        if ($user) {
            $nameParts = explode(' ', $user->name);
            $user->avatar = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));
            return response()->json(['status' => 'success', 'data' => $user]);
        }

        return response()->json(['status' => 'error', 'message' => 'Cliente não encontrado com esse email.'], 404);
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
            $manager = new ImageManager(new Driver());
            $image = $manager->decode($file->getRealPath());
            $encoded = $image->encode(new \Intervention\Image\Encoders\WebpEncoder(85));

            $filename = 'reward_' . time() . '_' . uniqid() . '.webp';
            $fullPath = "rewards/{$reward->id}/{$filename}";

            Storage::disk('public')->put($fullPath, (string) $encoded);
            $reward->update(['image_path' => 'storage/' . $fullPath]);
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
            $manager = new ImageManager(new Driver());
            $image = $manager->decode($file->getRealPath());
            $encoded = $image->encode(new \Intervention\Image\Encoders\WebpEncoder(85));

            $filename = 'reward_' . time() . '_' . uniqid() . '.webp';
            $fullPath = "rewards/{$reward->id}/{$filename}";

            Storage::disk('public')->put($fullPath, (string) $encoded);
            $reward->update(['image_path' => 'storage/' . $fullPath]);
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
