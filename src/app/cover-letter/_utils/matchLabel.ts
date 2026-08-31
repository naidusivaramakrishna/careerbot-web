/**
 * Single source of truth for "how good is this JD match" score bands within
 * the cover-letter feature. Both the Insights panel (CoverLetterView) and the
 * JD Match Matrix summary render a score derived from JD requirement
 * coverage, and previously each hard-coded its own thresholds independently
 * — this kept them from silently drifting apart again.
 *
 * Thresholds are chosen to preserve both prior call sites' behavior exactly:
 *   - CoverLetterView's Insights ring: >=85 "Excellent Match", else "Good Match".
 *   - JDMatchMatrix's summary line: >=70 "Strong", >=35 "Moderate", else "Low".
 * "excellent" (85) sits inside what was previously JDMatchMatrix's "good"
 * (>=70) range, so it does not change JDMatchMatrix's boundaries; "low" /
 * "very-low" split the JDMatchMatrix's <35 "Low" catch-all further for the
 * Insights ring, which never rendered anything below "Good" before this
 * unification.
 */
export type MatchBand = "excellent" | "good" | "moderate" | "low" | "very-low";

export function getMatchBand(score: number): MatchBand {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 35) return "moderate";
  if (score >= 15) return "low";
  return "very-low";
}

const MATCH_LABEL: Record<MatchBand, string> = {
  excellent: "Excellent Match",
  good: "Good Match",
  moderate: "Moderate Match",
  low: "Low Match",
  "very-low": "Very Low Match",
};

export function getMatchLabel(score: number): string {
  return MATCH_LABEL[getMatchBand(score)];
}

const ALIGNMENT_LABEL: Record<MatchBand, string> = {
  excellent: "Strong JD alignment",
  good: "Strong JD alignment",
  moderate: "Moderate JD alignment",
  low: "Low JD alignment",
  "very-low": "Very low JD alignment",
};

export function getMatchAlignmentLabel(score: number): string {
  return ALIGNMENT_LABEL[getMatchBand(score)];
}

const TEXT_TONE: Record<MatchBand, string> = {
  excellent: "text-emerald-700",
  good: "text-emerald-700",
  moderate: "text-amber-600",
  low: "text-orange-600",
  "very-low": "text-red-700",
};

export function getMatchLabelTone(score: number): string {
  return TEXT_TONE[getMatchBand(score)];
}

const BAR_TONE: Record<MatchBand, string> = {
  excellent: "bg-emerald-500",
  good: "bg-emerald-500",
  moderate: "bg-amber-500",
  low: "bg-orange-500",
  "very-low": "bg-red-400",
};

export function getMatchBarTone(score: number): string {
  return BAR_TONE[getMatchBand(score)];
}
