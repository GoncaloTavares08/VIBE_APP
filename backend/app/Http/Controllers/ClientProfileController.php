<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ClientProfile;
use App\Models\UserClubAccess;
use App\Models\PointsTransaction;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ClientProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        
        $profile = ClientProfile::with('gallery_photos')->firstOrCreate(
            ['user_id' => $user->id]
        );

        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;
        
        $profileData = $profile->toArray();
        if (!$profile->profile_photo_path) {
            $rp = \App\Models\RpProfile::where('user_id', $user->id)->first();
            if ($rp && $rp->profile_image_url) {
                $profileData['profile_photo_path'] = $rp->profile_image_url;
            }
        }
        $profileData['points'] = 0;
        $profileData['weekly_points'] = 0;
        $profileData['role'] = null;

        if ($clubSlug) {
            $club = \App\Models\Club::where('slug', $clubSlug)->first();
            
            if ($club) {
                $access = UserClubAccess::where('user_id', $user->id)
                    ->where('club_id', $club->id)
                    ->first();
                
                if ($access) {
                    $profileData['points'] = $access->points;
                    $profileData['role'] = $access->role;

                    // Weekly Points Calculation
                    $startOfWeek = now()->startOfWeek();
                    $weeklyPoints = PointsTransaction::where('user_id', $user->id)
                        ->where('club_id', $club->id)
                        ->where('created_at', '>=', $startOfWeek)
                        ->sum('points');
                    
                    $profileData['weekly_points'] = $weeklyPoints;
                    
                    // Global Rank Calculation
                    $globalRank = UserClubAccess::where('club_id', $club->id)
                        ->where('points', '>', $access->points)
                        ->count() + 1;
                    $profileData['global_rank'] = $globalRank;
                    
                    // Total Parties Count (all checked-in events in this club)
                    $totalParties = \Illuminate\Support\Facades\DB::table('guestlist as g')
                        ->join('events as e', 'g.event_id', '=', 'e.id')
                        ->where('g.client_id', $user->id)
                        ->where('e.club_id', $club->id)
                        ->where('g.status', 'checked_in')
                        ->count();
                    $profileData['total_parties'] = $totalParties;

                    // Party History (last 4 checked in events for thumbnails)
                    $partyHistory = \Illuminate\Support\Facades\DB::table('guestlist as g')
                        ->join('events as e', 'g.event_id', '=', 'e.id')
                        ->where('g.client_id', $user->id)
                        ->where('e.club_id', $club->id)
                        ->where('g.status', 'checked_in')
                        ->orderBy('g.checked_in_at', 'desc')
                        ->take(4)
                        ->select('e.id', 'e.name', 'e.date', 'e.image_url')
                        ->get();
                    $profileData['party_history'] = $partyHistory;
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $profileData
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $profile = ClientProfile::firstOrCreate(['user_id' => $user->id]);

        $validated = $request->validate([
            'name' => 'nullable|string|min:2|max:255',
            'bio' => 'nullable|string',
            'instagram' => 'nullable|string',
            'birthdate' => 'nullable|date',
            'gender' => 'nullable|string',
            'gender_preference' => 'nullable|string',
            'ghost_mode' => 'nullable|boolean',
            'photo' => 'nullable|image|max:5120'
        ]);

        if ($request->hasFile('photo')) {
            // Delete old photo from disk if it exists
            if ($profile->profile_photo_path && !str_starts_with($profile->profile_photo_path, 'http')) {
                $oldPath = str_replace('storage/', '', $profile->profile_photo_path);
                Storage::disk('public')->delete($oldPath);
            }
            
            $file = $request->file('photo');
            $datePath = date('Y/m/d');
            $uniqid = uniqid('profile_');
            $ext = $file->getClientOriginalExtension() ?: 'jpg';
            
            $tempPath = "temp/{$uniqid}.{$ext}";
            Storage::disk('public')->put($tempPath, file_get_contents($file->getRealPath()));
            
            $finalPath = "profiles/clients/{$datePath}/{$uniqid}.webp";
            
            \App\Jobs\ProcessImageJob::dispatch($tempPath, $finalPath, \App\Models\ClientProfile::class, $profile->id, 'profile_photo_path');

            $validated['profile_photo_path'] = 'storage/' . $tempPath;
        }
        unset($validated['photo']);

        if (isset($validated['name'])) {
            $user->update(['name' => $validated['name']]);
            unset($validated['name']);
        }

        $profile->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Perfil atualizado com sucesso!',
            'data' => $profile
        ]);
    }

    public function uploadGallery(Request $request)
    {
        $user = $request->user();
        $profile = ClientProfile::firstOrCreate(['user_id' => $user->id]);

        $request->validate([
            'photo' => 'required|image|max:5120'
        ]);

        $count = \App\Models\ClientProfilePhoto::where('client_profile_id', $profile->id)->count();
        if ($count >= 6) {
            return response()->json(['status' => 'error', 'message' => 'Máximo de 6 fotos atingido.'], 400);
        }

        $file = $request->file('photo');
        $datePath = date('Y/m/d');
        $uniqid = uniqid('gallery_');
        $ext = $file->getClientOriginalExtension() ?: 'jpg';
        
        $tempPath = "temp/{$uniqid}.{$ext}";
        Storage::disk('public')->put($tempPath, file_get_contents($file->getRealPath()));
        
        $finalPath = "profiles/clients/{$datePath}/{$uniqid}.webp";

        // Calculate next order
        $nextOrder = \App\Models\ClientProfilePhoto::where('client_profile_id', $profile->id)->max('photo_order') + 1;

        $photo = \App\Models\ClientProfilePhoto::create([
            'client_profile_id' => $profile->id,
            'photo_path' => 'storage/' . $tempPath,
            'photo_order' => $nextOrder
        ]);

        \App\Jobs\ProcessImageJob::dispatch($tempPath, $finalPath, \App\Models\ClientProfilePhoto::class, $photo->id, 'photo_path');

        return response()->json([
            'status' => 'success',
            'message' => 'Foto adicionada à galeria!',
            'data' => $photo
        ]);
    }

    public function deleteGallery($id, Request $request)
    {
        $user = $request->user();
        $profile = ClientProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            return response()->json(['status' => 'error', 'message' => 'Perfil não encontrado.'], 404);
        }

        $photo = \App\Models\ClientProfilePhoto::where('id', $id)
            ->where('client_profile_id', $profile->id)
            ->first();

        if (!$photo) {
            return response()->json(['status' => 'error', 'message' => 'Foto não encontrada.'], 404);
        }

        // Delete from storage (need to strip 'storage/' prefix)
        $storagePath = str_replace('storage/', '', $photo->photo_path);
        Storage::disk('public')->delete($storagePath);

        $photo->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Photo deleted successfully'
        ]);
    }

    public function deletePhoto(Request $request)
    {
        $user = $request->user();
        $profile = ClientProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            return response()->json(['status' => 'error', 'message' => 'Perfil não encontrado.'], 404);
        }

        if ($profile->profile_photo_path && !str_starts_with($profile->profile_photo_path, 'http')) {
            $storagePath = str_replace('storage/', '', $profile->profile_photo_path);
            Storage::disk('public')->delete($storagePath);
        }

        $profile->profile_photo_path = null;
        $profile->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Foto de perfil removida com sucesso'
        ]);
    }

    public function getPoints(Request $request)
    {
        $user = $request->user();
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;

        if (!$clubSlug) {
            return response()->json([
                'status' => 'error',
                'message' => 'Club ID is required in headers.'
            ], 400);
        }

        $club = \App\Models\Club::where('slug', $clubSlug)->first();

        if (!$club) {
            return response()->json([
                'status' => 'error',
                'message' => 'Club not found.'
            ], 404);
        }

        $access = \App\Models\UserClubAccess::where('user_id', $user->id)
            ->where('club_id', $club->id)
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => [
                'points' => $access ? $access->points : 0
            ]
        ]);
    }

    public function checkUsername(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255'
        ]);

        $exists = \App\Models\User::where('username', $validated['username'])
            ->where('id', '!=', $request->user()->id)
            ->exists();

        return response()->json([
            'status' => 'success',
            'available' => !$exists
        ]);
    }
}
