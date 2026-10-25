/**
 * The "High / Medium / Low impact" label of a Detailed Analysis section.
 *
 * It used to be a fixed value per section (Hard Skills High, STAR Medium,
 * Experience Low ...), while the Recommendations tab labels the same items by
 * the severity the API sent (critical = High, important = Medium, nice_to_have =
 * Low). So one item could read "Low Impact" in the report and "High Impact" in
 * Recommendations. Both now read the same source: the severity of the section's
 * outstanding fixes, with the old fixed value only as a fallback for a section
 * that has no fix rows (for example a score below 100 with no suggestion).
 */
export type Impact = "high" | "medium" | "low";

const RANK: Record<string, number> = { critical: 3, important: 2, nice_to_have: 1 };
const IMPACT_BY_RANK: Record<number, Impact> = { 3: "high", 2: "medium", 1: "low" };

interface PenaltyRow {
  readonly suggestion_id?: unknown;
  readonly category?: unknown;
  readonly severity?: unknown;
  readonly is_bulk_parent?: unknown;
  readonly is_master?: unknown;
}

/** The highest severity among the section's real fix rows, or `fallback`. */
export function impactFromPenalties(
  penalties: unknown,
  categories: readonly string[],
  fallback: Impact,
): Impact {
  if (!Array.isArray(penalties)) return fallback;
  let best = 0;
  for (const row of penalties as PenaltyRow[]) {
    if (!row || typeof row !== "object") continue;
    // Notes with no suggestion_id, and the "apply all" parents, are not fixes.
    if (!row.suggestion_id || row.is_bulk_parent || row.is_master) continue;
    if (typeof row.category !== "string" || !categories.includes(row.category)) continue;
    best = Math.max(best, RANK[String(row.severity)] ?? 0);
  }
  return IMPACT_BY_RANK[best] ?? fallback;
}
