/**
 * useNotificationStream Hook
 *
 * Manages real-time notifications via Server-Sent Events with exponential
 * backoff reconnection and proper connection-state tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotifications,
  Notification,
} from '@/api/notificationsApi';

// Reconnection strategy constants
const MAX_RETRIES    = 5;
const BASE_BACKOFF   = 2_000;   // 2 s initial backoff
const MAX_BACKOFF    = 30_000;  // cap at 30 s

interface UseNotificationStreamOptions {
  autoConnect?: boolean;
  onNotification?: (notification: Notification) => void;
}

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const { autoConnect = true, onNotification } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [isConnected,   setIsConnected]   = useState(false);

  const eventSourceRef        = useRef<EventSource | null>(null);
  const reconnectTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef         = useRef(0);
  // Stable ref to the latest onNotification so connect() closure never goes stale
  const onNotificationRef     = useRef(onNotification);
  useEffect(() => { onNotificationRef.current = onNotification; }, [onNotification]);

  // ── Internal cleanup helper ───────────────────────────────────────────────
  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    // Bail if already open — EventSource.OPEN === 1
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    // Close any stale/errored source before opening a fresh one.
    // Without this, the guard above would block reconnection because
    // a CLOSED EventSource (readyState 2) still occupies the ref.
    closeStream();

    if (retryCountRef.current >= MAX_RETRIES) {
      console.warn('[NotificationStream] Max retries reached — stopping reconnection.');
      return;
    }

    try {
      const es = subscribeToNotifications({
        onOpen: () => {
          // Connection confirmed — reset backoff counter
          retryCountRef.current = 0;
          setIsConnected(true);
        },

        onNotification: (notification) => {
          setNotifications((prev) => {
            // Deduplicate: skip if this id already exists (can happen when the
            // initial REST fetch and the SSE stream overlap on the same event)
            if (notification.id && prev.some((n) => n.id === notification.id)) {
              return prev;
            }
            return [notification, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
          onNotificationRef.current?.(notification);
        },

        onError: (readyState) => {
          setIsConnected(false);

          if (readyState === EventSource.CONNECTING) {
            // Browser's built-in auto-retry is running — do nothing.
            // If the browser succeeds, `onOpen` will fire and reset state.
            // If it keeps failing it will eventually emit readyState CLOSED.
            return;
          }

          // readyState CLOSED: server rejected (401, 404, network gone).
          // Browser will NOT retry; we schedule our own with exponential backoff.

          // Clear the dead source so the next connect() can proceed
          eventSourceRef.current = null;

          retryCountRef.current += 1;

          if (retryCountRef.current >= MAX_RETRIES) {
            console.warn('[NotificationStream] Max retries reached — not scheduling further reconnects.');
            return;
          }

          const delay = Math.min(BASE_BACKOFF * 2 ** (retryCountRef.current - 1), MAX_BACKOFF);

          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connect();
          }, delay);
        },
      });

      eventSourceRef.current = es;
      // Do NOT set isConnected(true) here — wait for the 'open' event.
      // Setting it synchronously before the connection is established causes
      // a false-positive flash when the server subsequently rejects.
    } catch (err) {
      console.error('[NotificationStream] Failed to create EventSource:', err);
      setIsConnected(false);
    }
  }, [closeStream]);

  // ── Disconnect (public) ───────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    retryCountRef.current = MAX_RETRIES; // prevent auto-reconnect after explicit close
    closeStream();
    setIsConnected(false);
  }, [closeStream]);

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
    if (autoConnect) connect();
    return () => { closeStream(); };
    // connect and closeStream are stable (no deps that change)
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
