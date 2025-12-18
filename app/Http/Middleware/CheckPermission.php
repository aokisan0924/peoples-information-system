<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user('admin');

        if (!$user) {
            abort(403, 'Unauthorized');
        }

        // 1. Super Admin has access to EVERYTHING
        if ($user->role === 'super-admin') {
            return $next($request);
        }

        // 2. Check if the user has the specific permission in their array
        // We assume $user->permissions is an array like ['view_loans', 'manage_members']
        $userPermissions = $user->permissions ?? [];

        if (in_array($permission, $userPermissions)) {
            return $next($request);
        }

        abort(403, 'You do not have permission to access this page.');
    }
}