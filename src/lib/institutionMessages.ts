/**
 * Closed-list copy for the institution platform.
 *
 * Single source of truth for every string the user reads. Components branch on
 * the canonical `reason`, never on backend free text — same discipline as
 * `coverLetterMessages.ts`.
 *
 * Copy rules applied here: written from the user's side, says what happened and
 * what to do next, no apologies, no jargon, no "records" / "entities".
 */
import type {
  ActivityType,
  InstitutionRole,
  ProgressStatus,
  StudentStatus,
} from '@/types/institution';

// ── failure reasons ───────────────────────────────────────────
/**
 * `details.reason` values the API sends on the error envelope, plus the two
 * transport-level classifications the client adds itself (`network`,
 * `unknown`) so every failure lands on exactly one branch.
 */
export type InstitutionErrorReason =
  | 'FORBIDDEN'
  | 'COLLEGE_PAUSED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'FEATURE_NOT_ENTITLED'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_TOKEN'
  | 'NETWORK'
  | 'UNKNOWN';

/**
 * The two subscription states are deliberately NOT collapsed: a paused college
 * is recoverable by the placement officer, an expired one needs the college
 * administration to renew. Different action, different person, different copy.
 */
export const ERROR_MESSAGES: Record<InstitutionErrorReason, string> = {
  FORBIDDEN: 'You do not have access to this.',
  COLLEGE_PAUSED:
    'Your college subscription is paused. You can still view everything, but changes cannot be saved.',
  SUBSCRIPTION_EXPIRED:
    'Your college subscription has expired. You can still view everything, but changes cannot be saved.',
  FEATURE_NOT_ENTITLED: 'This is switched off for your college.',
  INVALID_REQUEST: 'Check the highlighted field and try again.',
  NOT_FOUND: 'That student is no longer in your college.',
  // Shown with the server's own sentence when there is one (see ErrorNotice):
  // the useful part is WHAT collided, e.g. that this person already holds the role.
  CONFLICT: 'That already exists. Check what is already set up and try again.',
  // The COLLEGE session, not the login: the user is still signed in. Saying
  // "sign in again" sent people through logout/login that could not fix it.
  INVALID_TOKEN: 'Your college session ended. Select your college again to continue.',
  NETWORK: 'Could not reach the server. Check your connection and try again.',
  UNKNOWN: 'Something went wrong. Try again in a moment.',
};

/** Longer banner copy for the two read-only states, incl. who to contact. */
export const READ_ONLY_BANNER: Record<
  'COLLEGE_PAUSED' | 'SUBSCRIPTION_EXPIRED',
  { title: string; body: string }
> = {
  COLLEGE_PAUSED: {
    title: 'Read-only — your college subscription is paused',
    body: 'Everything is still visible. New entries and edits cannot be saved until the subscription resumes. Your placement officer can restart it.',
  },
  SUBSCRIPTION_EXPIRED: {
    title: 'Read-only — your college subscription has expired',
    body: 'Everything is still visible. New entries and edits cannot be saved until the subscription is renewed. Your college administration handles the renewal.',
  },
};

/** Tooltip on a control that is visible but disabled by the read-only state. */
export const READ_ONLY_CONTROL_HINT: Record<
  'COLLEGE_PAUSED' | 'SUBSCRIPTION_EXPIRED',
  string
> = {
  COLLEGE_PAUSED: 'Paused subscription — changes cannot be saved right now.',
  SUBSCRIPTION_EXPIRED: 'Expired subscription — changes cannot be saved right now.',
};

// ── labels ────────────────────────────────────────────────────
export const ROLE_LABELS: Record<InstitutionRole, string> = {
  cpo: 'Placement Officer',
  hod: 'Head of Department',
  faculty: 'Faculty',
  student: 'Student',
};

/** One line describing what this role sees — shown in the college switcher. */
export const ROLE_SCOPE_HINT: Record<InstitutionRole, string> = {
  cpo: 'Whole college',
  hod: 'Your department',
  faculty: 'Your assigned students',
  student: 'Your own record',
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  mock_test: 'Mock Test',
  coding_test: 'Coding Test',
  mock_interview: 'Mock Interview',
  english_assessment: 'English Assessment',
  resume_ats: 'Resume ATS Scan',
};

export const PROGRESS_STATUS_LABELS: Record<ProgressStatus, string> = {
  completed: 'Completed',
  in_progress: 'In progress',
  not_started: 'Not started',
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  enrolled: 'Enrolled',
  graduated: 'Graduated',
  withdrawn: 'Withdrawn',
  suspended: 'Suspended',
};

/** Human label for an unrecognised backend value — never render a raw slug. */
export function humanise(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function activityLabel(value: string): string {
  return (ACTIVITY_LABELS as Record<string, string>)[value] ?? humanise(value);
}

export function progressStatusLabel(value: string): string {
  return (PROGRESS_STATUS_LABELS as Record<string, string>)[value] ?? humanise(value);
}

export function studentStatusLabel(value: string): string {
  return (STUDENT_STATUS_LABELS as Record<string, string>)[value] ?? humanise(value);
}

/**
 * Whether a roster row has become a student who can sign in.
 *
 * Separate from STUDENT_STATUS_LABELS on purpose: "Enrolled" says the college
 * has them on the roll, not that they ever opened CareerBOT. A staff member
 * chasing sign-ups needs this one.
 */
export const CLAIM_STATUS_LABELS: Record<string, string> = {
  claimed: 'Signed up',
  invited: 'Code sent, not signed up',
  rostered: 'Not invited yet',
};

export function claimStatusLabel(value: string | null | undefined): string {
  if (!value) return CLAIM_STATUS_LABELS.rostered;
  return CLAIM_STATUS_LABELS[value] ?? humanise(value);
}
