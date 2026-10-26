'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import {
  createInstitutionSession,
  getMyPeople,
  getMyStanding,
  getMyStudentProfile,
  getStudentReadiness,
  onInstitutionSessionStale,
} from '@/api/institutionApi';
import {
  clearInstitutionSession,
  getInstitutionSession,
  setInstitutionSession,
  subscribeToInstitutionSession,
} from '@/lib/institutionSession';
import { useStudentCollege, type StudentCollege } from '@/hooks/useCollegeMembership';
import { onAccountChanged } from '@/lib/accountChange';
import type { MyPeople, Readiness, Standing, Student } from '@/types/institution';

/**
 * A student's own college record, for screens OUTSIDE /institution: the
 * identity bar in the Header and the College tab on the profile.
 *
 * Every institution data route needs the college session token, and outside
 * /institution there may not be one yet (it is minted by InstitutionGate when
 * /institution is first opened). So, in order:
 *
 *   1. useStudentCollege() says whether this is a student, and which
 *      membership (#275 rule: the session decides; with no session, exactly
 *      one membership that is a student one).
 *   2. No session yet -> mint one for that membership, exactly as the gate
 *      does (InstitutionContext.selectMembership). NOT inside /institution,
 *      where the gate owns selection and would race us.
 *   3. THEN the four reads, in parallel. None runs before the session exists.
 *
 * Results are dropped if the session changed while they were in flight, and
 * nothing is shared across sessions: the cache key is the session itself.
 * Any failure leaves that piece null; consumers show only what they have,
 * and `failed` says a piece is missing because a request failed -- not
 * because the college has nothing (a 404 from /students/me is a real null).
 * A load with a failure is not cached, so the next mount asks again.
 */
export interface StudentRecord {
  college: StudentCollege;
  student: Student | null;
  readiness: Readiness | null;
  standing: Standing | null;
  people: MyPeople | null;
  /** A read failed (refused token, network, 5xx): missing is not "none". */
  failed?: boolean;
}

export type StudentRecordState =
  | { status: 'none' }
  | { status: 'loading' }
  | { status: 'ready'; record: StudentRecord };

function sessionKey(): string {
  const s = getInstitutionSession();
  return s ? `${s.membership_id}|${s.institution_id}|${s.role}|${s.access_token.slice(-12)}` : '';
}

let minting: Map<string, Promise<void>> = new Map();
let loads: Map<string, Promise<Omit<StudentRecord, 'college'>>> = new Map();
// Bumped on every reset (in-page account change): a mint that was started for
// the previous account must not store its token for the next one.
let epoch = 0;
let lastStaleRecoveryAt = 0;
const STALE_RECOVERY_WINDOW_MS = 60_000;

/** Test seam; also run on every in-page account change. */
export function __resetStudentRecordCache() {
  epoch += 1;
  minting = new Map();
  loads = new Map();
  lastStaleRecoveryAt = 0;
}

onAccountChanged(__resetStudentRecordCache);

// A REFUSED COLLEGE TOKEN OUTSIDE /institution. InstitutionContext is the only
// other listener and it is mounted only inside /institution, so out here an
// expired token stayed stored and every read failed until the tab closed.
// It is dropped and a new one minted for the SAME membership right here: with
// several memberships, no session means no college (pickStudentCollege), so
// waiting for the hook to mint would lose the student's choice. Inside
// /institution the context owns recovery (and its own loop guard), so this
// stays out. At most once per window: a fresh token that is refused too is
// not a stale token, and re-minting cannot help.
onInstitutionSessionStale(() => {
  if (typeof window === 'undefined' || window.location.pathname.startsWith('/institution')) return;
  const refused = getInstitutionSession();
  if (!refused || refused.role !== 'student') return;
  const now = Date.now();
  if (lastStaleRecoveryAt && now - lastStaleRecoveryAt < STALE_RECOVERY_WINDOW_MS) return;
  lastStaleRecoveryAt = now;
  clearInstitutionSession();
  void mintOnce(refused.membership_id);
});

function mintOnce(membershipId: string): Promise<void> {
  let p = minting.get(membershipId);
  if (!p) {
    const forEpoch = epoch;
    const map = minting;
    p = createInstitutionSession({ membership_id: membershipId })
      .then((minted) => {
        // Minted for the previous account (an in-page sign-in happened
        // meanwhile): dropped, never stored for the next one.
        if (forEpoch !== epoch) return;
        // Another tab action or the gate may have chosen meanwhile: never
        // overwrite a session that now exists.
        if (!getInstitutionSession()) {
          setInstitutionSession({ ...minted, membership_id: membershipId });
        }
      })
      .catch(() => {
        // Not minted: the bar and tab simply do not appear.
      })
      .finally(() => {
        // Dedupes IN-FLIGHT mints only: once settled, a later need (a failed
        // mint, a session cleared by leaving the college or by stale-token
        // recovery) mints again.
        if (map.get(membershipId) === p) map.delete(membershipId);
      });
    minting.set(membershipId, p);
  }
  return p;
}

// A failure is null for that piece, and is COUNTED: a 401 and a 404 must not
// read the same to the screen ("your college has not added your details").
const settle = <T,>(p: Promise<T>, failures: { n: number }): Promise<T | null> =>
  p.catch(() => {
    failures.n += 1;
    return null;
  });

function loadOnce(key: string): Promise<Omit<StudentRecord, 'college'>> {
  let p = loads.get(key);
  if (!p) {
    const failures = { n: 0 };
    const map = loads;
    const load: Promise<Omit<StudentRecord, 'college'>> = Promise.all([
      settle(getMyStudentProfile(), failures),
      settle(getStudentReadiness('me'), failures),
      settle(getMyStanding(), failures),
      settle(getMyPeople(), failures),
    ]).then(([student, readiness, standing, people]) => {
      // A FAILURE IS NOT CACHED (same rule as the membership cache): the next
      // mount under this session asks again instead of keeping the gap.
      if (failures.n > 0 && map.get(key) === load) map.delete(key);
      return { student, readiness, standing, people, failed: failures.n > 0 };
    });
    p = load;
    loads.set(key, p);
  }
  return p;
}

export function useStudentRecord(): StudentRecordState {
  const college = useStudentCollege();
  const pathname = usePathname() ?? '';
  const key = useSyncExternalStore(subscribeToInstitutionSession, sessionKey, () => '');
  const [state, setState] = useState<StudentRecordState>({ status: 'none' });
  // The session the current 'ready' state was loaded for: a re-run for the
  // SAME session (e.g. a route change) keeps showing it instead of flashing
  // back to 'loading' and unmounting the identity bar.
  const readyFor = useRef<string | null>(null);

  const membershipId = college?.membershipId ?? null;

  useEffect(() => {
    let alive = true;
    if (!college || !membershipId) {
      readyFor.current = null;
      setState({ status: 'none' });
      return () => { alive = false; };
    }

    const session = getInstitutionSession();
    if (!session) {
      readyFor.current = null;
      setState({ status: 'loading' });
      if (!pathname.startsWith('/institution')) void mintOnce(membershipId);
      // The mint writes the session; the store change re-runs this effect.
      return () => { alive = false; };
    }
    if (session.membership_id !== membershipId) {
      // The session is for another membership (useStudentCollege would then
      // be null for staff); nothing to show.
      readyFor.current = null;
      setState({ status: 'none' });
      return () => { alive = false; };
    }

    const forKey = key;
    if (readyFor.current !== forKey) setState({ status: 'loading' });
    void loadOnce(forKey).then((data) => {
      // Dropped if the session changed (switch, sign-out) while in flight.
      if (alive && sessionKey() === forKey) {
        readyFor.current = forKey;
        setState({ status: 'ready', record: { college, ...data } });
      }
    });
    return () => { alive = false; };
    // college is derived from membershipId + name; key covers the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membershipId, college?.name, key, pathname]);

  return state;
}
