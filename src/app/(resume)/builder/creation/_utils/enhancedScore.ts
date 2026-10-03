import type { ATSScore } from "@/types/api.types";

/** Headline percentage fields an ats_breakdown / ats_score payload can carry.
 *
 * This list is the UNION of what two places already read, verified field by
 * field rather than asserted:
 *   - src/api/resumeatsapi.ts:315-324 and :391-400, whose `finalScore` chain
 *     reads FinalScore, Percentage, overall_score, final_score, percentage,
 *     score and TotalScore. TotalScore is the ONLY one of the three added
 *     here that resumeatsapi.ts reads -- it was a genuine parity gap.
 *   - ATSScore's own declarations in src/types/api.types.ts:316 and :338,
 *     which is where total_score and score_calculation.final_score come from.
 *     NEITHER reader handled those two; they are not a parity gap with
 *     resumeatsapi.ts, which also resolves 0 for them.
 *     (EnhancedResumeSummary.ats_score at :575-582 declares only final_score,
 *     Percentage, current_score, overall_score, score and MaxScore -- an
 *     earlier version of this comment wrongly cited it as their source.)
 *
 * An earlier version of this comment claimed the set was already "the same
 * variant set src/api/resumeatsapi.ts already resolves ... so every surface
 * resolves the SAME number". It was not: all three were declared somewhere and
 * unreadable here, so such payloads resolved to 0. Only TotalScore was a
 * disagreement WITH resumeatsapi.ts; the other two resolved to 0 in both. The
 * comment described an intent and was read as a statement of fact — which is
 * the drift it warned about.
 *
 * Add a field here and to resumeatsapi.ts's chain together. */
type ScoreHeadlineAliases = ATSScore & {
  current_score?: number;
  overall_score?: number;
  percentage?: number;
  score?: number;
  TotalScore?: number;
  total_score?: number;
  score_calculation?: { final_score?: number };
};

/** Returns the current score represented by a complete weighted breakdown. */
export function getEnhancedCurrentScore(score: ATSScore | null | undefined): number {
  if (!score) return 0;
  // Prefer the server's own headline percentage over recomputing it from
  // section_breakdown: some responses carry a freshly updated headline
  // alongside a delayed display breakdown. Recomputing first produced two
  // values on one screen (right rail 83, left score 78.12).
  const aliases = score as ScoreHeadlineAliases;
  // Unchanged: the original seven, in their original order. The three added
  // variants are deliberately NOT here -- see the fallback below the weighted
  // recompute. Appending them to this chain looked harmless and was not: a
  // payload carrying BOTH a stale legacy field and a complete section_breakdown
  // resolved to the breakdown before, and would have resolved to the stale
  // field instead ({total_score: 5} + a breakdown summing to 80 -> 5, not 80).
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
  // Last resort, below the weighted recompute on purpose. These three are read
  // by other surfaces but were unreadable here, so such a payload resolved to
  // 0. They sit here rather than in the headline chain so a complete
  // section_breakdown still wins over a stale legacy field.
  const legacy = aliases.TotalScore ?? aliases.total_score
    ?? aliases.score_calculation?.final_score;
  if (typeof legacy === "number" && Number.isFinite(legacy)) {
    return Math.max(0, Math.min(100, legacy));
  }

  // Nothing left to read: report 0 rather than a half-computed weighted total
  // from an incomplete breakdown.
  return 0;
}
