<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\MemberNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ClientNotificationController extends Controller
{
    public function index(): \Inertia\Response
    {
        return Inertia::render('Client/ClientNotification');
    }

    /**
     * GET /client/notifications/list
     * Supports ?preview=1 for the sidebar bell dropdown (returns flat array, no pagination).
     * Full paginated list for the Notifications page.
     */
    public function list(Request $request): JsonResponse
    {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $memberId = $member->id;
        $status   = (string) $request->string('status', 'all');
        $type     = (string) $request->string('type', 'all');
        $perPage  = max(1, (int) $request->integer('perPage', 10));
        $page     = max(1, (int) $request->integer('page', 1));
        $preview  = $request->boolean('preview', false);

        $query = MemberNotification::where('memberId', $memberId)
            ->orderByDesc('created_at');

        // STATUS FILTER
        if ($status === 'read') {
            $query->where('isRead', true);
        } elseif ($status === 'unread') {
            $query->where('isRead', false);
        }

        // TYPE FILTER
        if ($type !== 'all' && $type !== '') {
            $query->where('type', $type);
        }

        // PREVIEW MODE — top-right bell dropdown
        if ($preview) {
            try {
                $notifications = $query->limit(5)->get();

                return response()->json(
                    $notifications
                        ->map(fn (MemberNotification $n) => $this->transformNotification($n))
                        ->values()
                        ->all()
                );
            } catch (\Exception $e) {
                Log::error('Notification preview error: ' . $e->getMessage());
                return response()->json([], 200); // Graceful empty fallback for sidebar
            }
        }

        // FULL PAGINATED LIST
        try {
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            // FIX: also return unread count so frontend badge stays in sync
            $unreadCount = MemberNotification::where('memberId', $memberId)
                ->where('isRead', false)
                ->count();

            return response()->json([
                'data'        => $paginator->getCollection()
                    ->map(fn (MemberNotification $n) => $this->transformNotification($n))
                    ->values()
                    ->all(),
                'meta'        => [
                    'currentPage' => $paginator->currentPage(),
                    'perPage'     => $paginator->perPage(),
                    'lastPage'    => $paginator->lastPage(),
                    'total'       => $paginator->total(),
                    'unreadCount' => $unreadCount,
                ],
                'filters'     => [
                    'status'  => $status,
                    'type'    => $type,
                    'perPage' => $perPage,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Notification list error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to load notifications.'], 500);
        }
    }

    /**
     * POST /client/notifications/{id}/read
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $notification = MemberNotification::where('id', $id)
                ->where('memberId', $member->id)
                ->first();

            if (!$notification) {
                return response()->json(['message' => 'Notification not found.'], 404);
            }

            if (!$notification->isRead) {
                $notification->isRead = true;
                $notification->readAt = now();
                $notification->save();
            }

            // FIX: return updated unread count so the sidebar badge updates immediately
            $unreadCount = MemberNotification::where('memberId', $member->id)
                ->where('isRead', false)
                ->count();

            return response()->json([
                'message'      => 'Marked as read.',
                'notification' => $this->transformNotification($notification),
                'unreadCount'  => $unreadCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Mark as read error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to mark as read.'], 500);
        }
    }

    /**
     * POST /client/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $updated = MemberNotification::where('memberId', $member->id)
                ->where('isRead', false)
                ->update([
                    'isRead' => true,
                    'readAt' => now(),
                ]);

            return response()->json([
                'message'      => 'All notifications marked as read.',
                'updatedCount' => $updated,
                'unreadCount'  => 0,
            ]);
        } catch (\Exception $e) {
            Log::error('Mark all as read error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update notifications.'], 500);
        }
    }

    /**
     * Safe transform — only exposes what the frontend needs.
     * FIX: removed dead camelCase fallback for created_at (Eloquent always uses snake_case).
     */
    protected function transformNotification(MemberNotification $notification): array
    {
        $created = $notification->created_at
            ? Carbon::parse($notification->created_at)
            : null;

        return [
            'id'         => $notification->id,
            'title'      => (string) ($notification->title   ?? ''),
            'message'    => (string) ($notification->message ?? ''),
            'type'       => $notification->type    ?? 'general',
            'isRead'     => (bool)   $notification->isRead,
            'linkUrl'    => $notification->linkUrl ?? null,
            'date'       => $created?->format('M d, Y'),
            'time'       => $created?->format('h:i A'),
            'createdAgo' => $created?->diffForHumans(),
        ];
    }
}