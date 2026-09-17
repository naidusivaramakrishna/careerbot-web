import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { StandingCard } from '@/app/institution/_components/StandingCard';
import { LeaderboardCard } from '@/app/institution/_components/LeaderboardCard';
import { ComparisonCard } from '@/app/institution/_components/ComparisonCard';

describe('the standing card', () => {
  it('shows the place and what the percentile actually means', () => {
    render(<StandingCard standing={{
      available: true, rank: 3, cohort_size: 40, percentile: 92.5,
      readiness: 78, tied_with: 0,
    }} />);
    expect(screen.getByText('3rd')).toBeInTheDocument();
    expect(screen.getByText('of 40')).toBeInTheDocument();
    expect(screen.getByText(/scored below you/i)).toBeInTheDocument();
  });

  it('says when a place is SHARED', () => {
    /** Showing "3rd" to four students on the same score, with no note, reads
     *  to each of them as a different position from the others. */
    render(<StandingCard standing={{
      available: true, rank: 3, cohort_size: 40, percentile: 80,
      readiness: 60, tied_with: 2,
    }} />);
    expect(screen.getByText(/joint, with 2 others/i)).toBeInTheDocument();
  });

  it.each([
    ['cohort_too_small', /not enough of your year group/i],
    ['no_batch_year', /has not recorded which year you graduate/i],
    ['not_scored_yet', /take a mock test/i],
  ] as const)('explains %s in words a student can act on', (reason, text) => {
    /** Each has a different cause and a different next step. Collapsing them
     *  into "no data" leaves somebody refreshing a page that will never
     *  change. */
    render(<StandingCard standing={{ available: false, reason }} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('never renders a rank when standing is unavailable', () => {
    render(<StandingCard standing={{
      available: false, reason: 'cohort_too_small', cohort_size: 3,
    }} />);
    expect(screen.queryByText(/1st|2nd|3rd/)).not.toBeInTheDocument();
  });
});

describe('the leaderboard card', () => {
  const board = {
    available: true as const,
    entries: [
      { student_id: 'a', name: 'Ravi', readiness: 92 },
      { student_id: 'b', name: 'Meera', readiness: 88 },
    ],
  };

  it('numbers the rows as POSITIONS IN THIS LIST', () => {
    render(<LeaderboardCard board={board} />);
    expect(screen.getByText('Ravi')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('says the numbering is not a ranking, and that people may opt out', () => {
    /** Without this, a student who knows the top of their year and cannot
     *  find them assumes the list is broken -- and starts working out who is
     *  missing, which is what the opt-out exists to prevent. */
    render(<LeaderboardCard board={board} />);
    expect(screen.getByText(/choose not to appear/i)).toBeInTheDocument();
    expect(screen.getByText(/not everyone.s rank/i)).toBeInTheDocument();
  });

  it('handles a withheld board without pretending it is empty data', () => {
    render(<LeaderboardCard board={{
      available: false, reason: 'cohort_too_small', entries: [],
    }} />);
    expect(screen.getByText(/not enough of your year group/i)).toBeInTheDocument();
  });
});

describe('the department comparison', () => {
  const comparison = {
    groups: [
      { group: 'cse', scored: 40, available: true as const, average: 62.5, median: 60 },
      { group: 'tiny', scored: 3, available: false as const, reason: 'cohort_too_small' },
    ],
  };

  it('shows average AND median side by side', () => {
    /** One exceptional student lifts a mean and tells an HOD their department
     *  is fine when most of it is not. */
    render(<ComparisonCard comparison={comparison} />);
    expect(screen.getByText('62.5')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('says WHY a small department shows no average', () => {
    /** Two blank cells read as missing data and send somebody looking for a
     *  bug. */
    render(<ComparisonCard comparison={comparison} />);
    expect(screen.getByText(/too few scores/i)).toBeInTheDocument();
  });

  it('marks the reader’s own department so they can find it', () => {
    render(<ComparisonCard comparison={comparison} highlight="cse" />);
    expect(screen.getByText('yours')).toBeInTheDocument();
  });

  it('states that no individual student appears', () => {
    render(<ComparisonCard comparison={comparison} />);
    expect(screen.getByText(/no individual student/i)).toBeInTheDocument();
  });
});
