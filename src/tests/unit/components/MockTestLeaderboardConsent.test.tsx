/**
 * Platform mock-test leaderboard consent is OPT-IN (owner, 2026-10-26).
 *
 * Others see "Anonymous learner" until a user turns this on. The switch must
 * never show a state the server did not confirm, and an unknown state must not
 * be shown as "off".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const setMyMockTestLeaderboardConsent = vi.fn();
const getLeaderboard = vi.fn();
vi.mock('@/api/mockTestApi', async (importActual) => ({
  parseMockTestError: (await importActual<typeof import('@/api/mockTestApi')>()).parseMockTestError,
  setMyMockTestLeaderboardConsent: (...a: unknown[]) => setMyMockTestLeaderboardConsent(...a),
  getLeaderboard: (...a: unknown[]) => getLeaderboard(...a),
}));

import MockTestLeaderboardConsentToggle from '@/app/(interview)/mock-test/_components/MockTestLeaderboardConsentToggle';

const theSwitch = () =>
  screen.getByRole('switch', { name: /show my name on the mock-test leaderboard/i });

beforeEach(() => {
  setMyMockTestLeaderboardConsent.mockReset();
  getLeaderboard.mockReset();
});

describe('the mock-test leaderboard consent switch', () => {
  it('is OFF by default state and names the exact audience', () => {
    render(<MockTestLeaderboardConsentToggle optIn={false} />);
    expect(theSwitch()).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/all CareerBOT users who view the mock-test leaderboard/i))
      .toBeInTheDocument();
    expect(screen.getByText(/"Anonymous learner"/)).toBeInTheDocument();
    expect(screen.getByText(/you always see your own name on your row/i)).toBeInTheDocument();
    expect(screen.getByText(/separate from any college leaderboard setting/i)).toBeInTheDocument();
  });

  it('when ON, says who sees the name', () => {
    render(<MockTestLeaderboardConsentToggle optIn />);
    expect(theSwitch()).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/your name is shown to all CareerBOT users who view the mock-test leaderboard/i))
      .toBeInTheDocument();
  });

  it('turns it on and tells the board to read again', async () => {
    setMyMockTestLeaderboardConsent.mockResolvedValueOnce({ opt_in: true, changed: true });
    const onChanged = vi.fn();
    render(<MockTestLeaderboardConsentToggle optIn={false} onChanged={onChanged} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    expect(setMyMockTestLeaderboardConsent).toHaveBeenCalledWith(true);
    await waitFor(() => expect(theSwitch()).toHaveAttribute('aria-checked', 'true'));
    expect(onChanged).toHaveBeenCalled();
  });

  it('turns it off (withdrawal)', async () => {
    setMyMockTestLeaderboardConsent.mockResolvedValueOnce({ opt_in: false, changed: true });
    render(<MockTestLeaderboardConsentToggle optIn />);
    await act(async () => { fireEvent.click(theSwitch()); });
    expect(setMyMockTestLeaderboardConsent).toHaveBeenCalledWith(false);
    await waitFor(() => expect(theSwitch()).toHaveAttribute('aria-checked', 'false'));
  });

  it('on a failed save, shows what the server actually holds, not the optimistic state', async () => {
    setMyMockTestLeaderboardConsent.mockRejectedValueOnce({
      response: { status: 503, data: { detail: 'Could not confirm your leaderboard choice. Reload the page to see what is saved.' } },
    });
    // The timed-out write did land.
    getLeaderboard.mockResolvedValueOnce({ my_opt_in: true });
    render(<MockTestLeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(theSwitch()).toHaveAttribute('aria-checked', 'true'));
    expect(screen.getByRole('alert')).toHaveTextContent(/could not confirm/i);
  });

  it('on a failed save with a failed read-back, shows UNKNOWN, not the old position', async () => {
    setMyMockTestLeaderboardConsent.mockRejectedValueOnce(new Error('Network Error'));
    getLeaderboard.mockRejectedValueOnce(new Error('Network Error'));
    render(<MockTestLeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(theSwitch()).toBeDisabled());
    expect(screen.getByText(/could not load your current choice/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Off\./)).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('an answer without a boolean opt_in is checked by reading back', async () => {
    setMyMockTestLeaderboardConsent.mockResolvedValueOnce({});
    getLeaderboard.mockResolvedValueOnce({ my_opt_in: null });
    render(<MockTestLeaderboardConsentToggle optIn={false} />);
    await act(async () => { fireEvent.click(theSwitch()); });
    await waitFor(() => expect(theSwitch()).toBeDisabled());
    expect(screen.getByRole('alert')).toHaveTextContent(/could not confirm that was saved/i);
  });

  it('an UNKNOWN saved choice is not shown as off, and cannot be toggled', async () => {
    render(<MockTestLeaderboardConsentToggle optIn={null} />);
    expect(theSwitch()).toBeDisabled();
    expect(screen.getByText(/could not load your current choice/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Off\./)).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(theSwitch()); });
    expect(setMyMockTestLeaderboardConsent).not.toHaveBeenCalled();
  });
});
