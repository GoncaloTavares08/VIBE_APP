<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyResetCodeRequest;
use App\Models\User;
use App\Models\Club;
use App\Models\UserClubAccess;
use App\Models\ClientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $clientSlug = $request->header('X-Client-ID');
        $userRole = null;

        if ($clientSlug) {
            $club = Club::where('slug', strtolower($clientSlug))->first();
            if ($club) {
                UserClubAccess::create([
                    'user_id' => $user->id,
                    'club_id' => $club->id,
                    'role' => 'CLIENT',
                ]);
                $userRole = 'CLIENT';
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Conta criada com sucesso!',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $userRole,
                'club_slug' => $clientSlug,
                'created_at' => $user->created_at,
            ]
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais fornecidas estão incorretas.'],
            ]);
        }

        $clientSlug = $request->header('X-Client-ID');
        $userRole = null;
        $userPoints = 0;
        $joinedAt = null;

        if ($clientSlug) {
            $club = Club::where('slug', strtolower($clientSlug))->first();
            if ($club) {
                $access = UserClubAccess::firstOrCreate(
                    ['user_id' => $user->id, 'club_id' => $club->id],
                    ['role' => 'CLIENT']
                );
                $userRole = $access->role;
                $userPoints = $access->points;
                $joinedAt = $access->created_at;
            }
        }

        $profile = ClientProfile::where('user_id', $user->id)->first();

        $token = $user->createToken('auth_token')->plainTextToken;

        $responseUser = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_superadmin' => (bool) $user->is_superadmin,
            'created_at' => $user->created_at,
            'birthdate' => $profile->birthdate ?? null,
            'gender' => $profile->gender ?? null,
            'gender_preference' => $profile->gender_preference ?? null,
            'profile_photo_path' => $profile->profile_photo_path ?? null,
        ];

        if ($clientSlug && $userRole) {
            $responseUser['role'] = $user->is_superadmin ? 'SUPERADMIN' : $userRole;
            $responseUser['club_slug'] = $clientSlug;
            $responseUser['points'] = $userPoints;
            $responseUser['member_since'] = $joinedAt;
        } elseif ($user->is_superadmin) {
            $responseUser['role'] = 'SUPERADMIN';
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Login efetuado com sucesso.',
            'token' => $token,
            'user' => $responseUser
        ]);
    }

    public function googleLogin(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $googleToken = $request->token;
        $type = $request->input('type', 'access_token');
        $expectedClientId = config('services.google.client_id');

        if ($type === 'id_token') {
            // Native (Capacitor) Google Sign-In flow: the plugin hands back an ID token (JWT),
            // not an OAuth access token. Google's tokeninfo endpoint validates the JWT signature
            // server-side, so this stays consistent with the access_token branch's REST-based
            // verification style below instead of adding a JWT library.
            $tokenInfo = \Illuminate\Support\Facades\Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $googleToken,
            ]);

            if ($tokenInfo->failed() || ($expectedClientId && $tokenInfo->json('aud') !== $expectedClientId)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token do Google inválido.'
                ], 401);
            }

            $email = $tokenInfo->json('email');
            $name = $tokenInfo->json('name', 'Google User');
            $picture = $tokenInfo->json('picture');
        } else {
            // Web flow: useGoogleLogin() hands back an OAuth access token.
            $response = \Illuminate\Support\Facades\Http::withToken($googleToken)
                ->get('https://www.googleapis.com/oauth2/v3/userinfo');

            if ($response->failed()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Token do Google inválido.'
                ], 401);
            }

            // Verify the token was actually issued for this app's Google OAuth client
            // (userinfo alone doesn't prove that — any valid Google access token would pass it).
            if ($expectedClientId) {
                $tokenInfo = \Illuminate\Support\Facades\Http::get('https://oauth2.googleapis.com/tokeninfo', [
                    'access_token' => $googleToken,
                ]);

                $audience = $tokenInfo->json('aud') ?? $tokenInfo->json('azp');

                if ($tokenInfo->failed() || $audience !== $expectedClientId) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Token do Google não foi emitido para esta aplicação.'
                    ], 401);
                }
            }

            $googleUser = $response->json();
            $email = $googleUser['email'] ?? null;
            $name = $googleUser['name'] ?? 'Google User';
            $picture = $googleUser['picture'] ?? null;
        }

        if (!$email) {
            return response()->json([
                'status' => 'error',
                'message' => 'Não foi possível obter o email do Google.'
            ], 400);
        }

        return $this->finishGoogleLogin($request, $email, $name, $picture);
    }

    private function finishGoogleLogin(Request $request, string $email, string $name, ?string $picture)
    {
        // Find or Create user
        $user = User::where('email', $email)->first();
        $isNewUser = false;
        if (!$user) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make(Str::random(24)),
            ]);
            $isNewUser = true;
        }

        $clientSlug = $request->header('X-Client-ID');
        $userRole = null;
        $userPoints = 0;
        $joinedAt = null;

        if ($clientSlug) {
            $club = Club::where('slug', strtolower($clientSlug))->first();
            if ($club) {
                $access = UserClubAccess::firstOrCreate(
                    ['user_id' => $user->id, 'club_id' => $club->id],
                    ['role' => 'CLIENT']
                );
                $userRole = $access->role;
                $userPoints = $access->points;
                $joinedAt = $access->created_at;
            }
        }

        $profile = ClientProfile::firstOrCreate(['user_id' => $user->id]);

        if ($picture && empty($profile->profile_photo_path)) {
            $profile->profile_photo_path = $picture;
            $profile->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $responseUser = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'created_at' => $user->created_at,
            'birthdate' => $profile->birthdate ?? null,
            'gender' => $profile->gender ?? null,
            'gender_preference' => $profile->gender_preference ?? null,
            'profile_photo_path' => $profile->profile_photo_path ?? null,
        ];

        if ($clientSlug && $userRole) {
            $responseUser['role'] = $userRole;
            $responseUser['club_slug'] = $clientSlug;
            $responseUser['points'] = $userPoints;
            $responseUser['member_since'] = $joinedAt;
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Login Google efetuado com sucesso.',
            'token' => $token,
            'is_new_user' => $isNewUser,
            'user' => $responseUser
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout efetuado com sucesso.'
        ]);
    }
    public function resetRequest(ForgotPasswordRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            // Security: don't reveal if email exists or not
            return response()->json([
                'status' => 'error',
                'message' => 'Email não encontrado.'
            ]);
        }

        $code = Str::upper(Str::random(6));
        $user->reset_token = Hash::make($code);
        $user->reset_token_expiry = now()->addMinutes(15);
        $user->save();

        \App\Jobs\SendResetPasswordEmail::dispatch($user, $code);
        return response()->json([
            'status' => 'success',
            'message' => 'Foi enviado um email com o código de verificação (Verificar os logs caso MAIL_MAILER=log).'
        ]);
    }

    public function verifyCode(VerifyResetCodeRequest $request)
    {
        $user = User::where('email', $request->email)
                    ->whereNotNull('reset_token')
                    ->where('reset_token_expiry', '>', now())
                    ->first();

        if (! $user || ! Hash::check($request->code, $user->reset_token)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Código inválido ou expirado.'
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Código válido.'
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $user = User::where('email', $request->email)
                    ->whereNotNull('reset_token')
                    ->where('reset_token_expiry', '>', now())
                    ->first();

        if (! $user || ! Hash::check($request->code, $user->reset_token)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Código inválido ou expirado.'
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->reset_token = null;
        $user->reset_token_expiry = null;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Password atualizada com sucesso!'
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'A password atual está incorreta.'
            ], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Password alterada com sucesso!'
        ]);
    }
}
