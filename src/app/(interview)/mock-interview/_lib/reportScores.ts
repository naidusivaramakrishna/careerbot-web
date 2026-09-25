import type { ReportResponse } from "@/api/mockInterviewApi";

// Report scores come in two scales, and the scale is decided by WHICH FIELD a
// number came from, never by the number itself (a 0-100 score of 8 must not be
// read as 8/10):
//
//   0-100 ("percent"): *_score keys in `scores` (hr_score, communication_score,
//                      ...), each answer's competency_scores, a supplied radar.
//   0-10  ("tenths"):  the older keys in `scores` (overall, hr, communication,
//                      confidence, technical) and the report-level
//                      competency_scores.
//
// The one field that cannot be told apart by name is overall_score, so its
// scale comes from the payload type: a live realtime report is on 0-100.

export type ScoreScale = "tenths" | "percent";

const PERCENT_SCORE_KEYS = ["hr_score", "communication_score", "confidence_score", "technical_score"];

/** True for live realtime reports, whose overall_score is on the 0-100 scale. */
export function isPercentScaleReport(report: ReportResponse): boolean {
  const scores = report.scores ?? {};
  return (
    typeof report.weighted_score === "number" ||
    typeof report.score_source === "string" ||
    PERCENT_SCORE_KEYS.some((key) => typeof scores[key] === "number")
  );
}

/** Convert a score to a 0-100 integer using the scale of the field it came from. */
export function toPercent(value: number | undefined, scale: ScoreScale): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  const percent = scale === "tenths" ? value * 10 : value;
  return Math.round(Math.min(100, Math.max(0, percent)));
}

/**
 * Overall score on a 0-100 scale. Live reports are used as sent. Only reports
 * from the older backend (no live markers) fall back to the "10 or less means
 * 0-10" rule, because their overall_score has no field-level signal.
 */
export function normalizeOverallScore(report: ReportResponse): number {
  if (isPercentScaleReport(report)) return report.overall_score;
  return report.overall_score <= 10 ? Math.round(report.overall_score * 10) : report.overall_score;
}

// ─── Score breakdown (shared by /report and /shared-report) ──────────────────

export interface ReportDimension {
  key: string;
  label: string;
  score: number; // 0-100
}

export function humanize(key: string): string {
  const spaced = key.replace(/_score$/, "").replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Per-competency scores as a 0-100 breakdown; the caller states the scale of the field. */
export function mapCompetencyScores(scores: Record<string, number> | undefined, scale: ScoreScale): ReportDimension[] {
  return Object.entries(scores ?? {})
    .filter(([, v]) => typeof v === "number" && Number.isFinite(v))
    .map(([key, v]) => ({ key, label: humanize(key), score: toPercent(v, scale) }));
}

const NAMED_SCORE_KEYS = new Set([
  "overall",
  "hr", "hr_score",
  "communication", "communication_score",
  "confidence", "confidence_score",
  "technical", "technical_score",
]);

/**
 * Category scores from `scores`, each on the scale of its own field
 * (hr/communication/confidence/technical are 0-10, *_score keys are 0-100).
 * With fillFromOverall, a missing hr/communication/confidence falls back to the
 * overall score (the /report page shows those three rows always); without it
 * only scores that were actually sent appear. Unrecognised keys are kept.
 */
function categoryDimensions(report: ReportResponse, fillFromOverall: boolean): ReportDimension[] {
  const scores = report.scores ?? {};
  const overallScale: ScoreScale = isPercentScaleReport(report) ? "percent" : "tenths";
  const pick = (legacy?: number, modern?: number, useOverall = false): number | null => {
    if (typeof legacy === "number") return toPercent(legacy, "tenths");
    if (typeof modern === "number") return toPercent(modern, "percent");
    if (useOverall && fillFromOverall && typeof scores.overall === "number") return toPercent(scores.overall, overallScale);
    return null;
  };
  const named: { key: string; label: string; score: number | null }[] = [
    { key: "hr", label: "HR readiness", score: pick(scores.hr, scores.hr_score, true) },
    { key: "communication", label: "Communication", score: pick(scores.communication, scores.communication_score, true) },
    { key: "confidence", label: "Confidence", score: pick(scores.confidence, scores.confidence_score, true) },
    { key: "technical", label: "Technical", score: pick(scores.technical, scores.technical_score) },
  ];
  const extras = Object.entries(scores)
    .filter(([key, v]) => !NAMED_SCORE_KEYS.has(key) && typeof v === "number" && Number.isFinite(v))
    .map(([key, v]) => ({ key, label: humanize(key), score: toPercent(v as number, key.endsWith("_score") ? "percent" : "tenths") }));
  return [...named.filter((d): d is ReportDimension => d.score !== null), ...extras];
}

/** Breakdown rows: report-level competencies (0-10), else a supplied radar (0-100), else category scores. */
export function getReportDimensions(report: ReportResponse, options: { fillFromOverall?: boolean } = {}): ReportDimension[] {
  const competencies = mapCompetencyScores(report.competency_scores, "tenths");
  if (competencies.length > 0) return competencies;
  if (report.radar) return report.radar.map((d) => ({ key: d.dimension, label: d.dimension, score: toPercent(d.score, "percent") }));
  return categoryDimensions(report, options.fillFromOverall ?? false);
}
