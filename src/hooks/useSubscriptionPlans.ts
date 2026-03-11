/**
 * useSubscriptionPlans Hook
 *
 * Fetches and manages subscription plans.
 *
 * Features:
 * - Fetches all available plans on mount
 * - Caches plans in component state
 * - Provides loading and error states
 * - Manual refetch capability
 *
 * Usage:
 * const { plans, loading, error, refetch } = useSubscriptionPlans();
 *
 * if (loading) return <Loader />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * return (
 *   <div>
 *     {plans.map(plan => (
 *       <PlanCard key={plan.plan_id} plan={plan} />
 *     ))}
 *   </div>
 * );
 */

import { useState, useEffect, useCallback } from 'react';
import { getSubscriptionPlans, SubscriptionPlan, SubscriptionPlansResponse } from '@/api/subscriptionApi';

interface UseSubscriptionPlansOptions {
  autoFetch?: boolean;
}

export function useSubscriptionPlans(options: UseSubscriptionPlansOptions = {}) {
  const { autoFetch = true } = options;

  const [data, setData] = useState<SubscriptionPlansResponse | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getSubscriptionPlans();
      setData(result);
      setPlans(result.plans);
    } catch (err) {
      console.error('Failed to fetch subscription plans:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch subscription plans';
      setError(errorMessage);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchPlans();
    }
  }, [autoFetch, fetchPlans]);

  /**
   * Get plan by ID
   */
  const getPlanById = useCallback(
    (planId: string): SubscriptionPlan | undefined => {
      return plans.find((p) => p.plan_id === planId);
    },
    [plans]
  );

  /**
   * Get featured plans (popular/recommended)
   */
  const getFeaturedPlans = useCallback(() => {
    return plans.filter((p) => p.popular || p.recommended);
  }, [plans]);

  /**
   * Get plan by name
   */
  const getPlanByName = useCallback(
    (planName: string): SubscriptionPlan | undefined => {
      return plans.find((p) => p.plan_name === planName);
    },
    [plans]
  );

  return {
    plans,
    data,
    loading,
    error,
    refetch: fetchPlans,
    getPlanById,
    getFeaturedPlans,
    getPlanByName,
  };
}
