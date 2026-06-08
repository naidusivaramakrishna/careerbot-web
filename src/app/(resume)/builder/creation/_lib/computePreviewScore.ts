import type { ResumeResponse } from "@/api/resumeApi";
import type { PreviewScoreResult } from "./previewScoreTypes";
import { normalizeResumeData } from "./normalizeResumeData";
import {
  calculateScoreBreakdown,
  generateSuggestions,
  calculateFinalScore,
  getScoreBand,
} from "./previewScoreRules";

export { type PreviewScoreResult, type PreviewScoreBreakdown, type PreviewScoreSuggestion } from "./previewScoreTypes";
export { type NormalizedResumeData } from "./normalizeResumeData";

export const computePreviewScore = (resume: ResumeResponse): PreviewScoreResult => {
  if (!resume) {
    return {
      score: 0,
      band: "weak",
      breakdown: {
        contact: 0,
        summary: 0,
        education: 0,
        skills: 0,
        evidence: 0,
        metrics: 0,
        certifications: 0,
        formatting: 0,
      },
      suggestions: [],
    };
  }

  const normalized = normalizeResumeData(resume);
  const breakdown = calculateScoreBreakdown(normalized);
  const score = calculateFinalScore(breakdown);
  const band = getScoreBand(score);
  const suggestions = generateSuggestions(normalized, breakdown);

  return {
    score,
    band,
    breakdown,
    suggestions,
  };
};
