"use client";

/**
 * DashboardContext
 *
 * Centralised state for the authenticated user's dashboard.
 * - Fetches dashboard summary on mount via dashboardApi
 * - Listens to `credits-updated` CustomEvent (same-tab, from http.ts interceptor)
 * - Listens to BroadcastChannel `careerbot_credits` (cross-tab sync)
 * - Exposes `refreshDashboard()` so any child can trigger a re-fetch
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { DashboardSummary } from '@/types/dashboard.types';
import { getDashboardSummary } from '@/api/dashboardApi';
import { getQuotaBalance } from '@/api/quotaApi';
import logger from '@/lib/logger';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface DashboardContextValue {
  data: DashboardSummary | null;
  loading: boolean;
  error: Error | null;
  creditsRemaining: number | null;
  refreshDashboard: () => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                             */
/* ------------------------------------------------------------------ */

const DashboardContext = createContext<DashboardContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                            */
/* ------------------------------------------------------------------ */

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  // Prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ── Fetch ── */
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await getDashboardSummary();
      if (!mountedRef.current) return;
      setData(summary);
      setCreditsRemaining(summary.plan.credits_remaining);
      logger.info('DashboardContext: data loaded');
    } catch (err) {
      if (!mountedRef.current) return;
      logger.error('DashboardContext: fetch failed', err);
      setError(err as Error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  /* ── Same-tab credit sync (CustomEvent from http.ts interceptor) ── */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ credits_remaining: number }>).detail;
      if (typeof detail?.credits_remaining === 'number') {
        setCreditsRemaining(detail.credits_remaining);
        // Patch the in-memory summary so UI stays consistent
        setData((prev) =>
          prev
            ? {
                ...prev,
                plan: { ...prev.plan, credits_remaining: detail.credits_remaining },
              }
            : prev
        );
      }
    };
    window.addEventListener('credits-updated', handler);
    return () => window.removeEventListener('credits-updated', handler);
  }, []);

  /* ── Cross-tab credit sync (BroadcastChannel) ── */
  const bcSupportedRef = useRef(false);
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('careerbot_credits');
      bcSupportedRef.current = true;
      bc.onmessage = (e: MessageEvent<{ credits_remaining: number }>) => {
        if (typeof e.data?.credits_remaining === 'number') {
          setCreditsRemaining(e.data.credits_remaining);
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  plan: { ...prev.plan, credits_remaining: e.data.credits_remaining },
                }
              : prev
          );
        }
      };
    } catch {
      // BroadcastChannel unavailable (SSR, old browsers) — use focus fallback
      bcSupportedRef.current = false;
    }
    return () => {
      try { bc?.close(); } catch { /* ignore */ }
    };
  }, []);

  /* ── Window focus fallback (for browsers without BroadcastChannel) ── */
  useEffect(() => {
    const handleFocus = async () => {
      if (bcSupportedRef.current) return; // BroadcastChannel handles it
      try {
        const quota = await getQuotaBalance();
        if (!mountedRef.current) return;
        setCreditsRemaining(quota.credits_remaining);
        setData((prev) =>
          prev
            ? {
                ...prev,
                plan: { ...prev.plan, credits_remaining: quota.credits_remaining },
              }
            : prev
        );
      } catch {
        // Silent fail — best-effort refresh on focus
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        data,
        loading,
        error,
        creditsRemaining,
        refreshDashboard: fetchDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

const DASHBOARD_FALLBACK: DashboardContextValue = {
  data: null,
  loading: false,
  error: null,
  creditsRemaining: null,
  refreshDashboard: () => {},
};

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  // Return safe defaults when used outside DashboardProvider (e.g. ATS login, public pages)
  return ctx ?? DASHBOARD_FALLBACK;
}
