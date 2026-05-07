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

  // Listen for inline credit updates (when API response includes credits_remaining)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ credits_remaining: number }>).detail;
      if (typeof detail?.credits_remaining === 'number') {
        setData((prev) =>
          prev ? { ...prev, credits_remaining: detail.credits_remaining } : prev
        );
      }
    };
    window.addEventListener('credits-updated', handler);
    return () => window.removeEventListener('credits-updated', handler);
  }, []);

  // Listen for re-fetch signal (when API response does NOT include credits_remaining)
  useEffect(() => {
    window.addEventListener('credits-fetch-required', fetchCreditsBalance);
    return () => window.removeEventListener('credits-fetch-required', fetchCreditsBalance);
  }, [fetchCreditsBalance]);

  // Refetch on window focus (universal fallback for any missed deduction)
  useEffect(() => {
    window.addEventListener('focus', fetchCreditsBalance);
    return () => window.removeEventListener('focus', fetchCreditsBalance);
  }, [fetchCreditsBalance]);

  return {
    data,
    loading,
    error,
    refetch: fetchCreditsBalance,
  };
}
