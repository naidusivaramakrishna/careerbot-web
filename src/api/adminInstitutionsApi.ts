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

export type SubscriptionStatus = 'active' | 'grace' | 'paused' | 'expired';

/** One college in the list. An allow-list on the server, not the stored row:
 *  credit balance, feature flags and internal timestamps are not sent. */
export interface CollegeSummary {
  id: string;
  name: string;
  subscription_status: SubscriptionStatus;
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
