type EducationRecord = Record<string, unknown>;

const text = (value: unknown): string =>
  value == null ? "" : String(value).trim().replace(/\s+/g, " ");

const firstText = (...values: unknown[]): string =>
  values.map(text).find(Boolean) ?? "";

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

type EducationScoreType = "CGPA" | "Marks" | "GPA" | "Percentage";

const normalizeScoreType = (value: unknown): EducationScoreType | undefined => {
  const aliases: Record<string, EducationScoreType> = {
    cgpa: "CGPA",
    gpa: "GPA",
    marks: "Marks",
    percentage: "Percentage",
    percent: "Percentage",
    "%": "Percentage",
  };
  return aliases[text(value).toLowerCase()];
};

/** Keep persistence's alias projection aligned with the enhanced-resume mapper. */
function inferEducationScoreType(
  education: EducationRecord,
  rawValue: string,
): EducationScoreType | undefined {
  const value = rawValue.trim();
  const hasPercentageFormat = /%|percent/i.test(value);
  const numericValue = Number(
    value.replace(/%|percent(?:age)?/gi, "").replace(/,/g, "").trim(),
  );
  const explicit = normalizeScoreType(
    education.scoreType || education.score_type || education.gradeType || education.grade_type,
  );

  if (
    explicit === "CGPA" &&
    (hasPercentageFormat || (Number.isFinite(numericValue) && numericValue > 10))
  ) return "Percentage";
  if (
    explicit === "GPA" &&
    (hasPercentageFormat || (Number.isFinite(numericValue) && numericValue > 4))
  ) return numericValue <= 10 && !hasPercentageFormat ? "CGPA" : "Percentage";
  if (explicit) return explicit;
  if (text(education.percentage)) return "Percentage";
  if (text(education.cgpa)) return "CGPA";
  if (text(education.gpa) || text(education.gpa_value)) return "GPA";
  if (!value) return undefined;
  if (hasPercentageFormat) return "Percentage";

  const fraction = value.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  if (fraction) {
    const scale = Number(fraction[2]);
    if (scale === 100) return "Percentage";
    if (scale === 10) return "CGPA";
    if (scale === 4) return "GPA";
    return "Marks";
  }
  if (!Number.isFinite(numericValue) || numericValue < 0) return undefined;
  if (numericValue > 10 && numericValue <= 100) return "Percentage";
  if (numericValue > 4 && numericValue <= 10) return "CGPA";
  if (numericValue <= 4) return "GPA";
  return undefined;
}

function projectLegacyEducationAliases(
  item: EducationRecord,
  onlyFillUnsetCanonicalFields = false,
): EducationRecord {
  const prepared: EducationRecord = { ...item };
  const canFillDegree = !onlyFillUnsetCanonicalFields || item.degree === undefined;
  if (canFillDegree) {
    const degree = mergeEducationDegree(
      firstText(item.degree, item.qualification, item.program),
      firstText(item.branch, item.field_of_study, item.specialization),
    );
    if (degree) prepared.degree = degree;
  }

  const canFillScoreValue = !onlyFillUnsetCanonicalFields || item.scoreValue === undefined;
  const canFillScoreType = !onlyFillUnsetCanonicalFields || item.scoreType === undefined;
  if (canFillScoreValue || canFillScoreType) {
    const rawScoreValue = firstText(
      item.scoreValue,
      item.score_value,
      item.percentage,
      item.cgpa,
      item.gpa,
      item.gpa_value,
      item.grade,
    );
    const inferredScoreType = inferEducationScoreType(item, rawScoreValue);
    if (canFillScoreType && inferredScoreType) prepared.scoreType = inferredScoreType;
    if (canFillScoreValue && rawScoreValue) {
      const scoreType = canFillScoreType
        ? inferredScoreType
        : normalizeScoreType(item.scoreType);
      prepared.scoreValue = scoreType === "Percentage"
        ? rawScoreValue.replace(/\s*(?:%|percent(?:age)?)\s*$/i, "").trim()
        : rawScoreValue;
    }
  }
  return prepared;
}

function clearLegacyEducationAliases(item: EducationRecord): EducationRecord {
  const prepared = { ...item };
  for (const alias of LEGACY_EDUCATION_ALIASES) prepared[alias] = "";
  return prepared;
}

/**
 * Convert imported parser rows into the editor's canonical representation
 * before a user can edit them. Clearing aliases here makes a later deliberate
 * empty string distinguishable from a canonical field that was never loaded.
 */
export function normalizeEducationForBuilder(items: EducationRecord[]): EducationRecord[] {
  return items.map(item => clearLegacyEducationAliases(projectLegacyEducationAliases(item)));
}

/**
 * Education autosave is an id-based merge, not a full item replacement.
 * Aliases are normally removed during builder load. Keep this fallback only for
 * canonical fields that were never present; an empty canonical field is a user
 * deletion and must never be restored from a stale parser alias.
 */
export function prepareEducationForPersistence(items: EducationRecord[]): EducationRecord[] {
  return items.map(item =>
    clearLegacyEducationAliases(projectLegacyEducationAliases(item, true)),
  );
}
