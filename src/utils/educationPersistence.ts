type EducationRecord = Record<string, unknown>;

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Parser responses keep degree and field-of-study separately, while the
 * builder edits them as one Degree value. Make that projection idempotent:
 * once the field is already present, a reload must not append it again.
 */
export function mergeEducationDegree(degreeValue: unknown, fieldValue: unknown): string {
  const degree = text(degreeValue);
  const field = text(fieldValue);
  if (!field) return degree;
  if (!degree) return field;

  const fieldPattern = escapeRegExp(field).replace(/\s+/g, "\\s+");
  const occurrence = new RegExp(`(?:^|\\s)${fieldPattern}(?=\\s|$)`, "i");
  if (!occurrence.test(degree)) return `${degree} ${field}`;

  // Repair data already compounded by earlier saves, e.g.
  // "B.Tech Computer Science Computer Science".
  const repeatedSuffix = new RegExp(`(?:\\s+${fieldPattern}){2,}$`, "i");
  return degree.replace(repeatedSuffix, ` ${field}`).trim();
}

const LEGACY_EDUCATION_ALIASES = [
  "qualification",
  "program",
  "branch",
  "field_of_study",
  "specialization",
  "cgpa",
  "gpa",
  "gpa_value",
  "percentage",
  "grade_percentage",
  "gradePercentage",
  "grade",
  "gradeType",
  "grade_type",
] as const;

/**
 * Education autosave is an id-based merge, not a full item replacement.
 * Explicitly clear parser-only aliases after their values have been folded
 * into the builder's canonical degree/score fields. Otherwise the aliases
 * survive on the server and are folded in again on every subsequent reload.
 */
export function prepareEducationForPersistence(items: EducationRecord[]): EducationRecord[] {
  return items.map(item => {
    const prepared: EducationRecord = { ...item };
    for (const alias of LEGACY_EDUCATION_ALIASES) prepared[alias] = "";
    return prepared;
  });
}

