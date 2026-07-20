// Single source of truth for Smart Match "band" color + label — reused by
// JobCard, TopPickCard, and MatchAnalysisModal so the same job never shows
// a different match label/color depending on which component renders it.

export type MatchBand = "strong" | "good" | "partial" | "low";

export interface MatchBandConfig {
  label: string;
  color: string;
  bg: string;
}

export const MATCH_BAND_CONFIG: Record<MatchBand, MatchBandConfig> = {
  strong:  { label: "Excellent Match", color: "#4338ca", bg: "rgba(238,242,255,0.96)" },
  good:    { label: "Very Good Match", color: "#4f46e5", bg: "rgba(238,242,255,0.82)" },
  partial: { label: "Good Match",      color: "#475569", bg: "rgba(241,245,249,0.96)" },
  low:     { label: "Fair Match",      color: "#64748b", bg: "rgba(248,250,252,0.98)" },
};

export function getMatchBandConfig(band?: string | null): MatchBandConfig {
  return MATCH_BAND_CONFIG[band as MatchBand] ?? MATCH_BAND_CONFIG.low;
}
