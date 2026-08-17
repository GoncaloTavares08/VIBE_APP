<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Event;
use App\Models\Guestlist;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NetworkingTest extends TestCase
{
    use RefreshDatabase;

    private function checkInToEvent(User $user, Event $event): void
    {
        Guestlist::create([
            'event_id' => $event->id,
            'client_id' => $user->id,
            'status' => 'checked_in',
            'checked_in_at' => now(),
            'qr_code' => (string) Str::uuid(),
        ]);
    }

    private function makeEvent(): Event
    {
        $club = Club::create(['name' => 'Vibe Club', 'slug' => 'vibeclub']);
        $now = Carbon::now('Europe/Lisbon');

        return Event::create([
            'club_id' => $club->id,
            'name' => 'Sexta Vibe',
            'date' => $now->toDateString(),
            'start_time' => $now->copy()->subHour()->format('H:i:s'),
            'end_time' => $now->copy()->addHours(6)->format('H:i:s'),
            'capacity' => 500,
            'status' => 'ongoing',
        ]);
    }

    public function test_swipe_without_mutual_like_is_not_a_match(): void
    {
        $event = $this->makeEvent();
        $userA = User::create(['name' => 'Ana', 'email' => 'ana@example.com', 'password' => bcrypt('password')]);
        $userB = User::create(['name' => 'Bruno', 'email' => 'bruno@example.com', 'password' => bcrypt('password')]);
        $this->checkInToEvent($userA, $event);
        $this->checkInToEvent($userB, $event);

        Sanctum::actingAs($userA);

        $response = $this->postJson('/api/networking/swipe', [
            'liked_id' => $userB->id,
            'action' => 'like',
        ]);

        $response->assertStatus(200)->assertJsonPath('is_match', false);
    }

    public function test_swipe_creates_match_when_both_users_like_each_other(): void
    {
        $event = $this->makeEvent();
        $userA = User::create(['name' => 'Ana', 'email' => 'ana2@example.com', 'password' => bcrypt('password')]);
        $userB = User::create(['name' => 'Bruno', 'email' => 'bruno2@example.com', 'password' => bcrypt('password')]);
        $this->checkInToEvent($userA, $event);
        $this->checkInToEvent($userB, $event);

        Sanctum::actingAs($userA);
        $this->postJson('/api/networking/swipe', [
            'liked_id' => $userB->id,
            'action' => 'like',
        ])->assertStatus(200)->assertJsonPath('is_match', false);

        Sanctum::actingAs($userB);
        $response = $this->postJson('/api/networking/swipe', [
            'liked_id' => $userA->id,
            'action' => 'like',
        ]);

        $response->assertStatus(200)->assertJsonPath('is_match', true);

        $this->assertDatabaseHas('event_likes', [
            'event_id' => $event->id,
            'liker_id' => $userA->id,
            'liked_id' => $userB->id,
            'is_match' => 1,
        ]);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $userA->id]);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $userB->id]);
    }

    public function test_swipe_still_succeeds_when_push_delivery_fails(): void
    {
        // Even with a device token on file, Firebase isn't configured in tests (no real
        // project credentials) — the match flow must not blow up because of that.
        $event = $this->makeEvent();
        $userA = User::create(['name' => 'Ana', 'email' => 'ana4@example.com', 'password' => bcrypt('password')]);
        $userB = User::create(['name' => 'Bruno', 'email' => 'bruno4@example.com', 'password' => bcrypt('password')]);
        $this->checkInToEvent($userA, $event);
        $this->checkInToEvent($userB, $event);
        $userA->deviceTokens()->create(['token' => 'fake-token-a', 'platform' => 'web']);

        Sanctum::actingAs($userA);
        $this->postJson('/api/networking/swipe', ['liked_id' => $userB->id, 'action' => 'like'])
            ->assertStatus(200);

        Sanctum::actingAs($userB);
        $response = $this->postJson('/api/networking/swipe', ['liked_id' => $userA->id, 'action' => 'like']);

        $response->assertStatus(200)->assertJsonPath('is_match', true);
    }

    public function test_swipe_without_being_checked_in_to_an_event_fails(): void
    {
        $user = User::create(['name' => 'Ana', 'email' => 'ana3@example.com', 'password' => bcrypt('password')]);
        $other = User::create(['name' => 'Bruno', 'email' => 'bruno3@example.com', 'password' => bcrypt('password')]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/networking/swipe', [
            'liked_id' => $other->id,
            'action' => 'like',
        ]);

        $response->assertStatus(400);
    }
}
