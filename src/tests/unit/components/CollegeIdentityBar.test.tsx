/**
 * The college identity bar's content: every piece present, and every missing
 * piece dropped (never a dash), ranks only when available.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { CollegeIdentityBar, identityParts } from '@/components/layout/CollegeIdentityBar';
import type { StudentRecord } from '@/hooks/useStudentRecord';

const available = (rank: number) =>
  ({ available: true, rank, cohort_size: 40, percentile: 90, readiness: 81, tied_with: 0 }) as const;

function rec(over: Partial<StudentRecord> = {}): StudentRecord {
  return {
    college: { id: 'vit', name: 'VIT Chennai', membershipId: 'm1' },
    student: {
      department_name: 'CSE', section_name: 'B', batch_year: 2027, admission_number: '22CSE118',
    } as StudentRecord['student'],
    readiness: { readiness: 81, max: 100 } as StudentRecord['readiness'],
    standing: { ...available(4), college: available(12) },
    people: null,
    ...over,
  };
}

describe('identityParts', () => {
  it('the full line, as in the spec', () => {
    expect(identityParts(rec())).toEqual({
      badge: 'VIT',
      identity: 'VIT Chennai · CSE · Section B · Batch 2027 · 22CSE118',
      readiness: '81/100',
      collegeRank: '#12 in college',
      departmentRank: '#4 in CSE',
    });
  });

  it('missing section and batch are dropped, not dashed', () => {
    const p = identityParts(rec({
      student: { department_name: 'CSE', section_name: null, batch_year: null, admission_number: '22CSE118' } as StudentRecord['student'],
    }));
    expect(p.identity).toBe('VIT Chennai · CSE · 22CSE118');
  });

  it('a withheld department rank hides both ranks (college rank only rides on it)', () => {
    const p = identityParts(rec({ standing: { available: false, reason: 'cohort_too_small', cohort_size: 4 } }));
    expect(p.departmentRank).toBeNull();
    expect(p.collegeRank).toBeNull();
  });

  it('a withheld college rank keeps the department rank', () => {
    const p = identityParts(rec({
      standing: { ...available(4), college: { available: false, reason: 'cohort_too_small' } },
    }));
    expect(p.collegeRank).toBeNull();
    expect(p.departmentRank).toBe('#4 in CSE');
  });

  it('no readiness, no standing: just the identity', () => {
    const p = identityParts(rec({ readiness: null, standing: null }));
    expect([p.readiness, p.collegeRank, p.departmentRank]).toEqual([null, null, null]);
  });
});

describe('CollegeIdentityBar', () => {
  it('links to the college area and has a readable label', () => {
    render(<CollegeIdentityBar record={rec()} />);
    const bar = screen.getByTestId('college-identity-bar');
    expect(bar).toHaveAttribute('href', '/institution');
    expect(bar.getAttribute('aria-label')).toContain('VIT Chennai · CSE · Section B · Batch 2027 · 22CSE118');
    expect(bar.getAttribute('aria-label')).toContain('#12 in college');
  });
});
