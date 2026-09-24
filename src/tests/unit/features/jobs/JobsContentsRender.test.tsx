import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Renders the real JobsContents component with its network layer and the
// heavy presentational children stubbed out, to cover behaviour that only
// exists inside the component (the Smart Match warm-up retry loop and the
// "Did you apply?" confirmation dialog).

const mockGetSmartMatchedJobs = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/hooks/useCurrentUserId', () => ({
  useCurrentUserId: () => ({ userId: 'test-user' }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));
vi.mock('@/api/jobsApi', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSmartMatchedJobs: (...args: any[]) => mockGetSmartMatchedJobs(...args),
  getJobById: vi.fn(() => Promise.reject(new Error('not used'))),
  getJobTitleSuggestions: vi.fn(() => Promise.resolve([])),
}));
vi.mock('@/app/(jobs)/jobslogin/_components/sidebar/JobsRightSidebar', () => ({ default: () => null }));
vi.mock('@/app/(jobs)/jobslogin/_components/chat/NancyChat', () => ({ default: () => null }));
vi.mock('@/app/(jobs)/jobslogin/_components/JobsFilterSidebar', () => ({ default: () => null }));
vi.mock('@/app/(jobs)/jobslogin/_components/sidebar/JobList', () => ({ default: () => null }));
vi.mock('@/app/(jobs)/jobslogin/_components/JobDetailsInline', () => ({ default: () => null }));

import JobsContents from '@/app/(jobs)/jobslogin/_components/JobsContents';

const EMPTY_SCORED = {
  jobs: [],
  total: 0,
  skip: 0,
  limit: 50,
  cache_hit: true,
  computed_in_ms: 5,
  scorer_version: 1,
  profile_version: 1,
};

// Lets pending promise callbacks and any timers due within `ms` run.
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('JobsContents — Smart Match warm-up retry loop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    mockGetSmartMatchedJobs.mockReset();
    mockGetSmartMatchedJobs.mockResolvedValue(EMPTY_SCORED);
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // force_refresh is reserved for the explicit "Retry Smart Match" button
  // (see the comment on fetchSmartMatchedJobs). The automatic retries must
  // not send it.
  it('never sends force_refresh on the automatic retries', async () => {
    render(<JobsContents />);
    await advance(0);
    // Run the whole retry schedule (4s + 8s + 15s + 25s + 40s = 92s) and then some.
    await advance(120_000);

    expect(mockGetSmartMatchedJobs).toHaveBeenCalledTimes(6);
    for (const [params] of mockGetSmartMatchedJobs.mock.calls) {
      expect(params).not.toHaveProperty('force_refresh');
    }
  });

  it('stops calling the backend once the component unmounts', async () => {
    const { unmount } = render(<JobsContents />);
    await advance(0);
    expect(mockGetSmartMatchedJobs).toHaveBeenCalledTimes(1);

    unmount();
    await advance(120_000);

    expect(mockGetSmartMatchedJobs).toHaveBeenCalledTimes(1);
  });
});

describe('JobsContents — "Did you apply?" dialog keyboard handling', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockGetSmartMatchedJobs.mockReset();
    // Keep Smart Match pending; this suite only exercises the dialog.
    mockGetSmartMatchedJobs.mockReturnValue(new Promise(() => {}));
    // A pending apply in sessionStorage + a visible tab opens the dialog on mount.
    sessionStorage.setItem(
      'pendingApplyJob',
      JSON.stringify({ id: 'job-1', title: 'Frontend Engineer', company: 'Acme', url: 'https://careers.example.com/1' }),
    );
  });
  afterEach(() => {
    cleanup();
  });

  // fireEvent.keyDown returns false when a handler called preventDefault(),
  // which is what stops a browser from activating a focused button on
  // Enter/Space.
  it('does not cancel Enter/Space on the dialog buttons, and Enter does not dismiss it', async () => {
    render(<JobsContents />);
    const yes = await screen.findByText('Yes, I applied!');
    const no = screen.getByText(/No, I didn/);

    expect(fireEvent.keyDown(yes, { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(yes, { key: ' ' })).toBe(true);
    expect(fireEvent.keyDown(no, { key: 'Enter' })).toBe(true);
    expect(screen.getByText('Did you apply?')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    render(<JobsContents />);
    const yes = await screen.findByText('Yes, I applied!');
    fireEvent.keyDown(yes, { key: 'Escape' });
    expect(screen.queryByText('Did you apply?')).not.toBeInTheDocument();
  });
});
