export type ScoreBand = "weak" | "fair" | "good" | "strong";
export type SuggestionSeverity = "info" | "warning";

export interface PreviewScoreBreakdown {
  contact: number;
  summary: number;
  education: number;
  skills: number;
  evidence: number;
  metrics: number;
  certifications: number;
  formatting: number;
}

export interface PreviewScoreSuggestion {
  id: string;
  severity: SuggestionSeverity;
  message: string;
  section: string;
}

export interface PreviewScoreResult {
  score: number;
  band: ScoreBand;
  breakdown: PreviewScoreBreakdown;
  suggestions: PreviewScoreSuggestion[];
}
