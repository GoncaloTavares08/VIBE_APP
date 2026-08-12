<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     * For API-only apps, always return null to trigger a JSON 401 response.
     */
    protected function redirectTo(Request $request): ?string
    {
        // API-only app: never redirect, always return null → AuthenticationException renders JSON 401
        return null;
    }
}
