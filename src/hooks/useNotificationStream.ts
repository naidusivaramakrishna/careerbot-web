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

  // Connect to notification stream
  const connect = useCallback(async () => {
    if (eventSourceRef.current) return;

    try {
      // Resolve user_id via server-side route (reads httpOnly cookie)
      if (!userIdRef.current) {
        const res = await fetch('/api/auth/stream-token');
        if (!res.ok) {
          // Not authenticated — do not connect or schedule retries
          return;
        }
        const data = await res.json() as { user_id: string };
        userIdRef.current = data.user_id;
      }
      connectWithUserId(userIdRef.current);
    } catch (err) {
      console.error('Failed to resolve stream token:', err);
    }
  }, [connectWithUserId]);

  // Disconnect from notification stream
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

  // Fetch existing notifications on mount
  useEffect(() => {
    getNotifications(1, 4)
      .then(({ items, unread_count }) => {
        setNotifications(items);
        setUnreadCount(unread_count);
      })
      .catch(() => {/* non-fatal */});
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const remove = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === notificationId);
        if (notif && !notif.read) {
          setUnreadCount((prev) => Math.max(prev - 1, 0));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
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
