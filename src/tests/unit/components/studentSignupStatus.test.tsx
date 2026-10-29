/**
 * T4: staff can see who has signed up, and can send a code from the student's
 * own page.
 *
 * The roster row already had both. The student page (where an officer lands
 * right after adding a student) and the faculty home (where a faculty member
 * is asked to chase sign-ups) had neither.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useInstitution: vi.fn(),
  useStudentsPaged: vi.fn(),
  useRosterReport: vi.fn(),
  useInstitutionResource: vi.fn(),
  useStudentProgress: vi.fn(),
  useStructureNames: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ studentId: 's1' }),
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/institution/students/s1',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/contexts/InstitutionContext', () => ({
  useInstitution: mocks.useInstitution,
}));
vi.mock('@/hooks/useInstitutionResource', () => ({
  useStudentsPaged: mocks.useStudentsPaged,
  useRosterReport: mocks.useRosterReport,
  useInstitutionResource: mocks.useInstitutionResource,
  useStudentProgress: mocks.useStudentProgress,
}));
vi.mock('@/hooks/useStructureNames', () => ({
  useStructureNames: mocks.useStructureNames,
}));
vi.mock('@/api/institutionApi', () => ({
  getStudent: vi.fn(),
  issueInvite: vi.fn(),
  revokeInvites: vi.fn(),
  InstitutionApiError: class extends Error {},
}));
vi.mock('@/app/institution/_components/RecordProgressForm', () => ({
  RecordProgressForm: () => null,
}));

import { FacultyOverview } from '@/app/institution/_components/FacultyOverview';
import StudentsPage from '@/app/institution/students/page';
import StudentDetailPage from '@/app/institution/students/[studentId]/page';
import { claimStatusLabel, ERROR_MESSAGES, READ_ONLY_CONTROL_HINT } from '@/lib/institutionMessages';
import * as institutionApi from '@/api/institutionApi';
import type { ClaimStatus, Student } from '@/types/institution';

function state<T>(data: T, extra: Record<string, unknown> = {}) {
  return { data, isLoading: false, error: null, refetch: vi.fn(), ...extra };
}

function student(claim_status: ClaimStatus, over: Partial<Student> = {}): Student {
  return {
    id: 's1', account_id: null, claim_status, institution_id: 'vit',
    department_id: 'cse', full_name: 'Ravi Kumar', admission_number: 'A1',
    college_email: 'ravi@vit.ac.in', batch_year: 2026, section_id: null,
    status: 'enrolled', ...over,
  } as Student;
}

function institution({ canOnboard = true, readOnlyReason = null as string | null } = {}) {
  mocks.useInstitution.mockReturnValue({
    role: 'cpo',
    readOnlyReason,
    allows: (cap: string) =>
      cap === 'read_students' || (canOnboard && cap === 'onboard_student'),
  });
  mocks.useStructureNames.mockReturnValue({
    departmentName: (id: string) => id,
    sectionName: () => null,
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('claimStatusLabel', () => {
  it('says plainly whether the student has signed up', () => {
    expect(claimStatusLabel('claimed')).toBe('Signed up');
    expect(claimStatusLabel('invited')).toBe('Code sent, not signed up');
    expect(claimStatusLabel('rostered')).toBe('Not invited yet');
  });

  it('treats a missing value as not invited, and never shows a raw slug', () => {
    expect(claimStatusLabel(undefined)).toBe('Not invited yet');
    expect(claimStatusLabel('some_new_state')).toBe('Some New State');
  });
});

describe('student page', () => {
  function renderPage(s: ReturnType<typeof student>) {
    mocks.useInstitutionResource.mockReturnValue(state(s));
    mocks.useStudentProgress.mockReturnValue(state([]));
    render(<StudentDetailPage />);
  }

  it('shows the sign-up status', () => {
    institution();
    renderPage(student('invited'));
    expect(screen.getByText('Sign-up')).toBeInTheDocument();
    expect(screen.getByText('Code sent, not signed up')).toBeInTheDocument();
  });

  it('offers Invite for a student who was never sent a code', () => {
    institution();
    renderPage(student('rostered'));
    expect(screen.getByRole('button', { name: /invite/i })).toBeEnabled();
  });

  it('offers Reissue code once a code was sent', () => {
    institution();
    renderPage(student('invited'));
    expect(screen.getByRole('button', { name: /reissue code/i })).toBeEnabled();
  });

  it('offers nothing for a student who already signed up', () => {
    institution();
    renderPage(student('claimed'));
    expect(screen.queryByRole('button', { name: /invite|reissue/i })).not.toBeInTheDocument();
    expect(screen.getByText('Signed up')).toBeInTheDocument();
  });

  it('offers nothing to a role that may not issue codes', () => {
    institution({ canOnboard: false });
    renderPage(student('rostered'));
    expect(screen.queryByRole('button', { name: /invite|reissue/i })).not.toBeInTheDocument();
  });

  it('is disabled while the college is read-only', () => {
    institution({ readOnlyReason: 'COLLEGE_PAUSED' });
    renderPage(student('rostered'));
    expect(screen.getByRole('button', { name: /invite/i })).toBeDisabled();
  });

  it('opens the same invite dialog the roster uses', () => {
    institution();
    renderPage(student('rostered'));
    fireEvent.click(screen.getByRole('button', { name: /invite/i }));
    expect(screen.getByText(/invite code for ravi kumar/i)).toBeInTheDocument();
  });

  it('refreshes the student after a code is issued, and Done closes the dialog', async () => {
    institution();
    const refetch = vi.fn();
    mocks.useInstitutionResource.mockReturnValue(state(student('rostered'), { refetch }));
    mocks.useStudentProgress.mockReturnValue(state([]));
    vi.mocked(institutionApi.issueInvite).mockResolvedValue({
      student_id: 's1', full_name: 'Ravi Kumar', admission_number: 'A1',
      expires_at: '2026-11-27T00:00:00Z', code: 'ZHADV-SYB9B',
      emailed: false, email_error: null,
    } as never);
    render(<StudentDetailPage />);
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));
    fireEvent.click(screen.getByRole('button', { name: /issue code/i }));
    await screen.findByText('ZHADV-SYB9B');
    expect(refetch).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(screen.queryByText(/invite code for ravi kumar/i)).not.toBeInTheDocument();
  });
});

describe('faculty home', () => {
  it('has a Sign-up column so a faculty member can see who to chase', () => {
    institution();
    mocks.useStudentsPaged.mockReturnValue(state({
      items: [
        student('claimed', { id: 's1', full_name: 'Signed Student' }),
        student('invited', { id: 's2', full_name: 'Waiting Student' }),
      ],
      total: 2, skip: 0, limit: 200,
    }));
    mocks.useRosterReport.mockReturnValue(state({ items: [], total: 0 }));
    render(<FacultyOverview />);
    expect(screen.getByRole('columnheader', { name: 'Sign-up' })).toBeInTheDocument();
    const signed = screen.getByText('Signed Student').closest('tr') as HTMLElement;
    expect(within(signed).getByText('Signed up')).toBeInTheDocument();
    const waiting = screen.getByText('Waiting Student').closest('tr') as HTMLElement;
    expect(within(waiting).getByText('Code sent, not signed up')).toBeInTheDocument();
  });
});


describe('roster Account column', () => {
  function renderRoster(opts: { canOnboard?: boolean; readOnlyReason?: string | null } = {}) {
    institution(opts);
    mocks.useStudentsPaged.mockReturnValue(state({
      items: [student('rostered', { id: 's9', full_name: 'Roster Student' })],
      total: 1, skip: 0, limit: 50,
    }));
    render(<StudentsPage />);
    return screen.getByText('Roster Student').closest('tr') as HTMLElement;
  }

  it('offers Invite to a role that may issue codes', () => {
    const row = renderRoster();
    expect(within(row).getByRole('button', { name: /invite/i })).toBeEnabled();
  });

  it('is disabled while the college is read-only', () => {
    const row = renderRoster({ readOnlyReason: 'COLLEGE_PAUSED' });
    expect(within(row).getByRole('button', { name: /invite/i })).toBeDisabled();
  });

  it('shows the state, not a button, to a role that may not issue codes', () => {
    const row = renderRoster({ canOnboard: false });
    expect(within(row).queryByRole('button', { name: /invite/i })).not.toBeInTheDocument();
    expect(within(row).getByText('Not invited yet')).toBeInTheDocument();
  });
});

// A refetch that fails AFTER a code was issued. The code is shown once and
// cannot be looked up again (the server keeps only a digest), so the dialog
// must stay mounted: the page keeps the student it already has and shows the
// error inline, instead of swapping the whole page for an error screen.
describe('student page: a failed refresh keeps what is on screen', () => {
  const issued = {
    student_id: 's1', full_name: 'Ravi Kumar', admission_number: 'A1',
    expires_at: '2026-11-27T00:00:00Z', code: 'ZHADV-SYB9B',
    emailed: false, email_error: null,
  };
  const networkError = {
    reason: 'NETWORK', message: '', fieldErrors: [],
    isReadOnlyState: false,
  };

  function renderWithRefetch(after: Record<string, unknown>) {
    institution();
    const s = student('rostered');
    let current: Record<string, unknown> = state(s);
    const refetch = vi.fn(() => {
      current = { ...state(s), ...after, refetch };
    });
    current = { ...state(s), refetch };
    mocks.useInstitutionResource.mockImplementation(() => current);
    mocks.useStudentProgress.mockReturnValue(state([]));
    vi.mocked(institutionApi.issueInvite).mockResolvedValue(issued as never);
    const view = render(<StudentDetailPage />);
    return { view, refetch };
  }

  it('keeps the one-time code on screen when the refresh after issuing fails', async () => {
    const { view, refetch } = renderWithRefetch({ error: networkError });
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));
    fireEvent.click(screen.getByRole('button', { name: /issue code/i }));
    await screen.findByText('ZHADV-SYB9B');
    expect(refetch).toHaveBeenCalled();
    // The hook reports the failed refresh: same student, plus an error.
    view.rerender(<StudentDetailPage />);
    expect(screen.getByText('ZHADV-SYB9B')).toBeInTheDocument();
    expect(screen.getByText(/invite code for ravi kumar/i)).toBeInTheDocument();
    // The failure is still reported, next to the student it failed to refresh.
    expect(screen.getByText(ERROR_MESSAGES.NETWORK)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ravi Kumar' })).toBeInTheDocument();
  });

  it('control: a refresh that succeeds also keeps the code on screen', async () => {
    const { view } = renderWithRefetch({});
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));
    fireEvent.click(screen.getByRole('button', { name: /issue code/i }));
    await screen.findByText('ZHADV-SYB9B');
    view.rerender(<StudentDetailPage />);
    expect(screen.getByText('ZHADV-SYB9B')).toBeInTheDocument();
  });

  it('a student who is gone on refresh still gets the not-in-view screen', () => {
    institution();
    const s = student('rostered');
    mocks.useInstitutionResource.mockReturnValue(
      state(s, { error: { ...networkError, reason: 'NOT_FOUND' } }),
    );
    mocks.useStudentProgress.mockReturnValue(state([]));
    render(<StudentDetailPage />);
    expect(screen.getByText('That student is not in your view')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /invite/i })).not.toBeInTheDocument();
  });

  it('gone on the refresh after issuing: the code stays until Done, then not-in-view', async () => {
    const { view } = renderWithRefetch({ error: { ...networkError, reason: 'FORBIDDEN' } });
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));
    fireEvent.click(screen.getByRole('button', { name: /issue code/i }));
    await screen.findByText('ZHADV-SYB9B');
    view.rerender(<StudentDetailPage />);
    expect(screen.getByText('ZHADV-SYB9B')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(screen.getByText('That student is not in your view')).toBeInTheDocument();
  });

  it('with no student loaded at all, an error still replaces the page', () => {
    institution();
    mocks.useInstitutionResource.mockReturnValue(state(null, { error: networkError }));
    mocks.useStudentProgress.mockReturnValue(state([]));
    render(<StudentDetailPage />);
    expect(screen.getByText(ERROR_MESSAGES.NETWORK)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /invite/i })).not.toBeInTheDocument();
  });

  it('with no student loaded, not-found still says the student is not in view', () => {
    institution();
    mocks.useInstitutionResource.mockReturnValue(
      state(null, { error: { ...networkError, reason: 'NOT_FOUND' } }),
    );
    mocks.useStudentProgress.mockReturnValue(state([]));
    render(<StudentDetailPage />);
    expect(screen.getByText('That student is not in your view')).toBeInTheDocument();
  });
});

// The roster's read-only Invite explains itself the way every other write
// control does (WriteGuard): a disabled button cannot take focus, and a title
// attribute is not announced, so the reason must be in the page.
describe('roster Account column: read-only reason', () => {
  function renderRoster(readOnlyReason: string | null) {
    institution({ readOnlyReason });
    mocks.useStudentsPaged.mockReturnValue(state({
      items: [student('rostered', { id: 's9', full_name: 'Roster Student' })],
      total: 1, skip: 0, limit: 50,
    }));
    render(<StudentsPage />);
    return screen.getByText('Roster Student').closest('tr') as HTMLElement;
  }

  it('puts the read-only reason in the row, not only in a tooltip attribute', () => {
    const row = renderRoster('COLLEGE_PAUSED');
    expect(within(row).getAllByText(READ_ONLY_CONTROL_HINT.COLLEGE_PAUSED).length).toBeGreaterThan(0);
    expect(within(row).getByRole('button', { name: /invite/i })).toBeDisabled();
  });

  it('a click on the dimmed Invite does not open the student page', () => {
    const row = renderRoster('SUBSCRIPTION_EXPIRED');
    fireEvent.click(within(row).getByRole('button', { name: /invite/i }));
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('control: a writable college shows no read-only reason, and Invite opens the dialog', () => {
    const row = renderRoster(null);
    expect(within(row).queryByText(READ_ONLY_CONTROL_HINT.COLLEGE_PAUSED)).not.toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: /invite/i }));
    expect(screen.getByText(/invite code for roster student/i)).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
