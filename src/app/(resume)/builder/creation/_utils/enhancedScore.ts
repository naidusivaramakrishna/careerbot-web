import type { ATSScore } from "@/types/api.types";

/** Headline percentage fields an ats_breakdown / ats_score payload can carry.
 * This is the same variant set src/api/resumeatsapi.ts already resolves when
 * it computes `finalScore` from an ats_breakdown, and the same set
 * EnhancedResumeSummary.ats_score declares, so every surface that reads one of
 * these payloads resolves the SAME number from it. Add a field here and in
 * resumeatsapi.ts's chain together, or the two drift apart again. */
type ScoreHeadlineAliases = ATSScore & {
  current_score?: number;
  overall_score?: number;
  percentage?: number;
  score?: number;
};

/** Returns the current score represented by a complete weighted breakdown. */
export function getEnhancedCurrentScore(score: ATSScore | null | undefined): number {
  if (!score) return 0;
  // Prefer the server's own headline percentage over recomputing it from
  // section_breakdown: some responses carry a freshly updated headline
  // alongside a delayed display breakdown. Recomputing first produced two
  // values on one screen (right rail 83, left score 78.12).
  const aliases = score as ScoreHeadlineAliases;
  const headline = score.final_score ?? score.Percentage ?? aliases.current_score
    ?? score.FinalScore ?? aliases.overall_score ?? aliases.percentage ?? aliases.score;
  if (typeof headline === "number" && Number.isFinite(headline)) {
    return Math.max(0, Math.min(100, headline));
  }

  const sections = Object.values(score.section_breakdown ?? {}).filter(section => section.weight > 0);
  const weighted = sections.reduce(
    (acc, section) => {
      const aliases = section as typeof section & { weighted_pts?: number; max_pts?: number };
      const contribution = section.weighted_contribution ?? section.raw_score ?? aliases.weighted_pts;
      const maximum = section.weight ?? section.max_raw_score ?? aliases.max_pts;
      return {
        value: acc.value + (typeof contribution === "number" ? contribution : 0),
        maximum: acc.maximum + (typeof maximum === "number" ? maximum : 0),
        complete: acc.complete && typeof contribution === "number" && typeof maximum === "number",
      };
    },
    { value: 0, maximum: 0, complete: true },
  );
  if (weighted.complete && weighted.maximum >= 99) {
    return Math.max(0, Math.min(100, weighted.value));
  }
  // Every headline alias (current_score included) was already consulted above,
  // so there is nothing left to read: report 0 rather than a half-computed
  // weighted total from an incomplete breakdown.
  return 0;
}
