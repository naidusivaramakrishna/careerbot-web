/**
 * careerbot-ai needs a target role on every scan, so the enhancer API requires one. This finds it in a
 * parsed resume, in the same order the API used to: an explicit role, the builder's
 * `professionalSummary.targetRole`, the first headline segment, then the latest job title. When the
 * resume names none (a fresher with no headline), the caller asks the user.
 */

type Rec = Record<string, unknown>;

const PLACEHOLDERS = new Set([
  "", "string", "null", "none", "n/a", "na", "undefined",
  "role", "target_role", "not specified",   // also refused by the API (API_REFUSED below)
  // headline words that describe a person's situation, not a role to score for
  "fresher", "student", "graduate", "fresh graduate", "job seeker", "seeking opportunities",
  "looking for opportunities", "open to work",
]);
const MAX_ROLE_CHARS = 120;
// careerbot-api refuses these as `target_role` with a 422 (resume_enhancer_service/ai_contract.py
// _TARGET_ROLE_PLACEHOLDERS), and any role shorter than 2 characters (EnhanceResumeRequest min_length=2).
const API_REFUSED = new Set(["string", "role", "target_role", "none", "null", "n/a", "na", "not specified"]);
const MIN_ROLE_CHARS = 2;

const isRec = (value: unknown): value is Rec => value !== null && typeof value === "object" && !Array.isArray(value);

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (PLACEHOLDERS.has(text.toLowerCase())) return null;
  if (text.length < MIN_ROLE_CHARS) return null;
  return text.slice(0, MAX_ROLE_CHARS).trim();
}

/** First usable segment of a headline: a string ("A | B"), a list, or a `{ value }` wrapper. */
function headlineRole(headline: unknown): string | null {
  let parts: unknown = isRec(headline) ? headline.value : headline;
  if (typeof parts === "string") parts = parts.split("|");
  if (!Array.isArray(parts)) return null;
  for (const part of parts) {
    const text = isRec(part) ? (part.value ?? part.text) : part;
    const role = clean(text);
    if (role) return role;
  }
  return null;
}

function summaryRole(resume: Rec): string | null {
  for (const key of ["professionalSummary", "professional_summary"]) {
    const summary = resume[key];
    if (isRec(summary)) {
      const role = clean(summary.targetRole) ?? clean(summary.target_role);
      if (role) return role;
    }
  }
  return null;
}

const EXPERIENCE_KEYS = ["experience", "work_experience", "workExperience", "professional_experience"] as const;

function latestJobTitle(resume: Rec): string | null {
  const jobs = EXPERIENCE_KEYS.flatMap((key) => (Array.isArray(resume[key]) ? (resume[key] as unknown[]) : []));
  for (const job of jobs) {
    if (!isRec(job)) continue;
    const role = clean(job.role) ?? clean(job.title) ?? clean(job.job_title) ?? clean(job.position);
    if (role) return role;
  }
  return null;
}

/**
 * A role the user typed, trimmed and cut to the length the API takes, or null when the API would refuse it.
 * Only the API's own rules apply: a user may choose a role such as "Student" that a headline would not give.
 */
export function cleanTargetRole(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const role = value.trim().slice(0, MAX_ROLE_CHARS).trim();
  return role.length >= MIN_ROLE_CHARS && !API_REFUSED.has(role.toLowerCase()) ? role : null;
}

// A stored resume document (GET /parser/get_resume) keeps the parsed resume under `parsed_data`; the v1 parser
// kept its content in an `llm_data` wrapper. Each is read when the level above names no role.
const NESTED_KEYS = ["parsed_data", "llm_data"] as const;

function nestedRole(resume: Rec): string | null {
  for (const key of NESTED_KEYS) {
    const role = isRec(resume[key]) ? resolveTargetRole(resume[key]) : null;
    if (role) return role;
  }
  return null;
}

/** The role to score `resume` for, or null when it names none (top-level keys first, then `parsed_data` / `llm_data`). */
export function resolveTargetRole(resume: unknown): string | null {
  if (!isRec(resume)) return null;
  return (
    clean(resume.target_role) ?? clean(resume.targetRole) ?? summaryRole(resume) ??
    headlineRole(resume.headline) ?? latestJobTitle(resume) ?? nestedRole(resume)
  );
}
