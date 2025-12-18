<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 1. Get the authenticated admin user
        $user = $request->user('admin');

        // 2. Check if user is logged in
        if (! $user) {
            abort(403, 'Unauthorized access.');
        }

        // 3. Check if the user's role matches any of the allowed roles
        // This allows usage like: middleware('role:super-admin,manager')
        if (! in_array($user->role, $roles)) {
            abort(403, 'You do not have permission to access this page.');
        }

        return $next($request);
    }
}