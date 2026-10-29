/**
 * T5 (web): the placement officer corrects a student's details and changes
 * their status from the student page.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateStudent: vi.fn(),
  setStudentStatus: vi.fn(),
  useSections: vi.fn(),
}));

vi.mock('@/api/institutionApi', () => ({
  updateStudent: mocks.updateStudent,
  setStudentStatus: mocks.setStudentStatus,
  InstitutionApiError: class InstitutionApiError extends Error {
    reason: string;
    fieldErrors: { field: string; message: string }[] = [];
    constructor(opts: { reason: string; message?: string }) {
      super(opts.message ?? opts.reason);
      this.reason = opts.reason;
    }
  },
}));
vi.mock('@/hooks/useInstitutionResource', () => ({
  useSections: mocks.useSections,
}));

import { EditStudentDialog } from '@/app/institution/_components/EditStudentDialog';
import { can } from '@/lib/institutionPermissions';
import * as api from '@/api/institutionApi';
import type { Student } from '@/types/institution';

const STUDENT = {
  id: 's1', account_id: null, claim_status: 'invited', institution_id: 'vit',
  department_id: 'cse', full_name: 'narasimh swamy odugu',
  admission_number: '03k61a0537', college_email: 'narasimha.sasi@gmail.com',
  batch_year: 2025, section_id: null, status: 'enrolled',
} as Student;

function renderDialog(over: Partial<Student> = {}, writable = true, onClose = vi.fn()) {
  mocks.useSections.mockReturnValue({
    data: [{ id: 'sec-a', name: 'Section A', department_id: 'cse' }],
    isLoading: false, error: null, refetch: vi.fn(),
  });
  const onSaved = vi.fn();
  render(
    <EditStudentDialog
      student={{ ...STUDENT, ...over }}
      writable={writable}
      onClose={onClose}
      onSaved={onSaved}
    />,
  );
  return { onSaved };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('who may edit', () => {
  it('is the placement officer only', () => {
    expect(can('cpo', 'edit_student')).toBe(true);
    expect(can('hod', 'edit_student')).toBe(false);
    expect(can('faculty', 'edit_student')).toBe(false);
    expect(can('student', 'edit_student')).toBe(false);
  });
});

describe('details', () => {
  it('sends only the field that changed', async () => {
    mocks.updateStudent.mockResolvedValue({});
    const { onSaved } = renderDialog();
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Narasimha Swamy Odugu' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    await waitFor(() => expect(mocks.updateStudent).toHaveBeenCalledWith('s1', {
      full_name: 'Narasimha Swamy Odugu',
    }));
    expect(onSaved).toHaveBeenCalled();
    expect(await screen.findByText('Details saved.')).toBeInTheDocument();
  });

  it('sends null to clear the email', async () => {
    mocks.updateStudent.mockResolvedValue({});
    renderDialog();
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    await waitFor(() => expect(mocks.updateStudent).toHaveBeenCalledWith('s1', {
      college_email: null,
    }));
  });

  it('can place the student in a section', async () => {
    mocks.updateStudent.mockResolvedValue({});
    renderDialog();
    fireEvent.change(screen.getByLabelText(/section/i), { target: { value: 'sec-a' } });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    await waitFor(() => expect(mocks.updateStudent).toHaveBeenCalledWith('s1', {
      section_id: 'sec-a',
    }));
  });

  it('cannot save with nothing changed, a blank name, or a bad year', () => {
    renderDialog();
    const save = screen.getByRole('button', { name: /save details/i });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: '  ' } });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText(/batch/i), { target: { value: '25' } });
    expect(save).toBeDisabled();
    expect(screen.getByText('Enter a year between 1900 and 2100.')).toBeInTheDocument();
  });

  it('shows the server refusal, e.g. a duplicate admission number', async () => {
    const ApiError = (api as unknown as { InstitutionApiError: new (o: object) => Error })
      .InstitutionApiError;
    mocks.updateStudent.mockRejectedValue(new ApiError({
      reason: 'CONFLICT',
      message: 'a student with this admission number is already on the roster',
    }));
    renderDialog();
    fireEvent.change(screen.getByLabelText(/admission/i), { target: { value: '21CSE001' } });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    await waitFor(() => expect(mocks.updateStudent).toHaveBeenCalled());
    expect(screen.queryByText('Details saved.')).not.toBeInTheDocument();
    // The refusal itself is on screen, and the officer can correct and retry.
    expect(
      await screen.findByText('a student with this admission number is already on the roster'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save details/i })).toBeEnabled();
  });

  it('shows a field refusal under the field it names', async () => {
    const ApiError = (api as unknown as { InstitutionApiError: new (o: object) => Error })
      .InstitutionApiError;
    const err = new ApiError({ reason: 'INVALID_REQUEST', message: 'invalid' }) as Error & {
      fieldErrors: { field: string; message: string }[];
    };
    err.fieldErrors = [{ field: 'admission_number', message: 'Use letters and digits only.' }];
    mocks.updateStudent.mockRejectedValue(err);
    renderDialog();
    fireEvent.change(screen.getByLabelText(/admission/i), { target: { value: '21/CSE' } });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    expect(await screen.findByText('Use letters and digits only.')).toBeInTheDocument();
    expect(screen.getByLabelText(/admission/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('is disabled when the college is read-only', () => {
    renderDialog({}, false);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New Name' } });
    expect(screen.getByRole('button', { name: /save details/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /save status/i })).toBeDisabled();
  });
});

describe('status', () => {
  it('warns what leaving does, then saves the status', async () => {
    mocks.setStudentStatus.mockResolvedValue({ ...STUDENT, status: 'withdrawn', invites_revoked: 1 });
    renderDialog();
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'withdrawn' } });
    expect(screen.getByText(/loses access to the college pages/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /save status/i }));
    await waitFor(() => expect(mocks.setStudentStatus).toHaveBeenCalledWith('s1', 'withdrawn'));
    expect(await screen.findByText(/1 unused code\(s\) cancelled/)).toBeInTheDocument();
  });

  it('says access is back on when re-enrolling', async () => {
    mocks.setStudentStatus.mockResolvedValue({ ...STUDENT, status: 'enrolled' });
    renderDialog({ status: 'suspended' });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'enrolled' } });
    fireEvent.click(screen.getByRole('button', { name: /save status/i }));
    expect(await screen.findByText(/college access is back on/i)).toBeInTheDocument();
  });

  it('cannot save the status it already has', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /save status/i })).toBeDisabled();
  });
});


describe('Codex T5 web round 1', () => {
  it('a stored value with stray spaces is not an edit', () => {
    renderDialog({ full_name: '  narasimh swamy odugu ' });
    expect(screen.getByRole('button', { name: /save details/i })).toBeDisabled();
  });

  it('after a save the same change cannot be sent again', async () => {
    mocks.updateStudent.mockResolvedValue({ ...STUDENT, full_name: 'Narasimha Swamy Odugu' });
    renderDialog();
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Narasimha Swamy Odugu' },
    });
    const save = screen.getByRole('button', { name: /save details/i });
    fireEvent.click(save);
    await screen.findByText('Details saved.');
    expect(save).toBeDisabled();
    expect(mocks.updateStudent).toHaveBeenCalledTimes(1);
  });

  it('after a status save the same status cannot be sent again', async () => {
    mocks.setStudentStatus.mockResolvedValue({ ...STUDENT, status: 'graduated', invites_revoked: 0 });
    renderDialog();
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'graduated' } });
    const save = screen.getByRole('button', { name: /save status/i });
    fireEvent.click(save);
    await screen.findByText(/status saved/i);
    expect(save).toBeDisabled();
  });

  it.each(['0000', '9999', '1899', '2101'])('refuses batch year %s', (year) => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/batch/i), { target: { value: year } });
    expect(screen.getByRole('button', { name: /save details/i })).toBeDisabled();
  });

  it('clears section and batch with null', async () => {
    mocks.updateStudent.mockResolvedValue({});
    renderDialog({ section_id: 'sec-a', batch_year: 2025 });
    fireEvent.change(screen.getByLabelText(/section/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/batch/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    await waitFor(() => expect(mocks.updateStudent).toHaveBeenCalledWith('s1', {
      section_id: null, batch_year: null,
    }));
  });

  it('Escape closes the dialog', () => {
    const onClose = vi.fn();
    renderDialog({}, true, onClose);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('starts with the name field focused', () => {
    renderDialog();
    expect(screen.getByLabelText(/full name/i)).toHaveFocus();
  });
});

// ai-review f36884fb P2: a 409 left the dialog comparing against a stale row.
// The API (careerbot-api #507) answers 409 when the row changed under the
// edit ("reload and try again"), for a duplicate admission number or email,
// and when a status WAS saved but college access could not be switched back
// on. It takes no version from the client (extra fields are refused), so the
// dialog cannot send one; it re-reads instead. The page refetches (onSaved)
// and hands the dialog the fresh row, which becomes the baseline. Fields the
// officer has not touched follow the fresh row; the officer's own edits stay.
describe('after a 409 the dialog works from the fresh row', () => {
  const ApiError = () =>
    (api as unknown as { InstitutionApiError: new (o: object) => Error }).InstitutionApiError;

  function renderWithRerender(student: Student) {
    mocks.useSections.mockReturnValue({
      data: [{ id: 'sec-a', name: 'Section A', department_id: 'cse' }],
      isLoading: false, error: null, refetch: vi.fn(),
    });
    const props = { writable: true, onClose: vi.fn(), onSaved: vi.fn() };
    const view = render(<EditStudentDialog student={student} {...props} />);
    const rerender = (next: Student) =>
      view.rerender(<EditStudentDialog student={next} {...props} />);
    return { onSaved: props.onSaved, rerender };
  }

  it('re-reads the student on a details conflict and keeps the edit', async () => {
    const Err = ApiError();
    mocks.updateStudent.mockRejectedValueOnce(new Err({
      reason: 'CONFLICT',
      message: 'this student was changed by someone else a moment ago; reload and try again',
    }));
    const { onSaved, rerender } = renderWithRerender(STUDENT);
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Narasimha Swamy Odugu' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    expect(await screen.findByText(/changed by someone else a moment ago/)).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledTimes(1);
    // Another officer fixed the batch meanwhile; the page passes the fresh row.
    rerender({ ...STUDENT, batch_year: 2026 });
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Narasimha Swamy Odugu');
    expect(screen.getByLabelText(/batch/i)).toHaveValue('2026');
    mocks.updateStudent.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    await waitFor(() => expect(mocks.updateStudent).toHaveBeenLastCalledWith('s1', {
      full_name: 'Narasimha Swamy Odugu',
    }));
  });

  it('re-reads on a status conflict; a status the server did save is not offered again', async () => {
    const Err = ApiError();
    mocks.setStudentStatus.mockRejectedValueOnce(new Err({
      reason: 'CONFLICT',
      message: 'this student is now active at another college, so their access here '
        + 'cannot be switched back on. Their status was saved',
    }));
    const { onSaved, rerender } = renderWithRerender({ ...STUDENT, status: 'withdrawn' });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'enrolled' } });
    fireEvent.click(screen.getByRole('button', { name: /save status/i }));
    expect(await screen.findByText(/their status was saved/i)).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledTimes(1);
    rerender({ ...STUDENT, status: 'enrolled' });
    expect(screen.getByLabelText(/status/i)).toHaveValue('enrolled');
    expect(screen.getByRole('button', { name: /save status/i })).toBeDisabled();
  });

  it('control: a refusal that is not a conflict does not re-read', async () => {
    const Err = ApiError();
    mocks.updateStudent.mockRejectedValueOnce(new Err({ reason: 'FORBIDDEN', message: 'no' }));
    const { onSaved } = renderWithRerender(STUDENT);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'X Y' } });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    await waitFor(() => expect(mocks.updateStudent).toHaveBeenCalled());
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('a fresh row after a successful save leaves nothing to send', async () => {
    mocks.updateStudent.mockResolvedValueOnce({ ...STUDENT, full_name: 'New Name' });
    const { rerender } = renderWithRerender(STUDENT);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: /save details/i }));
    await screen.findByText('Details saved.');
    rerender({ ...STUDENT, full_name: 'New Name' });
    expect(screen.getByLabelText(/full name/i)).toHaveValue('New Name');
    expect(screen.getByRole('button', { name: /save details/i })).toBeDisabled();
  });
});

// Codex (ai-review f36884fb) P2: while sections load, or if they fail, the
// student's own section was not among the options, so the select showed
// "No section" for a student who has one.
describe('section select keeps the current section', () => {
  function renderWithSections(sections: Record<string, unknown>) {
    mocks.useSections.mockReturnValue({ isLoading: false, error: null, refetch: vi.fn(), ...sections });
    render(
      <EditStudentDialog
        student={{ ...STUDENT, section_id: 'sec-a' }}
        writable onClose={vi.fn()} onSaved={vi.fn()}
      />,
    );
    return screen.getByLabelText(/section/i);
  }

  it('while the sections are loading', () => {
    const select = renderWithSections({ data: null, isLoading: true });
    expect(select).toHaveValue('sec-a');
    expect(screen.getByRole('button', { name: /save details/i })).toBeDisabled();
  });

  it('when the sections failed to load', () => {
    const select = renderWithSections({ data: null, error: { reason: 'NETWORK' } });
    expect(select).toHaveValue('sec-a');
  });

  it('control: once loaded, the section shows by name', () => {
    const select = renderWithSections({
      data: [{ id: 'sec-a', name: 'Section A', department_id: 'cse' }],
    }) as HTMLSelectElement;
    expect(select).toHaveValue('sec-a');
    expect(select.selectedOptions[0].textContent).toBe('Section A');
  });
});
