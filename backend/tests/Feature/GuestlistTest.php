<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestlistTest extends TestCase
{
    use RefreshDatabase;

    private function makeClub(): Club
    {
        return Club::create(['name' => 'Vibe Club', 'slug' => 'vibeclub']);
    }

    public function test_status_ignores_an_event_that_already_ended_even_if_its_status_column_is_stale(): void
    {
        $club = $this->makeClub();
        $now = Carbon::now('Europe/Lisbon');

        // Event finished hours ago, but its `status` column was never refreshed
        // to "completed" (nothing calls autoUpdateStatuses() outside EventController).
        Event::create([
            'club_id' => $club->id,
            'name' => 'Ontem à Noite',
            'date' => $now->copy()->subDay()->toDateString(),
            'start_time' => $now->copy()->subDay()->subHours(6)->format('H:i:s'),
            'end_time' => $now->copy()->subHours(3)->format('H:i:s'),
            'capacity' => 500,
            'status' => 'ongoing',
        ]);

        $user = User::create(['name' => 'Ana', 'email' => 'ana@example.com', 'password' => bcrypt('password')]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/guestlist/status', ['X-Client-ID' => $club->slug]);

        $response->assertStatus(200)->assertJsonPath('computed_status', 'no-guestlist');
    }

    public function test_status_picks_the_genuinely_upcoming_event_over_a_stale_past_one(): void
    {
        $club = $this->makeClub();
        $now = Carbon::now('Europe/Lisbon');

        Event::create([
            'club_id' => $club->id,
            'name' => 'Ontem à Noite',
            'date' => $now->copy()->subDay()->toDateString(),
            'start_time' => $now->copy()->subDay()->subHours(6)->format('H:i:s'),
            'end_time' => $now->copy()->subHours(3)->format('H:i:s'),
            'capacity' => 500,
            'status' => 'ongoing',
        ]);

        $upcoming = Event::create([
            'club_id' => $club->id,
            'name' => 'Sexta que vem',
            'date' => $now->copy()->addDays(3)->toDateString(),
            'start_time' => '23:00:00',
            'end_time' => '06:00:00',
            'capacity' => 500,
            'status' => 'upcoming',
        ]);

        $user = User::create(['name' => 'Ana', 'email' => 'ana2@example.com', 'password' => bcrypt('password')]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/guestlist/status', ['X-Client-ID' => $club->slug]);

        $response->assertStatus(200)
            ->assertJsonPath('computed_status', 'no-guestlist')
            ->assertJsonPath('event.id', $upcoming->id);
    }
}
