import api from "../lib/api";

// --- Types ---

export interface NotificationItem {
  notificationId: number;
  type: string;
  message: string;
  relatedEntityId: number | null;
  isRead: boolean;
  createdAt: string;
}

// --- API Functions ---

export const notificationService = {
  /** All of the caller's notifications, newest first. */
  getMine: (unreadOnly = false) =>
    api.get<NotificationItem[]>("/api/notification", {
      params: unreadOnly ? { unreadOnly: true } : undefined,
    }),

  /** Unread count for the notification badge. */
  getUnreadCount: () => api.get<{ count: number }>("/api/notification/unread-count"),

  /** Mark a single notification read. */
  markRead: (id: number) => api.put(`/api/notification/${id}/read`),

  /** Mark all of the caller's notifications read. */
  markAllRead: () => api.put("/api/notification/read-all"),
};
