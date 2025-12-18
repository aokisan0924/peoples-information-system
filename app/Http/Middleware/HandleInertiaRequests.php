<?php

namespace App\Http\Middleware;

use App\Models\MemberNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Check for Admin User specifically
        $adminUser = $request->user('admin'); 
        
        // Fallback to standard user if admin guard isn't active (e.g. standard web routes)
        $user = $adminUser ?? $request->user();

        $member = Auth::guard('member')->user();

        $memberUnreadNotificationCount = 0;

        if ($member) {
            $memberUnreadNotificationCount = MemberNotification::where('memberId', $member->id)
                ->where('isRead', false)
                ->count();
        }

        return [
            ...parent::share($request),
            'auth' => [
                // Manually build the user array to ENSURE role is sent
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'branch' => $user->branch,
                    'permissions' => $user->permissions ?? [],
                ] : null,
                
                'member' => $member
            ],
            
            'memberUnreadNotificationCount' => $memberUnreadNotificationCount
        ];
    }
}