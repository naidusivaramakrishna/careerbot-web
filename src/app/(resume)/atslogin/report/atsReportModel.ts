import { getScoreSectionAction } from "@/app/(resume)/builder/creation/_utils/scoreSectionRouting";

/**
 * View model for the ATS scan report (score, per-section scores, suggestions with details).
 *
 * Built from what the scan stored: `ats_display` (careerbot-ai's scan through the backend) with a
 * fallback to the legacy `ats_score.section_breakdown`. Nothing here applies a fix: the report only
 * explains the score. Fixing happens in the enhancer (see `buildEnhancerFixUrl`).
 */

export type ReportImpact = "high" | "medium" | "low";
/** auto = the AI can write it; manual = needs the user's input; info = nothing to click, explanation only. */
export type ReportFixKind = "auto" | "manual" | "info";

export interface ReportItem {
  id: string;
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
  completeness: { scorePct: number; missingFields: string[] } | null;
  /** Fixes already applied by the scan (mode "auto"); the score and the lists above include them. */
  autoFixed: AutoFixedItem[];
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

function toItem(raw: Rec): ReportItem | null {
  const id = text(raw.id);
  if (!id || isBulkId(id)) return null;
  const reason = text(raw.reason) ?? (text(raw.message) && !text(raw.after_example) ? text(raw.message) : null);
  const points = num(raw.penalty_pts);
  return {
    id,
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

function bySeverity(a: ReportItem, b: ReportItem): number {
  if (a.rank !== null && b.rank !== null && a.rank !== b.rank) return a.rank - b.rank;
  if (a.rank !== null && b.rank === null) return -1;
  if (a.rank === null && b.rank !== null) return 1;
  return (b.points ?? 0) - (a.points ?? 0);
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
    const item = toItem(row);
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

/** Older scans only stored `ats_score.section_breakdown`: show the bars without suggestions. */
function legacySections(atsScore: Rec | undefined): ReportSection[] {
  const breakdown = atsScore && (atsScore.section_breakdown ?? atsScore.SectionBreakdown);
  if (!isRec(breakdown)) return [];
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
      items: [],
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
  const atsScore = isRec(raw.ats_score) ? raw.ats_score : isRec(enhancerState?.ats_breakdown) ? (enhancerState!.ats_breakdown as Rec) : undefined;

  const score =
    num(display?.score) ??
    num(raw.finalWeightedScore) ??
    num(atsScore?.final_score ?? atsScore?.FinalScore ?? atsScore?.Percentage ?? atsScore?.score) ??
    null;
  if (score === null) return null;

  const actionItems = isRec(display?.action_items) ? (display!.action_items as Rec) : {};
  const rawSections = Array.isArray(display?.sections) ? (display!.sections as unknown[]) : [];
  let sections = rawSections.filter(isRec).map((s) => sectionFrom(s, actionItems)).filter((s): s is ReportSection => s !== null);
  if (sections.length === 0) sections = legacySections(atsScore);

  const issueCount = sections.reduce((n, s) => n + s.items.length, 0);
  const recoverablePoints = round1(sections.reduce((n, s) => n + s.items.reduce((m, i) => m + (i.points ?? 0), 0), 0));

  // Freshest first: `display` / `atsScore` are re-read from the saved record, the top-level keys are from scan time.
  const sources: Array<Rec | undefined> = [display, atsScore, enhancerState, raw];
  const estimate = sources
    .flatMap((s) => (s ? [s.estimated_score_after_fixes, s.estimated_after_fixes, s.projected_score, s.potential_score] : []))
    .map(num)
    .find((n): n is number => n !== null && n >= score && n <= 100);
  const potentialScore = estimate ?? (recoverablePoints > 0 ? Math.min(100, Math.round(score + recoverablePoints)) : null);

  const completenessRaw = isRec(display?.completeness) ? (display!.completeness as Rec) : null;
  const completeness = completenessRaw
    ? {
        scorePct: Math.round(num(completenessRaw.score_pct) ?? 0),
        missingFields: Array.isArray(completenessRaw.missing_fields)
          ? completenessRaw.missing_fields.filter((f): f is string => typeof f === "string")
          : [],
      }
    : null;

  return {
    score: round1(score),
    band: bandFor(Math.round(score)),                  // the ring shows the rounded score; the band must agree with it
    potentialScore: potentialScore !== null && potentialScore > Math.round(score) ? potentialScore : null,
    sections,
    completeness,
    autoFixed: autoFixedFrom(raw.applied_fixes),
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
