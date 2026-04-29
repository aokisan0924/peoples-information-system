<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Auth\AuthenticationException;

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

        // IF SESSION IS DEAD -> Throw proper Auth Exception to force a redirect
        if (! $user) {
            throw new AuthenticationException('Unauthenticated.', ['admin'], route('admin.login'));
        }

        // 3. Check if the user's role matches
        if (! in_array($user->role, $roles)) {
            abort(403, 'You do not have permission to access this page.');
        }

        return $next($request);
    }
}