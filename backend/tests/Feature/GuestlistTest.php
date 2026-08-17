<?php

namespace Tests\Feature;

use App\Models\Club;
use App\Models\Event;
use App\Models\Guestlist;
use App\Models\User;
use App\Models\UserClubAccess;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
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

    public function test_status_reports_whether_the_event_has_already_started(): void
    {
        $club = $this->makeClub();
        $now = Carbon::now('Europe/Lisbon');

        $ongoingEvent = Event::create([
            'club_id' => $club->id,
            'name' => 'Agora Mesmo',
            'date' => $now->toDateString(),
            'start_time' => $now->copy()->subHour()->format('H:i:s'),
            'end_time' => $now->copy()->addHours(4)->format('H:i:s'),
            'capacity' => 500,
            'status' => 'ongoing',
        ]);

        $user = User::create(['name' => 'Ana', 'email' => 'ana6@example.com', 'password' => bcrypt('password')]);
        Guestlist::create([
            'event_id' => $ongoingEvent->id,
            'client_id' => $user->id,
            'status' => 'confirmed',
            'qr_code' => (string) Str::uuid(),
        ]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/guestlist/status', ['X-Client-ID' => $club->slug]);

        $response->assertStatus(200)
            ->assertJsonPath('computed_status', 'has-guestlist')
            ->assertJsonPath('event_started', true);
    }

    public function test_rp_is_only_auto_added_to_todays_guestlist_not_every_future_event(): void
    {
        // Regression: ensureRpOnGuestlist() used to auto-create a guestlist entry for
        // every future event at the club, no matter how far away, on every page load.
        $club = $this->makeClub();
        $now = Carbon::now('Europe/Lisbon');

        $todayEvent = Event::create([
            'club_id' => $club->id,
            'name' => 'Hoje',
            'date' => $now->toDateString(),
            'start_time' => '23:00:00',
            'end_time' => '06:00:00',
            'capacity' => 500,
            'status' => 'upcoming',
        ]);

        $farFutureEvent = Event::create([
            'club_id' => $club->id,
            'name' => 'Daqui a um mês',
            'date' => $now->copy()->addMonth()->toDateString(),
            'start_time' => '23:00:00',
            'end_time' => '06:00:00',
            'capacity' => 500,
            'status' => 'upcoming',
        ]);

        $rp = User::create(['name' => 'Rita RP', 'email' => 'rita@example.com', 'password' => bcrypt('password')]);
        UserClubAccess::create(['user_id' => $rp->id, 'club_id' => $club->id, 'role' => 'RP']);
        Sanctum::actingAs($rp);

        $this->getJson('/api/guestlist', ['X-Client-ID' => $club->slug])->assertStatus(200);

        $this->assertDatabaseHas('guestlist', ['event_id' => $todayEvent->id, 'client_id' => $rp->id]);
        $this->assertDatabaseMissing('guestlist', ['event_id' => $farFutureEvent->id, 'client_id' => $rp->id]);
    }
}
