/**
 * College provisioning, from the admin console.
 *
 * These routes authenticate as an ADMIN -- admin_service's login, its cookies,
 * its permissions -- NOT as a college member. That is the whole point of the
 * cutover: provisioning used to run on an ordinary user token plus a row in a
 * `platform_operators` collection that nothing in the product could write to,
 * so a college could be created but the person who creates colleges could only
 * be made by editing the database.
 *
 * Deliberately NOT part of institutionApi.ts. That client refuses to call
 * anything without a college session token, which is correct for it and wrong
 * here -- an admin has no college.
 */
import { httpClient } from '@/lib/http';

const BASE = '/admin/institutions';

/**
 * WHETHER THE PAYMENT IS WORKING. Not what the college is buying -- that is
 * CollegeTier, and the two are deliberately separate fields on the server.
 * A trial college can also be paused, and a paid college can be expired.
 * Merging them loses the difference between "they have not bought this yet"
 * and "their card failed", which need different words and a different person
 * to chase.
 */
export type SubscriptionStatus = 'active' | 'grace' | 'paused' | 'expired';

/**
 * WHAT THE COLLEGE IS BUYING.
 *
 * `free` never appears in a stored row: a college is on the free tier because
 * its 14-day trial ran out, which the server derives on every read rather
 * than waiting for a job to rewrite the row. So the value here can say `free`
 * while the database still says `trial`, and this is the one to render.
 */
export type CollegeTier = 'trial' | 'paid' | 'free';

/** One college in the list. An allow-list on the server, not the stored row:
 *  credit balance, feature flags and internal timestamps are not sent. */
export interface CollegeSummary {
  id: string;
  name: string;
  subscription_status: SubscriptionStatus;
  /** The EFFECTIVE tier, derived server-side. Render this one. */
  tier?: CollegeTier;
  /** What the row literally says. Debugging only -- never the badge. */
  stored_tier?: 'trial' | 'paid' | null;
  trial_ends_at?: string | null;
  /**
   * Whole days left, rounded up so a trial with four hours on it reads "1
   * day" rather than "0". `null` -- NOT 0 -- for anyone not on a running
   * trial, so a paying customer is never shown a countdown.
   */
  trial_days_remaining?: number | null;
  created_at?: string;
}

export interface CollegePage {
  items: CollegeSummary[];
  total: number;
  skip: number;
  limit: number;
}

/** A placement officer. IDs only -- the server deliberately joins nothing from
 *  the global user account, so there is no name or email to render here. */
export interface CollegeOfficer {
  id: string;
  account_id: string;
  display_name?: string | null;
  created_at?: string;
}

export interface CollegeDetail extends CollegeSummary {
  disabled_features: string[];
  cpos: CollegeOfficer[];
}

export interface CreateCollegeRequest {
  id: string;
  name: string;
  subscription_status?: SubscriptionStatus;
  /** Only trial or paid: `free` is not storable. Defaults to trial server-side. */
  tier?: 'trial' | 'paid';
}

export interface MarkPaidResult {
  id: string;
  tier: 'paid';
  /** false when it was already paid. NOT a failure -- see markCollegePaid. */
  changed: boolean;
  previous_tier?: string;
  trial_ended_at?: string | null;
}

/** What the API refused, in a form a screen can act on. */
export class AdminInstitutionError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(status: number, reason: string, message: string) {
    super(message);
    this.name = 'AdminInstitutionError';
    this.status = status;
    this.reason = reason;
  }

  /** A taken slug, or an officer appointed twice. Neither is a permission
   *  problem, and telling somebody 403 when the answer is "pick another name"
   *  sends them to ask for access they already have. */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** Not signed in as an admin, or lacking the permission. The console cannot
   *  tell those apart from here, and should not guess. */
  get isForbidden(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

function toError(err: unknown): AdminInstitutionError {
  const res = (err as { response?: { status?: number; data?: unknown } })?.response;
  const status = res?.status ?? 0;
  // The app's global handler reshapes every HTTPException, so the machine
  // readable reason is at error.details.reason -- not where FastAPI put it.
  const data = res?.data as
    | { error?: { message?: string; details?: { reason?: string } } }
    | undefined;
  return new AdminInstitutionError(
    status,
    data?.error?.details?.reason ?? 'UNKNOWN',
    data?.error?.message ?? 'That did not work. Please try again.',
  );
}

export async function listColleges(
  params: { skip?: number; limit?: number } = {},
): Promise<CollegePage> {
  try {
    const { data } = await httpClient.get<CollegePage>(BASE, { params });
    return data;
  } catch (err) {
    throw toError(err);
  }
}

export async function getCollege(id: string): Promise<CollegeDetail> {
  try {
    const { data } = await httpClient.get<CollegeDetail>(
      `${BASE}/${encodeURIComponent(id)}`);
    return data;
  } catch (err) {
    throw toError(err);
  }
}

export async function createCollege(
  body: CreateCollegeRequest,
): Promise<CollegeSummary> {
  try {
    const { data } = await httpClient.post<CollegeSummary>(BASE, body);
    return data;
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Appoint a placement officer by their internal account id.
 *
 * Kept for the case where somebody genuinely has one, but no human obtains an
 * id this way -- there is no lookup by email anywhere. appointOfficerByCode is
 * the path the console uses.
 */
export async function appointOfficer(
  collegeId: string,
  body: { account_id: string; display_name?: string | null },
): Promise<CollegeOfficer> {
  try {
    const { data } = await httpClient.post<CollegeOfficer>(
      `${BASE}/${encodeURIComponent(collegeId)}/cpo`, body);
    return data;
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Appoint the person who read you a pairing code.
 *
 * They generated it while signed in, so it proves which account is theirs. It
 * authorises nothing on its own -- this call is the appointment, and the
 * response names the account so the console can show who was just given a
 * college.
 */
export async function appointOfficerByCode(
  collegeId: string,
  body: { code: string; display_name?: string | null },
): Promise<CollegeOfficer> {
  try {
    const { data } = await httpClient.post<CollegeOfficer>(
      `${BASE}/${encodeURIComponent(collegeId)}/cpo/pair`, body);
    return data;
  } catch (err) {
    throw toError(err);
  }
}

/**
 * Record that a college has paid, ending its trial.
 *
 * The only way out of a trial: nothing else in the product changes a tier, so
 * without this every college created reaches the free tier after fourteen days
 * and stays there.
 *
 * NO BODY, because the route accepts none -- which is what stops it being
 * asked for "trial" and minting a second fourteen-day trial for a college that
 * has already had one.
 *
 * SAFE TO CALL TWICE. The second call returns 200 with changed:false rather
 * than a conflict, so a double click or a retry after a timeout is not an
 * error a screen has to explain. Treating it as one would have the operator
 * press the button again.
 */
export async function markCollegePaid(collegeId: string): Promise<MarkPaidResult> {
  try {
    const { data } = await httpClient.post<MarkPaidResult>(
      `${BASE}/${encodeURIComponent(collegeId)}/mark-paid`);
    return data;
  } catch (err) {
    throw toError(err);
  }
}

export async function revokeOfficer(
  collegeId: string,
  membershipId: string,
): Promise<void> {
  try {
    await httpClient.post(
      `${BASE}/${encodeURIComponent(collegeId)}/cpo/` +
      `${encodeURIComponent(membershipId)}/revoke`);
  } catch (err) {
    throw toError(err);
  }
}

/** A college id IS its subdomain slug and IS the tenant key every other
 *  collection is scoped by, so the server validates it strictly. Checking here
 *  too turns a 422 into a message beside the field. */
export function slugProblem(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Give the college a short id.';
  if (v.length > 50) return 'Too long — 50 characters at most.';
  if (!/^[a-z0-9-]+$/.test(v)) {
    return 'Lowercase letters, numbers and hyphens only.';
  }
  return null;
}
