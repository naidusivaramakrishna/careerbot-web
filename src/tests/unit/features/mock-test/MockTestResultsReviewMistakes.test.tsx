// ai-review on #150 @ 4e0c285d, P1: the results page's "Review Mistakes" button must
// open the runner's review mode (?reviewParentSession=), like history's "Review answers".
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const nav = vi.hoisted(() => ({ push: vi.fn(), id: 'custom', search: 'parentSession=parent-1' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: nav.id }),
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock('@/api/mockTestApi', async (orig) => ({
  ...(await orig<typeof import('@/api/mockTestApi')>()),
  getParentSessionResult: vi.fn(async () => ({
    sections: [{ name: 'Arithmetic', accuracy: 50, correct: 1, wrong: 1, skipped: 0 }],
    strengths: [], improvements: [], time_taken: 120,
  })),
  getSessionById: vi.fn(async () => null),
  getSessionVideoEvaluation: vi.fn(async () => null),
}));

import MockTestResultsPage from '@/app/(interview)/mock-test/results/[id]/page';

describe('results page: Review Mistakes', { timeout: 60_000 }, () => {
  beforeEach(() => { nav.push.mockClear(); });

  it('opens the runner review mode for the attempt (custom test -> custom-test route slug)', async () => {
    nav.id = 'custom';
    render(<MockTestResultsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /review mistakes/i }));
    expect(nav.push).toHaveBeenCalledWith('/mock-test/custom-test?reviewParentSession=parent-1');
  });

  it('uses the company id as the route for a company test', async () => {
    nav.id = 'tcs';
    render(<MockTestResultsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /review mistakes/i }));
    expect(nav.push).toHaveBeenCalledWith('/mock-test/tcs?reviewParentSession=parent-1');
  });
});
