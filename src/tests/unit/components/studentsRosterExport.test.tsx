/**
 * G8: the roster CSV export is reachable from the Students page.
 *
 * DownloadRosterButton existed with no screen using it. These tests hold it on
 * the roster header, check it is still offered when the college is read-only
 * (export is a read), and that pressing it calls the authenticated download.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useInstitution: vi.fn(),
  useStudentsPaged: vi.fn(),
  useStructureNames: vi.fn(),
  downloadRosterCsv: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/contexts/InstitutionContext', () => ({
  useInstitution: mocks.useInstitution,
}));

vi.mock('@/hooks/useInstitutionResource', () => ({
  useStudentsPaged: mocks.useStudentsPaged,
}));

vi.mock('@/hooks/useStructureNames', () => ({
  useStructureNames: mocks.useStructureNames,
}));

vi.mock('@/api/institutionApi', () => ({
  downloadRosterCsv: mocks.downloadRosterCsv,
}));

import StudentsPage from '@/app/institution/students/page';

function setup({ readOnlyReason = null as string | null, canOnboard = true } = {}) {
  mocks.useInstitution.mockReturnValue({
    role: 'faculty',
    readOnlyReason,
    canWrite: () => !readOnlyReason,
    allows: (cap: string) => cap === 'read_students' || (canOnboard && cap === 'onboard_student'),
  });
  mocks.useStudentsPaged.mockReturnValue({
    data: { items: [], total: 0, skip: 0, limit: 50 },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  mocks.useStructureNames.mockReturnValue({
    departmentName: (id: string) => id,
    sectionName: (id: string) => id,
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('roster CSV export on the Students page', () => {
  it('offers Export CSV next to Add a student', () => {
    setup();
    render(<StudentsPage />);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    // The empty roster has its own Add a student button too, so there are two.
    expect(screen.getAllByRole('button', { name: /add a student/i }).length).toBeGreaterThan(0);
  });

  it('is offered to a role that cannot add students', () => {
    setup({ canOnboard: false });
    render(<StudentsPage />);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /add a student/i })).not.toBeInTheDocument();
  });

  it('stays enabled when the college is read-only (export is a read)', () => {
    setup({ readOnlyReason: 'COLLEGE_PAUSED' });
    render(<StudentsPage />);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeEnabled();
  });

  it('pressing it calls the authenticated download', async () => {
    setup();
    mocks.downloadRosterCsv.mockResolvedValue({
      blob: new Blob(['a,b\n'], { type: 'text/csv' }),
      filename: 'roster-2026-10-27.csv',
    });
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<StudentsPage />);
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

    await waitFor(() => expect(mocks.downloadRosterCsv).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:x'));
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});
