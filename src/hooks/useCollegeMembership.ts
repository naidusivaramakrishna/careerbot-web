'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { listMemberships } from '@/api/institutionApi';
import {
  getInstitutionSession,
  subscribeToInstitutionSession,
} from '@/lib/institutionSession';
import type { InstitutionMembership } from '@/types/institution';

/**
 * Does this person belong to a college?
 *
 * The institution area had NO link anywhere in the product. It was reachable
 * only by typing /institution into the address bar, which means a placement
 * officer who was onboarded and told "it's live" found nothing at all.
 *
 * The link cannot simply be added to the static nav: most users are ordinary
 * jobseekers, and showing them a college entry that refuses them on arrival is
 * worse than showing nothing. So membership is resolved at runtime, once.
 *
 * `[]` is a NORMAL answer, not an error — it is what a jobseeker gets. A failed
 * request is treated the same way (render nothing) rather than surfaced: a
 * navigation item is not the place to report a backend problem, and every
 * college screen behind it reports its own errors properly.
 *
 * Resolved ONCE per page load and shared, so mounting the sidebar twice (the
 * collapsed and expanded trees) does not issue two requests. It deliberately
 * does not persist across a reload: a membership can be revoked, and a stale
 * "yes" in storage would keep offering a door that no longer opens.
 */
let inflight: Promise<InstitutionMembership[]> | null = null;
let latest: InstitutionMembership[] | null = null;
const listeners = new Set<(rows: InstitutionMembership[]) => void>();
// Bumped by every prime: a request that started before the prime is older
// than the rows it handed in, so its answer (or its failure) must neither be
// published nor clear the cache.
let generation = 0;

function publish(rows: InstitutionMembership[]) {
  latest = rows;
  listeners.forEach((notify) => notify(rows));
}

function resolveOnce(): Promise<InstitutionMembership[]> {
  if (!inflight) {
    const gen = generation;
    // A FAILURE IS NOT CACHED. A blip (or a call made before sign-in) answers
    // [] for this render, but the next mount asks again -- otherwise one failed
    // request hides a student's college navigation for the whole page load.
    inflight = listMemberships()
      .then((rows) => {
        if (gen !== generation) return [];
        publish(rows);
        return rows;
      })
      .catch(() => {
        if (gen === generation) inflight = null;
        return [];
      });
  }
  return inflight;
}

/**
 * Hand fresh membership rows to every mounted hook.
 *
 * InstitutionContext already loads the memberships itself (on entering
 * /institution, and again after an invite code is claimed). Without this, a
 * student who joins with a code -- the page then navigates WITHOUT a reload --
 * keeps the [] this cache got before the claim, and sees no college
 * navigation until they refresh.
 */
export function primeCollegeMemberships(rows: InstitutionMembership[]) {
  generation += 1;
  inflight = Promise.resolve(rows);
  publish(rows);
}

/** Test seam: clears the per-load cache. */
export function __resetCollegeMembershipCache() {
  generation += 1;
  inflight = null;
  latest = null;
}

function useMembershipState(): { rows: InstitutionMembership[]; resolved: boolean } {
  const [state, setState] = useState<{ rows: InstitutionMembership[]; resolved: boolean }>(
    () => (latest ? { rows: latest, resolved: true } : { rows: [], resolved: false }),
  );

  useEffect(() => {
    let alive = true;
    const onRows = (rows: InstitutionMembership[]) => {
      if (alive) setState({ rows, resolved: true });
    };
    listeners.add(onRows);
    const gen = generation;
    resolveOnce().then((rows) => {
      if (alive && gen === generation) setState({ rows, resolved: true });
    });
    return () => {
      alive = false;
      listeners.delete(onRows);
    };
  }, []);

  return state;
}

function useMembershipRows(): InstitutionMembership[] {
  return useMembershipState().rows;
}

/** True once the membership answer is known (so a student is not shown the
 *  jobseeker panel for the instant before it arrives). */
export function useCollegeMembershipResolved(): boolean {
  return useMembershipState().resolved;
}

export function useHasCollegeMembership(): boolean {
  return useMembershipRows().length > 0;
}

export interface StudentCollege {
  id: string;
  name: string;
}

/**
 * The active college session as one STRING, for useSyncExternalStore: the
 * membership and role change on a switch even when the college does not (a
 * person can be a student and faculty at the same college).
 */
function sessionKey(): string {
  const s = getInstitutionSession();
  return s ? `${s.membership_id}|${s.institution_id}|${s.role}` : '';
}

/**
 * The college a STUDENT is in right now, or null.
 *
 * The college session (sessionStorage, minted inside /institution) is the
 * authority for "which college, which role". Picking any student membership
 * instead would show a faculty member at one college -- who is a student at
 * another -- the student shell and the other college's name.
 *
 *   - session present: it must be a student session AND match a membership
 *     row the account owns (id, college and role).
 *   - no session yet (e.g. straight after sign-in, before /institution has
 *     been opened): only when the account has EXACTLY ONE membership and it
 *     is a student one -- the unambiguous case.
 *   - anything else (staff session, mixed roles, several colleges, the
 *     membership call failed): null, and the product looks as it always did.
 */
export function pickStudentCollege(
  rows: InstitutionMembership[],
  session: { membership_id: string; institution_id: string; role: string } | null,
): StudentCollege | null {
  if (session) {
    if (session.role !== 'student') return null;
    const row = rows.find(
      (r) =>
        r.membership_id === session.membership_id &&
        r.institution_id === session.institution_id &&
        r.role === 'student',
    );
    return row ? { id: row.institution_id, name: row.institution_name } : null;
  }
  if (rows.length === 1 && rows[0].role === 'student') {
    return { id: rows[0].institution_id, name: rows[0].institution_name };
  }
  return null;
}

export function useStudentCollege(): StudentCollege | null {
  const rows = useMembershipRows();
  // Re-render on a college switch or sign-out in this tab or another one.
  useSyncExternalStore(subscribeToInstitutionSession, sessionKey, () => '');
  return pickStudentCollege(rows, getInstitutionSession());
}
