<?php

namespace App\Policies;

use App\Models\Club;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ClubPolicy
{
    /**
     * ADMIN-tier access — club settings, rewards, RP roster, event CRUD.
     */
    public function manage(User $user, Club $club): bool
    {
        return $user->is_superadmin || $this->hasRole($user, $club, ['ADMIN']);
    }

    /**
     * STAFF-tier access — door scanning, check-in, bar purchases.
     */
    public function staff(User $user, Club $club): bool
    {
        return $user->is_superadmin || $this->hasRole($user, $club, ['STAFF', 'ADMIN']);
    }

    /**
     * RP-tier access — challenges, team management.
     */
    public function promote(User $user, Club $club): bool
    {
        return $user->is_superadmin || $this->hasRole($user, $club, ['RP', 'TEAM_LEADER', 'ADMIN']);
    }

    private function hasRole(User $user, Club $club, array $roles): bool
    {
        $access = DB::table('user_club_access')
            ->where('user_id', $user->id)
            ->where('club_id', $club->id)
            ->first();

        return $access && in_array($access->role, $roles);
    }
}
