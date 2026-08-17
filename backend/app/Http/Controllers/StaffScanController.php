<?php

namespace App\Http\Controllers;

use App\Http\Requests\Staff\ManualCheckinRequest;
use App\Http\Requests\Staff\ProcessPurchaseRequest;
use App\Http\Requests\Staff\ValidateQrRequest;
use Illuminate\Http\Request;
use App\Models\Guestlist;
use App\Models\RewardRedemption;
use App\Models\Event;
use App\Models\Club;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StaffScanController extends Controller
{
    /**
     * Resolves the club from the X-Client-ID header AND verifies the authenticated
     * user actually holds a STAFF/ADMIN role for it. Every action in this controller
     * (check-in, purchases, reward scans) must go through this — the header alone is
     * public info and proves nothing about who is calling.
     */
    private function checkStaffAccess(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $slug = $rawSlug ? strtolower($rawSlug) : null;
        if (!$slug) {
            return null;
        }

        $club = Club::where('slug', $slug)->first();
        if (!$club) {
            return null;
        }

        $this->authorize('staff', $club);

        return $club->id;
    }

    private function resolvePhotoUrl($path)
    {
        if (!$path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : url('storage/' . str_replace('storage/', '', $path));
    }

    public function validateQr(ValidateQrRequest $request)
    {
        $validated = $request->validated();

        $clubId = $this->checkStaffAccess($request);
        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        $qrCode = $validated['qr_code'];
        $confirm = $validated['confirm'] ?? false;
        $staffUser = $request->user();

        // Detect QR type and validate freshness
        $qrType = 'entry'; // default
        try {
            $decrypted = \Illuminate\Support\Facades\Crypt::decryptString($qrCode);
            if (strpos($decrypted, '|') !== false) {
                [$payload, $timestamp] = explode('|', $decrypted, 2);

                $uuid = $payload;

                // Detect type by prefix
                if (str_starts_with($payload, 'BAR:')) {
                    $qrType = 'bar';
                    $uuid = substr($payload, 4); // Remove BAR:
                    // Bar QR expires in 60 seconds (rotation is 45s)
                    if (time() - (int)$timestamp > 60) {
                        return response()->json(['status' => 'error', 'message' => '⏱️ QR Code de Bar Expirado. Pede ao cliente para fazer refresh na app.'], 400);
                    }
                } elseif (str_starts_with($payload, 'ENTRY:')) {
                    $qrType = 'entry';
                    $uuid = substr($payload, 6); // Remove ENTRY:
                    // Entry QR expires in 60 seconds
                    if (time() - (int)$timestamp > 60) {
                        return response()->json(['status' => 'error', 'message' => '⏱️ QR Code de Entrada Expirado. Pede ao cliente para fazer refresh na app.'], 400);
                    }
                }
                $qrCode = $uuid;
            }
        } catch (\Exception $e) {
            // Se o QR code não estiver encriptado, REJEITA IMEDIATAMENTE.
            // Isto previne que os clientes tirem print do seu UUID estático e usem para sempre.
            return response()->json([
                'status' => 'error', 
                'message' => 'QR Code Antigo ou Inválido. Pede ao cliente para atualizar a app ou fazer refresh.'
            ], 400);
        }

        $guestlist = Guestlist::with(['event', 'client.profile', 'rp'])->where('qr_code', $qrCode)->first();
        if ($guestlist) {
            return $this->handleGuestlistScan($guestlist, $confirm, $clubId, $qrType);
        }

        $redemption = RewardRedemption::with(['reward', 'client.profile'])->where('qr_code', $qrCode)->first();
        if ($redemption) {
            return $this->handleRewardScan($redemption, $confirm, $staffUser->id, $clubId);
        }

        return response()->json(['status' => 'error', 'message' => 'QR Code inválido ou não encontrado.'], 404);
    }

    private function handleGuestlistScan(Guestlist $guestlist, $confirm, $clubId, $qrType = 'entry')
    {
        if (!$guestlist->event) {
            return response()->json(['status' => 'error', 'message' => 'Evento associado não encontrado.'], 404);
        }

        if ($guestlist->event->club_id !== $clubId) {
            return response()->json(['status' => 'error', 'message' => 'Bilhete pertence a outro clube.'], 403);
        }

        $now = Carbon::now('Europe/Lisbon');
        $eventDate = $guestlist->event->date;
        $eventStartTime = $guestlist->event->start_time ?: '00:00';
        $eventEndTime = $guestlist->event->end_time;

        $eventStart = Carbon::parse($eventDate . ' ' . $eventStartTime, 'Europe/Lisbon');

        if ($eventEndTime) {
            $eventEnd = Carbon::parse($eventDate . ' ' . $eventEndTime, 'Europe/Lisbon');
            // If end time is earlier or equal to start time (e.g. starts 23:00, ends 06:00), it ends the next day
            if ($eventEnd->lte($eventStart)) {
                $eventEnd->addDay();
            }
        } else {
            // Default nightlife cutoff: next day at 12:00 (midday) or 12 hours after start
            $eventEnd = (clone $eventStart)->addHours(12);
        }

        $responsePayload = [
            'type' => 'guestlist',
            'qr_type' => $qrType, // 'entry' or 'bar'
            'client' => [
                'id' => $guestlist->client->id,
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

        // 1. Reject if event is explicitly cancelled or ended
        if (in_array(strtolower($guestlist->event->status ?? ''), ['cancelled', 'ended'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Este evento já encerrou ou foi cancelado.',
                'data' => $responsePayload
            ], 400);
        }

        // 2. Reject if event has already finished
        if ($now->gt($eventEnd)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Este evento já terminou (' . $eventEnd->format('d/m/Y H:i') . '). O bilhete/QR já não é válido.',
                'data' => $responsePayload
            ], 400);
        }

        // BAR QR: Only for clients already checked in — add points
        if ($qrType === 'bar') {
            if ($guestlist->status !== 'checked_in') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cliente ainda não entrou. Usa o QR de entrada primeiro.',
                    'data' => $responsePayload
                ], 400);
            }

            // Bar scan — prompt for purchase amount
            return response()->json([
                'status' => 'awaiting_payment',
                'message' => 'QR de Bar. Processar consumo?',
                'data' => $responsePayload
            ]);
        }

        // ENTRY QR: Check-in flow
        if ($now->lt($eventStart)) {
            return response()->json([
                'status' => 'error',
                'message' => 'O evento ainda não começou. (Início: ' . $eventStart->format('H:i') . ')',
                'data' => $responsePayload
            ], 400);
        }

        if ($guestlist->status === 'checked_in') {
            return response()->json([
                'status' => 'already_in',
                'message' => 'Já entrou às ' . Carbon::parse($guestlist->checked_in_at)->format('H:i') . '. Tudo bem!',
                'data' => $responsePayload
            ]);
        }

        if ($confirm) {
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
            'status' => 'info',
            'message' => 'Bilhete Válido. Confirmar entrada?',
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

        // 1. Verify if it belongs to the same club (if clubId is defined for this staff)
        if ($clubId && $redemption->reward && $redemption->reward->club_id !== $clubId) {
            $clubName = $redemption->reward->club->name ?? 'Outro Clube';
            return response()->json([
                'status' => 'error',
                'message' => "Este prémio pertence a outro clube ($clubName).",
                'data' => $responsePayload
            ], 400);
        }

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

    public function processPurchase(ProcessPurchaseRequest $request)
    {
        $validated = $request->validated();

        $clubId = $this->checkStaffAccess($request);
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
                'event_id' => $validated['event_id'] ?? null,
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
        $clubId = $this->checkStaffAccess($request);

        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        if (strlen($queryStr) < 3) {
            return response()->json(['status' => 'error', 'message' => 'Pesquisa muito curta.'], 400);
        }

        $now = Carbon::now('Europe/Lisbon');
        $activeEvent = \App\Models\Event::where('club_id', $clubId)
            ->whereIn('status', ['ongoing', 'upcoming'])
            ->orderByRaw("CASE WHEN status = 'ongoing' THEN 1 ELSE 2 END")
            ->orderBy('date', 'asc')
            ->orderBy('start_time', 'asc')
            ->first();

        if (!$activeEvent) {
            return response()->json([
                'status' => 'success',
                'data' => []
            ]);
        }

        $guests = Guestlist::with(['client', 'event'])
            ->where('event_id', $activeEvent->id)
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

    public function manualCheckin(ManualCheckinRequest $request)
    {
        $validated = $request->validated();

        $clubId = $this->checkStaffAccess($request);
        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        $guestlist = Guestlist::with('event')->find($validated['guest_id']);

        if (!$guestlist || !$guestlist->event) {
            return response()->json(['status' => 'error', 'message' => 'Convidado não encontrado.'], 404);
        }

        if ($guestlist->event->club_id !== $clubId) {
            return response()->json(['status' => 'error', 'message' => 'Bilhete pertence a outro clube.'], 403);
        }

        if ($guestlist->status === 'checked_in') {
            return response()->json(['status' => 'error', 'message' => 'Cliente já entrou.'], 400);
        }

        $now = Carbon::now('Europe/Lisbon');
        $eventDate = $guestlist->event->date;
        $eventStartTime = $guestlist->event->start_time ?: '00:00';
        $eventEndTime = $guestlist->event->end_time;

        $eventStart = Carbon::parse($eventDate . ' ' . $eventStartTime, 'Europe/Lisbon');

        if ($eventEndTime) {
            $eventEnd = Carbon::parse($eventDate . ' ' . $eventEndTime, 'Europe/Lisbon');
            if ($eventEnd->lte($eventStart)) {
                $eventEnd->addDay();
            }
        } else {
            $eventEnd = (clone $eventStart)->addHours(12);
        }

        if (in_array(strtolower($guestlist->event->status ?? ''), ['cancelled', 'ended'])) {
            return response()->json(['status' => 'error', 'message' => 'Este evento já encerrou ou foi cancelado.'], 400);
        }

        if ($now->gt($eventEnd)) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Este evento já terminou (' . $eventEnd->format('d/m/Y H:i') . '). Não é possível fazer check-in.'
            ], 400);
        }

        if ($now->lt($eventStart)) {
            return response()->json([
                'status' => 'error', 
                'message' => 'O evento ainda não começou. (Início: ' . $eventStart->format('H:i') . ')'
            ], 400);
        }

        $guestlist->update([
            'status' => 'checked_in',
            'checked_in_at' => $now
        ]);

        return response()->json([
            'status' => 'success',
            'checkInTime' => $now->format('H:i')
        ]);
    }
    public function getStatistics(Request $request)
    {
        $clubId = $this->checkStaffAccess($request);
        if (!$clubId) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 400);
        }

        $club = Club::find($clubId);
        if (!$club) {
            return response()->json(['status' => 'error', 'message' => 'Clube não encontrado.'], 404);
        }

        // Get today's active event for this club
        $today = Carbon::today('Europe/Lisbon')->toDateString();
        $now = Carbon::now('Europe/Lisbon');
        $searchDate = $now->hour < 10 ? $now->copy()->subDay()->toDateString() : $today;

        $event = Event::where('club_id', $clubId)
                      ->where(function($q) use ($searchDate, $today) {
                          $q->where('date', $searchDate)
                            ->orWhere('date', $today)
                            ->orWhere('status', 'ongoing');
                      })
                      ->orderByRaw("CASE WHEN status = 'ongoing' THEN 1 ELSE 2 END")
                      ->orderBy('date', 'asc')
                      ->first();

        $currentOccupancy = 0;
        $maxCapacity = ($event && $event->capacity > 0) ? (int)$event->capacity : ($club->max_capacity ?? 800);
        $genderRatio = ['male' => 50, 'female' => 50];
        $entriesData = [];
        $totalEntries = 0;
        $avgEntryTime = '--:--';

        if ($event) {
            $guestlists = Guestlist::with('client.profile')
                                  ->where('event_id', $event->id)
                                  ->where('status', 'checked_in')
                                  ->whereNotNull('checked_in_at')
                                  ->get();

            $currentOccupancy = $guestlists->count();
            $totalEntries = $currentOccupancy;

            if ($totalEntries > 0) {
                $males = 0;
                $females = 0;
                $entriesByHour = [];
                $totalMinutes = 0;

                foreach ($guestlists as $g) {
                    // Gender
                    if ($g->client && $g->client->profile) {
                        if ($g->client->profile->gender === 'male') $males++;
                        else if ($g->client->profile->gender === 'female') $females++;
                    }

                    // Entries by hour
                    $checkInTime = Carbon::parse($g->checked_in_at, 'Europe/Lisbon');
                    $hourString = $checkInTime->format('H:00');
                    if (!isset($entriesByHour[$hourString])) {
                        $entriesByHour[$hourString] = 0;
                    }
                    $entriesByHour[$hourString]++;

                    // For Average time
                    $hour = $checkInTime->hour;
                    $min = $checkInTime->minute;
                    // If hour < 10, it's the next day, add 24 to it for average calculation
                    $calcHour = $hour < 10 ? $hour + 24 : $hour;
                    $totalMinutes += ($calcHour * 60) + $min;
                }

                // Calculate Gender Ratio
                $totalGendered = $males + $females;
                if ($totalGendered > 0) {
                    $genderRatio['male'] = round(($males / $totalGendered) * 100);
                    $genderRatio['female'] = 100 - $genderRatio['male'];
                }

                // Build party chronological timeline (from start_time to end_time)
                $startHour = (int)substr($event->start_time ?? '23:00:00', 0, 2);
                $endHour = (int)substr($event->end_time ?? '06:00:00', 0, 2);
                $hourOrder = [];
                $curr = $startHour;
                for ($step = 0; $step <= 12; $step++) {
                    $hourOrder[] = sprintf('%02d:00', $curr);
                    if ($curr === $endHour) break;
                    $curr = ($curr + 1) % 24;
                }

                foreach ($hourOrder as $timeStr) {
                    $entriesData[] = [
                        'time' => $timeStr,
                        'count' => $entriesByHour[$timeStr] ?? 0
                    ];
                }

                // Append any entries outside the standard range
                foreach ($entriesByHour as $timeStr => $cnt) {
                    if (!in_array($timeStr, array_column($entriesData, 'time'))) {
                        $entriesData[] = [
                            'time' => $timeStr,
                            'count' => $cnt
                        ];
                    }
                }

                // Average entry time
                $avgMinutes = round($totalMinutes / $totalEntries);
                $avgH = floor($avgMinutes / 60);
                $avgM = $avgMinutes % 60;
                if ($avgH >= 24) $avgH -= 24;
                $avgEntryTime = sprintf('%02d:%02d', $avgH, $avgM);
            }
        }

        if (empty($entriesData)) {
            $entriesData = [
                ['time' => '23:00', 'count' => 0],
                ['time' => '00:00', 'count' => 0],
                ['time' => '01:00', 'count' => 0],
                ['time' => '02:00', 'count' => 0],
                ['time' => '03:00', 'count' => 0]
            ];
        }
        
        $occupancyPercentage = $maxCapacity > 0 ? min(100, ($currentOccupancy / $maxCapacity) * 100) : 0;

        return response()->json([
            'status' => 'success',
            'data' => [
                'currentOccupancy' => $currentOccupancy,
                'maxCapacity' => $maxCapacity,
                'occupancyPercentage' => $occupancyPercentage,
                'genderRatio' => $genderRatio,
                'entriesData' => $entriesData,
                'totalEntries' => $totalEntries,
                'avgEntryTime' => $avgEntryTime
            ]
        ]);
    }
}
