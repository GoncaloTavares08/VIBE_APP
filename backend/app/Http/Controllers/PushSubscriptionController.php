<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeviceTokenRequest;
use App\Models\DeviceToken;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function subscribe(DeviceTokenRequest $request)
    {
        $validated = $request->validated();

        DeviceToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $request->user()->id,
                'platform' => $validated['platform'] ?? 'web',
            ]
        );

        return response()->json(['status' => 'success']);
    }

    public function unsubscribe(DeviceTokenRequest $request)
    {
        $validated = $request->validated();

        DeviceToken::where('user_id', $request->user()->id)
            ->where('token', $validated['token'])
            ->delete();

        return response()->json(['status' => 'success']);
    }
}
