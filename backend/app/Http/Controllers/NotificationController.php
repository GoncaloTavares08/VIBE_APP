<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $notifications = $user->notifications()->take(50)->get()->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->data['type'] ?? 'system',
                'title' => $notification->data['title'] ?? $this->getTitle($notification->data),
                'description' => $notification->data['message'] ?? 'Notificação de Sistema',
                'timestamp' => $notification->created_at->diffForHumans(),
                'isRead' => !is_null($notification->read_at),
                'avatar' => $notification->data['avatar'] ?? null,
                'data' => $notification->data
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $notifications
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->find($id);
        
        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['status' => 'success']);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['status' => 'success']);
    }

    private function getTitle($data)
    {
        $type = $data['type'] ?? 'system';
        switch ($type) {
            case 'match': return 'Novo Match! 🔥';
            case 'registration': return 'Novo Cliente';
            case 'payment': return 'Pagamento Recebido';
            case 'event': return 'Lembrete de Evento';
            case 'team': return 'Atividade da Equipa';
            default: return 'Alerta de Sistema';
        }
    }
}
