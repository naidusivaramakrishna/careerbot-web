import { describe, it, expect } from "vitest";
import { getEnhancedCurrentScore } from "@/app/(resume)/builder/creation/_utils/enhancedScore";
import type { ATSScore } from "@/types/api.types";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

// ── Headline variants that resolved to 0 here (added 2026-10-02) ───────────
// TotalScore, total_score and score_calculation.final_score are declared in
// api.types.ts (ATSScore :316, :338) and resolved to 0 by this function.
// Only TotalScore was a disagreement with src/api/resumeatsapi.ts, whose chain
// also reads it; the other two resolve to 0 in BOTH readers.
describe("getEnhancedCurrentScore — variants that used to resolve to 0", () => {
  it.each([
    ["TotalScore", { TotalScore: 73 }],
    ["total_score", { total_score: 73 }],
    ["score_calculation.final_score", { score_calculation: { final_score: 73 } }],
  ])("resolves %s instead of falling through to 0", (_label, payload) => {
    expect(getEnhancedCurrentScore(payload as unknown as ATSScore)).toBe(73);
  });

  // THE REGRESSION GUARD. These three sit BELOW the weighted recompute, not in
  // the headline chain. Appending them to the headline chain looked harmless
  // and silently changed a resolved payload: a stale legacy field alongside a
  // complete section_breakdown went from the breakdown's 80 to the stale 5.
  // Executed, pre-fix: all three returned 5.
  const completeBreakdown = {
    a: { weight: 50, weighted_contribution: 40 },
    b: { weight: 50, weighted_contribution: 40 },
  };
  it.each([
    ["TotalScore", { TotalScore: 5, section_breakdown: completeBreakdown }],
    ["total_score", { total_score: 5, section_breakdown: completeBreakdown }],
    ["score_calculation.final_score",
     { score_calculation: { final_score: 5 }, section_breakdown: completeBreakdown }],
  ])("a complete section_breakdown still beats a stale %s", (_label, payload) => {
    expect(getEnhancedCurrentScore(payload as unknown as ATSScore)).toBe(80);
  });

  it("a complete breakdown alone is unchanged", () => {
    expect(getEnhancedCurrentScore(
      { section_breakdown: completeBreakdown } as unknown as ATSScore)).toBe(80);
  });

  it.each([
    ["final_score beats total_score", { final_score: 91, total_score: 5 }, 91],
    ["Percentage beats TotalScore", { Percentage: 64, TotalScore: 9 }, 64],
    ["score beats TotalScore", { score: 55, TotalScore: 9 }, 55],
  ])("%s", (_label, payload, expected) => {
    expect(getEnhancedCurrentScore(payload as unknown as ATSScore)).toBe(expected);
  });
});

// The NAMED-CONSUMER check, derived from resumeatsapi.ts's SOURCE rather than
// from a list copied here. A hardcoded list only catches removals from this
// file; reading the other chain means adding a field THERE and not here fails
// this test, which is the drift the docstring claims to prevent.
describe("parity with resumeatsapi.ts's finalScore chain", () => {
  const source = readFileSync(
    resolve(__dirname, "../../../api/resumeatsapi.ts"), "utf8");
  // Bound the slice to the finalScore expression itself. An earlier version
  // sliced to the next "0\n" and ran into the estimatedScore block that
  // follows, picking up estimated_score_after_fixes -- a projected score, not a
  // headline one. The closing ");" of the Number(...) call is the real end.
  const start = source.indexOf("const finalScore");
  const chain = source.slice(start, source.indexOf(");", start));
  const fields = Array.from(
    new Set(Array.from(chain.matchAll(/atsBreakdownRec\.([A-Za-z_]+)/g), m => m[1])));

  it("extracts a non-empty field list from resumeatsapi.ts", () => {
    expect(fields.length).toBeGreaterThan(3);
  });

  it.each(fields)("reads %s, which resumeatsapi.ts also reads", (field) => {
    expect(getEnhancedCurrentScore({ [field]: 42 } as unknown as ATSScore)).toBe(42);
  });
});
