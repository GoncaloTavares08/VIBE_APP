<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Club;

class ClientHistoryController extends Controller
{
    private function checkAccess(Request $request)
    {
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
        if (!$clubSlug) {
            abort(400, 'Club slug missing');
        }

        $club = Club::where('slug', $clubSlug)->first();
        if (!$club) {
            abort(404, 'Club not found');
        }

        return $club;
    }

    public function getHistory(Request $request)
    {
        $club = $this->checkAccess($request);
        
        $userId = $request->user()->id;

        // 1. Fetch Checked In Events (Paginated)
        $events = DB::table('guestlist as g')
            ->join('events as e', 'g.event_id', '=', 'e.id')
            ->where('g.client_id', $userId)
            ->where('e.club_id', $club->id)
            ->where('g.status', 'checked_in')
            ->orderBy('g.checked_in_at', 'desc')
            ->orderBy('e.date', 'desc')
            ->select('e.id', 'e.name as event_name', 'e.date as event_date', 'e.image_url', 'g.checked_in_at')
            ->paginate(15, ['*'], 'events_page');

        $events->getCollection()->transform(function ($event) {
            if ($event->image_url && strpos($event->image_url, 'http') !== 0) {
                $event->image_url = '/' . ltrim(str_replace('/api/', '', $event->image_url), '/');
            }
            return $event;
        });

        // 2. Fetch Points History using UNION for proper pagination
        $transactions = DB::table('points_transactions')
            ->where('user_id', $userId)
            ->where('club_id', $club->id)
            ->where('transaction_type', '!=', 'reward_redemption')
            ->select('id', 'points', 'transaction_type', 'amount_spent', 'created_at', DB::raw("NULL as reward_name"));

        $history = DB::table('reward_redemptions as rr')
            ->join('rewards as r', 'rr.reward_id', '=', 'r.id')
            ->where('rr.user_id', $userId)
            ->where('r.club_id', $club->id)
            ->select('rr.id', DB::raw('(-1 * rr.points_spent) as points'), DB::raw("'reward_redemption' as transaction_type"), DB::raw('0.00 as amount_spent'), 'rr.redeemed_at as created_at', 'rr.reward_name')
            ->union($transactions)
            ->orderBy('created_at', 'desc')
            ->paginate(15, ['*'], 'history_page');

        $history->getCollection()->transform(function ($tx) {
            return [
                'transaction_type' => $tx->transaction_type,
                'points' => (int) $tx->points,
                'amount_spent' => $tx->amount_spent,
                'created_at' => $tx->created_at,
                'event_name' => '',
                'description' => $tx->transaction_type === 'reward_redemption' ? 'Prémio: ' . $tx->reward_name : ($tx->transaction_type === 'purchase' ? 'Compra no Bar' : 'Ajuste')
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'events' => $events,
                'transactions' => $history
            ]
        ]);
    }
}
