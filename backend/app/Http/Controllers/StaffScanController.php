<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Guestlist;
use App\Models\RewardRedemption;
use App\Models\Event;
use App\Models\Club;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StaffScanController extends Controller
{
    private function getClubId(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $slug = $rawSlug ? strtolower($rawSlug) : null;
        if (!$slug) return null;

        $club = Club::where('slug', $slug)->first();
        return $club ? $club->id : null;
    }

    private function resolvePhotoUrl($path)
    {
        if (!$path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : url('storage/' . str_replace('storage/', '', $path));
    }

    public function validateQr(Request $request)
    {
        $validated = $request->validate([
            'qr_code' => 'required|string',
            'confirm' => 'boolean'
        ]);

        $clubId = $this->getClubId($request);
        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        $qrCode = $validated['qr_code'];
        $confirm = $validated['confirm'] ?? false;
        $staffUser = $request->user();

        // Dynamic QR (TOTP) Anti-PrintScreen check
        try {
            $decrypted = \Illuminate\Support\Facades\Crypt::decryptString($qrCode);
            if (strpos($decrypted, '|') !== false) {
                list($uuid, $timestamp) = explode('|', $decrypted);
                
                if (time() - (int)$timestamp > 30) {
                    return response()->json(['status' => 'error', 'message' => 'QR Code Expirado (PrintScreen detetado). Por favor faça refresh na app.'], 400);
                }
                
                $qrCode = $uuid;
            }
        } catch (\Exception $e) {
            // Not encrypted or old static code, continue normally
        }

        // Check both tables to see where it exists.
        
        $guestlist = Guestlist::with(['event', 'client.profile', 'rp'])->where('qr_code', $qrCode)->first();
        if ($guestlist) {
            return $this->handleGuestlistScan($guestlist, $confirm, $clubId);
        }

        $redemption = RewardRedemption::with(['reward', 'client.profile'])->where('qr_code', $qrCode)->first();
        if ($redemption) {
            return $this->handleRewardScan($redemption, $confirm, $staffUser->id, $clubId);
        }

        return response()->json(['status' => 'error', 'message' => 'QR Code inválido ou não encontrado.'], 404);
    }

    private function handleGuestlistScan(Guestlist $guestlist, $confirm, $clubId)
    {
        if ($guestlist->event->club_id !== $clubId) {
            return response()->json(['status' => 'error', 'message' => 'Bilhete pertence a outro clube.'], 403);
        }

        $now = Carbon::now('Europe/Lisbon');
        $eventStart = Carbon::parse($guestlist->event->date . ' ' . $guestlist->event->start_time, 'Europe/Lisbon');

        $responsePayload = [
            'type' => 'guestlist',
            'client' => [
                'name' => $guestlist->client->name,
                'photo' => $this->resolvePhotoUrl($guestlist->client->profile->profile_photo_path ?? null),
            ],
            'event' => [
                'id' => $guestlist->event->id,
                'name' => $guestlist->event->name,
                'date' => $guestlist->event->date
            ],
            'rp_name' => $guestlist->rp ? $guestlist->rp->name : 'Direto (Sem RP)',
            'guestlist_status' => $guestlist->status,
            'checked_in_at' => $guestlist->checked_in_at
        ];

        if ($now->lt($eventStart)) {
            return response()->json([
                'status' => 'error',
                'message' => 'O evento ainda não começou. (Início: ' . $eventStart->format('H:i') . ')',
                'data' => $responsePayload
            ], 400);
        }

        if ($confirm) {
            if ($guestlist->status === 'checked_in') {
                return response()->json([
                    'status' => 'awaiting_payment',
                    'message' => 'Cliente já está dentro. Processar compra?',
                    'data' => $responsePayload
                ]);
            }

            $guestlist->update([
                'status' => 'checked_in',
                'checked_in_at' => $now
            ]);

            $responsePayload['guestlist_status'] = 'checked_in';
            $responsePayload['checked_in_at'] = $now;

            return response()->json([
                'status' => 'success',
                'message' => 'Entrada Confirmada!',
                'data' => $responsePayload
            ]);
        }

        // Preview
        return response()->json([
            'status' => $guestlist->status === 'checked_in' ? 'awaiting_payment' : 'info',
            'message' => $guestlist->status === 'checked_in' ? 'Cliente já está dentro. Processar compra?' : 'Bilhete Válido. Pode entrar.',
            'data' => $responsePayload
        ]);
    }

    private function handleRewardScan(RewardRedemption $redemption, $confirm, $staffId, $clubId)
    {
        $now = Carbon::now('Europe/Lisbon');

        $responsePayload = [
            'type' => 'reward',
            'client' => [
                'name' => $redemption->client->name,
                'photo' => $this->resolvePhotoUrl($redemption->client->profile->profile_photo_path ?? null),
            ],
            'reward' => [
                'name' => $redemption->reward_name,
                'points_spent' => $redemption->points_spent
            ],
            'redemption_status' => $redemption->status
        ];

        if ($redemption->status === 'used') {
            $responsePayload['used_at'] = $redemption->used_at;
            return response()->json([
                'status' => 'warning',
                'message' => 'PRÉMIO JÁ ENTREGUE em ' . Carbon::parse($redemption->used_at)->format('Y-m-d H:i:s'),
                'data' => $responsePayload
            ]);
        }

        if (Carbon::parse($redemption->expires_at)->lt($now)) {
            return response()->json([
                'status' => 'error',
                'message' => 'QR Code Expirou em ' . $redemption->expires_at,
                'data' => $responsePayload
            ], 400);
        }

        if ($confirm) {
            $redemption->update([
                'status' => 'used',
                'used_at' => $now,
                'activated_by' => $staffId
            ]);

            $responsePayload['redemption_status'] = 'used';
            $responsePayload['used_at'] = $now;

            return response()->json([
                'status' => 'success',
                'message' => 'Prémio Entregue com Sucesso!',
                'data' => $responsePayload
            ]);
        }

        return response()->json([
            'status' => 'info',
            'message' => 'Prémio Válido. Entregar?',
            'data' => $responsePayload
        ]);
    }

    public function processPurchase(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'amount' => 'required|numeric|min:0.01',
            'event_id' => 'nullable|integer'
        ]);

        $clubId = $this->getClubId($request);
        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        $pointsAwarded = (int) ($validated['amount'] * 10);
        $staffId = $request->user()->id;
        $now = Carbon::now('Europe/Lisbon');

        DB::beginTransaction();
        try {
            // Add points
            $access = DB::table('user_club_access')
                ->where('user_id', $validated['user_id'])
                ->where('club_id', $clubId)
                ->first();

            $newPoints = $pointsAwarded;
            if (!$access) {
                DB::table('user_club_access')->insert([
                    'user_id' => $validated['user_id'],
                    'club_id' => $clubId,
                    'role' => 'CLIENT',
                    'points' => $pointsAwarded,
                    'joined_at' => $now
                ]);
            } else {
                $newPoints += $access->points;
                DB::table('user_club_access')
                    ->where('id', $access->id)
                    ->update(['points' => $newPoints]);
            }

            // Transaction log
            DB::table('points_transactions')->insert([
                'club_id' => $clubId,
                'user_id' => $validated['user_id'],
                'points' => $pointsAwarded,
                'transaction_type' => 'purchase',
                'amount_spent' => $validated['amount'],
                'event_id' => $validated['event_id'],
                'staff_id' => $staffId,
                'created_at' => $now
            ]);

            DB::commit();

            $client = \App\Models\User::find($validated['user_id']);

            return response()->json([
                'status' => 'success',
                'message' => "Compra processada! +{$pointsAwarded} pontos",
                'data' => [
                    'user_name' => $client->name ?? 'Cliente',
                    'amount' => $validated['amount'],
                    'points_awarded' => $pointsAwarded,
                    'new_total_points' => $newPoints
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => 'Erro ao processar compra: ' . $e->getMessage()], 500);
        }
    }

    public function searchGuestlist(Request $request)
    {
        $queryStr = $request->query('query');
        $clubId = $this->getClubId($request);

        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        if (strlen($queryStr) < 3) {
            return response()->json(['status' => 'error', 'message' => 'Pesquisa muito curta.'], 400);
        }

        $guests = Guestlist::with(['client', 'event'])
            ->whereHas('event', function ($q) use ($clubId) {
                $q->where('club_id', $clubId)
                  ->whereIn('status', ['upcoming', 'ongoing']);
            })
            ->whereHas('client', function ($q) use ($queryStr) {
                $q->where('name', 'like', "%{$queryStr}%")
                  ->orWhere('email', 'like', "%{$queryStr}%");
            })
            ->limit(20)
            ->get();

        $formatted = $guests->map(function ($g) {
            return [
                'id' => $g->id,
                'name' => $g->client->name,
                'status' => $g->status === 'checked_in' ? 'checked-in' : 'pending',
                'checkInTime' => $g->checked_in_at ? Carbon::parse($g->checked_in_at)->format('H:i') : null,
                'rp' => $g->rp ? $g->rp->name : 'Direto',
                'event' => $g->event->name
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    public function manualCheckin(Request $request)
    {
        $validated = $request->validate([
            'guest_id' => 'required|integer|exists:guestlists,id'
        ]);

        $clubId = $this->getClubId($request);
        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        $guestlist = Guestlist::with('event')->find($validated['guest_id']);

        if ($guestlist->event->club_id !== $clubId) {
            return response()->json(['status' => 'error', 'message' => 'Bilhete pertence a outro clube.'], 403);
        }

        if ($guestlist->status === 'checked_in') {
            return response()->json(['status' => 'error', 'message' => 'Cliente já entrou.'], 400);
        }

        $now = Carbon::now('Europe/Lisbon');
        $guestlist->update([
            'status' => 'checked_in',
            'checked_in_at' => $now
        ]);

        return response()->json([
            'status' => 'success',
            'checkInTime' => $now->format('H:i')
        ]);
    }
}
