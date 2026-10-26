/**
 * The enhancer API answers in careerbot-ai's own format: `resume_json`, `target_role`, `score`,
 * `sections[].fixes`, `completeness`, `suggestions` (the "apply all" offers) and `recommended_section_order`,
 * followed by the API's own fields (`enhanced_resume_id`, `applied_fixes`, the score projection ...).
 *
 * The editor, the score tab and the ATS report were written around a different shape (`ats_display`,
 * `ats_score`, `enhancer_state.resume`, `enhanced_data`, a flat `suggestions` list of individual fixes).
 * This adapter converts at the API boundary, once, so none of that code has to change. It is the mirror of the
 * API's `to_ai_response`; a response that is not in the AI format (an older endpoint, a skills mutation) is
 * returned untouched.
 */

type Rec = Record<string, unknown>;

const isRec = (value: unknown): value is Rec => value !== null && typeof value === "object" && !Array.isArray(value);
const hasText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isBulkId = (id: string) => id === "apply_all_fixes" || id.endsWith("_apply_all");

/** careerbot-ai's flat format: `resume_json` next to a `sections` list. */
type AiScan = Rec & { sections: unknown[]; resume_json: unknown };

export function isAiScanResponse(raw: unknown): raw is AiScan {
  return isRec(raw) && Array.isArray(raw.sections) && "resume_json" in raw;
}

/** The text a fix shows when careerbot-ai gives no reason: "before -> after", or just the new text. */
export function fixMessage(fix: Rec): string {
  if (hasText(fix.reason)) return fix.reason;
  const { before_example: before, after_example: after } = fix;
  if (hasText(after)) return hasText(before) ? `${before} -> ${after}` : after;
  return "";
}

/** One fix as the editor reads it: its section and message added; a read-only fix (`ui_action`) is `info`. */
function editorFix(fix: Rec, section: string): Rec {
  const out: Rec = { ...fix, section, message: fixMessage(fix) };
  if (fix.ui_action) out.fix_type = "info";
  return out;
}

const PROJECTION_KEYS = [
  "current_score", "estimated_score_after_fixes", "points_possible", "issues_count",
  "sections_with_issues", "score_status", "score_source",
] as const;

function convert(raw: Rec): Rec {
  const sections = (raw.sections as unknown[]).filter(isRec);
  const individual: Rec[] = [];
  const actionItems: Record<string, Rec[]> = {};
  const displaySections: Rec[] = [];
  const sectionBreakdown: Record<string, Rec> = {};

  for (const section of sections) {
    const name = String(section.name ?? "");
    const { fixes: rawFixes, ...rest } = section;
    const rows: Rec[] = [];
    const deductions: Rec[] = [];
    const mine: Rec[] = [];
    for (const fix of Array.isArray(rawFixes) ? rawFixes : []) {
      if (!isRec(fix)) continue;
      const id = hasText(fix.id) ? fix.id : null;
      if (!id) { rows.push(fix); continue; }              // a reason-only row: kept for its explanation
      if (isBulkId(id)) continue;                          // apply-all rows are offered separately
      const shown = editorFix(fix, name);
      rows.push(shown);
      mine.push(shown);
      deductions.push({
        id, before_example: fix.before_example, after_example: fix.after_example,
        penalty_pts: typeof fix.penalty_pts === "number" ? fix.penalty_pts : 0,
      });
    }
    individual.push(...mine);
    if (name && mine.length > 0) actionItems[name] = mine;
    displaySections.push({ ...rest, fixes: rows, deductions });
    if (name) {
      sectionBreakdown[name] = {
        score: section.score_pct ?? 0, weighted_pts: section.weighted_pts ?? 0, max_pts: section.max_pts ?? 0,
        is_not_applicable: section.is_not_applicable ?? false, deductions,
      };
    }
  }

  const projection: Rec = {};
  for (const key of PROJECTION_KEYS) if (key in raw) projection[key] = raw[key];

  const display: Rec = {
    score: raw.score,
    sections: displaySections,
    action_items: actionItems,
    completeness: raw.completeness,
    recommended_section_order: raw.recommended_section_order ?? [],
    bulk_suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
    ...projection,
  };
  const breakdown: Rec = {
    final_score: raw.score,
    section_breakdown: sectionBreakdown,
    score_components: {},
    section_map: {},
    suggestions: individual,
    penalties: [],
    missing_sections: {},
    mode: raw.mode ?? "",
    score_source: raw.score_source ?? "",
    ...projection,
  };

  const { sections: _sections, resume_json: resume, suggestions: _bulk, completeness: _c, score: _s,
    recommended_section_order: _o, ...extras } = raw;
  void _sections; void _bulk; void _c; void _s; void _o;
  return {
    ...extras,
    enhanced_data: resume,
    enhancer_state: { resume, target_role: raw.target_role, ats_breakdown: breakdown },
    ats_display: display,
    ats_score: breakdown,
    ats_breakdown: breakdown,
    suggestions: individual,
  };
}

/**
 * Convert an enhancer API response for the rest of the app. A bulk-save reply wraps the record in
 * `enhanced_resume`; that inner record is converted too. Anything not in the AI format is returned as it is.
 * The converted record's fields are also put at the top level, where the old bulk-save reply had them: the
 * editor's section delete and ResumeContext's score sync read the score there.
 */
export function normalizeScanResponse<T>(raw: T): T {
  if (!isRec(raw)) return raw;
  const record: Rec = raw;                       // the type guard below would narrow `raw` to `never` afterwards
  if (isAiScanResponse(record)) return convert(record) as T;
  const wrapped = record.enhanced_resume;
  if (isAiScanResponse(wrapped)) {
    const inner = convert(wrapped);
    return { ...inner, ...record, enhanced_resume: inner } as T;
  }
  return raw;
}
