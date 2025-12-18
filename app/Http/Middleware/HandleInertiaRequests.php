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
        $user = $request->user();

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
                'user' => $user,
                'member' => $member
            ],
            
            'memberUnreadNotificationCount' => $memberUnreadNotificationCount
        ];
    }
}
