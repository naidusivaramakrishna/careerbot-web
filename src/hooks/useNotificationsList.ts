/**
 * useNotificationsList Hook
 *
 * Manages paginated notifications list
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  Notification,
  NotificationListResponse,
} from '@/api/notificationsApi';

export function useNotificationsList(initialPage: number = 1, limit: number = 20) {
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchNotifications = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNotifications(page, limit);
      setData(response);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(initialPage);
  }, [initialPage, fetchNotifications]);

  const goToPage = useCallback((page: number) => {
    if (data && page > 0 && page <= data.pagination.total_pages) {
      fetchNotifications(page);
    }
  }, [data, fetchNotifications]);

  const nextPage = useCallback(() => {
    if (data?.pagination.has_next) {
      goToPage(currentPage + 1);
    }
  }, [data, currentPage, goToPage]);

  const prevPage = useCallback(() => {
    if (data?.pagination.has_prev) {
      goToPage(currentPage - 1);
    }
  }, [data, currentPage, goToPage]);

  return {
    notifications: data?.items || [],
    unreadCount: data?.unread_count || 0,
    pagination: data?.pagination || {
      page: 1,
      limit,
      total_pages: 0,
      has_next: false,
      has_prev: false,
    },
    loading,
    error,
    currentPage,
    goToPage,
    nextPage,
    prevPage,
    refetch: () => fetchNotifications(currentPage),
  };
}
