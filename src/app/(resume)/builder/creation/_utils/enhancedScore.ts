import type { ATSScore } from "@/types/api.types";

/** Returns the current score represented by a complete weighted breakdown. */
export function getEnhancedCurrentScore(score: ATSScore | null | undefined): number {
  if (!score) return 0;
  // `final_score` is the server's authoritative headline after an apply/undo.
  // Do not recompute it from section_breakdown first: some responses contain a
  // freshly updated final score alongside a delayed display breakdown. That
  // produced two values on one screen (right rail 83, left score 78.12).
  const authoritative = score.final_score ?? score.Percentage
    ?? (score as ATSScore & { current_score?: number }).current_score;
  if (typeof authoritative === "number" && Number.isFinite(authoritative)) {
    return Math.max(0, Math.min(100, authoritative));
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
  const current = (score as ATSScore & { current_score?: number }).current_score;
  return current ?? 0;
}
