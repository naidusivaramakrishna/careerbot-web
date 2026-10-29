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

/** Roles that can be created through POST /members. The server accepts only hod and
 *  faculty: cpo is provisioned by the platform, and a STUDENT membership exists only
 *  once the student claims an invite code against a student record. */
export type OnboardableRole = Exclude<InstitutionRole, 'cpo' | 'student'>;

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
  /** One class group, so a whole section can be given to one faculty
   *  member without ticking every row by hand. Not with without_section. */
  section_id?: string;
}

/** What the caller may do here, answerable BEFORE they try. */
export interface InstitutionContext {
  institution_id: string;
  institution_name: string;
  role: InstitutionRole;
  department_id: string | null;
  subscription_status: string | null;
  writable: boolean;
  /** A DENY-list. Everything not named here is on -- which is why the student
   *  screen derives what to show from this rather than from an allow-list: a
   *  feature added after a college's row was written must arrive switched on,
   *  not silently missing. */
  disabled_features: string[];
  /** What the college is BUYING, computed server-side on every read. Separate
   *  from subscription_status, which is whether their payment works. */
  tier?: 'trial' | 'paid' | 'free';
  /** Whole days, rounded up. `null` -- not 0 -- for anyone not on a running
   *  trial, so a paid college is never shown a countdown. */
  trial_days_remaining?: number | null;
}

/** Where one student comes in their cohort.
 *
 *  A UNION, not an object with optional fields. Below ten scored students the
 *  server returns no rank at all -- and a type that made `rank` optional would
 *  let a screen read `standing.rank` and render `undefined` for exactly the
 *  small cohorts the suppression exists to protect. */
export type Standing =
  | {
      available: true;
      rank: number;
      cohort_size: number;
      percentile: number;
      readiness: number;
      /** How many share this exact place, so a screen can say "joint 3rd"
       *  rather than implying a clean placing. */
      tied_with: number;
      /** Rank in the same batch year across every department of the college
       *  ("#12 in college"). Only present when the department rank above is;
       *  the same privacy floor applies, so it can be unavailable on its own. */
      college?: Standing;
    }
  | {
      available: false;
      /** `cohort_too_small` -- fewer than ten in the year group have a score.
       *  `no_batch_year` -- the college has not recorded which year they
       *  graduate, so there is no cohort to rank them in.
       *  `not_scored_yet` -- they have taken nothing. */
      reason: 'cohort_too_small' | 'no_batch_year' | 'not_scored_yet';
      cohort_size?: number;
      min_cohort?: number;
    };

/** One named entry on a leaderboard. NO RANK, deliberately -- see Leaderboard. */
export interface LeaderboardEntry {
  student_id: string;
  name: string;
  readiness: number;
}

/** The top of a cohort.
 *
 *  NO cohort_size AND NO RANKS. Both were removed after review: a size lets a
 *  reader who knows the year group subtract to find who is not listed, and ranks
 *  leave a visible gap that says somebody is missing and brackets their score
 *  between the two names either side. Number the rows as displayed positions. */
export type Leaderboard =
  | { available: true; entries: LeaderboardEntry[] }
  | { available: false; reason: string; min_cohort?: number;
      entries: LeaderboardEntry[] };

/** The answer to PUT /students/me/leaderboard. `changed` is false when the
 *  student repeated the choice they had already made. */
export interface LeaderboardConsent {
  opt_in: boolean;
  changed: boolean;
}

/** One department's numbers. Never a student. */
export type CohortComparisonGroup =
  | { group: string; scored: number; available: true;
      average: number; median: number }
  | { group: string; scored: number; available: false; reason: string };

export interface CohortComparison {
  groups: CohortComparisonGroup[];
}

/** One row of the placement officer's roster report. */
export interface RosterReportRow {
  student_id: string;
  full_name: string;
  admission_number: string | null;
  college_email: string | null;
  department_id: string;
  section_id: string | null;
  batch_year: number | null;
  status: string;
  claim_status: string;
  readiness: number;
  activities_scored: number;
  activities_total: number;
  /** ISO time the newest in_progress/completed progress row was RECORDED, or
   *  null when nothing has been. A recording time, never a login time.
   *  Optional so an older server that does not send it reads as "unknown". */
  last_activity_at?: string | null;
  [activityColumn: string]: unknown;
}

export interface RosterReport {
  items: RosterReportRow[];
  total: number;
}

/** One faculty member on GET /reports/faculty (CPO and HOD only).
 *
 *  `avg_readiness` is over SCORED students only -- the same rule as
 *  /reports/comparison -- so `scored` travels beside it, and it is null when
 *  none of their students has a score. Counts only students the caller can
 *  already read. */
export interface FacultyReportRow {
  membership_id: string;
  account_id: string;
  display_name: string | null;
  department_id: string | null;
  assigned: number;
  scored: number;
  avg_readiness: number | null;
}

export interface FacultyReport {
  items: FacultyReportRow[];
  total: number;
}

/** A member of staff, as a STUDENT may see them.
 *
 *  A name and a role, and nothing else. No account id: a student needs to
 *  know who to speak to, not an internal identifier they could join against
 *  another response. The name is what the COLLEGE typed at onboarding, never
 *  read from that person's platform account. */
export interface CollegePerson {
  name: string | null;
  role: 'faculty' | 'hod' | 'cpo';
}

/** THREE SEPARATE LISTS, not one array with a role field. "Who is my faculty"
 *  and "who runs placements" are two questions, and a screen that has to
 *  filter a mixed list to answer either will eventually filter it wrongly. */
export interface MyPeople {
  faculty: CollegePerson[];
  hods: CollegePerson[];
  placement_officers: CollegePerson[];
}

/** Something a faculty member asked a student to do, by a date.
 *
 *  ONE ROW PER STUDENT even when set for a whole section, because completion
 *  is per student -- a shared row would need a parallel structure recording
 *  who had done it, and that structure IS this row. */
export interface StudentTask {
  id: string;
  student_id: string;
  title: string;
  details: string | null;
  /** ISO-8601, and NULLABLE: "read chapter 4" with no deadline is a real
   *  thing to set, and requiring a date would have staff invent one that then
   *  shows as overdue. */
  due_at: string | null;
  status: 'pending' | 'done';
  completed_at: string | null;
  /** The faculty account that set it. */
  set_by: string;
  created_at?: string;
}

export interface StudentTaskList {
  items: StudentTask[];
}

export interface SetTasksRequest {
  student_ids: string[];
  title: string;
  details?: string | null;
  due_at?: string | null;
}

export interface SetTasksResult {
  created: number;
  task_ids: string[];
  /** PER-STUDENT, not all-or-nothing. A section of forty always contains
   *  somebody who transferred out last week; the request succeeds for the
   *  rest and says who it could not reach. */
  refused: Array<{ student_id: string; reason: string }>;
}

/** One activity's contribution to a readiness score. */
export interface ReadinessPart {
  activity: string;
  weight: number;
  /** Whether a usable COMPLETED score exists. A completed attempt with no
   *  score is still an attempt, which is why this is not called `attempted`. */
  scored: boolean;
  best_fraction: number | null;
  earned: number;
}

/** A student's placement readiness, and the working behind it.
 *
 *  The breakdown comes with the number on purpose: a single figure a student
 *  cannot take apart is one they will not trust. */
export interface Readiness {
  student_id: string;
  readiness: number;
  max: number;
  /** How many of the activities have a usable score. */
  scored: number;
  of: number;
  breakdown: ReadinessPart[];
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
  /** Whether the code was emailed to the student.
   *
   *  FALSE IS NOT A FAILURE OF THE INVITE. The code exists either way -- it
   *  is right there in `code` -- so a mail outage costs a delivery, not the
   *  invitation. The screen must still show the code, or an officer will
   *  reissue and revoke the one sitting in the student's inbox. */
  emailed: boolean;
  /** Why it was not emailed, in words for the officer. Most often: the
   *  college never recorded an email for this student. */
  email_error: string | null;
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
  /** Readable names for department_id / section_id. Sent ONLY on a student's own
   *  profile (GET /students/me), because a student cannot list departments or
   *  sections. Staff screens resolve the ids against those lists instead. */
  department_name?: string | null;
  section_name?: string | null;
  /** Whether this student's NAME is shown on the leaderboard. Sent only on a
   *  student's own profile (GET /students/me), and it is the answer the board
   *  acts on, not a raw stored field: OPT-IN, so a row from before consent
   *  existed reads false. Changed only by the student, via
   *  setMyLeaderboardConsent. */
  leaderboard_opt_in?: boolean;
  status: StudentStatus;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
  /** Present ONLY on the response to a faculty member creating a student, and
   *  only when the automatic assignment to that faculty member did not
   *  complete. The student WAS created -- this is not a failure -- but they
   *  are not on the creator's list, so the creator cannot see them or record
   *  their progress until somebody assigns them.
   *
   *  Saying so is the point: the alternative was failing the whole request,
   *  which told the faculty member their student did not exist and sent them
   *  into a retry the unique admission-number index refuses. */
  faculty_assignment_pending?: boolean;
}

/** GET /institution/faculty-assignments?faculty_membership_id= */
export interface FacultyRoster {
  faculty_membership_id: string;
  student_ids: string[];
  count: number;
}

/** POST /institution/faculty-assignments/remove */
export interface RemoveAssignmentsResult {
  removed: number;
}

/** POST /institution/faculty-assignments/move */
export interface MoveAssignmentsRequest {
  from_membership_id: string;
  to_membership_id: string;
  student_ids: string[];
}

export interface MoveAssignmentsResult {
  assigned: number;
  removed: number;
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

/** What the server did with one row of a roster upload. */
export type BulkRowOutcome = 'created' | 'duplicate' | 'rejected';

export interface BulkImportRowResult {
  /** Position in the chunk that was SENT, not in the file. The screen maps it
   *  back to the file's own line before showing it to anyone. */
  index: number;
  outcome: BulkRowOutcome;
  admission_number: string;
  message: string | null;
  student_id?: string;
  faculty_assignment_pending?: boolean;
}

export interface BulkImportResponse {
  results: BulkImportRowResult[];
  submitted: number;
  created: number;
  duplicate: number;
  rejected: number;
}

/** One student in a roster upload. Same shape as the single-student form. */
export interface BulkStudentRow {
  department_id: string;
  full_name: string;
  admission_number: string;
  college_email?: string | null;
  section_id?: string | null;
  batch_year?: number | null;
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

/** One row per assignment the request CREATED. Students who were already on the
 *  faculty member's roster are skipped and are NOT in the list, so
 *  `requested - result.length` is how many were already assigned. */
export type FacultyAssignmentResult = Array<{
  id: string;
  student_id: string;
  faculty_account_id: string;
  department_id: string;
  active: boolean;
}>;

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
