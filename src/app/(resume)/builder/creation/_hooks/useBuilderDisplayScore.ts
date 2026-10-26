"use client";
import { useResume } from "../_context/ResumeContext";
import { useScore } from "../_context/ScoreContext";
import { useResumeScorePreview } from "./useResumeScorePreview";
import { selectPreviewScore } from "../_components/PreviewPanel";
import { getEnhancedCurrentScore } from "../_utils/enhancedScore";

/**
 * The score shown on the builder's "Score NN%" button: the same number the preview toolbar used to
 * show (enhanced ATS score, else the calculated score, else the live preview score).
 */
export function useBuilderDisplayScore(isEnhancedResume: boolean): number {
  const { resumeData, enhancedAtsScore } = useResume();
  const { canonicalScore, canonicalStatus } = useScore();
  const previewScore = useResumeScorePreview(resumeData);
  return selectPreviewScore(
    previewScore.score,
    canonicalScore,
    canonicalStatus,
    isEnhancedResume && enhancedAtsScore ? Math.round(getEnhancedCurrentScore(enhancedAtsScore)) : undefined,
  );
}
