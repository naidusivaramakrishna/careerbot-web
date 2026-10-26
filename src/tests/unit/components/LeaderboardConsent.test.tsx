/**
 * Leaderboard consent is OPT-IN (owner, 2026-10-25).
 *
 * A student is not named on any leaderboard until they turn it on, and the
 * switch must never show a state the server did not accept: a student who
 * believes their name is hidden when it is not is the failure this exists to
 * prevent.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const setMyLeaderboardConsent = vi.fn();
const getMyStudentProfile = vi.fn();
vi.mock('@/api/institutionApi', async (importActual) => ({
  // The real error class, so the toggle's instanceof check sees what fail() throws.
  InstitutionApiError: (await importActual<typeof import('@/api/institutionApi')>()).InstitutionApiError,
  setMyLeaderboardConsent: (...a: unknown[]) => setMyLeaderboardConsent(...a),
  getMyStudentProfile: (...a: unknown[]) => getMyStudentProfile(...a),
}));

const emptyBoard = { available: true as const, entries: [] };
let board: { data: unknown; error: unknown } = { data: emptyBoard, error: null };
const refetchBoard = vi.fn();
let profile: Record<string, unknown> | null = null;
const resource = <T,>(data: T) => ({
  data, isLoading: false, error: null, refetch: vi.fn(),
});
vi.mock('@/hooks/useInstitutionResource', () => ({
  useMyStudentProfile: () => resource(profile),
  useStudentProgress: () => resource([]),
  useStudentReadiness: () => resource(null),
  useInstitutionContext: () => resource(null),
  useMyStanding: () => resource(null),
  useLeaderboard: () => ({ ...resource(board.data), error: board.error, refetch: refetchBoard }),
  useCohortComparison: () => resource(null),
}));

import { InstitutionApiError } from '@/api/institutionApi';
import { LeaderboardConsentToggle } from '@/app/institution/_components/LeaderboardConsentToggle';
import { StudentOverview } from '@/app/institution/_components/StudentOverview';

const theSwitch = () =>
  screen.getByRole('switch', { name: /show my name on the leaderboard/i });

beforeEach(() => {
  setMyLeaderboardConsent.mockReset();
  getMyStudentProfile.mockReset();
  refetchBoard.mockReset();
  profile = null;
  board = { data: emptyBoard, error: null };
});

describe('the leaderboard consent switch', () => {
  it('is OFF when the student has not opted in, and says they are not listed', () => {
    render(<LeaderboardConsentToggle optIn={false} />);
    expect(theSwitch()).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/your name is not on any leaderboard/i)).toBeInTheDocument();
  });

  it('says WHO sees the name, and that their own position stays private to them', () => {
    render(<LeaderboardConsentToggle optIn={false} />);
    // The audience the API actually serves the board to (cohort_leaderboard):
    // classmates in the same department AND year, that department's faculty
    // and HOD, and the college-wide placement office.
    expect(screen.getByText(/students in your department and year/i)).toBeInTheDocument();
    expect(screen.getByText(/faculty and the head of department in your department/i))
      .toBeInTheDocument();
    expect(screen.getByText(/college placement office/i)).toBeInTheDocument();
    expect(screen.getByText(/your own position is always shown to you/i))
      .toBeInTheDocument();
  });

  it('turns it on, then tells the board to read again', async () => {
    setMyLeaderboardConsent.mockResolvedValueOnce({ opt_in: true, changed: true });
    const onChanged = vi.fn();
    render(<LeaderboardConsentToggle optIn={false} onChanged={onChanged} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    expect(setMyLeaderboardConsent).toHaveBeenCalledWith(true);
    await waitFor(() => expect(theSwitch()).toHaveAttribute('aria-checked', 'true'));
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('turns it off', async () => {
    setMyLeaderboardConsent.mockResolvedValueOnce({ opt_in: false, changed: true });
    render(<LeaderboardConsentToggle optIn />);
    await act(async () => { fireEvent.click(theSwitch()); });
    expect(setMyLeaderboardConsent).toHaveBeenCalledWith(false);
    await waitFor(() => expect(theSwitch()).toHaveAttribute('aria-checked', 'false'));
  });

  it('moves at once, before the save answers', async () => {
    let release: (v: unknown) => void = () => {};
    setMyLeaderboardConsent.mockReturnValueOnce(new Promise((r) => { release = r; }));
    render(<LeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    expect(theSwitch()).toHaveAttribute('aria-checked', 'true');
    expect(theSwitch()).toBeDisabled();
    await act(async () => { release({ opt_in: true, changed: true }); });
    await waitFor(() => expect(theSwitch()).toBeEnabled());
  });

  it('PUTS IT BACK when the save fails, and says so', async () => {
    setMyLeaderboardConsent.mockRejectedValueOnce(new Error('offline'));
    const onChanged = vi.fn();
    render(<LeaderboardConsentToggle optIn={false} onChanged={onChanged} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(screen.getByRole('alert'))
      .toHaveTextContent(/could not save/i));
    expect(theSwitch()).toHaveAttribute('aria-checked', 'false');
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('a failed WITHDRAWAL stays visibly on, never falsely off', async () => {
    setMyLeaderboardConsent.mockRejectedValueOnce(new Error('offline'));
    render(<LeaderboardConsentToggle optIn />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(theSwitch()).toHaveAttribute('aria-checked', 'true');
  });

  it("shows the SERVER's answer, not the optimistic guess", async () => {
    setMyLeaderboardConsent.mockResolvedValueOnce({ opt_in: false, changed: false });
    render(<LeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(theSwitch()).toBeEnabled());
    expect(theSwitch()).toHaveAttribute('aria-checked', 'false');
  });

  it.each([
    ['an empty body', ''],
    ['a different key', { leaderboard_opt_in: true }],
    ['a string opt_in', { opt_in: 'true' }],
  ])('reads the profile again when the save answers %s, and shows what it says', async (_label, body) => {
    /** Defaulting to Off here would tell a student who is now listed that
     *  they are not -- the exact failure this switch exists to prevent. */
    setMyLeaderboardConsent.mockResolvedValueOnce(body);
    getMyStudentProfile.mockResolvedValueOnce({ id: 'stu1', leaderboard_opt_in: true });
    const onChanged = vi.fn();
    render(<LeaderboardConsentToggle optIn={false} onChanged={onChanged} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(theSwitch()).toBeEnabled());
    expect(getMyStudentProfile).toHaveBeenCalledTimes(1);
    expect(theSwitch()).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('goes back and says it could not confirm when neither the save nor the profile says', async () => {
    setMyLeaderboardConsent.mockResolvedValueOnce({});
    getMyStudentProfile.mockRejectedValueOnce(new Error('offline'));
    render(<LeaderboardConsentToggle optIn />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(screen.getByRole('alert'))
      .toHaveTextContent(/could not confirm that was saved/i));
    expect(theSwitch()).toHaveAttribute('aria-checked', 'true');
  });

  it('does not read the profile when the save gives a boolean answer', async () => {
    setMyLeaderboardConsent.mockResolvedValueOnce({ opt_in: true, changed: true });
    render(<LeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(theSwitch()).toBeEnabled());
    expect(getMyStudentProfile).not.toHaveBeenCalled();
  });

  it('says the college is paused instead of "try again" when turning it on is refused', async () => {
    setMyLeaderboardConsent.mockRejectedValueOnce(new InstitutionApiError({
      reason: 'COLLEGE_PAUSED', status: 403, message: 'college is paused; writes are refused',
    }));
    render(<LeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/your choice has not changed/i);
    expect(alert).toHaveTextContent(/subscription is paused/i);
    expect(alert).not.toHaveTextContent(/try again/i);
    expect(theSwitch()).toHaveAttribute('aria-checked', 'false');
  });

  it("keeps the server's reason where it is useful (a refused request)", async () => {
    setMyLeaderboardConsent.mockRejectedValueOnce(new InstitutionApiError({
      reason: 'INVALID_REQUEST', status: 422, message: 'opt_in must be true or false',
    }));
    render(<LeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    expect(await screen.findByRole('alert')).toHaveTextContent('opt_in must be true or false');
  });

  it('still says "try again" for a dropped connection', async () => {
    setMyLeaderboardConsent.mockRejectedValueOnce(new InstitutionApiError({ reason: 'NETWORK' }));
    render(<LeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    expect(await screen.findByRole('alert')).toHaveTextContent(/please try again/i);
  });
});

describe('the My progress screen', () => {
  const me = {
    id: 'stu1', full_name: 'Ravi Kumar', department_id: 'cse',
    admission_number: 'A1', batch_year: 2026, section_id: null,
  };

  it('shows the switch OFF for a student who never chose (field absent)', () => {
    profile = { ...me };
    render(<StudentOverview />);
    expect(theSwitch()).toHaveAttribute('aria-checked', 'false');
  });

  it('shows it ON for a student who opted in', () => {
    profile = { ...me, leaderboard_opt_in: true };
    render(<StudentOverview />);
    expect(theSwitch()).toHaveAttribute('aria-checked', 'true');
  });

  it('re-reads the board after a change', async () => {
    profile = { ...me };
    setMyLeaderboardConsent.mockResolvedValueOnce({ opt_in: true, changed: true });
    render(<StudentOverview />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(refetchBoard).toHaveBeenCalledTimes(1));
  });

  it('keeps the switch when the board failed to load', () => {
    /** A student must be able to take their name down whatever else is broken. */
    profile = { ...me, leaderboard_opt_in: true };
    board = { data: null, error: new InstitutionApiError({ reason: 'NETWORK' }) };
    render(<StudentOverview />);
    expect(theSwitch()).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('heading', { name: 'Top of your year' })).toBeNull();
  });

  it('hides the old board and says so when the reload after a change fails', async () => {
    /** The hook keeps the last list on a failed refetch: after a withdrawal
     *  the student's own name would stay listed beside a switch that says Off. */
    profile = { ...me, leaderboard_opt_in: true };
    board = {
      data: { available: true, entries: [{ student_id: 'stu1', name: 'Ravi Kumar', readiness: 80 }] },
      error: new InstitutionApiError({ reason: 'NETWORK' }),
    };
    render(<StudentOverview />);
    expect(screen.queryByText('Ravi Kumar')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent(/leaderboard could not be refreshed/i);
    expect(theSwitch()).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetchBoard).toHaveBeenCalledTimes(1);
  });

  it('shows the board when it loaded', () => {
    profile = { ...me };
    board = {
      data: { available: true, entries: [{ student_id: 'x', name: 'Meera Iyer', readiness: 90 }] },
      error: null,
    };
    render(<StudentOverview />);
    expect(screen.getByText('Meera Iyer')).toBeInTheDocument();
    expect(screen.queryByText(/could not be refreshed/i)).toBeNull();
  });
});
