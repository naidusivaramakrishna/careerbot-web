/**
 * Notifications API
 *
 * Handles real-time notifications via Server-Sent Events (SSE)
 */

import { httpClient } from '@/lib/http';

export interface NotificationMetadata {
  [key: string]: string | number | boolean;
}

export interface Notification {
  id: string;
  type: 'job' | 'credit' | 'system' | 'interview' | 'resume' | string;
  title: string;
  body: string;
  action_url: string;
  metadata: NotificationMetadata;
  timestamp: string;
  read: boolean;
}

export interface NotificationEvent {
  event: 'connected' | 'heartbeat' | 'notification';
  data?: Notification;
  status?: string;
  user_id?: string;
}

export interface SSECallbacks {
  onNotification: (notification: Notification) => void;
  onOpen?: () => void;
  onError?: (readyState: number) => void;
}

/**
 * Connect to the real-time notification stream via Server-Sent Events.
 *
 * readyState values passed to onError:
 *   EventSource.CONNECTING (0) — browser auto-retry in progress (transient)
 *   EventSource.CLOSED     (2) — server rejected permanently (401, 404, etc.)
 */
export function subscribeToNotifications(callbacks: SSECallbacks): EventSource {
  const { onNotification, onOpen, onError } = callbacks;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';

  const eventSource = new EventSource(`${baseUrl}/notifications/stream`, {
    withCredentials: true,
  });

  // Fires when the connection is established (or re-established after a retry)
  eventSource.addEventListener('open', () => {
    onOpen?.();
  });

  eventSource.addEventListener('notification', (event: Event) => {
    try {
      const messageEvent = event as MessageEvent;
      const notification: Notification = JSON.parse(messageEvent.data);
      onNotification(notification);
    } catch {
      // Malformed payload — swallow silently, don't crash the stream
    }
  });

  eventSource.addEventListener('heartbeat', () => {
    // Keep-alive ping, no action needed
  });

  eventSource.addEventListener('error', (event: Event) => {
    const es = event.target as EventSource;
    const state = es.readyState;

    // readyState CONNECTING (0): browser is already auto-retrying — this is
    // normal and happens every time the connection drops momentarily. Do NOT
    // log or reconnect manually; the browser handles it.
    //
    // readyState CLOSED (2): server actively rejected the connection (401, 404,
    // stream limit exceeded, etc.). The browser will NOT retry — we must handle it.
    if (state === EventSource.CLOSED) {
      // Only warn on permanent closure — not on transient retries
      console.warn('[NotificationStream] Connection closed by server (readyState=CLOSED). Will retry with backoff.');
    }

    onError?.(state);
  });

  return eventSource;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await httpClient.patch(`/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await httpClient.post('/notifications/read-all');
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await httpClient.delete(`/notifications/${notificationId}`);
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(): Promise<void> {
  await httpClient.delete('/notifications');
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<{ unread_count: number }> {
  const response = await httpClient.get<{ unread_count: number }>('/notifications/count');
  return response.data;
}

/**
 * Notification list response
 */
export interface NotificationListResponse {
  unread_count: number;
  items: Notification[];
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Get paginated list of notifications
 */
export async function getNotifications(page: number = 1, limit: number = 20): Promise<NotificationListResponse> {
  const response = await httpClient.get<NotificationListResponse>('/notifications', {
    params: { page, limit },
  });
  return response.data;
}
