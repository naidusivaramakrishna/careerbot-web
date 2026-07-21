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
  strong:  { label: "Excellent Match", color: "#16a34a", bg: "rgba(220,252,231,0.9)" },
  good:    { label: "Very Good Match", color: "#4F46E5", bg: "rgba(219,234,254,0.9)" },
  partial: { label: "Good Match",      color: "#d97706", bg: "rgba(254,243,199,0.9)" },
  low:     { label: "Fair Match",      color: "#dc2626", bg: "rgba(254,226,226,0.9)" },
};

export function getMatchBandConfig(band?: string | null): MatchBandConfig {
  return MATCH_BAND_CONFIG[band as MatchBand] ?? MATCH_BAND_CONFIG.low;
}
