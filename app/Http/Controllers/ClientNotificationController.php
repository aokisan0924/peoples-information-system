<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ClientNotification;
use App\Models\MemberNotification;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClientNotificationController extends Controller
{
    public function index() {
        return Inertia::render('Client/ClientNotification');
    }

    public function list(Request $request): JsonResponse
    {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $memberId = $member->id;

        $status  = (string) $request->string('status', 'all');
        $type    = (string) $request->string('type', 'all');
        $perPage = (int) $request->integer('perPage', 10);
        $page    = (int) $request->integer('page', 1);
        $preview = $request->boolean('preview', false);

        if ($perPage <= 0) {
            $perPage = 10;
        }

        $query = MemberNotification::where('memberId', $memberId)
            ->orderByDesc('created_at');

        // status filter
        if ($status === 'read') {
            $query->where('isRead', true);
        } elseif ($status === 'unread') {
            $query->where('isRead', false);
        }

        // type filter
        if ($type !== 'all' && $type !== '') {
            $query->where('type', $type);
        }

        // 🔹 PREVIEW: for top-right bell dropdown in SidebarLayout.jsx
        if ($preview) {
            $notifications = $query->limit(5)->get();

            $data = $notifications
                ->map(fn (MemberNotification $notification) => $this->transformNotification($notification))
                ->values()
                ->all();

            // Sidebar expects an array (no { data: ... })
            return response()->json($data);
        }

        // 🔹 FULL PAGINATED LIST: for ClientNotifications.jsx page
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $data = $paginator->getCollection()
            ->map(fn (MemberNotification $notification) => $this->transformNotification($notification))
            ->values()
            ->all();

        $meta = [
            'currentPage' => $paginator->currentPage(),
            'perPage'     => $paginator->perPage(),
            'lastPage'    => $paginator->lastPage(),
            'total'       => $paginator->total(),
        ];

        $filters = [
            'status'  => $status,
            'type'    => $type,
            'perPage' => $perPage,
        ];

        return response()->json([
            'data'    => $data,
            'meta'    => $meta,
            'filters' => $filters,
        ]);
    }

    /**
     * POST /client/notifications/{id}/read
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $notification = MemberNotification::where('id', $id)
            ->where('memberId', $member->id)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        if (!$notification->isRead) {
            $notification->isRead = true;
            $notification->readAt = now();
            $notification->save();
        }

        return response()->json([
            'message'      => 'Notification marked as read',
            'notification' => $this->transformNotification($notification),
        ]);
    }

    /**
     * POST /client/notifications/read-all
     * Mark all notifications as read for the current member.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $member = Auth::guard('member')->user();

        if (!$member) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        MemberNotification::where('memberId', $member->id)
            ->where('isRead', false)
            ->update([
                'isRead' => true,
                'readAt' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Convert model to safe array for frontend only.
     * No raw model objects returned.
     */
    protected function transformNotification(MemberNotification $notification): array
    {
        $createdAt = $notification->created_at ?? $notification->createdAt ?? null;
        $created   = $createdAt instanceof Carbon
            ? $createdAt
            : ($createdAt ? Carbon::parse($createdAt) : null);

        return [
            'id'         => $notification->id,
            'title'      => (string) $notification->title,
            'message'    => (string) $notification->message,
            'type'       => $notification->type ?? null,
            'isRead'     => (bool) $notification->isRead,
            'linkUrl'    => $notification->linkUrl ?? null,
            'date'       => $created ? $created->format('M d, Y') : null,
            'time'       => $created ? $created->format('h:i A') : null,
            'createdAgo' => $created ? $created->diffForHumans() : null,
        ];
    }
}
