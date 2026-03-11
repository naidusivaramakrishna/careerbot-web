/**
 * useCurrentSubscription Hook
 *
 * Fetches and manages the current user's subscription details.
 *
 * Features:
 * - Fetches current subscription on mount
 * - Caches subscription data in component state
 * - Provides loading and error states
 * - Manual refetch capability
 * - Auto-refresh support
 *
 * Usage:
 * const { subscription, loading, error, refetch } = useCurrentSubscription();
 *
 * if (loading) return <Loader />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * return (
 *   <div>
 *     <h2>{subscription?.plan_name}</h2>
 *     <p>Credits remaining: {subscription?.credits_remaining}</p>
 *   </div>
 * );
 */

import { useState, useEffect, useCallback } from 'react';
import { getCurrentSubscription, CurrentSubscription } from '@/api/subscriptionApi';

interface UseCurrentSubscriptionOptions {
  autoFetch?: boolean;
  refetchInterval?: number; // in milliseconds
}

export function useCurrentSubscription(options: UseCurrentSubscriptionOptions = {}) {
  const { autoFetch = true, refetchInterval = 60000 } = options; // Default refresh every 60 seconds

  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCurrentSubscription();
      setSubscription(result);
    } catch (err) {
      console.error('Failed to fetch current subscription:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch current subscription';
      setError(errorMessage);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchSubscription();
    }
  }, [autoFetch, fetchSubscription]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refetchInterval || !autoFetch) return;

    const interval = setInterval(() => {
      fetchSubscription();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, autoFetch, fetchSubscription]);

  /**
   * Check if user is on free plan
   */
  const isFreeUser = useCallback(() => {
    return subscription?.plan_id === 'FREE';
  }, [subscription]);

  /**
   * Check if subscription is active
   */
  const isActiveSubscription = useCallback(() => {
    return subscription?.status === 'active';
  }, [subscription]);

  /**
   * Get days remaining in billing cycle
   */
  const getDaysRemaining = useCallback(() => {
    if (!subscription?.expires_at) return null;
    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysRemaining);
  }, [subscription]);

  /**
   * Get credit usage percentage
   */
  const getCreditUsagePercentage = useCallback(() => {
    if (!subscription || subscription.credits_total === 0) return 0;
    return Math.round((subscription.credits_used / subscription.credits_total) * 100);
  }, [subscription]);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    isFreeUser,
    isActiveSubscription,
    getDaysRemaining,
    getCreditUsagePercentage,
  };
}
