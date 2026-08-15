<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ClientProfile;
use App\Models\ClientGalleryPhoto;
use App\Models\Guestlist;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class NetworkingSeeder extends Seeder
{
    public function run()
    {
        $eventId = \App\Models\Event::first()->id ?? 1;

        $mockUsers = [
            ['name' => 'Maria', 'email' => 'maria@vibe.com', 'gender' => 'female', 'bio' => 'Adoro dançar! 💃', 'age' => 22, 'vibes' => 25],
            ['name' => 'João', 'email' => 'joao@vibe.com', 'gender' => 'male', 'bio' => 'Bora beber um copo? 🍻', 'age' => 25, 'vibes' => 45],
            ['name' => 'Ana', 'email' => 'ana@vibe.com', 'gender' => 'female', 'bio' => 'Só boas vibes ✨', 'age' => 21, 'vibes' => 120],
            ['name' => 'Pedro', 'email' => 'pedro@vibe.com', 'gender' => 'male', 'bio' => 'A curtir a noite! 🎵', 'age' => 24, 'vibes' => 88],
            ['name' => 'Sofia', 'email' => 'sofia@vibe.com', 'gender' => 'female', 'bio' => 'Quem me paga um shot? 🥃', 'age' => 23, 'vibes' => 310],
            ['name' => 'Lucas', 'email' => 'lucas@vibe.com', 'gender' => 'male', 'bio' => 'Party time 🎉', 'age' => 20, 'vibes' => 15],
            ['name' => 'Marta', 'email' => 'marta@vibe.com', 'gender' => 'female', 'bio' => 'Sempre na pista!', 'age' => 26, 'vibes' => 70],
            ['name' => 'Tiago', 'email' => 'tiago@vibe.com', 'gender' => 'male', 'bio' => 'Vibe boa', 'age' => 28, 'vibes' => 5],
        ];

        foreach ($mockUsers as $index => $mock) {
            $user = User::firstOrCreate(
                ['email' => $mock['email']],
                [
                    'name' => $mock['name'],
                    'password' => Hash::make('password123'),
                ]
            );

            ClientProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'gender' => $mock['gender'],
                    'birthdate' => Carbon::now()->subYears($mock['age'])->format('Y-m-d'),
                    'bio' => $mock['bio'],
                    'ghost_mode' => 0,
                    'instagram' => strtolower($mock['name']) . '_vibe'
                ]
            );

            // Add dummy photos
            ClientGalleryPhoto::firstOrCreate([
                'user_id' => $user->id,
                'photo_order' => 0
            ], [
                'photo_path' => 'https://i.pravatar.cc/500?img=' . ($index * 2 + 10)
            ]);

            ClientGalleryPhoto::firstOrCreate([
                'user_id' => $user->id,
                'photo_order' => 1
            ], [
                'photo_path' => 'https://i.pravatar.cc/500?img=' . ($index * 2 + 11)
            ]);

            // Add to guestlist (checked_in)
            Guestlist::updateOrCreate(
                ['client_id' => $user->id, 'event_id' => $eventId],
                [
                    'status' => 'checked_in',
                    'checked_in_at' => Carbon::now(),
                ]
            );
        }

        echo "Created mock users for event \$eventId!\n";
    }
}
