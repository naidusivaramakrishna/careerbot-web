import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotifications,
  Notification,
} from '@/api/notificationsApi';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 5000;

interface UseNotificationStreamOptions {
  autoConnect?: boolean;
  onNotification?: (notification: Notification) => void;
}

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const { autoConnect = true, onNotification } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const userIdRef = useRef<string | null>(null);

  const connectWithUserId = useCallback((userId: string) => {
    if (eventSourceRef.current) return;

    try {
      eventSourceRef.current = subscribeToNotifications(
        userId,
        (notification: Notification) => {
          reconnectAttemptsRef.current = 0;
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          onNotification?.(notification);
        },
        () => {
          setIsConnected(false);
          eventSourceRef.current = null;

          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.warn('[notifications] Max reconnect attempts reached, giving up.');
            return;
          }

          const delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWithUserId(userId);
          }, delay);
        }
      );
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to connect to notification stream:', err);
      setIsConnected(false);
    }
  }, [onNotification]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (eventSourceRef.current) return;

    try {
      if (!userIdRef.current) {
        const res = await fetch('/api/auth/stream-token');
        if (!res.ok) return; // Not authenticated — skip silently
        const data = await res.json() as { user_id: string };
        userIdRef.current = data.user_id;
      }
      connectWithUserId(userIdRef.current);
    } catch (err) {
      console.error('[NotificationStream] Failed to resolve stream token:', err);
    }
  }, [connectWithUserId]);

  // ── Disconnect (public) ───────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setIsConnected(false);
  }, []);

  // ── Fetch existing notifications on mount ─────────────────────────────────
  useEffect(() => {
    getNotifications(1, 4)
      .then(({ items, unread_count }) => {
        setNotifications(items);
        setUnreadCount(unread_count);
      })
      .catch(() => { /* non-fatal — UI shows empty state */ });
  }, []);

  // ── Auto-connect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoConnect) void connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  // ── Notification actions ──────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      // non-fatal
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // non-fatal
    }
  }, []);

  const remove = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === notificationId);
        if (target && !target.read) setUnreadCount((c) => Math.max(c - 1, 0));
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch {
      // non-fatal
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    remove,
  };
}
