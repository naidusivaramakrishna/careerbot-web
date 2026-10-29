/**
 * T6 (web): the Assignments screen shows who is already on a faculty member's
 * roster, filters by section, removes or moves students, and warns above 25.
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useInstitution: vi.fn(),
  useMembers: vi.fn(),
  useDepartments: vi.fn(),
  useSections: vi.fn(),
  useStudentsPaged: vi.fn(),
  useStructureNames: vi.fn(),
  listFacultyAssignments: vi.fn(),
  removeStudentsFromFaculty: vi.fn(),
  moveStudentsBetweenFaculty: vi.fn(),
  assignStudentsToFaculty: vi.fn(),
  useActiveInstitutionId: vi.fn(() => 'vit'),
}));

vi.mock('@/contexts/InstitutionContext', () => ({ useInstitution: mocks.useInstitution }));
vi.mock('@/hooks/useInstitutionResource', () => ({
  useMembers: mocks.useMembers,
  useDepartments: mocks.useDepartments,
  useSections: mocks.useSections,
  useStudentsPaged: mocks.useStudentsPaged,
  useActiveInstitutionId: mocks.useActiveInstitutionId,
}));
vi.mock('@/hooks/useStructureNames', () => ({ useStructureNames: mocks.useStructureNames }));
vi.mock('@/api/institutionApi', () => ({
  listFacultyAssignments: mocks.listFacultyAssignments,
  removeStudentsFromFaculty: mocks.removeStudentsFromFaculty,
  moveStudentsBetweenFaculty: mocks.moveStudentsBetweenFaculty,
  assignStudentsToFaculty: mocks.assignStudentsToFaculty,
  InstitutionApiError: class InstitutionApiError extends Error {
    reason: string;
    fieldErrors: { field: string; message: string }[] = [];
    constructor(o: { reason: string; message?: string }) {
      super(o.message ?? o.reason);
      this.reason = o.reason;
    }
  },
}));

import FacultyAssignmentsPage from '@/app/institution/assignments/page';
import { ROSTER_WARNING_SIZE } from '@/lib/facultyAssignment';

function state<T>(data: T) {
  return { data, isLoading: false, error: null, refetch: vi.fn() };
}

const FACULTY = [
  { membership_id: 'mem-a', account_id: 'fac-a', institution_id: 'vit', role: 'faculty',
    department_id: 'cse', display_name: 'Prof A' },
  { membership_id: 'mem-b', account_id: 'fac-b', institution_id: 'vit', role: 'faculty',
    department_id: 'cse', display_name: 'Prof B' },
  { membership_id: 'mem-e', account_id: 'fac-e', institution_id: 'vit', role: 'faculty',
    department_id: 'ece', display_name: 'Prof E' },
];

function student(id: string, name: string) {
  return { id, full_name: name, admission_number: id.toUpperCase(), department_id: 'cse',
    section_id: 'sec-a', status: 'enrolled', claim_status: 'rostered', account_id: null,
    institution_id: 'vit', college_email: null, batch_year: 2025 };
}

function setup({ roster = ['s1'], students = [student('s1', 'On Roster'), student('s2', 'Not Yet')] } = {}) {
  mocks.useInstitution.mockReturnValue({ readOnlyReason: null, canWrite: () => true,
    allows: () => true, role: 'hod' });
  mocks.useActiveInstitutionId.mockReturnValue('vit');
  mocks.useMembers.mockReturnValue(state(FACULTY));
  mocks.useDepartments.mockReturnValue(state([{ id: 'cse', name: 'CSE' }, { id: 'ece', name: 'ECE' }]));
  mocks.useSections.mockReturnValue(state([{ id: 'sec-a', name: 'Section A' }]));
  mocks.useStudentsPaged.mockReturnValue(state({ items: students, total: students.length,
    skip: 0, limit: 100 }));
  mocks.useStructureNames.mockReturnValue({ sectionName: () => 'Section A' });
  mocks.listFacultyAssignments.mockResolvedValue({ faculty_membership_id: 'mem-a',
    student_ids: roster, count: roster.length });
  return render(<FacultyAssignmentsPage />);
}

async function chooseFacultyA() {
  fireEvent.change(screen.getByLabelText(/faculty member/i, { selector: 'select' }), {
    target: { value: 'mem-a' },
  });
  await waitFor(() => expect(mocks.listFacultyAssignments).toHaveBeenCalledWith('mem-a'));
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('roster on the assignments screen', () => {
  it('says how many students the faculty member has and who is on the roster', async () => {
    setup();
    await chooseFacultyA();
    expect(await screen.findByText(/1 student on this roster/)).toBeInTheDocument();
    const onRow = screen.getByText('On Roster').closest('tr') as HTMLElement;
    const offRow = screen.getByText('Not Yet').closest('tr') as HTMLElement;
    expect(within(onRow).getByText('Yes')).toBeInTheDocument();
    expect(within(offRow).getByText('No')).toBeInTheDocument();
  });

  it('filters the students by section on the server', async () => {
    setup();
    await chooseFacultyA();
    fireEvent.change(screen.getByLabelText(/filter by section/i), { target: { value: 'sec-a' } });
    expect(mocks.useStudentsPaged).toHaveBeenLastCalledWith(
      expect.objectContaining({ section_id: 'sec-a', department_id: 'cse' }),
    );
  });

  it('removes ticked students who are on the roster, then reloads it', async () => {
    mocks.removeStudentsFromFaculty.mockResolvedValue({ removed: 1 });
    setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign On Roster'));
    fireEvent.click(screen.getByRole('button', { name: /remove 1 from this faculty member/i }));
    await waitFor(() => expect(mocks.removeStudentsFromFaculty).toHaveBeenCalledWith({
      faculty_membership_id: 'mem-a', student_ids: ['s1'],
    }));
    expect(await screen.findByText(/1 student removed/)).toBeInTheDocument();
    expect(mocks.listFacultyAssignments).toHaveBeenCalledTimes(2);
  });

  it('moves only to faculty in the same department', async () => {
    mocks.moveStudentsBetweenFaculty.mockResolvedValue({ assigned: 1, removed: 1 });
    setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign On Roster'));
    const moveSelect = screen.getByLabelText(/move to faculty member/i);
    const labels = within(moveSelect).getAllByRole('option').map((o) => o.textContent);
    expect(labels.some((l) => l?.includes('Prof B'))).toBe(true);
    expect(labels.some((l) => l?.includes('Prof E'))).toBe(false);   // other department
    expect(labels.some((l) => l?.includes('Prof A'))).toBe(false);   // the source itself
    fireEvent.change(moveSelect, { target: { value: 'mem-b' } });
    fireEvent.click(screen.getByRole('button', { name: /^move 1$/i }));
    await waitFor(() => expect(mocks.moveStudentsBetweenFaculty).toHaveBeenCalledWith({
      from_membership_id: 'mem-a', to_membership_id: 'mem-b', student_ids: ['s1'],
    }));
  });

  it('offers no remove for students who are not on the roster', async () => {
    setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it(`warns above ${ROSTER_WARNING_SIZE} students for one faculty member`, async () => {
    const many = Array.from({ length: ROSTER_WARNING_SIZE }, (_, i) => `r${i}`);
    setup({ roster: many });
    await chooseFacultyA();
    await screen.findByText(new RegExp(`${ROSTER_WARNING_SIZE} students on this roster`));
    expect(screen.queryByText(/makes close monitoring hard/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));   // one more ticked to add
    expect(screen.getByText(/makes close monitoring hard/)).toBeInTheDocument();
  });
});

describe('Codex T6 web round 1', () => {
  it('a late roster answer for the previous faculty member is ignored', async () => {
    let resolveA: (v: unknown) => void = () => {};
    setup();
    mocks.listFacultyAssignments.mockReset();
    mocks.listFacultyAssignments
      .mockImplementationOnce(() => new Promise((r) => { resolveA = r; }))   // A: slow
      .mockResolvedValueOnce({ faculty_membership_id: 'mem-b', student_ids: [], count: 0 });
    const select = screen.getByLabelText(/faculty member/i, { selector: 'select' });
    fireEvent.change(select, { target: { value: 'mem-a' } });
    fireEvent.change(select, { target: { value: 'mem-b' } });
    expect(await screen.findByText(/0 students on this roster/)).toBeInTheDocument();
    resolveA({ faculty_membership_id: 'mem-a', student_ids: ['s1', 's2'], count: 2 });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/2 students on this roster/)).not.toBeInTheDocument();
    expect(screen.getByText(/0 students on this roster/)).toBeInTheDocument();
  });

  it('read-only: the faculty selector is disabled', async () => {
    mocks.useInstitution.mockReturnValue({ readOnlyReason: 'COLLEGE_PAUSED',
      canWrite: () => false, allows: () => true, role: 'hod' });
    mocks.useMembers.mockReturnValue(state(FACULTY));
    mocks.useDepartments.mockReturnValue(state([{ id: 'cse', name: 'CSE' }]));
    mocks.useSections.mockReturnValue(state([]));
    mocks.useStudentsPaged.mockReturnValue(state({ items: [student('s1', 'On Roster')],
      total: 1, skip: 0, limit: 100 }));
    mocks.useStructureNames.mockReturnValue({ sectionName: () => 'Section A' });
    mocks.listFacultyAssignments.mockResolvedValue({ faculty_membership_id: 'mem-a',
      student_ids: ['s1'], count: 1 });
    render(<FacultyAssignmentsPage />);
    // The faculty select itself is disabled while read-only, as Assign is.
    expect(screen.getByLabelText(/faculty member/i, { selector: 'select' })).toBeDisabled();
  });

  it('the section filter resets when the faculty member changes', async () => {
    setup();
    await chooseFacultyA();
    fireEvent.change(screen.getByLabelText(/filter by section/i), { target: { value: 'sec-a' } });
    fireEvent.change(screen.getByLabelText(/faculty member/i, { selector: 'select' }), {
      target: { value: 'mem-b' },
    });
    expect(mocks.useStudentsPaged).toHaveBeenLastCalledWith(
      expect.objectContaining({ section_id: undefined }),
    );
  });
});

describe('fix round (ai-review at 1b56ca28)', () => {
  const EMPTY = { items: [], total: 0, skip: 0, limit: 100 };

  it('an empty section keeps the form, so the filter can be cleared', async () => {
    setup();
    await chooseFacultyA();
    mocks.useStudentsPaged.mockImplementation((p: { section_id?: string }) =>
      p.section_id ? state(EMPTY) : state({ items: [student('s1', 'On Roster')], total: 1,
        skip: 0, limit: 100 }));
    fireEvent.change(screen.getByLabelText(/filter by section/i), { target: { value: 'sec-a' } });
    expect(screen.queryByText('No students to assign yet')).not.toBeInTheDocument();
    const filter = screen.getByLabelText(/filter by section/i);
    fireEvent.change(filter, { target: { value: '' } });
    expect(await screen.findByText('On Roster')).toBeInTheDocument();
  });

  it('control: a college with no students at all still shows the empty state', () => {
    setup({ students: [] });
    expect(screen.getByText('No students to assign yet')).toBeInTheDocument();
  });

  it('switching college drops the previous college\'s roster and faculty choice', async () => {
    const view = setup();
    await chooseFacultyA();
    expect(await screen.findByText(/1 student on this roster/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Assign On Roster'));
    mocks.useActiveInstitutionId.mockReturnValue('other-college');
    mocks.useMembers.mockReturnValue(state([{ membership_id: 'mem-z', account_id: 'fac-z',
      institution_id: 'other-college', role: 'faculty', department_id: 'mech',
      display_name: 'Prof Z' }]));
    view.rerender(<FacultyAssignmentsPage />);
    expect(screen.queryByText(/on this roster/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove 1/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/faculty member/i, { selector: 'select' })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Assign students' })).toBeInTheDocument();
  });

  it('a roster answer from the previous college is ignored', async () => {
    let resolveA: (v: unknown) => void = () => {};
    const view = setup();
    mocks.listFacultyAssignments.mockReset();
    mocks.listFacultyAssignments.mockImplementationOnce(
      () => new Promise((r) => { resolveA = r; }));
    fireEvent.change(screen.getByLabelText(/faculty member/i, { selector: 'select' }), {
      target: { value: 'mem-a' },
    });
    mocks.useActiveInstitutionId.mockReturnValue('other-college');
    view.rerender(<FacultyAssignmentsPage />);
    resolveA({ faculty_membership_id: 'mem-a', student_ids: ['s1', 's2'], count: 2 });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/on this roster/)).not.toBeInTheDocument();
  });

  it('a failed Remove reloads the roster (part of it may have been removed)', async () => {
    mocks.removeStudentsFromFaculty.mockRejectedValue(new Error('some could not be removed'));
    setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign On Roster'));
    fireEvent.click(screen.getByRole('button', { name: /remove 1 from this faculty member/i }));
    await waitFor(() => expect(mocks.listFacultyAssignments).toHaveBeenCalledTimes(2));
  });

  it('a failed Move reloads the roster (it assigns before it removes)', async () => {
    mocks.moveStudentsBetweenFaculty.mockRejectedValue(new Error('interrupted'));
    setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign On Roster'));
    fireEvent.change(screen.getByLabelText(/move to faculty member/i), { target: { value: 'mem-b' } });
    fireEvent.click(screen.getByRole('button', { name: /^move 1$/i }));
    await waitFor(() => expect(mocks.listFacultyAssignments).toHaveBeenCalledTimes(2));
  });

  it('a failed Assign reloads the roster too', async () => {
    mocks.assignStudentsToFaculty.mockRejectedValue(new Error('interrupted'));
    setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));
    fireEvent.click(screen.getByRole('button', { name: /assign 1 student/i }));
    await waitFor(() => expect(mocks.listFacultyAssignments).toHaveBeenCalledTimes(2));
  });

  it('read-only after a roster loads: Remove and Move are disabled and say why', async () => {
    const view = setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign On Roster'));
    mocks.useInstitution.mockReturnValue({ readOnlyReason: 'COLLEGE_PAUSED',
      canWrite: () => false, allows: () => true, role: 'hod' });
    view.rerender(<FacultyAssignmentsPage />);
    expect(screen.getByRole('button', { name: /remove 1 from this faculty member/i })).toBeDisabled();
    expect(screen.getByLabelText(/move to faculty member/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /^move 1$/i })).toBeDisabled();
    // One hint per guarded group (Assign, Remove/Move), each in an sr-only span and a tooltip.
    expect(screen.getAllByText(/paused subscription/i)).toHaveLength(4);
  });

  it('"Try again" on a failed roster load reloads it and does not submit the form', async () => {
    setup();
    const { InstitutionApiError } = await import('@/api/institutionApi');
    mocks.listFacultyAssignments.mockReset();
    mocks.listFacultyAssignments
      .mockRejectedValueOnce(new InstitutionApiError({ reason: 'NETWORK' }))
      .mockResolvedValueOnce({ faculty_membership_id: 'mem-a', student_ids: ['s1'], count: 1 });
    fireEvent.change(screen.getByLabelText(/faculty member/i, { selector: 'select' }), {
      target: { value: 'mem-a' },
    });
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));
    fireEvent.click(await screen.findByRole('button', { name: /try again/i }));
    await waitFor(() => expect(mocks.listFacultyAssignments).toHaveBeenCalledTimes(2));
    expect(mocks.assignStudentsToFaculty).not.toHaveBeenCalled();
    expect(await screen.findByText(/1 student on this roster/)).toBeInTheDocument();
  });

  it('a failed sections load offers no stale sections and a retry that does not submit', async () => {
    const refetch = vi.fn();
    setup();
    mocks.useSections.mockReturnValue({ data: [{ id: 'sec-old', name: 'Old Dept Section' }],
      isLoading: false, error: new Error('network'), refetch });
    await chooseFacultyA();
    expect(screen.queryByRole('option', { name: 'Old Dept Section' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));
    fireEvent.click(screen.getByRole('button', { name: /retry sections/i }));
    expect(refetch).toHaveBeenCalled();
    expect(mocks.assignStudentsToFaculty).not.toHaveBeenCalled();
  });

  it('switching college during a pending Assign frees the new college\'s controls', async () => {
    mocks.assignStudentsToFaculty.mockImplementation(() => new Promise(() => {}));
    const view = setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));
    fireEvent.click(screen.getByRole('button', { name: /assign 1 student/i }));
    await screen.findByText('Assigning');
    mocks.useActiveInstitutionId.mockReturnValue('other-college');
    view.rerender(<FacultyAssignmentsPage />);
    expect(screen.getByLabelText(/faculty member/i, { selector: 'select' })).not.toBeDisabled();
    expect(screen.queryByText('Assigning')).not.toBeInTheDocument();
  });

  it('an old action finishing after a new one started does not unlock the new one', async () => {
    let resolveOld: (v: unknown) => void = () => {};
    mocks.assignStudentsToFaculty
      .mockImplementationOnce(() => new Promise((r) => { resolveOld = r; }))
      .mockImplementationOnce(() => new Promise(() => {}));
    const view = setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));
    fireEvent.click(screen.getByRole('button', { name: /assign 1 student/i }));
    await screen.findByText('Assigning');
    mocks.useActiveInstitutionId.mockReturnValue('other-college');
    view.rerender(<FacultyAssignmentsPage />);
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));
    fireEvent.click(screen.getByRole('button', { name: /assign 1 student/i }));
    await screen.findByText('Assigning');
    resolveOld([{ id: 'row-1' }]);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText('Assigning')).toBeInTheDocument();
  });

  it('switching away and back does not let the first visit\'s answer land', async () => {
    let resolveOld: (v: unknown) => void = () => {};
    mocks.removeStudentsFromFaculty.mockImplementationOnce(
      () => new Promise((r) => { resolveOld = r; }));
    const view = setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign On Roster'));
    fireEvent.click(screen.getByRole('button', { name: /remove 1 from this faculty member/i }));
    mocks.useActiveInstitutionId.mockReturnValue('other-college');
    view.rerender(<FacultyAssignmentsPage />);
    mocks.useActiveInstitutionId.mockReturnValue('vit');
    view.rerender(<FacultyAssignmentsPage />);
    fireEvent.change(screen.getByLabelText(/faculty member/i, { selector: 'select' }), {
      target: { value: 'mem-b' },
    });
    await waitFor(() => expect(mocks.listFacultyAssignments).toHaveBeenCalledWith('mem-b'));
    fireEvent.click(screen.getByLabelText('Assign Not Yet'));
    const calls = mocks.listFacultyAssignments.mock.calls.length;
    resolveOld({ removed: 1 });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/removed from this faculty member/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Assign Not Yet')).toBeChecked();
    // Only the roster now on screen is read again (the old write changed the server).
    expect(mocks.listFacultyAssignments.mock.calls.length).toBe(calls + 1);
    expect(mocks.listFacultyAssignments).toHaveBeenLastCalledWith('mem-b');
  });

  it('while a new section loads, the previous section\'s rows cannot be ticked', async () => {
    setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    const old = state({ items: [student('s1', 'On Roster'), student('s2', 'Not Yet')], total: 2,
      skip: 0, limit: 100 });
    mocks.useStudentsPaged.mockImplementation((p: { section_id?: string }) =>
      p.section_id ? { ...old, isLoading: true } : old);
    fireEvent.change(screen.getByLabelText(/filter by section/i), { target: { value: 'sec-a' } });
    expect(screen.getByLabelText('Assign Not Yet')).toBeDisabled();
    expect(screen.getByRole('button', { name: /select page/i })).toBeDisabled();
  });

  it('while a department\'s sections load, the previous department\'s are not offered', async () => {
    setup();
    mocks.useSections.mockReturnValue({ data: [{ id: 'sec-old', name: 'Old Dept Section' }],
      isLoading: true, error: null, refetch: vi.fn() });
    await chooseFacultyA();
    expect(screen.queryByRole('option', { name: 'Old Dept Section' })).not.toBeInTheDocument();
  });

  it('an old visit\'s write that lands later reloads the roster now on screen', async () => {
    let resolveOld: (v: unknown) => void = () => {};
    mocks.removeStudentsFromFaculty.mockImplementationOnce(
      () => new Promise((r) => { resolveOld = r; }));
    const view = setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    fireEvent.click(screen.getByLabelText('Assign On Roster'));
    fireEvent.click(screen.getByRole('button', { name: /remove 1 from this faculty member/i }));
    mocks.useActiveInstitutionId.mockReturnValue('other-college');
    view.rerender(<FacultyAssignmentsPage />);
    mocks.useActiveInstitutionId.mockReturnValue('vit');
    view.rerender(<FacultyAssignmentsPage />);
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    const calls = mocks.listFacultyAssignments.mock.calls.length;
    resolveOld({ removed: 1 });
    await waitFor(() => expect(mocks.listFacultyAssignments.mock.calls.length).toBe(calls + 1));
    expect(mocks.listFacultyAssignments).toHaveBeenLastCalledWith('mem-a');
    expect(screen.queryByText(/removed from this faculty member/)).not.toBeInTheDocument();
  });

  it('after a failed load for a new section, the previous rows still cannot be ticked', async () => {
    setup();
    await chooseFacultyA();
    await screen.findByText(/1 student on this roster/);
    const old = state({ items: [student('s1', 'On Roster'), student('s2', 'Not Yet')], total: 2,
      skip: 0, limit: 100 });
    mocks.useStudentsPaged.mockImplementation((p: { section_id?: string }) =>
      p.section_id ? { ...old, error: new Error('network') } : old);
    fireEvent.change(screen.getByLabelText(/filter by section/i), { target: { value: 'sec-a' } });
    expect(screen.getByLabelText('Assign Not Yet')).toBeDisabled();
    expect(screen.getByRole('button', { name: /select page/i })).toBeDisabled();
  });
});
