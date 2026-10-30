import { getScoreSectionAction } from "@/app/(resume)/builder/creation/_utils/scoreSectionRouting";

/**
 * View model for the ATS scan report (score, per-section scores, suggestions with details).
 *
 * Built from what the scan stored: `ats_display` (careerbot-ai's scan through the backend) with a
 * fallback to the legacy `ats_score.section_breakdown`. Nothing here applies a fix: the report only
 * explains the score. Fixing happens in the enhancer (see `buildEnhancerFixUrl`).
 */

/** careerbot-ai's own impact levels (by the points a fix recovers: over 5 high, over 2 medium, else low). */
export type ReportImpact = "high" | "medium" | "low";
/** auto = the AI can write it; manual = needs the user's input; info = nothing to click, explanation only. */
export type ReportFixKind = "auto" | "manual" | "info";

export interface ReportItem {
  id: string;
  /** The ATS section the suggestion belongs to, so it can be named when it is listed by impact. */
  section: string;
  title: string;
  /** Why it was flagged (or what is missing). */
  reason: string | null;
  /** Current text and the suggested replacement, when the fix rewrites something. */
  before: string | null;
  after: string | null;
  impact: ReportImpact;
  /** Global priority across the whole resume, 1 = most urgent. */
  rank: number | null;
  /** Overall-score points recovered by this fix. */
  points: number | null;
  kind: ReportFixKind;
}

export interface ReportSection {
  name: string;
  scorePct: number;
  weightedPts: number;
  maxPts: number;
  notApplicable: boolean;
  /** Explanation-only rows (e.g. why the Summary lost points). */
  reasons: string[];
  items: ReportItem[];
  /** Builder section that edits this ATS section, or null when nothing can be edited for it. */
  editorSection: string | null;
}

/** A fix the scan applied for the user: what it changed, so the report can show it. */
export interface AutoFixedItem {
  id: string;
  title: string;
  section: string | null;
  /** Why it was suggested, when the scan said. */
  reason: string | null;
  before: string | null;
  after: string | null;
  points: number | null;
}

export interface AtsReportModel {
  score: number;
  band: { label: string; tone: "good" | "fair" | "poor" };
  /** Score reachable by applying the fixes, when it can be told. */
  potentialScore: number | null;
  sections: ReportSection[];
  /** Fixes already applied by the scan (mode "auto"); the score and the lists above include them. */
  autoFixed: AutoFixedItem[];
  /** Every fix the scan applied, including ones the ledger cannot describe (not in `autoFixed`). */
  autoFixedCount: number;
  issueCount: number;
  /** Total points the listed fixes recover. */
  recoverablePoints: number;
}

type Rec = Record<string, unknown>;

const isRec = (value: unknown): value is Rec => value !== null && typeof value === "object" && !Array.isArray(value);
const num = (value: unknown): number | null => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);
const round1 = (value: number) => Math.round(value * 10) / 10;

/** Bulk offers belong to the enhancer ("apply all"), never to the report. */
const isBulkId = (id: string) => id === "apply_all_fixes" || id.endsWith("_apply_all");

const TITLES: Array<[RegExp, string]> = [
  [/^suggested_summary/, "Rewrite your summary"],
  [/^headline_missing$/, "Add a professional headline"],
  [/^headline_weak$/, "Make your headline name the role you want"],
  [/_sentence_weak_/, "Strengthen a weak bullet point"],
  [/_tech_stack_missing$/, "Add the technologies you used"],
  [/_bullets_missing$/, "Add bullet points describing your work"],
  [/_(start|end)_date_missing$|_duration_missing$/, "Add the missing dates"],
  [/_(role|company|title)_missing$/, "Add the missing job details"],
  [/_off_domain$/, "Remove content that does not match your target role"],
  [/_domain_mismatch$/, "Your resume does not match the target role"],
  [/^(experience|internships|projects|education)_none$/, "Add this missing section"],
  [/^education_issue_/, "Complete your education details"],
  [/^skills_evidence_gap$/, "Show your listed skills in your work"],
  [/^skills_off_domain$/, "Remove skills outside your target role"],
  [/^skills_duplicate_entries$/, "Remove duplicate skills"],
  [/^skills_missing$/, "Add your technical skills"],
  [/^soft_skills_/, "Add soft skills"],
  [/^missing_certifications$/, "Add your certifications"],
  [/^cert_\d+_unbacked$/, "Back your certificate with matching skills"],
  [/^cert_\d+_(issuer|year|invalid)$|^cert_issue_/, "Complete your certificate details"],
  [/^certifications_off_domain$/, "Remove certificates outside your target role"],
  [/^contact_issue_/, "Complete your contact details"],
  [/^ats_/, "Fix a document format issue"],
  [/^careerprogression_score_gap$/, "Show more scope in your latest role"],
];

function titleFor(id: string, reason: string | null): string {
  for (const [pattern, title] of TITLES) if (pattern.test(id)) return title;
  if (reason) {
    const first = reason.split(/(?<=[.!?])\s/)[0];
    return first.length > 90 ? `${first.slice(0, 87)}…` : first;
  }
  const words = id.replace(/_\d+/g, "").replace(/_/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Improve this section";
}

const INFORMATIONAL = (id: string) =>
  id.startsWith("ats_") || id === "careerprogression_score_gap" || id.endsWith("_domain_mismatch");

function kindOf(id: string, fixType: unknown): ReportFixKind {
  if (INFORMATIONAL(id)) return "info";
  if (fixType === "auto") return "auto";
  if (fixType === "manual") return "manual";
  return "info";
}

function impactOf(value: unknown, points: number | null): ReportImpact {
  if (value === "high" || value === "medium" || value === "low") return value;
  if (points !== null && points > 5) return "high";
  if (points !== null && points > 2) return "medium";
  return "low";
}

function toItem(raw: Rec, section: string): ReportItem | null {
  const id = text(raw.id);
  if (!id || isBulkId(id)) return null;
  const reason = text(raw.reason) ?? (text(raw.message) && !text(raw.after_example) ? text(raw.message) : null);
  const points = num(raw.penalty_pts);
  return {
    id,
    section,
    title: titleFor(id, reason),
    reason,
    before: text(raw.before_example),
    after: text(raw.after_example),
    impact: impactOf(raw.impact, points),
    rank: num(raw.rank),
    points: points !== null && points > 0 ? round1(points) : null,
    kind: kindOf(id, raw.ui_action ? "info" : raw.fix_type),
  };
}

/** Only these can be opened in the enhancer: format findings, an off-field resume and `info` items just explain. */
export const canFix = (item: ReportItem) => item.kind !== "info" && !/^ats_|_domain_mismatch$/.test(item.id);

function bySeverity(a: ReportItem, b: ReportItem): number {
  if (a.rank !== null && b.rank !== null && a.rank !== b.rank) return a.rank - b.rank;
  if (a.rank !== null && b.rank === null) return -1;
  if (a.rank === null && b.rank !== null) return 1;
  return (b.points ?? 0) - (a.points ?? 0);
}

/** The impact levels in the order the report lists them, and the words it uses for them. */
export const IMPACT_ORDER: readonly ReportImpact[] = ["high", "medium", "low"];
export const IMPACT_LABEL: Record<ReportImpact, string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
};

/** One section's suggestions of one impact level. */
export interface ImpactSectionGroup {
  section: ReportSection;
  items: ReportItem[];
}

export interface ImpactGroup {
  impact: ReportImpact;
  /** Every suggestion of this level, across sections, most urgent first. */
  items: ReportItem[];
  /** The same suggestions under the sections they belong to; the section with the most urgent one comes first. */
  sections: ImpactSectionGroup[];
  /** Points the suggestions of this level recover together. */
  points: number;
}

/**
 * The suggestions of every applicable section, grouped by their impact (high first), most urgent first inside a group,
 * and inside a group again by section. A level with no suggestion has no group.
 */
export function groupByImpact(sections: ReportSection[]): ImpactGroup[] {
  const applicable = sections.filter((section) => !section.notApplicable);
  const items = applicable.flatMap((section) => section.items);
  return IMPACT_ORDER.map((impact) => {
    const inGroup = items.filter((item) => item.impact === impact).sort(bySeverity);
    const bySection: ImpactSectionGroup[] = [];
    for (const item of inGroup) {
      const existing = bySection.find((entry) => entry.section.name === item.section);
      if (existing) {
        existing.items.push(item);
        continue;
      }
      const section = applicable.find((candidate) => candidate.name === item.section);
      if (section) bySection.push({ section, items: [item] });
    }
    return { impact, items: inGroup, sections: bySection, points: round1(inGroup.reduce((sum, item) => sum + (item.points ?? 0), 0)) };
  }).filter((group) => group.items.length > 0);
}

function sectionFrom(raw: Rec, actionItems: Rec): ReportSection | null {
  const name = text(raw.name);
  if (!name) return null;
  const rows = Array.isArray(raw.fixes) ? raw.fixes : Array.isArray(actionItems[name]) ? (actionItems[name] as unknown[]) : [];
  const reasons: string[] = [];
  const items: ReportItem[] = [];
  for (const row of rows) {
    if (!isRec(row)) continue;
    if (!text(row.id)) {
      const reason = text(row.reason);
      if (reason) reasons.push(reason);
      continue;
    }
    const item = toItem(row, name);
    if (item) items.push(item);
  }
  return {
    name,
    scorePct: Math.max(0, Math.min(100, Math.round(num(raw.score_pct) ?? 0))),
    weightedPts: round1(num(raw.weighted_pts) ?? 0),
    maxPts: round1(num(raw.max_pts) ?? 0),
    notApplicable: raw.is_not_applicable === true,
    reasons,
    items: items.sort(bySeverity),
    editorSection: getScoreSectionAction(name)?.editorSection ?? null,
  };
}

/**
 * Older scans only stored `ats_score.section_breakdown` and a flat suggestion list: group it by section.
 * The list sat in `ats_score.suggestions` / `Suggestions`, or under a nested breakdown (`ats_score.breakdown`,
 * `ats_score.Breakdown` or the report's own `breakdown`), the containers the pre-redesign report read.
 */
function legacySections(atsScore: Rec | undefined, raw: Rec): ReportSection[] {
  const breakdown = atsScore && (atsScore.section_breakdown ?? atsScore.SectionBreakdown);
  if (!isRec(breakdown)) return [];
  const nested = [atsScore?.breakdown, atsScore?.Breakdown, raw.breakdown].find(isRec);
  const legacy = [atsScore?.suggestions, atsScore?.Suggestions, nested?.Suggestions].find(Array.isArray);
  const suggestions = (Array.isArray(legacy) ? legacy : []).filter(isRec);
  const listed = new Set<Rec>();          // a suggestion is listed once, even if two keys differ only in case
  const itemsFor = (name: string) => suggestions
    .filter((row) => !listed.has(row) && text(row.section)?.toLowerCase() === name.trim().toLowerCase())
    .map((row) => { listed.add(row); return toItem(row, name); })
    .filter((item): item is ReportItem => item !== null)
    .sort(bySeverity);
  const sections: ReportSection[] = [];
  for (const [name, value] of Object.entries(breakdown)) {
    if (!isRec(value)) continue;
    const pct = num(value.percentage ?? value.Percentage ?? value.score);
    if (pct === null) continue;
    sections.push({
      name,
      scorePct: Math.max(0, Math.min(100, Math.round(pct))),
      weightedPts: round1(num(value.raw_score ?? value.weighted_pts) ?? 0),
      maxPts: round1(num(value.max_score ?? value.max_pts ?? value.max_raw_score) ?? 0),
      notApplicable: value.is_not_applicable === true,
      reasons: [],
      items: itemsFor(name),
      editorSection: getScoreSectionAction(name)?.editorSection ?? null,
    });
  }
  return sections;
}

export function bandFor(score: number): AtsReportModel["band"] {
  if (score >= 80) return { label: "Strong", tone: "good" };
  if (score >= 60) return { label: "Fair", tone: "fair" };
  return { label: "Needs work", tone: "poor" };
}

/** Automatic fixes in the ledger, described or not (careerbot-api adds `suggestion` only when it finds the detail). */
function autoFixedTotal(ledger: unknown): number {
  if (!Array.isArray(ledger)) return 0;
  return ledger.filter((entry) => isRec(entry) && entry.auto === true
    && (text(entry.suggestion_id) ?? (isRec(entry.suggestion) ? text(entry.suggestion.id) : null)) !== null).length;
}

function autoFixedFrom(ledger: unknown): AutoFixedItem[] {
  if (!Array.isArray(ledger)) return [];
  const out: AutoFixedItem[] = [];
  for (const entry of ledger) {
    if (!isRec(entry) || entry.auto !== true || !isRec(entry.suggestion)) continue;
    const detail = entry.suggestion;
    const id = text(detail.id) ?? text(entry.suggestion_id);
    if (!id) continue;
    const reason = text(detail.reason);
    const points = num(detail.penalty_pts);
    out.push({
      id,
      title: titleFor(id, reason),
      section: text(detail.section),
      reason,
      before: text(detail.before_example),
      after: text(detail.after_example),
      points: points !== null && points > 0 ? round1(points) : null,
    });
  }
  return out;
}

export function buildAtsReport(raw: unknown): AtsReportModel | null {
  if (!isRec(raw)) return null;
  const enhancerState = isRec(raw.enhancer_state) ? raw.enhancer_state : undefined;
  const display = isRec(raw.ats_display) ? raw.ats_display : isRec(enhancerState?.ats_display) ? (enhancerState!.ats_display as Rec) : undefined;
  // Same order as the report this replaced: ats_score, then a top-level ats_breakdown (older reports), then the enhancer state's.
  const atsScore = [raw.ats_score, raw.ats_breakdown, enhancerState?.ats_breakdown].find(isRec);

  const score =
    num(display?.score) ??
    num(raw.finalWeightedScore) ??
    num(atsScore?.final_score ?? atsScore?.FinalScore ?? atsScore?.Percentage ?? atsScore?.score) ??
    null;
  if (score === null) return null;

  const actionItems = isRec(display?.action_items) ? (display!.action_items as Rec) : {};
  const rawSections = Array.isArray(display?.sections) ? (display!.sections as unknown[]) : [];
  let sections = rawSections.filter(isRec).map((s) => sectionFrom(s, actionItems)).filter((s): s is ReportSection => s !== null);
  if (sections.length === 0) sections = legacySections(atsScore, raw);

  const issueCount = sections.reduce((n, s) => n + s.items.length, 0);
  const recoverablePoints = round1(sections.reduce((n, s) => n + s.items.reduce((m, i) => m + (i.points ?? 0), 0), 0));
  // The fallback promises only what the Fix buttons can reach: information-only findings are not added.
  const fixablePoints = round1(sections.reduce((n, s) => n + s.items.filter(canFix).reduce((m, i) => m + (i.points ?? 0), 0), 0));

  // Freshest first: `display` / `atsScore` are re-read from the saved record, the top-level keys are from scan time.
  const sources: Array<Rec | undefined> = [display, atsScore, enhancerState, raw];
  const estimate = sources
    .flatMap((s) => (s ? [s.estimated_score_after_fixes, s.estimated_after_fixes, s.projected_score, s.potential_score] : []))
    .map(num)
    .find((n): n is number => n !== null && n >= score && n <= 100);
  const potentialScore = estimate !== undefined ? Math.round(estimate)
    : fixablePoints > 0 ? Math.min(100, Math.round(score + fixablePoints)) : null;

  const autoFixed = autoFixedFrom(raw.applied_fixes);
  return {
    score: round1(score),
    band: bandFor(Math.round(score)),                  // the ring shows the rounded score; the band must agree with it
    potentialScore: potentialScore !== null && potentialScore > Math.round(score) ? potentialScore : null,
    sections,
    autoFixed,
    autoFixedCount: autoFixedTotal(raw.applied_fixes),
    issueCount,
    recoverablePoints,
  };
}

/** Enhancer page for a scanned resume, opened on the section the user wants to fix. */
export function buildEnhancerFixUrl(enhancedResumeId: string, atsSectionName?: string | null): string {
  const params = new URLSearchParams({ source: "enhanced", from_ats: "true" });
  if (atsSectionName) params.set("open_section", atsSectionName);
  return `/builder/creation/${encodeURIComponent(enhancedResumeId)}?${params.toString()}`;
}

export const FIX_KIND_LABEL: Record<ReportFixKind, string> = {
  auto: "Quick fix",
  manual: "You need to add this",
  info: "Good to know",
};
