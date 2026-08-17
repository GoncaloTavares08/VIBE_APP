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

class StaffScanTest extends TestCase
{
    use RefreshDatabase;

    private function makeClub(): Club
    {
        return Club::create(['name' => 'Vibe Club', 'slug' => 'vibeclub']);
    }

    private function makeOngoingEvent(Club $club): Event
    {
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

    public function test_client_cannot_process_purchase(): void
    {
        $club = $this->makeClub();
        $client = User::create(['name' => 'Cliente', 'email' => 'client@example.com', 'password' => bcrypt('password')]);
        UserClubAccess::create(['user_id' => $client->id, 'club_id' => $club->id, 'role' => 'CLIENT']);

        Sanctum::actingAs($client);

        $response = $this->postJson('/api/staff/purchase', [
            'user_id' => $client->id,
            'amount' => 999999,
        ], ['X-Client-ID' => $club->slug]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('points_transactions', ['user_id' => $client->id]);
    }

    public function test_staff_can_process_purchase_and_awards_points(): void
    {
        $club = $this->makeClub();
        $staff = User::create(['name' => 'Porteiro', 'email' => 'staff@example.com', 'password' => bcrypt('password')]);
        UserClubAccess::create(['user_id' => $staff->id, 'club_id' => $club->id, 'role' => 'STAFF']);

        $client = User::create(['name' => 'Cliente', 'email' => 'client2@example.com', 'password' => bcrypt('password')]);

        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/staff/purchase', [
            'user_id' => $client->id,
            'amount' => 10,
        ], ['X-Client-ID' => $club->slug]);

        $response->assertStatus(200)->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('user_club_access', [
            'user_id' => $client->id,
            'club_id' => $club->id,
            'points' => 100,
        ]);
    }

    public function test_manual_checkin_on_guestlist_from_another_club_is_rejected(): void
    {
        $club = $this->makeClub();
        $otherClub = Club::create(['name' => 'Other Club', 'slug' => 'otherclub']);
        $event = $this->makeOngoingEvent($otherClub);

        $staff = User::create(['name' => 'Porteiro', 'email' => 'staff3@example.com', 'password' => bcrypt('password')]);
        UserClubAccess::create(['user_id' => $staff->id, 'club_id' => $club->id, 'role' => 'STAFF']);

        $guest = User::create(['name' => 'Convidado', 'email' => 'guest@example.com', 'password' => bcrypt('password')]);
        $guestlist = Guestlist::create([
            'event_id' => $event->id,
            'client_id' => $guest->id,
            'status' => 'confirmed',
            'qr_code' => (string) Str::uuid(),
        ]);

        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/staff/scan/manual-checkin', [
            'guest_id' => $guestlist->id,
        ], ['X-Client-ID' => $club->slug]);

        $response->assertStatus(403);
    }

    public function test_manual_checkin_success_flow(): void
    {
        $club = $this->makeClub();
        $event = $this->makeOngoingEvent($club);

        $staff = User::create(['name' => 'Porteiro', 'email' => 'staff5@example.com', 'password' => bcrypt('password')]);
        UserClubAccess::create(['user_id' => $staff->id, 'club_id' => $club->id, 'role' => 'STAFF']);

        $guest = User::create(['name' => 'Convidado', 'email' => 'guest3@example.com', 'password' => bcrypt('password')]);
        $guestlist = Guestlist::create([
            'event_id' => $event->id,
            'client_id' => $guest->id,
            'status' => 'confirmed',
            'qr_code' => (string) Str::uuid(),
        ]);

        Sanctum::actingAs($staff);

        $response = $this->postJson('/api/staff/scan/manual-checkin', [
            'guest_id' => $guestlist->id,
        ], ['X-Client-ID' => $club->slug]);

        $response->assertStatus(200)->assertJsonPath('status', 'success');
        $this->assertDatabaseHas('guestlist', ['id' => $guestlist->id, 'status' => 'checked_in']);
    }
}
