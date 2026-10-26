'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  getLeaderboard,
  parseMockTestError,
  setMyMockTestLeaderboardConsent,
} from '@/api/mockTestApi';

/**
 * The caller's own choice to be NAMED on the platform mock-test leaderboard.
 *
 * OPT-IN (owner, 2026-10-26, DPDP), so it starts OFF. The audience is every
 * CareerBOT user who views the mock-test leaderboard, and the copy names it.
 * Your own row always shows your name to you, either way. This is separate
 * from a college leaderboard choice, which has a different audience.
 *
 * OPTIMISTIC, NEVER UNCONFIRMED. The switch never settles on a state the
 * server did not confirm: after a failed save it reads the saved choice again
 * (a timed-out write may still have landed); if that read fails too, it shows
 * "unknown" (disabled, reload to retry) rather than guessing either position.
 *
 * UNKNOWN IS NOT "OFF". If the page could not read the saved choice, the
 * switch is disabled and says so -- showing "off" to a user who is listed is
 * the failure this exists to prevent.
 */

export const AUDIENCE = 'all CareerBOT users who view the mock-test leaderboard';

/** The saved answer, read again from the server; null if that read fails. */
async function readBackOptIn(): Promise<boolean | null> {
  try {
    const board = await getLeaderboard();
    return typeof board?.my_opt_in === 'boolean' ? board.my_opt_in : null;
  } catch {
    return null;
  }
}

export default function MockTestLeaderboardConsentToggle({
  optIn,
  onChanged,
}: {
  /** The saved choice from the leaderboard response; null = could not be read. */
  optIn: boolean | null;
  /** Called after a save attempt, so the board can be read again. */
  onChanged?: () => void;
}) {
  const [checked, setChecked] = useState<boolean | null>(optIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A ref as well as state: the effect below must not undo a save in flight.
  const saving = useRef(false);

  useEffect(() => {
    if (!saving.current) setChecked(optIn);
  }, [optIn]);

  const toggle = async () => {
    if (saving.current || checked === null) return;
    const previous = checked;
    const next = !previous;
    saving.current = true;
    setBusy(true);
    setError(null);
    setChecked(next);
    try {
      const saved = await setMyMockTestLeaderboardConsent(next);
      const answer = typeof saved?.opt_in === 'boolean' ? saved.opt_in : await readBackOptIn();
      if (answer === null) {
        // Unknown: the save may or may not have landed. Show neither position.
        setChecked(null);
        setError('Could not confirm that was saved. Reload the page to see your current choice.');
      } else {
        setChecked(answer);
      }
    } catch (err) {
      // A timed-out write may still have landed, so the previous position is
      // not known to be true either: show the saved choice, or unknown.
      const actual = await readBackOptIn();
      setChecked(actual);
      setError(parseMockTestError(err).message);
    } finally {
      saving.current = false;
      setBusy(false);
      onChanged?.();
    }
  };

  let status: string;
  if (checked === null) {
    status = 'We could not load your current choice. Reload the page to try again.';
  } else if (checked) {
    status = `On. Your name is shown to ${AUDIENCE} when you are in the top 10.`;
  } else {
    status = `Off. ${AUDIENCE.charAt(0).toUpperCase()}${AUDIENCE.slice(1)} see you as "Anonymous learner" with your score, never your name. Turn this on to show them your name.`;
  }

  return (
    <section
      className="rounded-xl border px-5 py-4 mb-7"
      style={{ borderColor: '#E5E7EB', background: '#F8FAFC' }}
      aria-labelledby="mock-board-consent-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id="mock-board-consent-heading" className="text-sm font-bold" style={{ color: '#0F172A' }}>
            Show my name on the mock-test leaderboard
          </h3>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: '#475569' }}>{status}</p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: '#64748B' }}>
            You always see your own name on your row. This is separate from any college
            leaderboard setting. You can change it at any time.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked === true}
          aria-labelledby="mock-board-consent-heading"
          onClick={toggle}
          disabled={busy || checked === null}
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            checked ? 'bg-[#1e3a8a]' : 'bg-[#cbd5e1]'
          }`}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>
      ) : null}
    </section>
  );
}
