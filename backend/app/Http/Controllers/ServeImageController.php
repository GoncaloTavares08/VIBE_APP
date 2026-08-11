<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class ServeImageController extends Controller
{
    public function serve(Request $request)
    {
        $file = $request->query('file');
        if (!$file) {
            return response()->json(['error' => 'No file specified'], 400);
        }

        // Security: Mitigate path traversal
        $file = str_replace(['../', '..\\', './', '.\\'], '', $file);
        
        if (preg_match('#\.\.[\\\/]#', $file)) {
             return response()->json(['error' => 'Invalid path'], 400);
        }
        
        if (str_starts_with($file, 'storage/')) {
            $file = substr($file, 8);
        }
        
        // Check new storage first
        $newPath = storage_path('app/public/' . $file);
        
        // Then check legacy api/uploads securely
        $legacyBasePath = realpath(base_path('../api'));
        $legacyPath = realpath(base_path('../api/' . $file));

        $servePath = null;

        if (File::exists($newPath) && File::isFile($newPath)) {
            $servePath = $newPath;
        } elseif ($legacyPath && $legacyBasePath && str_starts_with($legacyPath, $legacyBasePath) && File::exists($legacyPath) && File::isFile($legacyPath)) {
            $servePath = $legacyPath;
        }

        if (!$servePath) {
            return response()->json([
                'error' => 'File not found',
                'requested' => $file
            ], 404);
        }

        $mimeType = File::mimeType($servePath);
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

        if (!in_array($mimeType, $allowedTypes)) {
            return response()->json(['error' => 'Invalid file type'], 403);
        }

        return response()->file($servePath, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=31536000'
        ]);
    }
}
