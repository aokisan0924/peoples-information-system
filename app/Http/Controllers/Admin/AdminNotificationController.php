<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\JsonResponse;

class AdminNotificationController extends Controller
{
    /**
     * Return the latest 20 notifications + unread count.
     * Polled by the sidebar every 30 seconds.
     */
    public function index(): JsonResponse {
        $notifications = AdminNotification::latest()
            ->limit(20)
            ->get(['id', 'type', 'title', 'message', 'linkUrl', 'relatedId', 'isRead', 'created_at']);

        $unreadCount = AdminNotification::where('isRead', false)->count();

        return response()->json([
            'notifications' => $notifications,
            'unreadCount'   => $unreadCount,
        ]);
    }

    /** Mark a single notification as read. */
    public function markRead(int $id): JsonResponse {
        AdminNotification::where('id', $id)->update(['isRead' => true]);
        return response()->json(['success' => true]);
    }

    /** Mark all notifications as read. */
    public function markAllRead(): JsonResponse {
        AdminNotification::where('isRead', false)->update(['isRead' => true]);
        return response()->json(['success' => true]);
    }
}