/**
 * careerbot-ai needs a target role on every scan, so the enhancer API requires one. This finds it in a
 * parsed resume, in the same order the API used to: an explicit role, the builder's
 * `professionalSummary.targetRole`, the first headline segment, then the latest job title. When the
 * resume names none (a fresher with no headline), the caller asks the user.
 */

type Rec = Record<string, unknown>;

const PLACEHOLDERS = new Set([
  "", "string", "null", "none", "n/a", "na", "undefined",
  // headline words that describe a person's situation, not a role to score for
  "fresher", "student", "graduate", "fresh graduate", "job seeker", "seeking opportunities",
  "looking for opportunities", "open to work",
]);
const MAX_ROLE_CHARS = 120;

const isRec = (value: unknown): value is Rec => value !== null && typeof value === "object" && !Array.isArray(value);

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (PLACEHOLDERS.has(text.toLowerCase())) return null;
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

function latestJobTitle(resume: Rec): string | null {
  const jobs = Array.isArray(resume.experience) ? resume.experience : [];
  for (const job of jobs) {
    if (!isRec(job)) continue;
    const role = clean(job.role) ?? clean(job.title) ?? clean(job.job_title) ?? clean(job.position);
    if (role) return role;
  }
  return null;
}

/** The role to score `resume` for, or null when it names none. */
export function resolveTargetRole(resume: unknown): string | null {
  if (!isRec(resume)) return null;
  return (
    clean(resume.target_role) ?? clean(resume.targetRole) ?? summaryRole(resume) ??
    headlineRole(resume.headline) ?? latestJobTitle(resume)
  );
}
