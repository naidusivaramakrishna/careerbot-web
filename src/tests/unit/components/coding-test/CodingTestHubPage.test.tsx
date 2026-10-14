import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ProblemWithStatus, QuotaResponse } from '@/app/coding-test/_lib/types';

// These render whole pages; give them room on a busy CI host.
configure({ asyncUtilTimeout: 10000 });
vi.setConfig({ testTimeout: 30000 });

// ─── Mocks ──────────────────────────────────────────────────────────────────
// The hub's data comes from three coding-test API calls and (for the greeting)
// the dashboard context. The dashboard chrome itself (header, sidebar, footer)
// is replaced by a marker so the tests can see WHERE it is mounted.

const mockDashboard: { data: { user: { name: string } } | null } = { data: null };
let mockProblems: ProblemWithStatus[] = [];
let mockQuota: QuotaResponse | null = null;

vi.mock('@/contexts/DashboardContext', () => ({
  useDashboard: () => ({
    data: mockDashboard.data,
    loading: false,
    error: null,
    creditsRemaining: null,
    refreshDashboard: () => {},
  }),
}));

vi.mock('@/app/(user)/dashboard/ClientLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-chrome">{children}</div>
  ),
}));

vi.mock('@/components/coding-test/OnboardingModal', () => ({
  default: () => null,
}));

vi.mock('@/app/coding-test/_lib/api', () => ({
  fetchProblems: vi.fn(async () => ({ problems: [], total: mockProblems.length })),
}));

vi.mock('@/app/coding-test/_lib/gradingApi', () => ({
  fetchProblemsAnnotated: vi.fn(async () => mockProblems),
  fetchQuota: vi.fn(async () => mockQuota),
}));

import CodingPracticeHubPage from '@/app/coding-test/page';
import CodingTestLayout from '@/app/coding-test/layout';

function problem(slug: string, accepted: boolean): ProblemWithStatus {
  return { slug, title: slug, difficulty: 'easy', tag: 'Arrays', user_status: accepted ? 'accepted' : null };
}

beforeEach(() => {
  mockDashboard.data = null;
  mockProblems = [];
  mockQuota = null;
  localStorage.setItem('coding_test_onboarded', '1');
});

describe('coding-test hub page', () => {
  it('greets the signed-in user by their own first name, never a hard-coded one', async () => {
    mockDashboard.data = { user: { name: 'Asha Rao' } };
    render(<CodingPracticeHubPage />);
    expect(await screen.findByText(/Hey Asha!/)).toBeInTheDocument();
    expect(screen.queryByText(/Shobha/)).not.toBeInTheDocument();
  });

  it('falls back to a neutral greeting when the user name is not known (other state)', async () => {
    render(<CodingPracticeHubPage />);
    expect(await screen.findByText(/Hey there!/)).toBeInTheDocument();
    expect(screen.queryByText(/Shobha/)).not.toBeInTheDocument();
  });

  it('does not present the all-time solved count as a daily number or as a wrong total', async () => {
    mockProblems = [problem('a', true), problem('b', true), problem('c', true), problem('d', true), problem('e', true)];
    render(<CodingPracticeHubPage />);
    await waitFor(() => expect(screen.getAllByText('5').length).toBeGreaterThan(0));
    expect(screen.queryByText('Daily Goal')).not.toBeInTheDocument();
    // The capped 3/3 is shown as progress toward a stated target, never as
    // "Problems Solved" (the user has solved 5).
    expect(screen.queryByText('Problems Solved')).not.toBeInTheDocument();
    const card = screen.getByText('Practice Goal').closest('div.rounded-xl') as HTMLElement;
    expect(card).toHaveTextContent('3/ 3');
    expect(card).toHaveTextContent('Target: solve 3 problems');
  });

  it('shows goal progress below the target for a new user (other state)', async () => {
    mockProblems = [problem('a', true), problem('b', false)];
    render(<CodingPracticeHubPage />);
    await waitFor(() => {
      const card = screen.getByText('Practice Goal').closest('div.rounded-xl') as HTMLElement;
      expect(card).toHaveTextContent('1/ 3');
    });
  });

  it('does not show a fake streak number', async () => {
    render(<CodingPracticeHubPage />);
    await screen.findByText('Streak');
    expect(screen.queryByText('days')).not.toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('keeps the responsive columns on the language grid', async () => {
    render(<CodingPracticeHubPage />);
    // Text + closest('a') instead of *ByRole: role queries over the big SVG
    // icons take seconds each in jsdom.
    const python = (await screen.findByText('Python')).closest('a') as HTMLElement;
    const grid = python.parentElement as HTMLElement;
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
  });

  it('renders every language card with a link to the filtered problem list (control)', async () => {
    render(<CodingPracticeHubPage />);
    for (const [label, value] of [['Python', 'python'], ['Java', 'java'], ['C', 'c'], ['C++', 'cpp']]) {
      const link = (await screen.findByText(label, { selector: 'a p' })).closest('a');
      expect(link).toHaveAttribute('href', `/coding-test/problems?language=${value}`);
    }
  });

  it('mounts the dashboard chrome around the hub page itself', async () => {
    render(<CodingPracticeHubPage />);
    const chrome = screen.getByTestId('dashboard-chrome');
    expect(chrome).toContainElement(await screen.findByText('Select a Language'));
  });

  it('keeps the low-credit banner below the fixed 56px dashboard header', async () => {
    mockQuota = { credits_remaining: 2, cost_per_submission: 1, submissions_remaining: 2, plan: 'free' };
    render(<CodingPracticeHubPage />);
    const banner = (await screen.findByText(/AI grading credits remaining/)).closest('div') as HTMLElement;
    expect(banner).toHaveClass('sticky', 'top-14');
    expect(banner).not.toHaveClass('top-0');
  });
});

describe('coding-test layout', () => {
  it('does not wrap full-viewport child routes (problems, editor, playground) in the dashboard chrome', () => {
    render(<CodingTestLayout><div data-testid="child-route" /></CodingTestLayout>);
    expect(screen.getByTestId('child-route')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-chrome')).not.toBeInTheDocument();
  });
});
