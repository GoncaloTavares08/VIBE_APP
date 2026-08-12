<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Club;

class ClubController extends Controller
{
    // Replaces get_club_info.php
    public function getClubInfo(Request $request)
    {
        // Get slug from query parameter, fallback to header
        $rawSlug = $request->query('slug') ?? $request->header('X-Client-ID');
        $slug = $rawSlug ? strtolower($rawSlug) : null;

        if (!$slug) {
            return response()->json([
                'status' => 'error',
                'message' => 'Club slug não fornecido.'
            ], 400);
        }

        $club = Club::where('slug', $slug)
            ->where('is_active', 1)
            ->first();

        if (!$club) {
            return response()->json([
                'status' => 'error',
                'message' => 'Clube não encontrado.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'club' => [
                'id' => $club->id,
                'name' => $club->name,
                'slug' => $club->slug,
                'location' => $club->location
            ]
        ]);
    }

    public function getActiveClubs()
    {
        $clubs = Club::where('is_active', 1)
            ->inRandomOrder()
            ->limit(10)
            ->pluck('name');

        return response()->json([
            'status' => 'success',
            'data' => $clubs
        ]);
    }

    // Replaces user_clubs.php
    public function getUserClubs(Request $request, $userId)
    {
        $clubs = DB::table('clubs as c')
            ->join('user_club_access as uca', 'c.id', '=', 'uca.club_id')
            ->where('uca.user_id', $userId)
            ->where('c.is_active', 1)
            ->select(
                'c.id',
                'c.name',
                'c.slug',
                'c.location',
                'uca.role',
                'uca.points',
                'uca.joined_at'
            )
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $clubs
        ]);
    }

    public function verifyAccess(Request $request)
    {
        $userId = $request->input('user_id') ?? $request->user()->id;
        $rawSlug = $request->header('X-Client-ID');
        $clubSlug = $rawSlug ? strtolower($rawSlug) : null;

        if (!$clubSlug) {
            return response()->json([
                'has_access' => false,
                'message' => 'Nenhum clube especificado.'
            ]);
        }

        $club = Club::where('slug', $clubSlug)->where('is_active', 1)->first();

        if (!$club) {
            return response()->json([
                'has_access' => false,
                'message' => 'Clube não encontrado ou inativo.'
            ]);
        }

        $access = DB::table('user_club_access')
            ->where('user_id', $userId)
            ->where('club_id', $club->id)
            ->first();

        if (!$access) {
            return response()->json([
                'has_access' => false,
                'club' => ['name' => $club->name],
                'message' => 'Não tens acesso a este clube.'
            ]);
        }

        return response()->json([
            'has_access' => true,
            'club' => ['name' => $club->name],
            'role' => $access->role,
            'points' => $access->points,
            'joined_at' => $access->joined_at
        ]);
    }

    public function getPublicRps($slug)
    {
        $club = Club::where('slug', strtolower($slug))->where('is_active', 1)->first();

        if (!$club) {
            return response()->json([
                'status' => 'error',
                'message' => 'Clube não encontrado ou inativo.'
            ], 404);
        }

        $rps = DB::table('users as u')
            ->join('user_club_access as uca', 'u.id', '=', 'uca.user_id')
            ->leftJoin('rp_profiles as p', 'u.id', '=', 'p.user_id')
            ->where('uca.club_id', $club->id)
            ->where('uca.role', 'RP')
            ->select(
                'u.name',
                'p.username',
                'p.profile_image_url as avatar',
                'uca.points'
            )
            ->whereNotNull('p.username') // Only RPs with public profiles
            ->orderBy('uca.points', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $rps
        ]);
    }
}
