<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Auth\AuthenticationException;

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

        // IF SESSION IS DEAD -> Throw proper Auth Exception to force a redirect
        if (!$user) {
            throw new AuthenticationException('Unauthenticated.', ['admin'], route('admin.login'));
        }

        // 1. Super Admin has access to EVERYTHING
        if ($user->role === 'super-admin') {
            return $next($request);
        }

        // 2. Check if the user has the specific permission
        $userPermissions = $user->permissions ?? [];

        if (in_array($permission, $userPermissions)) {
            return $next($request);
        }

        abort(403, 'You do not have permission to access this page.');
    }
}