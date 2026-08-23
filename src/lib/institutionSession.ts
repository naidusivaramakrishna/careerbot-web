/**
 * Storage for the active institution session.
 *
 * The consumer app authenticates with httpOnly cookies (see `lib/http.ts`), but
 * POST /institution/session hands the token back IN THE RESPONSE BODY, so the
 * browser has to hold it. It lives in `sessionStorage`, deliberately:
 *
 *   - `http.ts` already calls `sessionStorage.clear()` on sign-out / failed
 *     refresh, so the institution token dies with the consumer session for free.
 *   - sessionStorage is per-tab, so two tabs can sit in two different colleges
 *     without one silently re-tenanting the other. Cross-tab bleed is exactly
 *     the failure mode that would write a student into the wrong college.
 *
 * A `storage` event is NOT used for this reason. Same-tab listeners get the
 * `institution-session-changed` CustomEvent instead.
 */
import type { InstitutionRole, InstitutionSession } from '@/types/institution';

const SESSION_KEY = 'careerbot_institution_session';

/** The stored session plus the membership it was minted from. */
export interface StoredInstitutionSession extends InstitutionSession {
  membership_id: string;
}

export const INSTITUTION_SESSION_EVENT = 'institution-session-changed';

function isRole(value: unknown): value is InstitutionRole {
  return value === 'cpo' || value === 'hod' || value === 'faculty' || value === 'student';
}

/** Parse defensively: a hand-edited or stale entry must not crash the app. */
function parse(raw: string | null): StoredInstitutionSession | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const s = parsed as Record<string, unknown>;
    if (
      typeof s.access_token !== 'string' ||
      typeof s.institution_id !== 'string' ||
      typeof s.membership_id !== 'string' ||
      !isRole(s.role)
    ) {
      return null;
    }
    return {
      access_token: s.access_token,
      token_type: typeof s.token_type === 'string' ? s.token_type : 'bearer',
      institution_id: s.institution_id,
      role: s.role,
      membership_id: s.membership_id,
    };
  } catch {
    return null;
  }
}

export function getInstitutionSession(): StoredInstitutionSession | null {
  if (typeof window === 'undefined') return null;
  return parse(sessionStorage.getItem(SESSION_KEY));
}

export function setInstitutionSession(session: StoredInstitutionSession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(INSTITUTION_SESSION_EVENT));
}

export function clearInstitutionSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(INSTITUTION_SESSION_EVENT));
}

/**
 * `Authorization` header value for institution requests, or null when there is
 * no active session. The api client refuses to call a scoped route without it
 * rather than falling back to the consumer cookie — a request that silently
 * ran under the wrong identity is worse than a request that failed.
 */
export function institutionAuthHeader(): string | null {
  const session = getInstitutionSession();
  if (!session) return null;
  const scheme = session.token_type?.toLowerCase() === 'bearer' ? 'Bearer' : session.token_type;
  return `${scheme || 'Bearer'} ${session.access_token}`;
}
