import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import { getDashboardSummary } from '@/api/dashboardApi';
import { getQuotaBalance } from '@/api/quotaApi';
import type { DashboardSummary } from '@/types/dashboard.types';

vi.mock('@/api/dashboardApi', () => ({
  getDashboardSummary: vi.fn(),
}));

vi.mock('@/api/quotaApi', () => ({
  getQuotaBalance: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockGetDashboardSummary = vi.mocked(getDashboardSummary);
const mockGetQuotaBalance = vi.mocked(getQuotaBalance);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DashboardProvider>{children}</DashboardProvider>
);

const createDashboardSummary = (
  creditsRemaining = 100,
  overrides: Partial<DashboardSummary> = {}
): DashboardSummary => ({
  user: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  plan: {
    plan_id: 'premium',
    plan_name: 'Premium',
    credits_total: 500,
    credits_remaining: creditsRemaining,
  },
  profile: {
    completeness: 80,
    missing_fields: [],
  },
  recommended_step: {
    step_number: 4,
    step_name: 'browse_jobs',
    title: 'Browse Jobs',
    description: 'Browse jobs',
    credit_cost: 0,
    cta_text: 'Browse Jobs',
    cta_path: '/jobs',
  },
  progress: {
    resume_uploaded: true,
    profile_completed: true,
    ats_scan_done: true,
    resume_enhanced: false,
    job_applied: false,
  },
  usage_counts: {
    resumes_created: 1,
    resumes_parsed: 1,
    ats_scans: 1,
    resumes_enhanced: 0,
    job_matches: 0,
    job_applications: 0,
    assessments_taken: 0,
  },
  best_scores: {
    ats_score: 82,
  },
  recent_activity: [],
  trending_roles: [],
  ...overrides,
  plan: {
    plan_id: 'premium',
    plan_name: 'Premium',
    credits_total: 500,
    credits_remaining: creditsRemaining,
    ...overrides.plan,
  },
});

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];

  name: string;
  onmessage: ((event: MessageEvent<{ credits_remaining: number }>) => void) | null = null;
  close = vi.fn();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  emit(data: { credits_remaining: number } | Record<string, unknown>) {
    this.onmessage?.({ data } as MessageEvent<{ credits_remaining: number }>);
  }
}

describe('DashboardContext', () => {
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  beforeEach(() => {
    vi.clearAllMocks();
    MockBroadcastChannel.instances = [];
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
    mockGetDashboardSummary.mockResolvedValue(createDashboardSummary(100));
    mockGetQuotaBalance.mockResolvedValue({ credits_remaining: 75 } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalBroadcastChannel) {
      vi.stubGlobal('BroadcastChannel', originalBroadcastChannel);
    }
  });

  it('returns safe fallback values when useDashboard is called outside DashboardProvider', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current).toMatchObject({
      data: null,
      loading: false,
      error: null,
      creditsRemaining: null,
    });
    expect(() => result.current.refreshDashboard()).not.toThrow();
  });

  it('fetches the dashboard summary on mount and exposes credits from the plan', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetDashboardSummary).toHaveBeenCalledWith({ skipAuthRedirect: true });
    expect(result.current.error).toBeNull();
    expect(result.current.data?.plan.credits_remaining).toBe(100);
    expect(result.current.creditsRemaining).toBe(100);
  });

  it('sets error and clears loading when the initial dashboard fetch fails', async () => {
    const error = new Error('Dashboard unavailable');
    mockGetDashboardSummary.mockRejectedValue(error);

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.creditsRemaining).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it('refreshDashboard refetches and replaces dashboard data', async () => {
    mockGetDashboardSummary
      .mockResolvedValueOnce(createDashboardSummary(100))
      .mockResolvedValueOnce(createDashboardSummary(240, { profile: { completeness: 95, missing_fields: [] } }));

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    await act(async () => {
      result.current.refreshDashboard();
    });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(240);
    });

    expect(result.current.data?.profile.completeness).toBe(95);
    expect(mockGetDashboardSummary).toHaveBeenCalledTimes(2);
  });

  it('patches credits from same-tab credits-updated events without refetching', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent('credits-updated', {
          detail: { credits_remaining: 64 },
        })
      );
    });

    expect(result.current.creditsRemaining).toBe(64);
    expect(result.current.data?.plan.credits_remaining).toBe(64);
    expect(mockGetDashboardSummary).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed same-tab credit events', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent('credits-updated', {
          detail: { credits_remaining: 'bad-value' },
        })
      );
    });

    expect(result.current.creditsRemaining).toBe(100);
    expect(result.current.data?.plan.credits_remaining).toBe(100);
  });

  it('patches credits from BroadcastChannel messages and closes the channel on unmount', async () => {
    const { result, unmount } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    const channel = MockBroadcastChannel.instances.find(
      (instance) => instance.name === 'careerbot_credits'
    );

    expect(channel).toBeDefined();

    act(() => {
      channel?.emit({ credits_remaining: 41 });
    });

    expect(result.current.creditsRemaining).toBe(41);
    expect(result.current.data?.plan.credits_remaining).toBe(41);

    unmount();
    expect(channel?.close).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed BroadcastChannel credit messages', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    const channel = MockBroadcastChannel.instances.find(
      (instance) => instance.name === 'careerbot_credits'
    );

    act(() => {
      channel?.emit({ credits_remaining: null });
    });

    expect(result.current.creditsRemaining).toBe(100);
    expect(result.current.data?.plan.credits_remaining).toBe(100);
  });

  it('uses focus fallback to refresh credits when BroadcastChannel is unavailable', async () => {
    vi.stubGlobal(
      'BroadcastChannel',
      vi.fn(() => {
        throw new Error('BroadcastChannel unavailable');
      })
    );
    mockGetQuotaBalance.mockResolvedValue({ credits_remaining: 33 } as never);

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(33);
    });

    expect(mockGetQuotaBalance).toHaveBeenCalledTimes(1);
    expect(result.current.data?.plan.credits_remaining).toBe(33);
  });

  it('does not call focus fallback quota API when BroadcastChannel is active', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(mockGetQuotaBalance).not.toHaveBeenCalled();
    expect(result.current.creditsRemaining).toBe(100);
  });

  it('silently ignores quota refresh errors from the focus fallback', async () => {
    vi.stubGlobal(
      'BroadcastChannel',
      vi.fn(() => {
        throw new Error('BroadcastChannel unavailable');
      })
    );
    mockGetQuotaBalance.mockRejectedValue(new Error('Quota unavailable'));

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => {
      expect(result.current.creditsRemaining).toBe(100);
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(mockGetQuotaBalance).toHaveBeenCalledTimes(1);
    });

    expect(result.current.creditsRemaining).toBe(100);
    expect(result.current.error).toBeNull();
  });

  it('does not update context state after unmount during an in-flight dashboard request', async () => {
    let resolveRequest: (summary: DashboardSummary) => void = () => undefined;
    mockGetDashboardSummary.mockReturnValue(
      new Promise<DashboardSummary>((resolve) => {
        resolveRequest = resolve;
      })
    );

    const { result, unmount } = renderHook(() => useDashboard(), { wrapper });

    expect(result.current.loading).toBe(true);

    unmount();

    await act(async () => {
      resolveRequest(createDashboardSummary(10));
    });

    expect(mockGetDashboardSummary).toHaveBeenCalledTimes(1);
  });
});
