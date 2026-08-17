<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Reward;
use App\Models\User;
use App\Models\UserClubAccess;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RewardTest extends TestCase
{
    use RefreshDatabase;

    public function test_redeem_deducts_points_and_creates_redemption(): void
    {
        $club = Club::create(['name' => 'Vibe Club', 'slug' => 'vibeclub']);
        $user = User::create(['name' => 'Ana', 'email' => 'ana@example.com', 'password' => bcrypt('password')]);
        UserClubAccess::create(['user_id' => $user->id, 'club_id' => $club->id, 'role' => 'CLIENT', 'points' => 100]);
        $reward = Reward::create(['club_id' => $club->id, 'name' => 'Shot Grátis', 'points' => 50, 'stock' => 5, 'available' => true]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/rewards/redeem', [
            'reward_id' => $reward->id,
        ], ['X-Client-ID' => $club->slug]);

        $response->assertStatus(200)->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('user_club_access', [
            'user_id' => $user->id,
            'club_id' => $club->id,
            'points' => 50,
        ]);
        $this->assertDatabaseHas('reward_redemptions', [
            'user_id' => $user->id,
            'reward_id' => $reward->id,
            'points_spent' => 50,
        ]);
        $this->assertEquals(4, $reward->fresh()->stock);
    }

    public function test_redeem_fails_with_insufficient_points(): void
    {
        $club = Club::create(['name' => 'Vibe Club', 'slug' => 'vibeclub']);
        $user = User::create(['name' => 'Ana', 'email' => 'ana2@example.com', 'password' => bcrypt('password')]);
        UserClubAccess::create(['user_id' => $user->id, 'club_id' => $club->id, 'role' => 'CLIENT', 'points' => 10]);
        $reward = Reward::create(['club_id' => $club->id, 'name' => 'Shot Grátis', 'points' => 50, 'stock' => 5, 'available' => true]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/rewards/redeem', [
            'reward_id' => $reward->id,
        ], ['X-Client-ID' => $club->slug]);

        $response->assertStatus(400);
        $this->assertDatabaseHas('user_club_access', ['user_id' => $user->id, 'points' => 10]);
    }

    public function test_redeem_fails_for_out_of_stock_reward(): void
    {
        $club = Club::create(['name' => 'Vibe Club', 'slug' => 'vibeclub']);
        $user = User::create(['name' => 'Ana', 'email' => 'ana3@example.com', 'password' => bcrypt('password')]);
        UserClubAccess::create(['user_id' => $user->id, 'club_id' => $club->id, 'role' => 'CLIENT', 'points' => 1000]);
        $reward = Reward::create(['club_id' => $club->id, 'name' => 'Shot Grátis', 'points' => 50, 'stock' => 0, 'available' => true]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/rewards/redeem', [
            'reward_id' => $reward->id,
        ], ['X-Client-ID' => $club->slug]);

        $response->assertStatus(400);
    }
}
