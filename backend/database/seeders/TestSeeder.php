<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Club;
use App\Models\UserClubAccess;
use App\Models\ClientProfile;
use App\Models\ClientProfilePhoto;
use App\Models\RpProfile;
use App\Models\Event;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Illuminate\Support\Str;

class TestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('pt_PT');
        $password = Hash::make('password');

        // 1. Create Clubs
        $clubsData = [
            ['name' => 'Vibe Club', 'slug' => 'vibe', 'is_active' => true, 'address' => 'Rua Vibe 123, Porto', 'city' => 'Porto', 'location' => 'Porto'],
            ['name' => 'Eskada', 'slug' => 'eskada', 'is_active' => true, 'address' => 'Rua do Pinheiro 45, Braga', 'city' => 'Braga', 'location' => 'Braga'],
            ['name' => 'Boîte', 'slug' => 'boite', 'is_active' => true, 'address' => 'Avenida de Lisboa, Lisboa', 'city' => 'Lisboa', 'location' => 'Lisboa'],
        ];

        $clubs = [];
        foreach ($clubsData as $clubInfo) {
            $clubs[] = Club::create([
                'name' => $clubInfo['name'],
                'slug' => $clubInfo['slug'],
                'is_active' => $clubInfo['is_active'],
                'address' => $clubInfo['address'],
                'city' => $clubInfo['city'],
                'location' => $clubInfo['location'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $mainClub = $clubs[0]; // Vibe Club

        // 2. Base Accounts for Vibe Club
        $roles = [
            'ADMIN' => 'admin@vibe.com',
            'MANAGER' => 'manager@vibe.com',
            'STAFF' => 'door@vibe.com',
            'RP' => 'rp@vibe.com',
            'CLIENT' => 'goncalo08pt@gmail.com', // Updated for Google Login
        ];

        $baseUsers = [];
        foreach ($roles as $role => $email) {
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => ucfirst(strtolower($role)) . ' Vibe',
                    'password' => $password,
                    'email_verified_at' => now(),
                ]
            );

            UserClubAccess::firstOrCreate(
                ['user_id' => $user->id, 'club_id' => $mainClub->id],
                [
                    'role' => $role,
                    'points' => ($role === 'CLIENT' || $role === 'RP') ? $faker->numberBetween(0, 500) : 0,
                ]
            );

            $baseUsers[$role] = $user;

            // Extra profiles for base users
            if ($role === 'RP') {
                RpProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'username' => 'rp_' . $user->id,
                        'bio' => 'Top RP do Vibe Club!',
                        'instagram' => 'rp_vibe',
                        'profile_image_url' => 'https://i.pravatar.cc/300?u=' . $user->id,
                    ]
                );
            }
            if ($role === 'CLIENT') {
                ClientProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'bio' => 'Adoro festas!',
                        'instagram' => 'cliente_vibe',
                        'birthdate' => $faker->dateTimeBetween('-30 years', '-18 years'),
                        'gender' => 'male',
                        'gender_preference' => 'everyone',
                        'profile_photo_path' => null, // Leave empty so Google Login populates it
                    ]
                );
            }
        }

        // 3. Create 5 RPs for EACH Club
        $rpsByClub = [];
        $rpsByClub[$mainClub->id] = [$baseUsers['RP']];

        foreach ($clubs as $clubItem) {
            if (!isset($rpsByClub[$clubItem->id])) {
                $rpsByClub[$clubItem->id] = [];
            }
            
            for ($i = 1; $i <= 5; $i++) {
                $rpUser = User::firstOrCreate(
                    ['email' => "rp{$i}_{$clubItem->slug}@example.com"],
                    [
                        'name' => $faker->name,
                        'password' => $password,
                        'email_verified_at' => now(),
                    ]
                );

                UserClubAccess::firstOrCreate(
                    ['user_id' => $rpUser->id, 'club_id' => $clubItem->id],
                    [
                        'role' => 'RP',
                        'points' => $faker->numberBetween(0, 1000),
                    ]
                );

                RpProfile::firstOrCreate(
                    ['user_id' => $rpUser->id],
                    [
                        'username' => 'rp_' . $rpUser->id,
                        'bio' => $faker->sentence,
                        'instagram' => strtolower($faker->firstName),
                        'profile_image_url' => 'https://i.pravatar.cc/300?u=' . $rpUser->id,
                    ]
                );
                
                // Add to array unless it's already there (to avoid duplication if re-run)
                $exists = false;
                foreach($rpsByClub[$clubItem->id] as $existing) {
                    if ($existing->id === $rpUser->id) $exists = true;
                }
                if (!$exists) {
                    $rpsByClub[$clubItem->id][] = $rpUser;
                }
            }
        }

        // 4. Create 20 Final Clients for Vibe Club
        $clients = [$baseUsers['CLIENT']];
        for ($i = 1; $i <= 20; $i++) {
            $clientUser = User::firstOrCreate(
                ['email' => "cliente{$i}@gmail.com"],
                [
                    'name' => $faker->name,
                    'password' => $password,
                    'email_verified_at' => now(),
                ]
            );

            UserClubAccess::firstOrCreate(
                ['user_id' => $clientUser->id, 'club_id' => $mainClub->id],
                [
                    'role' => 'CLIENT',
                    'points' => $faker->numberBetween(0, 200),
                ]
            );

            $profile = ClientProfile::firstOrCreate(
                ['user_id' => $clientUser->id],
                [
                    'bio' => $faker->text(100),
                    'instagram' => strtolower($faker->firstName) . $faker->numberBetween(10, 99),
                    'birthdate' => $faker->dateTimeBetween('-35 years', '-18 years'),
                    'gender' => $faker->randomElement(['male', 'female']),
                    'gender_preference' => $faker->randomElement(['male', 'female', 'everyone']),
                    'profile_photo_path' => 'https://i.pravatar.cc/300?u=' . $clientUser->id,
                ]
            );

            // Add gallery photos
            $numPhotos = $faker->numberBetween(2, 5);
            for ($j = 0; $j < $numPhotos; $j++) {
                ClientProfilePhoto::firstOrCreate(
                    ['client_profile_id' => $profile->id, 'photo_order' => $j],
                    [
                        'photo_path' => 'https://picsum.photos/600/800?random=' . ($clientUser->id * 10 + $j),
                    ]
                );
            }
            $clients[] = $clientUser;
        }

        // 5. Create 5 Events for all Clubs
        $events = [];
        $eventNames = ['Welcome Caloiros', 'Halloween Party', 'White Night', 'Summer Vibes', 'Neon Party'];
        $futureEventWithCheckins = rand(1, 4); // Pick a random future event to also have checkins

        foreach ($eventNames as $index => $eventName) {
            if ($index === 0) {
                $date = now();
                $status = 'ongoing';
            } else {
                $date = now()->addDays(rand(1, 30));
                $status = 'upcoming';
            }
            $eventClubId = $clubs[$index % count($clubs)]->id;

            $events[] = $event = Event::firstOrCreate(
                ['name' => $eventName, 'club_id' => $eventClubId],
                [
                    'description' => $faker->paragraph,
                    'date' => $date->toDateString(),
                    'start_time' => '23:30:00',
                    'end_time' => '06:00:00',
                    'capacity' => 1000,
                    'organizer_name' => 'Vibe Productions',
                    'status' => $status,
                    'image_url' => 'https://picsum.photos/800/400?event=' . $index,
                    'created_by' => $baseUsers['ADMIN']->id,
                ]
            );

            // Assign all RPs of this club to the event
            foreach ($rpsByClub[$eventClubId] as $rp) {
                DB::table('rp_profile_events')->insertOrIgnore([
                    'rp_user_id' => $rp->id,
                    'event_id' => $event->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 6. Associate Clients to Events (Guestlist) via RPs
        foreach ($events as $index => $event) {
            // Check if guestlist already exists to prevent duplicate runs crashing
            $exists = DB::table('guestlist')->where('event_id', $event->id)->exists();
            if ($exists) continue;

            // Assign random clients to this event
            $eventClients = $faker->randomElements($clients, $faker->numberBetween(5, 15));
            
            // Explicitly ensure the default CLIENT is checked into the ongoing event (index 0)
            if ($index === 0) {
                $baseClient = $baseUsers['CLIENT'];
                $found = false;
                foreach ($eventClients as $ec) {
                    if ($ec->id === $baseClient->id) $found = true;
                }
                if (!$found) {
                    $eventClients[] = $baseClient;
                }
            }
            
            $clubRps = $rpsByClub[$event->club_id];
            
            foreach ($eventClients as $client) {
                $rp = $faker->randomElement($clubRps);
                
                if ($index === 0 && $client->id === $baseUsers['CLIENT']->id) {
                    $status = 'checked_in';
                } elseif ($index === 0 || $index === $futureEventWithCheckins) {
                    $status = $faker->randomElement(['checked_in', 'confirmed']);
                } else {
                    $status = 'confirmed';
                }
                
                DB::table('guestlist')->insert([
                    'event_id' => $event->id,
                    'client_id' => $client->id,
                    'rp_id' => $rp->id,
                    'status' => $status,
                    'qr_code' => Str::random(20),
                    'checked_in_at' => $status === 'checked_in' ? now()->subMinutes(rand(1, 120)) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}

