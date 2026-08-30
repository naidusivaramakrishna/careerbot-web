import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ReadinessCard } from '@/app/institution/_components/ReadinessCard';
import { EnabledFeaturesCard } from '@/app/institution/_components/EnabledFeaturesCard';
import type { InstitutionContext, Readiness } from '@/types/institution';

const part = (activity: string, weight: number, earned: number,
              scored: boolean, best: number | null) => ({
  activity, weight, earned, scored, best_fraction: best,
});

const READINESS: Readiness = {
  student_id: 'stu1',
  readiness: 30,
  max: 100,
  scored: 2,
  of: 5,
  breakdown: [
    part('mock_test', 25, 20, true, 0.8),
    part('coding_test', 25, 0, false, null),
    part('mock_interview', 20, 0, false, null),
    part('english_assessment', 20, 0, false, null),
    part('resume_ats', 10, 10, true, 1),
  ],
};

const CONTEXT: InstitutionContext = {
  institution_id: 'vit',
  institution_name: 'VIT',
  role: 'student',
  department_id: 'cse',
  subscription_status: 'active',
  writable: true,
  disabled_features: [],
};

describe('the readiness card', () => {
  it('shows the number AND the working', () => {
    /**
     * The breakdown is not decoration. A single figure a student cannot take
     * apart is one they will not trust, and the first thing anyone asks on
     * seeing 30 is "why 30".
     */
    render(<ReadinessCard readiness={READINESS} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText(/out of 100/i)).toBeInTheDocument();
    // all five activities present, including the untouched ones
    expect(screen.getAllByText(/Not taken yet/i)).toHaveLength(3);
  });

  it('says "Not taken yet" rather than a zero score', () => {
    /**
     * "0 / 25" beside four other numbers reads as a mark out of 25 that the
     * student scored zero on. Not taking something is not failing it.
     */
    render(<ReadinessCard readiness={READINESS} />);
    expect(screen.queryByText(/you scored 0/i)).not.toBeInTheDocument();
  });

  it('tells a student that practising can only help', () => {
    // Otherwise somebody who retakes a test and sees no movement assumes the
    // score is broken. The rule is "best attempt counts"; saying so is what
    // makes the number behave the way they expect.
    render(<ReadinessCard readiness={READINESS} />);
    // The full sentence, not just "best attempt" -- that substring also
    // appears on every scored row ("80% of your best attempt"), so a loose
    // matcher passes whether or not the reassurance is there at all.
    expect(screen.getByText(/practising can only help/i)).toBeInTheDocument();
  });

  it('treats zero as a starting point, not a failure', () => {
    render(<ReadinessCard readiness={{ ...READINESS, readiness: 0, scored: 0 }} />);
    expect(screen.getByText(/Nothing scored yet/i)).toBeInTheDocument();
  });

  it('exposes the score to assistive technology as a progress bar', () => {
    render(<ReadinessCard readiness={READINESS} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});

describe('the enabled-features card', () => {
  it('shows what is ON, derived from the deny-list', () => {
    render(<EnabledFeaturesCard context={CONTEXT} />);
    expect(screen.getByText(/Mock Test/i)).toBeInTheDocument();
  });

  it('NEVER shows a disabled feature, greyed out or otherwise', () => {
    /**
     * A student cannot switch one on and cannot ask anybody to -- it is a
     * commercial decision between the college and the platform. Showing them
     * a thing they are not allowed to have creates a question with no answer.
     */
    render(<EnabledFeaturesCard
      context={{ ...CONTEXT, disabled_features: ['coding_test'] }} />);
    expect(screen.queryByText(/Coding Test/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Mock Test/i)).toBeInTheDocument();
  });

  it('matches the deny-list case-insensitively', () => {
    // normalise_deny_list lower-cases on the server, but a hand-edited row can
    // carry anything. Failing to match here would show a feature the backend
    // will then refuse -- the worst of both.
    render(<EnabledFeaturesCard
      context={{ ...CONTEXT, disabled_features: ['  Coding_Test '] }} />);
    expect(screen.queryByText(/Coding Test/i)).not.toBeInTheDocument();
  });

  it('says so plainly when a college has everything switched off', () => {
    render(<EnabledFeaturesCard context={{
      ...CONTEXT,
      disabled_features: ['mock_test', 'coding_test', 'mock_interview',
                          'english_assessment', 'resume_tools', 'job_matching'],
    }} />);
    expect(screen.getByText(/not switched any activities on/i)).toBeInTheDocument();
  });
});
