/**
 * Institution (college) platform API client.
 *
 * 1:1 with careerbot-api's `/api/v1/institution/*` routes:
 *
 *   GET  /institution/memberships                  listMemberships
 *   POST /institution/session                      createInstitutionSession
 *   POST /institution/departments                  createDepartment
 *   GET  /institution/departments                  listDepartments
 *   POST /institution/batches                      createBatch
 *   GET  /institution/batches                      listBatches
 *   POST /institution/sections                     createSection
 *   GET  /institution/sections?department_id=      listSections
 *   POST /institution/members                      createMember
 *   POST /institution/students                     createStudent
 *   GET  /institution/students                     listStudents
 *   GET  /institution/students/{id}                getStudent
 *   POST /institution/faculty-assignments          assignStudentsToFaculty
 *   POST /institution/progress                     recordProgress
 *   GET  /institution/students/{id}/progress       listStudentProgress
 *
 * TOKEN RULE (the thing that is easy to get wrong): every route except
 * `listMemberships` and `createInstitutionSession` runs on the INSTITUTION
 * token minted by POST /session — the one carrying `inst_mid`. The consumer
 * httpOnly cookie is not enough. `withInstitutionAuth` attaches it explicitly
 * and throws INVALID_TOKEN rather than letting a request run un-scoped.
 *
 * Goes through `httpClient` (src/lib/http.ts) for the shared base URL,
 * correlation id and tenant header, but opts OUT of its 401 redirect: an
 * expired *institution* token means "pick your college again", not "your
 * CareerBOT session ended".
 */
import axios from 'axios';
import { httpClient } from '@/lib/http';
import { institutionAuthHeader } from '@/lib/institutionSession';
import type { InstitutionErrorReason } from '@/lib/institutionMessages';
import { ERROR_MESSAGES } from '@/lib/institutionMessages';
import type {
  Batch,
  BulkImportResponse,
  BulkStudentRow,
  CreateBatchRequest,
  CreateDepartmentRequest,
  CreateFacultyAssignmentRequest,
  CreateInstitutionSessionRequest,
  CreateMemberRequest,
  CreateProgressRequest,
  CreateSectionRequest,
  CreateStudentRequest,
  Department,
  FacultyAssignmentResult,
  InstitutionMembership,
  InstitutionSession,
  ListSectionsParams,
  MemberRecord,
  ProgressRecord,
  Readiness,
  Standing,
  Leaderboard,
  CohortComparison,
  RosterReport,
  Section,
  Student,
  Paged,
  ListStudentsParams,
  InstitutionContext,
  IssuedInvite,
  ClaimResult,
} from '@/types/institution';

const BASE = '/institution';

/** A single field the server rejected, for inline form validation. */
export interface InstitutionFieldError {
  field: string;
  message: string;
}

// ── error class ───────────────────────────────────────────────
/**
 * Thrown by every function in this file on a non-success outcome.
 *
 * Components branch on `reason` — the canonical classification taken from the
 * envelope's `error.details.reason` when present, and derived from the HTTP
 * status only as a fallback. They never branch on `message`, which is backend
 * copy and may change.
 */
export class InstitutionApiError extends Error {
  readonly reason: InstitutionErrorReason;
  readonly status: number | undefined;
  /** Populated for INVALID_REQUEST so a form can mark the offending input. */
  readonly fieldErrors: InstitutionFieldError[];
  readonly backendErrorCode?: string;
  readonly errorId?: string;
  readonly requestId?: string;

  constructor(args: {
    reason: InstitutionErrorReason;
    status?: number;
    message?: string;
    fieldErrors?: InstitutionFieldError[];
    backendErrorCode?: string;
    errorId?: string;
    requestId?: string;
  }) {
    super(args.message?.trim() || ERROR_MESSAGES[args.reason]);
    this.name = 'InstitutionApiError';
    this.reason = args.reason;
    this.status = args.status;
    this.fieldErrors = args.fieldErrors ?? [];
    this.backendErrorCode = args.backendErrorCode;
    this.errorId = args.errorId;
    this.requestId = args.requestId;
  }

  /** True when the college is readable but not writable. */
  get isReadOnlyState(): boolean {
    return this.reason === 'COLLEGE_PAUSED' || this.reason === 'SUBSCRIPTION_EXPIRED';
  }
}

// ── read-only observer ────────────────────────────────────────
/**
 * There is no route that reports a college's subscription status, so the UI
 * cannot know it is paused until a write is refused. Every mapped error is
 * therefore published here; `InstitutionProvider` subscribes and flips the
 * whole area into read-only mode the first time one arrives, so a single
 * refusal in one corner disables write affordances everywhere instead of each
 * screen rediscovering it. See the report note on the missing status route.
 */
type ReadOnlyListener = (reason: 'COLLEGE_PAUSED' | 'SUBSCRIPTION_EXPIRED') => void;
const readOnlyListeners = new Set<ReadOnlyListener>();

export function onInstitutionReadOnly(listener: ReadOnlyListener): () => void {
  readOnlyListeners.add(listener);
  return () => {
    readOnlyListeners.delete(listener);
  };
}

type StaleSessionListener = () => void;
const staleSessionListeners = new Set<StaleSessionListener>();

/** Fires when the stored college token stops being usable.
 *
 *  Without this the UI is stuck forever: the gate sees a stored session so it
 *  skips auto-select, every scoped call is refused, and the user sits looking
 *  at a college name in the sidebar with zeroes in every panel and no way out
 *  short of clearing browser storage.
 *
 *  It is not an edge case. It happens whenever a membership is revoked, a
 *  college is removed, or the row the token names is rebuilt -- the token is
 *  still cryptographically valid, it just points at something that is gone. */
export function onInstitutionSessionStale(listener: StaleSessionListener): () => void {
  staleSessionListeners.add(listener);
  return () => {
    staleSessionListeners.delete(listener);
  };
}

function publishStaleSession(error: InstitutionApiError, status?: number): void {
  // The backend answers 403 with FORBIDDEN for a membership it cannot resolve
  // -- deliberately indistinguishable from "not yours", so the response does
  // not disclose whether the membership exists. The MESSAGE is what
  // distinguishes it, and matching on it is unpleasant but it is the only
  // signal available without weakening that property.
  const looksStale =
    (status === 403 || status === 401) &&
    /no active institution membership|membership not found|not usable|malformed/i.test(
      error.message ?? '',
    );
  if (!looksStale) return;
  staleSessionListeners.forEach((listener) => listener());
}

function publishReadOnly(error: InstitutionApiError): void {
  const reason = error.reason;
  // Capture into a local first: narrowing on a property is discarded inside the
  // forEach closure, so `error.reason` would widen back to the full union.
  if (reason !== 'COLLEGE_PAUSED' && reason !== 'SUBSCRIPTION_EXPIRED') return;
  readOnlyListeners.forEach((listener) => listener(reason));
}

// ── envelope parsing ──────────────────────────────────────────
interface ErrorEnvelope {
  success?: boolean;
  error?: {
    message?: string;
    error_code?: string;
    error_id?: string;
    request_id?: string;
    path?: string;
    details?: Record<string, unknown>;
  };
  detail?: string | Array<{ loc?: Array<string | number>; msg?: string }>;
}

const KNOWN_REASONS: readonly InstitutionErrorReason[] = [
  'FORBIDDEN',
  'COLLEGE_PAUSED',
  'SUBSCRIPTION_EXPIRED',
  'FEATURE_NOT_ENTITLED',
  'INVALID_REQUEST',
  'NOT_FOUND',
  'INVALID_TOKEN',
];

function reasonFromDetails(details: Record<string, unknown> | undefined): InstitutionErrorReason | null {
  const raw = details?.reason;
  if (typeof raw !== 'string') return null;
  const upper = raw.toUpperCase() as InstitutionErrorReason;
  return KNOWN_REASONS.includes(upper) ? upper : null;
}

/** Status-only fallback for a failure that carries no `details.reason`. */
function reasonFromStatus(status: number | undefined): InstitutionErrorReason {
  if (status === 400 || status === 422) return 'INVALID_REQUEST';
  if (status === 401) return 'INVALID_TOKEN';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'UNKNOWN';
}

/**
 * Pull field-level errors out of whichever shape the server used. The agreed
 * envelope only documents `details.reason`, so this reads the three shapes the
 * rest of this API is known to emit and quietly yields nothing otherwise —
 * a form then shows the message at form level instead of on a field.
 */
function parseFieldErrors(data: ErrorEnvelope | undefined): InstitutionFieldError[] {
  const out: InstitutionFieldError[] = [];
  const details = data?.error?.details;

  // 1. { details: { field: "admission_number", message?: "..." } }
  if (typeof details?.field === 'string') {
    out.push({
      field: details.field,
      message:
        typeof details.message === 'string' && details.message
          ? details.message
          : data?.error?.message || ERROR_MESSAGES.INVALID_REQUEST,
    });
  }

  // 2. { details: { validation_errors: [{ field, message }] } }
  const validationErrors = details?.validation_errors;
  if (Array.isArray(validationErrors)) {
    validationErrors.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const e = entry as Record<string, unknown>;
      if (typeof e.field === 'string') {
        out.push({
          field: e.field,
          message: typeof e.message === 'string' ? e.message : ERROR_MESSAGES.INVALID_REQUEST,
        });
      }
    });
  }

  // 3. FastAPI's raw 422: { detail: [{ loc: ["body", "field"], msg }] }
  if (data && Array.isArray(data.detail)) {
    data.detail.forEach((entry) => {
      const field = entry?.loc?.filter((p) => typeof p === 'string' && p !== 'body').pop();
      if (typeof field === 'string') {
        out.push({ field, message: entry.msg || ERROR_MESSAGES.INVALID_REQUEST });
      }
    });
  }

  return out;
}

function mapError(err: unknown): InstitutionApiError {
  if (err instanceof InstitutionApiError) return err;

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as ErrorEnvelope | undefined;

    // No response at all = the request never landed.
    if (!err.response) {
      return new InstitutionApiError({ reason: 'NETWORK', message: ERROR_MESSAGES.NETWORK });
    }

    // `details.reason` is authoritative; status is only a fallback. A paused
    // college answers 403, and so does a role violation — collapsing them into
    // one message would tell a placement officer they lack access to their own
    // college the day the invoice is late.
    const reason = reasonFromDetails(data?.error?.details) ?? reasonFromStatus(status);

    return new InstitutionApiError({
      reason,
      status,
      message: data?.error?.message,
      fieldErrors: reason === 'INVALID_REQUEST' ? parseFieldErrors(data) : [],
      backendErrorCode: data?.error?.error_code,
      errorId: data?.error?.error_id,
      requestId: data?.error?.request_id,
    });
  }

  return new InstitutionApiError({
    reason: 'UNKNOWN',
    message: err instanceof Error ? err.message : undefined,
  });
}

/** Map, publish read-only and stale-session state, then rethrow. */
function fail(err: unknown): never {
  const mapped = mapError(err);
  publishReadOnly(mapped);
  publishStaleSession(mapped, axios.isAxiosError(err) ? err.response?.status : undefined);
  throw mapped;
}

// ── request config ────────────────────────────────────────────
/**
 * `X-Skip-Auth-Redirect` stops `http.ts` from treating an institution 401 as a
 * consumer-session expiry and bouncing the user to the login modal.
 */
const SKIP_REDIRECT_HEADERS = { 'X-Skip-Auth-Redirect': 'true' } as const;

function withInstitutionAuth(extraHeaders: Record<string, string> = {}) {
  const auth = institutionAuthHeader();
  if (!auth) {
    throw new InstitutionApiError({
      reason: 'INVALID_TOKEN',
      message: 'Pick a college to continue.',
    });
  }
  return { headers: { ...SKIP_REDIRECT_HEADERS, ...extraHeaders, Authorization: auth } };
}

// ── session bootstrap (consumer token) ────────────────────────
/**
 * GET /institution/memberships
 *
 * Runs on the ORDINARY consumer session. `[]` is a normal answer — it means
 * this person is a jobseeker, not a college user. Callers must render nothing
 * college-related rather than treating it as an error.
 */
export async function listMemberships(): Promise<InstitutionMembership[]> {
  try {
    const response = await httpClient.get<InstitutionMembership[]>(`${BASE}/memberships`, {
      headers: SKIP_REDIRECT_HEADERS,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    return fail(err);
  }
}

/**
 * POST /institution/session
 *
 * Exchanges a membership for the institution token. Also runs on the consumer
 * session — this is the one write that must NOT carry a previous college's
 * token. 403 here means the membership is unknown, inactive, or someone
 * else's.
 */
export async function createInstitutionSession(
  body: CreateInstitutionSessionRequest,
): Promise<InstitutionSession> {
  try {
    const response = await httpClient.post<InstitutionSession>(`${BASE}/session`, body, {
      headers: SKIP_REDIRECT_HEADERS,
    });
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

// ── departments ───────────────────────────────────────────────
export async function listDepartments(): Promise<Department[]> {
  try {
    const response = await httpClient.get<Department[]>(
      `${BASE}/departments`,
      withInstitutionAuth(),
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    return fail(err);
  }
}

export async function createDepartment(body: CreateDepartmentRequest): Promise<Department> {
  try {
    const response = await httpClient.post<Department>(
      `${BASE}/departments`,
      body,
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

// ── batches ───────────────────────────────────────────────────
export async function listBatches(): Promise<Batch[]> {
  try {
    const response = await httpClient.get<Batch[]>(`${BASE}/batches`, withInstitutionAuth());
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    return fail(err);
  }
}

export async function createBatch(body: CreateBatchRequest): Promise<Batch> {
  try {
    const response = await httpClient.post<Batch>(`${BASE}/batches`, body, withInstitutionAuth());
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

// ── sections ──────────────────────────────────────────────────
export async function listSections(params: ListSectionsParams = {}): Promise<Section[]> {
  try {
    const response = await httpClient.get<Section[]>(`${BASE}/sections`, {
      ...withInstitutionAuth(),
      params: params.department_id ? { department_id: params.department_id } : undefined,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    return fail(err);
  }
}

export async function createSection(body: CreateSectionRequest): Promise<Section> {
  try {
    const response = await httpClient.post<Section>(
      `${BASE}/sections`,
      body,
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

// ── people ────────────────────────────────────────────────────
/** POST /institution/members — onboard an HOD, faculty member or student. */
export async function createMember(body: CreateMemberRequest): Promise<MemberRecord> {
  try {
    const response = await httpClient.post<MemberRecord>(
      `${BASE}/members`,
      body,
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

export async function listStudents(
  params: ListStudentsParams = {},
): Promise<Paged<Student>> {
  try {
    const response = await httpClient.get<Paged<Student>>(`${BASE}/students`, {
      ...withInstitutionAuth(),
      params,
    });
    const body = response.data;
    // Defensive: an older backend returned a bare array. Normalising here keeps
    // one shape in the components rather than two.
    if (Array.isArray(body)) {
      return { items: body, total: body.length, skip: 0, limit: body.length };
    }
    return {
      items: Array.isArray(body?.items) ? body.items : [],
      total: typeof body?.total === 'number' ? body.total : 0,
      skip: body?.skip ?? 0,
      limit: body?.limit ?? 0,
    };
  } catch (err) {
    return fail(err);
  }
}

/** The caller's OWN student record.
 *
 *  The student screen used to call listStudents() and take the first row,
 *  trusting the server to have scoped it to one. Correct today, and silently
 *  wrong the moment scoping widens -- it would show someone else's record
 *  with no error anywhere. */
export async function getMyStudentProfile(): Promise<Student | null> {
  try {
    const response = await httpClient.get<Student>(
      `${BASE}/students/me`, withInstitutionAuth());
    return response.data ?? null;
  } catch (err) {
    // 404 is a normal answer: this account has no student record here.
    //
    // 403 is NOT, and used to be collapsed into the same null. A student whose
    // membership was revoked, or whose college is misconfigured, was told their
    // record does not exist -- so they contact the college about missing data
    // while the college looks for a record that is sitting right there. A scope
    // refusal has to say it is a scope refusal.
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    return fail(err);
  }
}

/** What the caller may do here, asked BEFORE they try to do it.
 *
 *  A paused college used to look entirely normal until someone lost work to a
 *  403. This lets the UI show the read-only state up front. */
export async function getInstitutionContext(): Promise<InstitutionContext> {
  try {
    const response = await httpClient.get<InstitutionContext>(
      `${BASE}/context`, withInstitutionAuth());
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/** Issue a claim code for a roster entry.
 *
 *  The response carries the one and only copy of the code. */
export async function issueInvite(
  studentId: string, expiresDays = 30, sendEmail = false,
): Promise<IssuedInvite> {
  try {
    const response = await httpClient.post<IssuedInvite>(
      `${BASE}/students/${encodeURIComponent(studentId)}/invite`,
      { expires_days: expiresDays, send_email: sendEmail },
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/** Cancel every live code for a student without issuing a new one. */
export async function revokeInvites(studentId: string): Promise<number> {
  try {
    const response = await httpClient.post<{ revoked: number }>(
      `${BASE}/students/${encodeURIComponent(studentId)}/invite/revoke`,
      {},
      withInstitutionAuth(),
    );
    return response.data?.revoked ?? 0;
  } catch (err) {
    return fail(err);
  }
}

/** Redeem a code and bind THIS account to the roster row it names.
 *
 *  Runs on the ORDINARY consumer session, deliberately: the person redeeming
 *  has no college membership yet -- getting one is what redeeming does. It
 *  must not carry an institution token, and it must not require one. */
export async function claimWithInviteCode(code: string): Promise<ClaimResult> {
  try {
    const response = await httpClient.post<ClaimResult>(
      `${BASE}/claim`, { code }, { headers: SKIP_REDIRECT_HEADERS });
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/** The college's staff, so a human can PICK one.
 *
 *  Assigning students to a faculty member previously meant typing an internal
 *  account id that no screen displays. */
export async function listMembers(
  role?: 'cpo' | 'hod' | 'faculty' | 'student',
): Promise<MemberRecord[]> {
  try {
    const response = await httpClient.get<MemberRecord[]>(`${BASE}/members`, {
      ...withInstitutionAuth(),
      params: role ? { role } : undefined,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    return fail(err);
  }
}

export async function getStudent(studentId: string): Promise<Student> {
  try {
    const response = await httpClient.get<Student>(
      `${BASE}/students/${encodeURIComponent(studentId)}`,
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

export async function createStudent(body: CreateStudentRequest): Promise<Student> {
  try {
    const response = await httpClient.post<Student>(
      `${BASE}/students`,
      body,
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/**
 * The server's cap on one chunk. Mirrored here so the screen can split the file
 * before sending rather than discovering the limit as a 422 on row 501.
 * Changing it in one place only is a contract break; a test asserts the pair.
 */
export const BULK_CHUNK_SIZE = 500;

/** Split a roster into chunks the server will accept. */
export function chunkStudents<T>(rows: T[], size = BULK_CHUNK_SIZE): T[][] {
  if (size < 1) throw new Error('chunk size must be at least 1');
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/**
 * POST /institution/students/bulk — one chunk of a roster.
 *
 * Returns 200 with a per-row outcome even when some rows failed, so a thrown
 * error here means the CHUNK was refused (not signed in, not allowed, college
 * paused, malformed file) rather than that some students were rejected. The
 * caller must branch on both.
 */
export async function bulkOnboardStudents(
  students: BulkStudentRow[],
): Promise<BulkImportResponse> {
  try {
    const response = await httpClient.post<BulkImportResponse>(
      `${BASE}/students/bulk`,
      { students },
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

export async function assignStudentsToFaculty(
  body: CreateFacultyAssignmentRequest,
): Promise<FacultyAssignmentResult> {
  try {
    const response = await httpClient.post<FacultyAssignmentResult>(
      `${BASE}/faculty-assignments`,
      body,
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

// ── progress ──────────────────────────────────────────────────
/**
 * POST /institution/progress — FACULTY ONLY.
 *
 * A CPO or HOD reading the same rows still gets 403 here, so the UI must not
 * offer this control to them (see `canWriteProgress` in the shell nav).
 */
export async function recordProgress(body: CreateProgressRequest): Promise<ProgressRecord> {
  try {
    const response = await httpClient.post<ProgressRecord>(
      `${BASE}/progress`,
      body,
      withInstitutionAuth(),
    );
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/** A student's placement readiness, and the working behind it.
 *
 *  Same permission as reading their progress -- readiness is a sum of rows the
 *  caller can already see, so gating it separately would mean somebody able to
 *  read every score but not their total.
 *
 *  Pass "me" and the server resolves the caller's own record; a student's scope
 *  reaches nobody else's, so there is no id for them to supply. */
export async function getStudentReadiness(studentId: string): Promise<Readiness> {
  try {
    const response = await httpClient.get<Readiness>(
      `${BASE}/students/${encodeURIComponent(studentId)}/readiness`,
      withInstitutionAuth());
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/** Where the caller comes in their own year group.
 *
 *  The cohort is DEPARTMENT + GRADUATION YEAR, decided server-side from the
 *  student's own record -- a first-year ranked against final-years is a number
 *  nobody should act on. `available: false` is a normal answer, not an error:
 *  a cohort under ten scored students is withheld, because "1st of 2" says the
 *  other student scored lower, exactly, about somebody the reader can name. */
export async function getMyStanding(): Promise<Standing> {
  try {
    const response = await httpClient.get<Standing>(
      `${BASE}/students/me/standing`, withInstitutionAuth());
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/** The top of the caller's cohort.
 *
 *  Students who opted out are ABSENT -- not anonymised, not placeholders --
 *  and the response carries no cohort size, because "ten in the year, nine
 *  names" identifies the tenth. Entries carry no rank for the same reason: a
 *  gap in the numbering would say somebody is missing and bracket their score
 *  between the two names either side. */
export async function getLeaderboard(limit = 10): Promise<Leaderboard> {
  try {
    const response = await httpClient.get<Leaderboard>(
      `${BASE}/leaderboard?limit=${encodeURIComponent(String(limit))}`,
      withInstitutionAuth());
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/** How each department compares. AGGREGATES ONLY -- never a student.
 *
 *  Readable by every role, including a faculty member looking at a department
 *  they could never list, and safe to be so precisely because no row in it
 *  belongs to a person. */
export async function getCohortComparison(): Promise<CohortComparison> {
  try {
    const response = await httpClient.get<CohortComparison>(
      `${BASE}/reports/comparison`, withInstitutionAuth());
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/** Every student the caller can see, with their readiness. Same scope as the
 *  roster: faster than opening each student in turn, not wider. */
export async function getRosterReport(): Promise<RosterReport> {
  try {
    const response = await httpClient.get<RosterReport>(
      `${BASE}/reports/roster`, withInstitutionAuth());
    return response.data;
  } catch (err) {
    return fail(err);
  }
}

/**
 * Download the roster report as a CSV file.
 *
 * A BLOB, NOT A PLAIN LINK. The route needs the college session token, which
 * an <a href> cannot carry -- a bare link would arrive unauthenticated and
 * download a 403 page named roster.csv, which is the worst possible outcome
 * because it looks like it worked.
 *
 * The FILENAME comes from Content-Disposition when the browser lets us read
 * it, and falls back to a dated name otherwise. Never "download.csv": every
 * export otherwise lands in Downloads indistinguishable from the last one.
 */
export async function downloadRosterCsv(): Promise<{ blob: Blob; filename: string }> {
  try {
    const response = await httpClient.get(`${BASE}/reports/roster.csv`, {
      ...withInstitutionAuth(),
      responseType: 'blob',
    });

    const disposition = String(
      response.headers?.['content-disposition'] ?? '');
    const match = disposition.match(/filename="?([^"]+)"?/i);
    const today = new Date().toISOString().slice(0, 10);

    return {
      blob: response.data as Blob,
      filename: match?.[1] ?? `roster-${today}.csv`,
    };
  } catch (err) {
    return fail(err);
  }
}

export async function listStudentProgress(studentId: string): Promise<ProgressRecord[]> {
  try {
    const response = await httpClient.get<ProgressRecord[]>(
      `${BASE}/students/${encodeURIComponent(studentId)}/progress`,
      withInstitutionAuth(),
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    return fail(err);
  }
}

const institutionApi = {
  listMemberships,
  createInstitutionSession,
  listDepartments,
  createDepartment,
  listBatches,
  createBatch,
  listSections,
  createSection,
  createMember,
  listStudents,
  getMyStudentProfile,
  getInstitutionContext,
  listMembers,
  issueInvite,
  revokeInvites,
  claimWithInviteCode,
  getStudent,
  createStudent,
  assignStudentsToFaculty,
  recordProgress,
  listStudentProgress,
};

export default institutionApi;
