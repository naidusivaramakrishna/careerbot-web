import { describe, it, expect } from "vitest";
import { getEnhancedCurrentScore } from "@/app/(resume)/builder/creation/_utils/enhancedScore";
import type { ATSScore } from "@/types/api.types";

describe("getEnhancedCurrentScore", () => {
  it("reads final_score first when the sibling headline fields disagree", () => {
    expect(getEnhancedCurrentScore({
      final_score: 83,
      Percentage: 78,
      current_score: 76,
    } as ATSScore)).toBe(83);
  });

  // The variants below are the same set src/api/resumeatsapi.ts resolves from
  // an ats_breakdown, and the same set EnhancedResumeSummary.ats_score
  // declares. Any one of them arriving alone must still produce the number --
  // reading none of them is what made the v2 editor header show no score.
  it.each([
    [{ Percentage: 72 }, 72],
    [{ current_score: 68 }, 68],
    [{ FinalScore: 91 }, 91],
    [{ overall_score: 83 }, 83],
    [{ percentage: 64 }, 64],
    [{ score: 57 }, 57],
  ])("supports persisted score compatibility fields (%o)", (score, expected) => {
    expect(getEnhancedCurrentScore(score as ATSScore)).toBe(expected);
  });

  it("returns 0 when there is no headline field and no usable breakdown", () => {
    expect(getEnhancedCurrentScore({} as ATSScore)).toBe(0);
    expect(getEnhancedCurrentScore(null)).toBe(0);
    expect(getEnhancedCurrentScore(undefined)).toBe(0);
  });

  it("clamps an invalid server range to a display-safe percentage", () => {
    expect(getEnhancedCurrentScore({ final_score: 140 } as ATSScore)).toBe(100);
    expect(getEnhancedCurrentScore({ final_score: -10 } as ATSScore)).toBe(0);
  });
});
