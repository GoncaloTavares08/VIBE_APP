<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Club;
use App\Models\UserClubAccess;
use App\Models\ClientProfile;
use App\Models\RpProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Criar o Clube
        $club = Club::create([
            'name' => 'Eskada',
            'slug' => 'eskada',
            'location' => 'Porto',
            'city' => 'Porto',
            'is_active' => true,
        ]);

        // 2. Definir os utilizadores de teste
        $testUsers = [
            ['name' => 'Gonçalo Admin', 'email' => 'admin@vibe.com', 'role' => 'ADMIN'],
            ['name' => 'Staff Porta', 'email' => 'staff@vibe.com', 'role' => 'STAFF'],
            ['name' => 'RP Principal', 'email' => 'rp@vibe.com', 'role' => 'RP'],
            ['name' => 'Cliente VIP', 'email' => 'cliente@vibe.com', 'role' => 'CLIENT'],
        ];

        // 3. Criar os Users e associar ao Clube com a Role certa
        foreach ($testUsers as $testUser) {
            $user = User::create([
                'name' => $testUser['name'],
                'email' => $testUser['email'],
                'password' => Hash::make('password123'), // Password comum de teste
            ]);

            // Dar acesso e permissão a este clube!
            UserClubAccess::create([
                'user_id' => $user->id,
                'club_id' => $club->id,
                'role' => $testUser['role'],
            ]);

            // Se for RP, criar perfil vazio de RP
            if ($testUser['role'] === 'RP') {
                RpProfile::create(['user_id' => $user->id, 'username' => 'rp_' . $user->id]);
            }

            // Se for Cliente, criar perfil vazio de Cliente
            if ($testUser['role'] === 'CLIENT') {
                ClientProfile::create(['user_id' => $user->id]);
            }
        }
    }
}
