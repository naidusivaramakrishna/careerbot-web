import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useInstitution: vi.fn(),
  useStudentsPaged: vi.fn(),
  useRosterReport: vi.fn(),
  useStructureNames: vi.fn(),
}));

vi.mock('@/contexts/InstitutionContext', () => ({
  useInstitution: mocks.useInstitution,
}));
vi.mock('@/hooks/useInstitutionResource', () => ({
  useStudentsPaged: mocks.useStudentsPaged,
  useRosterReport: mocks.useRosterReport,
}));
vi.mock('@/hooks/useStructureNames', () => ({
  useStructureNames: mocks.useStructureNames,
}));

import { FacultyOverview } from '@/app/institution/_components/FacultyOverview';
import {
  CurrentReadiness,
  LastActivityCell,
  ReadinessCell,
  formatActivityDate,
  rankDepartments,
} from '@/app/institution/_components/StaffReadiness';
import type { RosterReportRow } from '@/types/institution';

function state<T>(data: T, extra: Record<string, unknown> = {}) {
  return { data, isLoading: false, error: null, refetch: vi.fn(), ...extra };
}

const ROW: RosterReportRow = {
  student_id: 's1', full_name: 'R Nair', admission_number: 'A1',
  college_email: null, department_id: 'CSE', section_id: null,
  batch_year: 2026, status: 'active', claim_status: 'claimed',
  readiness: 46.2, activities_scored: 3, activities_total: 5,
  last_activity_at: '2026-10-20T10:00:00+00:00',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('rankDepartments', () => {
  it('ranks by average, competition style, and skips withheld groups', () => {
    const ranks = rankDepartments([
      { group: 'A', scored: 10, available: true, average: 50, median: 50 },
      { group: 'B', scored: 10, available: true, average: 70, median: 70 },
      { group: 'C', scored: 10, available: true, average: 50, median: 49 },
      { group: 'D', scored: 2, available: false, reason: 'cohort_too_small' },
    ]);
    expect(ranks.get('B')).toBe(1);
    expect(ranks.get('A')).toBe(2);
    expect(ranks.get('C')).toBe(2);
    expect(ranks.has('D')).toBe(false);
    expect(ranks.size).toBe(3);
  });

  it('returns nothing for no groups', () => {
    expect(rankDepartments([]).size).toBe(0);
  });
});

describe('cells', () => {
  it('shows readiness with the scored count', () => {
    render(<ReadinessCell row={ROW} />);
    expect(screen.getByText('46.2')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('says "Not scored yet" instead of a zero that reads as a failure', () => {
    render(<ReadinessCell row={{ ...ROW, readiness: 0, activities_scored: 0 }} />);
    expect(screen.getByText('Not scored yet')).toBeInTheDocument();
  });

  it('a missing row is a dash, not a zero', () => {
    render(<ReadinessCell row={undefined} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('last activity: a date, "Nothing yet", or a dash for an older server', () => {
    const { rerender } = render(<LastActivityCell row={ROW} />);
    expect(document.querySelector('time')?.getAttribute('datetime'))
      .toBe('2026-10-20T10:00:00+00:00');
    rerender(<LastActivityCell row={{ ...ROW, last_activity_at: null }} />);
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
    const older: RosterReportRow = { ...ROW };
    delete older.last_activity_at;
    rerender(<LastActivityCell row={older} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('an unreadable date is not shown as "Invalid Date"', () => {
    expect(formatActivityDate('not-a-date')).toBeNull();
    expect(formatActivityDate(null)).toBeNull();
    expect(formatActivityDate('')).toBeNull();
  });
});

describe('CurrentReadiness (Mark screen)', () => {
  it('shows the number and every part', () => {
    render(
      <CurrentReadiness
        readiness={{
          student_id: 's1', readiness: 45, max: 100, scored: 2, of: 5,
          breakdown: [
            { activity: 'mock_test', weight: 25, scored: true, best_fraction: 0.8, earned: 20 },
            { activity: 'coding_test', weight: 25, scored: true, best_fraction: 1, earned: 25 },
            { activity: 'mock_interview', weight: 20, scored: false, best_fraction: null, earned: 0 },
            { activity: 'english_assessment', weight: 20, scored: false, best_fraction: null, earned: 0 },
            { activity: 'resume_ats', weight: 10, scored: false, best_fraction: null, earned: 0 },
          ],
        }}
      />,
    );
    expect(screen.getByText('Current readiness')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/2 of 5 activities scored/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });
});

describe('FacultyOverview', () => {
  it('joins readiness and last activity from ONE roster report', () => {
    mocks.useInstitution.mockReturnValue({ readOnlyReason: null });
    mocks.useStructureNames.mockReturnValue({ sectionName: () => null });
    mocks.useStudentsPaged.mockReturnValue(state({
      items: [
        { id: 's1', account_id: null, claim_status: 'claimed', institution_id: 'i1',
          department_id: 'CSE', full_name: 'R Nair', admission_number: 'A1',
          college_email: null, batch_year: 2026, section_id: null, status: 'active' },
        { id: 's2', account_id: null, claim_status: 'claimed', institution_id: 'i1',
          department_id: 'CSE', full_name: 'New Student', admission_number: 'A2',
          college_email: null, batch_year: 2026, section_id: null, status: 'active' },
      ],
      total: 2, skip: 0, limit: 200,
    }));
    mocks.useRosterReport.mockReturnValue(state({
      items: [ROW, { ...ROW, student_id: 's2', full_name: 'New Student',
        readiness: 0, activities_scored: 0, last_activity_at: null }],
      total: 2,
    }));
    render(<FacultyOverview />);
    expect(mocks.useRosterReport).toHaveBeenCalled();
    const nair = screen.getByText('R Nair').closest('tr');
    expect(nair).toHaveTextContent('46.2');
    const fresh = screen.getByText('New Student').closest('tr');
    expect(fresh).toHaveTextContent('Not scored yet');
    expect(fresh).toHaveTextContent('Nothing yet');
  });
});
