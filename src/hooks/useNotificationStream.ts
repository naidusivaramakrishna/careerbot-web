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
// A stream that stayed open this long was healthy, so the next error starts
// the backoff over. Longer than the 30 s server heartbeat on purpose.
const STABLE_CONNECTION_MS = 60_000;

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
  // False after unmount, so a token fetch or reconnect timer that resolves
  // late cannot open a stream nobody will ever close.
  const mountedRef = useRef(false);

  const connectWithUserId = useCallback((userId: string) => {
    if (eventSourceRef.current || !mountedRef.current) return;

    try {
      let openedAt = 0;
      const source: EventSource = subscribeToNotifications(
        userId,
        (notification: Notification) => {
          reconnectAttemptsRef.current = 0;
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          onNotification?.(notification);
        },
        () => {
          // Close before dropping the ref. An EventSource reconnects on its
          // own after an error, so an unclosed one stays alive next to the one
          // the timer below opens; past the API's 3-streams-per-user cap
          // (sse_manager.py) they evict each other in a loop.
          source.close();
          if (eventSourceRef.current !== source) return;
          setIsConnected(false);
          eventSourceRef.current = null;

          // Only a stream that stayed up resets the backoff. One evicted
          // seconds after opening (more than 3 tabs) keeps climbing, so tabs
          // cannot keep evicting each other at the base rate.
          if (openedAt && Date.now() - openedAt >= STABLE_CONNECTION_MS) {
            reconnectAttemptsRef.current = 0;
          }

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
      source.addEventListener('open', () => { openedAt = Date.now(); });
      eventSourceRef.current = source;
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
      if (!mountedRef.current) return; // unmounted while the token was in flight
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
    getNotifications(1, 4, { skipAuthRedirect: true })
      .then(({ items, unread_count }) => {
        setNotifications(items);
        setUnreadCount(unread_count);
      })
      .catch(() => { /* non-fatal — UI shows empty state */ });
  }, []);

  // ── Auto-connect ──────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    if (autoConnect) void connect();
    return () => {
      mountedRef.current = false;
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
