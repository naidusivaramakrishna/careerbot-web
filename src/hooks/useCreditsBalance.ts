/**
 * useCreditsBalance Hook
 *
 * Fetches and manages user credit balance with optional auto-refresh.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCreditsBalance, CreditsBalance } from '@/api/creditsApi';

interface UseCreditsBalanceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useCreditsBalance(options: UseCreditsBalanceOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [data, setData] = useState<CreditsBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditsBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const creditsData = await getCreditsBalance();
      setData(creditsData);
    } catch (err) {
      console.error('Failed to fetch credits balance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credits balance';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCreditsBalance();
  }, [fetchCreditsBalance]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchCreditsBalance();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchCreditsBalance]);

  return {
    data,
    loading,
    error,
    refetch: fetchCreditsBalance,
  };
}
