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

export interface ListSectionsParams {
  department_id?: string;
}

// ── people ────────────────────────────────────────────────────
export interface CreateMemberRequest {
  account_id: string;
  role: OnboardableRole;
  /** Required by the route for every onboardable role. */
  department_id: string;
}

export interface MemberRecord {
  membership_id: string;
  account_id: string;
  institution_id: string;
  role: InstitutionRole;
  department_id: string | null;
  active?: boolean;
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
  faculty_account_id: string;
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
