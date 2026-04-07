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

/**
 * Connect to the real-time notification stream
 * Returns an EventSource that emits notifications
 */
export function subscribeToNotifications(
  onNotification: (notification: Notification) => void,
  onError?: (error: Event) => void,
  onOpen?: () => void,
): EventSource {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_BASE_URL) {
    console.warn('[careerbot] NEXT_PUBLIC_BASE_URL is not set — SSE notifications will not connect in production.');
  }
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';
  const eventSource = new EventSource(`${baseUrl}/notifications/stream`, {
    withCredentials: true,
  });

  eventSource.addEventListener('open', () => {
    onOpen?.();
  });

  eventSource.addEventListener('notification', (event: Event) => {
    try {
      const messageEvent = event as MessageEvent;
      const notification: Notification = JSON.parse(messageEvent.data);
      onNotification(notification);
    } catch (err) {
      console.error('Failed to parse notification:', err);
    }
  });

  eventSource.addEventListener('heartbeat', () => {
    // Keep-alive ping, no action needed
  });

  eventSource.addEventListener('error', (event: Event) => {
    const es = event.target as EventSource;
    const state = es?.readyState === EventSource.CLOSED ? 'CLOSED'
                : es?.readyState === EventSource.CONNECTING ? 'CONNECTING'
                : 'OPEN';
    console.warn(`Notification stream error (readyState: ${state})`);
    if (onError) {
      onError(event);
    }
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
