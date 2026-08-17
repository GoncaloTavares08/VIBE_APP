<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_user_and_returns_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Ana Silva',
            'email' => 'ana@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $this->assertDatabaseHas('users', ['email' => 'ana@example.com']);
    }

    public function test_login_with_correct_credentials_returns_token(): void
    {
        User::create([
            'name' => 'Ana Silva',
            'email' => 'ana@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'ana@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure(['token']);
    }

    public function test_login_with_wrong_password_fails(): void
    {
        User::create([
            'name' => 'Ana Silva',
            'email' => 'ana@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'ana@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    public function test_google_login_rejects_token_whose_audience_does_not_match(): void
    {
        Config::set('services.google.client_id', 'expected-client-id.apps.googleusercontent.com');

        Http::fake([
            'www.googleapis.com/oauth2/v3/userinfo' => Http::response([
                'email' => 'ana@example.com',
                'name' => 'Ana Silva',
            ]),
            'oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'some-other-client-id.apps.googleusercontent.com',
            ]),
        ]);

        $response = $this->postJson('/api/login/google', [
            'token' => 'stolen-access-token',
        ]);

        $response->assertStatus(401);
        $this->assertDatabaseMissing('users', ['email' => 'ana@example.com']);
    }

    public function test_google_login_accepts_token_with_matching_audience(): void
    {
        Config::set('services.google.client_id', 'expected-client-id.apps.googleusercontent.com');

        Http::fake([
            'www.googleapis.com/oauth2/v3/userinfo' => Http::response([
                'email' => 'ana@example.com',
                'name' => 'Ana Silva',
            ]),
            'oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud' => 'expected-client-id.apps.googleusercontent.com',
            ]),
        ]);

        $response = $this->postJson('/api/login/google', [
            'token' => 'legit-access-token',
        ]);

        $response->assertStatus(200)->assertJsonPath('status', 'success');
        $this->assertDatabaseHas('users', ['email' => 'ana@example.com']);
    }
}
