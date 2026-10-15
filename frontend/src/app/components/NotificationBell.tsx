import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import {
  notificationService,
  type NotificationItem,
} from "../../services/notificationService";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

const POLL_INTERVAL_MS = 30000;

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      // Silent — the bell should never break the page.
    }
  }, [isAuthenticated]);

  const loadItems = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationService.getMine();
      setItems(res.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Poll the unread count while authenticated.
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshCount();
    const id = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, refreshCount]);

  // Load the list when the popover opens.
  useEffect(() => {
    if (open) loadItems();
  }, [open, loadItems]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          className="relative text-neutral-600 hover:text-neutral-900 transition-colors p-1"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-white text-[11px] leading-[18px] text-center ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <span className="font-medium text-neutral-900">Notifications</span>
          {items.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAll}
              className="text-xs text-orange-600 hover:text-orange-700"
            >
              Mark all read
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-500">
              You have no notifications yet.
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {items.map((n) => (
                <li
                  key={n.notificationId}
                  className={`px-4 py-3 flex items-start gap-3 ${
                    n.isRead ? "bg-white" : "bg-orange-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-800 break-words">{n.message}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      aria-label="Mark as read"
                      onClick={() => handleMarkRead(n.notificationId)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
