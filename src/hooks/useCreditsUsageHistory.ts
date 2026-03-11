/**
 * useCreditsUsageHistory Hook
 *
 * Fetches and manages credit usage history with pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCreditsUsage, CreditsUsageResponse } from '@/api/creditsApi';

interface UseCreditsUsageHistoryOptions {
  initialPage?: number;
  pageSize?: number;
}

export function useCreditsUsageHistory(
  options: UseCreditsUsageHistoryOptions = {},
) {
  const { initialPage = 1, pageSize = 20 } = options;

  const [data, setData] = useState<CreditsUsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const fetchUsageHistory = useCallback(
    async (page: number = currentPage) => {
      try {
        setLoading(true);
        setError(null);
        const usageData = await getCreditsUsage(page, pageSize);
        setData(usageData);
        setCurrentPage(page);
      } catch (err) {
        console.error('Failed to fetch credits usage history:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch usage history';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize],
  );

  // Initial fetch
  useEffect(() => {
    fetchUsageHistory(initialPage);
  }, [initialPage]);

  const goToNextPage = useCallback(() => {
    if (data?.pagination.has_next) {
      fetchUsageHistory(currentPage + 1);
    }
  }, [data?.pagination.has_next, currentPage, fetchUsageHistory]);

  const goToPreviousPage = useCallback(() => {
    if (data?.pagination.has_prev) {
      fetchUsageHistory(currentPage - 1);
    }
  }, [data?.pagination.has_prev, currentPage, fetchUsageHistory]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= (data?.pagination.total_pages || 1)) {
        fetchUsageHistory(page);
      }
    },
    [data?.pagination.total_pages, fetchUsageHistory],
  );

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages: data?.pagination.total_pages || 0,
    hasNextPage: data?.pagination.has_next || false,
    hasPreviousPage: data?.pagination.has_prev || false,
    totalItems: data?.total || 0,
    refetch: () => fetchUsageHistory(currentPage),
    goToNextPage,
    goToPreviousPage,
    goToPage,
  };
}
