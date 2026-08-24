/**
 * Institution (college) platform — contract types.
 *
 * 1:1 with careerbot-api's `/api/v1/institution/*` routes. Field names and
 * literal unions mirror the backend Pydantic models at
 * careerbot-api/app/services/institution_org_service/models.py and the role /
 * policy model at careerbot-api/app/core/institution/{roles,policy}.py.
 *
 * Nothing here is speculative: every field below is either returned by a route
 * in the agreed contract or defined on the backend model. Fields the backend
 * defines but no route is documented to return are marked OPTIONAL so a
 * narrower payload still type-checks.
 */

// ── roles ─────────────────────────────────────────────────────
/**
 * A membership role. `platform_admin` is deliberately NOT here: the backend
 * keeps platform operators in a separate collection and it is never a
 * membership row (models.py: MembershipRole).
 */
export type InstitutionRole = 'cpo' | 'hod' | 'faculty' | 'student';

/** Roles that can be created through POST /members (cpo is provisioned by the platform). */
export type OnboardableRole = Exclude<InstitutionRole, 'cpo'>;

export const INSTITUTION_ROLES: readonly InstitutionRole[] = [
  'cpo',
  'hod',
  'faculty',
  'student',
] as const;

// ── membership + session ──────────────────────────────────────
export interface InstitutionMembership {
  membership_id: string;
  institution_id: string;
  /** The college's REAL name. The route has always returned it; this type
   *  dropped it, so every screen fell back to prettifying the slug and a
   *  placement officer at VIT Chennai was greeted by "VIT CHENNAI" at best and
   *  "DEMO COLLEGE" at worst. The server falls back to the slug itself when
   *  the institution row is missing, so this is always a usable string. */
  institution_name: string;
  role: InstitutionRole;
  /** Absent for `cpo` — a CPO is institution-wide, not department-scoped. */
  department_id: string | null;
}

/**
 * Response of POST /institution/session. `access_token` carries the `inst_mid`
 * claim and is the ONLY token accepted by the other institution routes.
 */
export interface InstitutionSession {
  access_token: string;
  token_type: string;
  institution_id: string;
  role: InstitutionRole;
}

export interface CreateInstitutionSessionRequest {
  membership_id: string;
}

// ── org structure ─────────────────────────────────────────────
export interface Department {
  id: string;
  institution_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  /** Optional caller-chosen id; the server generates one when omitted. */
  department_id?: string;
}

export interface Batch {
  id: string;
  institution_id: string;
  academic_year: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBatchRequest {
  academic_year: string;
  name: string;
}

export interface Section {
  id: string;
  institution_id: string;
  department_id: string;
  batch_id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSectionRequest {
  department_id: string;
  batch_id: string;
  name: string;
}

/** GET /students returns a page plus a total, so a client can page without
 *  fetching the whole roster to count it. At a deemed university that roster
 *  is tens of thousands of rows. */
export interface Paged<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ListStudentsParams {
  skip?: number;
  limit?: number;
  /** matches admission number or name, server-side */
  q?: string;
  department_id?: string;
  batch_year?: number;
  /** Enrolment state. Filtered on the SERVER so the answer covers the whole
   *  roster: filtering it in the browser answered over one page, and "no
   *  graduates" was a lie about everyone who had not been loaded. */
  status?: StudentStatus;
  /** Only students who are in no class group. They are invisible to every
   *  faculty roster until placed in one, so a placement officer needs to find
   *  them -- and at a thousand students that answer cannot come from counting
   *  one page in the browser. */
  without_section?: boolean;
}

/** What the caller may do here, answerable BEFORE they try. */
export interface InstitutionContext {
  institution_id: string;
  institution_name: string;
  role: InstitutionRole;
  department_id: string | null;
  subscription_status: string | null;
  writable: boolean;
  disabled_features: string[];
}

/** What issuing an invite returns.
 *
 *  `code` is the ONLY copy. The server stores a keyed digest and cannot read
 *  it back, so if it is lost the college reissues. The UI must show it once
 *  and say so plainly -- a screen that implies it can be retrieved later sets
 *  the officer up to lose it. */
export interface IssuedInvite {
  student_id: string;
  full_name: string;
  admission_number: string | null;
  expires_at: string;
  code: string;
}

export interface ClaimResult {
  institution_id: string;
  institution_name: string;
  student_id: string;
  /** true when this account had already claimed the row -- a repeat redeem,
   *  not a failure. */
  already_claimed: boolean;
}

export interface ListSectionsParams {
  department_id?: string;
}

// ── people ────────────────────────────────────────────────────
export interface CreateMemberRequest {
  account_id: string;
  role: OnboardableRole;
  /** Required by the route for every onboardable role. */
  department_id: string;
  /** What the college calls this person. Optional, but without it the staff
   *  picker can only show an account id, which nobody can read. */
  display_name?: string;
}

export interface MemberRecord {
  membership_id: string;
  account_id: string;
  institution_id: string;
  role: InstitutionRole;
  department_id: string | null;
  active?: boolean;
  /** What the COLLEGE called this person when it added them. Typed by the
   *  college, not read from the platform account: that join crossed the tenant
   *  boundary, because staff onboarding accepts any account id and `users`
   *  carries no institution at all. `null` when they were added by id alone. */
  display_name?: string | null;
}

/** models.py StudentProfile.status */
export type StudentStatus = 'enrolled' | 'graduated' | 'withdrawn' | 'suspended';

/** Whether a login account is attached to this roster row. Separate from
 *  StudentStatus, which is about ENROLMENT (graduated, withdrawn) -- a
 *  graduated student is still claimed, and an enrolled one may never have
 *  signed up. */
export type ClaimStatus = 'rostered' | 'invited' | 'claimed';

export interface Student {
  id: string;
  /** NULL until the student claims this row with an invite code. The college
   *  enters its roster on day one; students sign up over the following weeks. */
  account_id: string | null;
  claim_status: ClaimStatus;
  institution_id: string;
  department_id: string;
  full_name: string;
  /** Required at onboarding: the college's own identifier, and the only one
   *  that always exists -- many colleges issue no student email at all. */
  admission_number: string;
  college_email: string | null;
  batch_year: number | null;
  section_id: string | null;
  status: StudentStatus;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStudentRequest {
  /** account_id is DELIBERATELY ABSENT. Staff put a student on the roster;
   *  they do not get to say which login owns that row. If they could, the
   *  invite code would be decoration -- anyone able to onboard could point a
   *  row at any account and take over that student's record. The account is
   *  bound only when the student redeems their code. Sending it is a 422. */
  department_id: string;
  full_name: string;
  /** Required. */
  admission_number: string;
  college_email?: string;
  section_id?: string;
  batch_year?: number;
}

export interface CreateFacultyAssignmentRequest {
  /** The MEMBERSHIP, not the account. Naming the account routed a request
   *  value onto a protected scope key, and answered differently for "no such
   *  account", "not in your scope" and "not a faculty member" -- which
   *  confirms membership state for accounts the caller cannot see. The
   *  membership id comes from GET /members, already scoped to the caller. */
  faculty_membership_id: string;
  student_ids: string[];
}

export interface FacultyAssignmentResult {
  faculty_account_id: string;
  student_ids: string[];
}

// ── progress ──────────────────────────────────────────────────
/** Closed list — the route rejects anything else. */
export type ActivityType =
  | 'mock_test'
  | 'coding_test'
  | 'mock_interview'
  | 'english_assessment'
  | 'resume_ats';

export const ACTIVITY_TYPES: readonly ActivityType[] = [
  'mock_test',
  'coding_test',
  'mock_interview',
  'english_assessment',
  'resume_ats',
] as const;

/**
 * The route accepts a free-form `status`. The three below are the values the
 * UI writes; a row read back with any other value still renders (see
 * `progressStatusTone`), it just falls back to a neutral chip.
 */
export type ProgressStatus = 'completed' | 'in_progress' | 'not_started';

export const PROGRESS_STATUSES: readonly ProgressStatus[] = [
  'completed',
  'in_progress',
  'not_started',
] as const;

export interface CreateProgressRequest {
  student_id: string;
  activity_type: ActivityType;
  status: string;
  score?: number;
  max_score?: number;
  activity_ref?: string;
}

export interface ProgressRecord {
  id?: string;
  student_id: string;
  activity_type: ActivityType;
  status: string;
  score: number | null;
  max_score: number | null;
  activity_ref: string | null;
  created_at?: string;
  updated_at?: string;
}
