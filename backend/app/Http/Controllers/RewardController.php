<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Reward;
use App\Models\RewardRedemption;
use App\Models\UserClubAccess;
use App\Models\PointsTransaction;
use App\Models\Club;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class RewardController extends Controller
{
    private function getClubId(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $slug = $rawSlug ? strtolower($rawSlug) : null;
        if (!$slug) return null;
        
        $club = Club::where('slug', $slug)->first();
        return $club ? $club->id : null;
    }

    public function index(Request $request)
    {
        $clubId = $this->getClubId($request);
        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Club ID não fornecido.'], 400);
        }

        $rewards = Reward::where('club_id', $clubId)
            ->where('available', 1)
            ->where('stock', '>', 0)
            ->orderBy('points', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $rewards
        ]);
    }

    public function redeem(Request $request)
    {
        $validated = $request->validate([
            'reward_id' => 'required|integer|exists:rewards,id'
        ]);

        $user = $request->user();
        $clubId = $this->getClubId($request);

        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        DB::beginTransaction();
        try {
            $reward = Reward::where('id', $validated['reward_id'])
                ->where('club_id', $clubId)
                ->where('available', 1)
                ->where('stock', '>', 0)
                ->lockForUpdate()
                ->first();

            if (!$reward) {
                DB::rollBack();
                return response()->json(['status' => 'error', 'message' => 'Prémio indisponível ou esgotado.'], 400);
            }

            $userClubAccess = UserClubAccess::where('user_id', $user->id)
                ->where('club_id', $clubId)
                ->lockForUpdate()
                ->first();

            if (!$userClubAccess || $userClubAccess->points < $reward->points) {
                DB::rollBack();
                return response()->json(['status' => 'error', 'message' => 'Pontos insuficientes.'], 400);
            }

            // Deduct points
            $newPoints = $userClubAccess->points - $reward->points;
            $userClubAccess->update(['points' => $newPoints]);

            // Decrement stock
            $reward->decrement('stock');

            // Generate UUID for QR Code
            $qrCode = (string) Str::uuid();
            $expiresAt = Carbon::now()->addDays(30);

            // Create redemption
            $redemption = RewardRedemption::create([
                'user_id' => $user->id,
                'reward_id' => $reward->id,
                'reward_name' => $reward->name,
                'points_spent' => $reward->points,
                'qr_code' => $qrCode,
                'status' => 'pending',
                'expires_at' => $expiresAt
            ]);

            // Record transaction
            PointsTransaction::create([
                'user_id' => $user->id,
                'club_id' => $clubId,
                'points' => -$reward->points,
                'transaction_type' => 'reward_redemption'
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Prémio resgatado com sucesso!',
                'data' => [
                    'redemption_id' => $redemption->id,
                    'qr_code' => \Illuminate\Support\Facades\Crypt::encryptString($qrCode . '|' . time()),
                    'expires_at' => $expiresAt,
                    'new_points' => $newPoints
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Erro interno ao resgatar o prémio.'], 500);
        }
    }

    public function myRedemptions(Request $request)
    {
        $user = $request->user();
        
        $redemptions = RewardRedemption::with('reward')
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'used'])
            ->where('expires_at', '>', now())
            ->orderBy('redeemed_at', 'desc')
            ->get();

        $formatted = $redemptions->map(function ($redemption) {
            $redemption->qr_code = \Illuminate\Support\Facades\Crypt::encryptString($redemption->qr_code . '|' . time());
            return $redemption;
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }
}
