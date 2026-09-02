/**
 * useUnreadNotificationsCount Hook
 *
 * Manages unread notifications count with optional auto-refresh
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getUnreadNotificationCount } from '@/api/notificationsApi';

interface UseUnreadNotificationsCountOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useUnreadNotificationsCount(options: UseUnreadNotificationsCountOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUnreadNotificationCount({ skipAuthRedirect: true });
      setUnreadCount(response.unread_count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch unread count';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    error,
    refetch: fetchUnreadCount,
  };
}
