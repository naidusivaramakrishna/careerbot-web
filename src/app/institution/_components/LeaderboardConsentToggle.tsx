'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  getMyStudentProfile,
  InstitutionApiError,
  setMyLeaderboardConsent,
} from '@/api/institutionApi';
import { displayMessage } from './ErrorNotice';
import { Caption } from './Typography';
import { CARD, INK } from './tokens';

/**
 * The student's own choice to be NAMED on the leaderboard.
 *
 * OPT-IN (owner, 2026-10-25), so it starts OFF: nobody is listed until they
 * turn this on themselves. What it controls is publication -- other people
 * seeing your name and score -- and the copy says exactly who those people
 * are. Your own position on the standing card is shown to you either way, and
 * the copy says that too, so turning it off does not read as losing your rank.
 *
 * OPTIMISTIC, AND PUT BACK ON FAILURE. The switch moves at once; if the save
 * is refused (a paused college refuses turning it on, a dropped connection
 * refuses either) it returns to where it was and says so. A student who
 * believes their name is hidden when it is not is the failure this exists to
 * prevent, so the switch never shows a state the server did not accept.
 *
 * NOT TRUSTING A SHAPE IT CANNOT CHECK. The PUT answers {opt_in, changed}. An
 * answer without a boolean opt_in says nothing about what was saved, so the
 * profile is read again (its leaderboard_opt_in is what the board acts on);
 * if that fails too, the switch goes back and says it could not confirm.
 */
const NOT_SAVED = 'Your choice has not changed.';

/** Why a save failed, in words that fit the cause: "try again" cannot help a
 *  paused college, and the server's reason is kept where it is useful. */
function saveFailedMessage(err: unknown): string {
  if (err instanceof InstitutionApiError
      && err.reason !== 'NETWORK' && err.reason !== 'UNKNOWN') {
    return `${NOT_SAVED} ${displayMessage(err)}`;
  }
  return `Could not save that. ${NOT_SAVED} Please try again.`;
}

/** The saved answer when the PUT did not say: the profile's effective value. */
async function readBackOptIn(): Promise<boolean | null> {
  try {
    const me = await getMyStudentProfile();
    return typeof me?.leaderboard_opt_in === 'boolean' ? me.leaderboard_opt_in : null;
  } catch {
    return null;
  }
}

export function LeaderboardConsentToggle({
  optIn,
  onChanged,
}: {
  /** The answer the board acts on, from the student's own profile. */
  optIn: boolean;
  /** Called after a save lands, so the board can be read again. */
  onChanged?: () => void;
}) {
  const [checked, setChecked] = useState(optIn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A ref as well as state: the effect below must not re-run when a save
  // FINISHES (the prop is still the pre-save value then, and would undo it).
  const saving = useRef(false);

  // A refetched profile is the newer truth -- but never mid-save, or the
  // optimistic state would flicker back before the answer arrives.
  useEffect(() => {
    if (!saving.current) setChecked(optIn);
  }, [optIn]);

  const toggle = async () => {
    if (saving.current) return;
    const previous = checked;
    const next = !previous;
    saving.current = true;
    setBusy(true);
    setError(null);
    setChecked(next);
    try {
      const saved = await setMyLeaderboardConsent(next);
      // The server's answer, not ours -- and only if it is one.
      const answer = typeof saved?.opt_in === 'boolean' ? saved.opt_in : await readBackOptIn();
      if (answer === null) {
        setChecked(previous);
        setError('Could not confirm that was saved. Reload the page to see your current choice.');
      } else {
        setChecked(answer);
      }
      // Something may have landed either way, so the board reads again.
      onChanged?.();
    } catch (err) {
      setChecked(previous);
      setError(saveFailedMessage(err));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  return (
    <section className={`${CARD} p-5`} aria-labelledby="board-consent-heading">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id="board-consent-heading" className="text-sm font-medium"
              style={{ color: INK.strong }}>
            Show my name on the leaderboard
          </h3>
          <Caption className="mt-1">
            {checked
              ? 'On. Students in your department and year, faculty and the head of department in your department, and the college placement office can see your name and readiness score on the leaderboard.'
              : 'Off. Your name is not on any leaderboard. Turn this on to let students in your department and year, faculty and the head of department in your department, and the college placement office see your name and readiness score there.'}
          </Caption>
          <Caption className="mt-1">
            Your own position is always shown to you, whichever you choose. You
            can change this at any time.
          </Caption>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby="board-consent-heading"
          onClick={toggle}
          disabled={busy}
          className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            checked ? 'bg-emerald-600' : 'bg-[#cbd5e1]'
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
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
