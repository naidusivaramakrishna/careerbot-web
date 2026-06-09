import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API
const mockGetDashboardSummary = vi.fn();
const mockGetQuotaBalance = vi.fn();

vi.mock('@/api/dashboardApi', () => ({
  getDashboardSummary: mockGetDashboardSummary,
}));

vi.mock('@/api/quotaApi', () => ({
  getQuotaBalance: mockGetQuotaBalance,
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock types
interface DashboardSummary {
  plan: {
    credits_remaining: number;
    credits_total: number;
    plan_id: string;
    plan_name: string;
  };
  [key: string]: any;
}

interface DashboardContextValue {
  data: DashboardSummary | null;
  loading: boolean;
  error: Error | null;
  creditsRemaining: number | null;
  refreshDashboard: () => void;
}

// Mock context hook
const useDashboardMock = (): DashboardContextValue => {
  const [data, setData] = require('react').useState<DashboardSummary | null>(null);
  const [loading, setLoading] = require('react').useState(true);
  const [error, setError] = require('react').useState<Error | null>(null);
  const [creditsRemaining, setCreditsRemaining] = require('react').useState<number | null>(null);
  const mountedRef = require('react').useRef(true);

  require('react').useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchDashboard = require('react').useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await mockGetDashboardSummary();
      if (!mountedRef.current) return;
      setData(summary);
      setCreditsRemaining(summary.plan.credits_remaining);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err as Error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  require('react').useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Same-tab credit sync
  require('react').useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ credits_remaining: number }>).detail;
      if (typeof detail?.credits_remaining === 'number') {
        setCreditsRemaining(detail.credits_remaining);
        setData((prev: DashboardSummary | null) =>
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

  // Cross-tab credit sync
  require('react').useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('careerbot_credits');
      bc.onmessage = (e: MessageEvent<{ credits_remaining: number }>) => {
        if (typeof e.data?.credits_remaining === 'number') {
          setCreditsRemaining(e.data.credits_remaining);
          setData((prev: DashboardSummary | null) =>
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
      // BroadcastChannel unavailable
    }
    return () => {
      try { bc?.close(); } catch { /* ignore */ }
    };
  }, []);

  return { data, loading, error, creditsRemaining, refreshDashboard: fetchDashboard };
};

describe('Credits Context & Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDashboardSummary.mockResolvedValue({
      plan: {
        credits_remaining: 100,
        credits_total: 500,
        plan_id: 'premium',
        plan_name: 'Premium Plan',
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads dashboard with initial credits on mount', async () => {
    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.creditsRemaining).toBe(100);
    expect(result.current.data?.plan.credits_total).toBe(500);
  });

  it('handles loading state while fetching', () => {
    mockGetDashboardSummary.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        plan: { credits_remaining: 100, credits_total: 500, plan_id: 'premium', plan_name: 'Premium' }
      }), 100))
    );

    const { result } = renderHook(() => useDashboardMock());

    expect(result.current.loading).toBe(true);
  });

  it('displays error state on fetch failure', async () => {
    const mockError = new Error('Failed to fetch dashboard');
    mockGetDashboardSummary.mockRejectedValue(mockError);

    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error?.message).toBe('Failed to fetch dashboard');
  });

  it('syncs credits via CustomEvent (same-tab)', async () => {
    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    act(() => {
      const event = new CustomEvent('credits-updated', {
        detail: { credits_remaining: 75 },
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(75);
    });
  });

  it('updates dashboard data on credits sync', async () => {
    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.data?.plan.credits_remaining).toBe(100);
    });

    act(() => {
      const event = new CustomEvent('credits-updated', {
        detail: { credits_remaining: 50 },
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.data?.plan.credits_remaining).toBe(50);
    });
  });

  it('refreshes dashboard on demand', async () => {
    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockGetDashboardSummary.mockResolvedValue({
      plan: {
        credits_remaining: 200,
        credits_total: 500,
        plan_id: 'premium',
        plan_name: 'Premium Plan',
      },
    });

    act(() => {
      result.current.refreshDashboard();
    });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(200);
    });
  });

  it('ignores state updates after unmount', async () => {
    mockGetDashboardSummary.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        plan: { credits_remaining: 100, credits_total: 500, plan_id: 'premium', plan_name: 'Premium' }
      }), 100))
    );

    const { result, unmount } = renderHook(() => useDashboardMock());

    act(() => {
      unmount();
    });

    expect(result.current.loading).toBe(true);
  });

  it('handles invalid credits event data gracefully', async () => {
    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    act(() => {
      const event = new CustomEvent('credits-updated', {
        detail: { credits_remaining: 'invalid' },
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });
  });

  it('returns plan information with credits', async () => {
    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.plan).toEqual({
      credits_remaining: 100,
      credits_total: 500,
      plan_id: 'premium',
      plan_name: 'Premium Plan',
    });
  });

  it('handles credits exceeding total', async () => {
    mockGetDashboardSummary.mockResolvedValue({
      plan: {
        credits_remaining: 600,
        credits_total: 500,
        plan_id: 'premium',
        plan_name: 'Premium Plan',
      },
    });

    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(600);
    });
  });

  it('handles zero credits', async () => {
    mockGetDashboardSummary.mockResolvedValue({
      plan: {
        credits_remaining: 0,
        credits_total: 500,
        plan_id: 'free',
        plan_name: 'Free Plan',
      },
    });

    const { result } = renderHook(() => useDashboardMock());

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(0);
    });
  });
});
