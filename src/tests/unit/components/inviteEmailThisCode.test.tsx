/**
 * T3 (web): "Email this code" sends the code still on screen without
 * reissuing it, so a code already read out keeps working.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  issueInvite: vi.fn(),
  revokeInvites: vi.fn(),
  emailCurrentInvite: vi.fn(),
}));
vi.mock('@/api/institutionApi', () => ({
  issueInvite: mocks.issueInvite,
  revokeInvites: mocks.revokeInvites,
  emailCurrentInvite: mocks.emailCurrentInvite,
  InstitutionApiError: class InstitutionApiError extends Error {
    reason: string;
    fieldErrors: { field: string; message: string }[] = [];
    constructor(o: { reason: string; message?: string }) {
      super(o.message ?? o.reason);
      this.reason = o.reason;
    }
  },
}));

import { InviteCodeDialog } from '@/app/institution/_components/InviteCodeDialog';
import type { Student } from '@/types/institution';

const STUDENT = {
  id: 's1', account_id: null, claim_status: 'rostered', institution_id: 'vit',
  department_id: 'cse', full_name: 'Ravi Kumar', admission_number: 'A1',
  college_email: 'ravi@vit.ac.in', batch_year: 2025, section_id: null, status: 'enrolled',
} as Student;

const ISSUED = { student_id: 's1', full_name: 'Ravi Kumar', admission_number: 'A1',
  expires_at: '2026-11-27T00:00:00Z', code: 'ZHADV-SYB9B', emailed: false, email_error: null };

async function issueWithoutEmail(student = STUDENT) {
  mocks.issueInvite.mockResolvedValue(ISSUED);
  render(<InviteCodeDialog student={student} writable onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /issue code/i }));
  await screen.findByText('ZHADV-SYB9B');
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('Email this code', () => {
  it('emails the shown code without reissuing it', async () => {
    mocks.emailCurrentInvite.mockResolvedValue({ emailed: true, email_error: null });
    await issueWithoutEmail();
    fireEvent.click(screen.getByRole('button', { name: /email this code/i }));
    await waitFor(() => expect(mocks.emailCurrentInvite).toHaveBeenCalledWith('s1', 'ZHADV-SYB9B'));
    expect(mocks.issueInvite).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/emailed to ravi@vit.ac.in/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /email this code/i })).not.toBeInTheDocument();
    expect(screen.getByText('ZHADV-SYB9B')).toBeInTheDocument();
  });

  it('is not offered when the student has no email on record', async () => {
    await issueWithoutEmail({ ...STUDENT, college_email: null });
    expect(screen.queryByRole('button', { name: /email this code/i })).not.toBeInTheDocument();
  });

  it('shows a refusal and keeps the code on screen', async () => {
    const Err = (await import('@/api/institutionApi')).InstitutionApiError as unknown as
      new (o: object) => Error;
    mocks.emailCurrentInvite.mockRejectedValue(new Err({
      reason: 'INVALID_REQUEST', message: "that is not this student's current code",
    }));
    await issueWithoutEmail();
    fireEvent.click(screen.getByRole('button', { name: /email this code/i }));
    await waitFor(() => expect(mocks.emailCurrentInvite).toHaveBeenCalled());
    expect(screen.getByText('ZHADV-SYB9B')).toBeInTheDocument();
    expect(await screen.findByText(/not this student's current code/i)).toBeInTheDocument();
  });

  it('is disabled while the college is read-only', async () => {
    mocks.issueInvite.mockResolvedValue(ISSUED);
    const { rerender } = render(<InviteCodeDialog student={STUDENT} writable onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /issue code/i }));
    await screen.findByText('ZHADV-SYB9B');
    rerender(<InviteCodeDialog student={STUDENT} writable={false} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /email this code/i })).toBeDisabled();
  });

  it('cannot be clicked twice while sending', async () => {
    let finish: (v: unknown) => void = () => {};
    mocks.emailCurrentInvite.mockImplementation(() => new Promise((r) => { finish = r; }));
    await issueWithoutEmail();
    fireEvent.click(screen.getByRole('button', { name: /email this code/i }));
    expect(screen.getByRole('button', { name: /working/i })).toBeDisabled();
    finish({ emailed: true, email_error: null });
    await screen.findByText(/emailed to/i);
    expect(mocks.emailCurrentInvite).toHaveBeenCalledTimes(1);
  });

  it('shows the send error the server reports', async () => {
    mocks.emailCurrentInvite.mockResolvedValue({ emailed: false,
      email_error: 'the invite email could not be sent' });
    await issueWithoutEmail();
    fireEvent.click(screen.getByRole('button', { name: /email this code/i }));
    expect(await screen.findByText(/not emailed: the invite email could not be sent/i))
      .toBeInTheDocument();
  });
});
