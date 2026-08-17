<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\Club;
use App\Models\UserClubAccess;
use App\Models\Event;

class SuperAdminController extends Controller
{
    private function checkSuperAdmin(Request $request)
    {
        $this->authorize('superadmin');
    }

    public function overview(Request $request)
    {
        $this->checkSuperAdmin($request);

        $totalClubs = Club::count();
        $activeClubs = Club::where('is_active', 1)->count();
        $totalNetworkCapacity = (int) Club::where('is_active', 1)->sum('max_capacity');

        $totalUsers = User::count();
        $superAdminsCount = User::where('is_superadmin', 1)->count();
        $newUsers30d = User::where('created_at', '>=', now()->subDays(30))->count();

        $totalAdmins = DB::table('user_club_access')
            ->where('role', 'ADMIN')
            ->distinct('user_id')
            ->count('user_id');

        $totalStaff = DB::table('user_club_access')
            ->where('role', 'STAFF')
            ->distinct('user_id')
            ->count('user_id');

        $totalRps = DB::table('user_club_access')
            ->whereIn('role', ['RP', 'TEAM_LEADER'])
            ->distinct('user_id')
            ->count('user_id');

        $totalEvents = Event::count();
        $activeEvents = Event::whereIn('status', ['ongoing', 'upcoming'])->count();

        $clubBreakdown = Club::select('id', 'name', 'slug', 'is_active', 'location', 'city', 'max_capacity')
            ->withCount(['events'])
            ->get()
            ->map(function ($club) {
                $adminsCount = DB::table('user_club_access')
                    ->where('club_id', $club->id)
                    ->where('role', 'ADMIN')
                    ->count();

                $staffCount = DB::table('user_club_access')
                    ->where('club_id', $club->id)
                    ->where('role', 'STAFF')
                    ->count();

                $rpsCount = DB::table('user_club_access')
                    ->where('club_id', $club->id)
                    ->whereIn('role', ['RP', 'TEAM_LEADER'])
                    ->count();

                return [
                    'id' => $club->id,
                    'name' => $club->name,
                    'slug' => $club->slug,
                    'is_active' => (bool) $club->is_active,
                    'location' => $club->location,
                    'city' => $club->city,
                    'max_capacity' => $club->max_capacity,
                    'events_count' => $club->events_count,
                    'admins_count' => $adminsCount,
                    'staff_count' => $staffCount,
                    'rps_count' => $rpsCount,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_clubs' => $totalClubs,
                'active_clubs' => $activeClubs,
                'network_capacity' => $totalNetworkCapacity,
                'total_users' => $totalUsers,
                'new_users_30d' => $newUsers30d,
                'superadmins_count' => $superAdminsCount,
                'total_admins' => $totalAdmins,
                'total_staff' => $totalStaff,
                'total_rps' => $totalRps,
                'total_events' => $totalEvents,
                'active_events' => $activeEvents,
                'clubs' => $clubBreakdown,
            ]
        ]);
    }

    public function getClubs(Request $request)
    {
        $this->checkSuperAdmin($request);

        $clubs = Club::orderBy('created_at', 'desc')->get()->map(function ($club) {
            $admins = DB::table('user_club_access as uca')
                ->join('users as u', 'uca.user_id', '=', 'u.id')
                ->where('uca.club_id', $club->id)
                ->where('uca.role', 'ADMIN')
                ->select('u.id', 'u.name', 'u.email')
                ->get();

            $staffCount = DB::table('user_club_access')
                ->where('club_id', $club->id)
                ->where('role', 'STAFF')
                ->count();

            $rpCount = DB::table('user_club_access')
                ->where('club_id', $club->id)
                ->whereIn('role', ['RP', 'TEAM_LEADER'])
                ->count();

            $eventCount = DB::table('events')->where('club_id', $club->id)->count();

            $revenue = (float) DB::table('points_transactions as pt')
                ->join('events as e', 'pt.event_id', '=', 'e.id')
                ->where('e.club_id', $club->id)
                ->where('pt.transaction_type', 'purchase')
                ->sum('pt.amount_spent');

            return [
                'id' => $club->id,
                'name' => $club->name,
                'logo_url' => $club->logo_url,
                'slug' => $club->slug,
                'location' => $club->location,
                'address' => $club->address,
                'city' => $club->city,
                'max_capacity' => $club->max_capacity,
                'opening_time' => $club->opening_time,
                'closing_time' => $club->closing_time,
                'contact_phone' => $club->contact_phone,
                'is_active' => (bool) $club->is_active,
                'created_at' => $club->created_at,
                'admins' => $admins,
                'staff_count' => $staffCount,
                'rp_count' => $rpCount,
                'event_count' => $eventCount,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $clubs
        ]);
    }

    public function createClub(Request $request)
    {
        $this->checkSuperAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo_url' => 'nullable|string|max:1000',
            'logo_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,svg,gif|max:10240',
            'slug' => 'required|string|max:100|unique:clubs,slug',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'max_capacity' => 'required|integer|min:1',
            'opening_time' => 'nullable|string',
            'closing_time' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean'
        ]);

        if ($request->hasFile('logo_file')) {
            $file = $request->file('logo_file');
            $filename = 'club_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('clubs/logos', $filename, 'public');
            $validated['logo_url'] = '/storage/' . $path;
        }
        unset($validated['logo_file']);

        $validated['slug'] = Str::slug($validated['slug']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        $club = Club::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Clube criado com sucesso!',
            'data' => $club
        ], 201);
    }

    public function updateClub(Request $request, $id)
    {
        $this->checkSuperAdmin($request);

        $club = Club::find($id);
        if (!$club) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'logo_url' => 'nullable|string|max:1000',
            'logo_file' => 'nullable|file|mimes:jpeg,png,jpg,webp,svg,gif|max:10240',
            'slug' => 'sometimes|string|max:100|unique:clubs,slug,' . $id,
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'max_capacity' => 'sometimes|integer|min:1',
            'opening_time' => 'nullable|string',
            'closing_time' => 'nullable|string',
            'contact_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean'
        ]);

        if ($request->hasFile('logo_file')) {
            $file = $request->file('logo_file');
            $filename = 'club_' . $id . '_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('clubs/logos', $filename, 'public');
            $validated['logo_url'] = '/storage/' . $path;
        }
        unset($validated['logo_file']);

        if (isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['slug']);
        }

        $club->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Clube atualizado com sucesso!',
            'data' => $club
        ]);
    }

    public function toggleClubStatus(Request $request, $id)
    {
        $this->checkSuperAdmin($request);

        $club = Club::find($id);
        if (!$club) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 404);
        }

        $club->is_active = !$club->is_active;
        $club->save();

        return response()->json([
            'status' => 'success',
            'message' => $club->is_active ? 'Clube ativado com sucesso!' : 'Clube desativado com sucesso!',
            'is_active' => (bool) $club->is_active
        ]);
    }

    public function getUsers(Request $request)
    {
        $this->checkSuperAdmin($request);

        $search = $request->query('search');
        $clubId = $request->query('club_id');
        $role = $request->query('role');

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($clubId || $role) {
            $query->whereHas('clubAccess', function ($q) use ($clubId, $role) {
                if ($clubId) $q->where('club_id', $clubId);
                if ($role) $q->where('role', $role);
            });
        }

        $users = $query->with(['clubAccess.club'])->orderBy('name', 'asc')->limit(100)->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_superadmin' => (bool) $user->is_superadmin,
                'created_at' => $user->created_at,
                'club_access' => $user->clubAccess->map(function ($access) {
                    return [
                        'club_id' => $access->club_id,
                        'club_name' => $access->club->name ?? 'Clube',
                        'club_slug' => $access->club->slug ?? '',
                        'role' => $access->role,
                        'points' => $access->points,
                        'joined_at' => $access->created_at,
                    ];
                }),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    public function assignRole(Request $request)
    {
        $this->checkSuperAdmin($request);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'club_id' => 'required|exists:clubs,id',
            'role' => 'required|in:ADMIN,STAFF,RP,TEAM_LEADER,CLIENT',
        ]);

        $access = UserClubAccess::updateOrCreate(
            ['user_id' => $validated['user_id'], 'club_id' => $validated['club_id']],
            ['role' => $validated['role']]
        );

        return response()->json([
            'status' => 'success',
            'message' => "Permissão atualizada para {$validated['role']} com sucesso!",
            'data' => $access
        ]);
    }

    public function removeClubAccess(Request $request)
    {
        $this->checkSuperAdmin($request);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'club_id' => 'required|exists:clubs,id',
        ]);

        UserClubAccess::where('user_id', $validated['user_id'])
            ->where('club_id', $validated['club_id'])
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Acesso ao clube revogado com sucesso.'
        ]);
    }

    public function toggleSuperAdmin(Request $request)
    {
        $this->checkSuperAdmin($request);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $targetUser = User::find($validated['user_id']);

        // Don't allow removing own superadmin to avoid lockout
        if ($targetUser->id === $request->user()->id && $targetUser->is_superadmin) {
            return response()->json([
                'status' => 'error',
                'message' => 'Não podes revogar os teus próprios privilégios de SuperAdmin.'
            ], 400);
        }

        $targetUser->is_superadmin = !$targetUser->is_superadmin;
        $targetUser->save();

        return response()->json([
            'status' => 'success',
            'message' => $targetUser->is_superadmin
                ? "Utilizador {$targetUser->name} promovido a SuperAdmin!"
                : "Privilégios de SuperAdmin revogados para {$targetUser->name}.",
            'is_superadmin' => (bool) $targetUser->is_superadmin
        ]);
    }

    public function createAdminUser(Request $request)
    {
        $this->checkSuperAdmin($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'club_id' => 'nullable|exists:clubs,id',
            'role' => 'required|in:ADMIN,SUPERADMIN,STAFF,RP,TEAM_LEADER',
        ]);

        $isSuperAdmin = ($validated['role'] === 'SUPERADMIN');

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_superadmin' => $isSuperAdmin,
        ]);

        if (!empty($validated['club_id'])) {
            UserClubAccess::create([
                'user_id' => $user->id,
                'club_id' => $validated['club_id'],
                'role' => $isSuperAdmin ? 'ADMIN' : $validated['role'],
                'points' => 0,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Administrador criado com sucesso!',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_superadmin' => $user->is_superadmin,
            ]
        ], 201);
    }
}
