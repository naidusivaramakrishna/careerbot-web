import { getBand, bandStyles } from "@/lib/job-match/bands";
import { describe, expect, it } from "vitest";
import { getScoreBand, resultsSummary, resultColor } from "../../../../app/(jobs)/jobmatch/_components/analysis/resultsSummary";

describe("match results summary", () => {
  it("uses existing scores and deduplicates reported skills without mutating results", () => {
    const input = {data: {ats_score: "78%", match_result: {
      Technical_Skills_Check: {match_score: "75%", matched_critical_skills: [{skill: "React"}], missing_important_skills: [{skill: "SQL"}]},
      Soft_Skills_Check: {match_score: 80, matched_skills: ["Communication", "React"], missing_skills: []},
      Match_Penalties: {penalties: [{category: "summary"}, {category: "summary"}, {category: "technical_skills"}]},
    }}};
    const before = JSON.stringify(input);
    const result = resultsSummary(input);
    expect(result.score).toBe(78);
    expect(result.matched).toEqual(["React", "Communication"]);
    expect(result.missing).toEqual(["SQL"]);
    expect(result.areas).toEqual(["summary"]);
    expect(result.breakdown[1].score).toBe(75);
    expect(JSON.stringify(input)).toBe(before);
  });
  it("supports legacy keys and distinguishes unavailable scores from zero", () => {
    const result = resultsSummary({data: {ats_score: 0, match_result: {Technical_Skills: {match_score: 0}, Soft_Skills: {execution_failed: true, match_score: 0}}}});
    expect(result.score).toBe(0);
    expect(result.breakdown[1].score).toBe(0);
    expect(result.breakdown[2].score).toBeNull();
    expect(resultsSummary({}).score).toBeNull();
    // Job Match's shared score bands: 85-100 green, 70-84 info, 55-69 warning, 0-54 rose.
    expect(resultColor(20)).toBe("#B42318");
    expect(resultColor(70)).toBe("#175CD3");
    expect(resultColor(85)).toBe("#067647");
  });
  // Same guards as ScoreBreakdown.tsx: a Leadership / Career Progression card
  // only renders when its match_score is present (`!= null`), so the Overview
  // table and the PDF must not add a "N/A" row the detailed page doesn't show.
  it("omits Leadership and Career Progression rows the detailed breakdown hides", () => {
    const labels = (match: Record<string, unknown>) => resultsSummary({data: {ats_score: 70, match_result: match}}).breakdown.map(row => row.label);
    expect(labels({})).not.toContain("Leadership");
    expect(labels({Leadership_Check: {match_score: null}})).not.toContain("Leadership");
    expect(labels({Career_Progression_Check: {applicable: true, match_score: null}})).not.toContain("Career Progression");
    expect(labels({Leadership_Check: {match_score: 0}})).toContain("Leadership");
    expect(labels({Career_Progression_Check: {match_score: 60}})).toContain("Career Progression");
  });
});

describe("shared score band boundaries", () => {
  it.each([
    [0, "Needs work", "#B42318", "#FEF3F2"],
    [54.9, "Needs work", "#B42318", "#FEF3F2"],
    [55, "Fair match", "#B54708", "#FFFAEB"],
    [69.9, "Fair match", "#B54708", "#FFFAEB"],
    [70, "Good match", "#175CD3", "#EFF8FF"],
    [84.9, "Good match", "#175CD3", "#EFF8FF"],
    [85, "Strong match", "#067647", "#ECFDF3"],
    [100, "Strong match", "#067647", "#ECFDF3"],
  ])("classifies %s consistently", (score, label, text, bg) => {
    expect(getScoreBand(score as number)).toMatchObject({label, text, bg});
    expect(bandStyles[getBand(score as number)].label).toBe(label);
    expect(resultsSummary({data: {ats_score: score}}).band).toBe(label);
  });
  it("keeps missing and invalid scores neutral", () => {
    for (const score of [null, NaN, Infinity]) expect(getScoreBand(score).tone).toBe("neutral");
  });
});

describe("public band API", () => {
  it.each([
    [85, 'strong', 'success'], [70, 'good', 'info'], [55, 'fair', 'warning'], [0, 'needs-work', 'error'],
  ] as const)('maps %s to its semantic styles', (score, band, token) => {
    expect(getBand(score)).toBe(band);
    expect(bandStyles[band]).toMatchObject({text: 'text-' + token + '-700', bg: 'bg-' + token + '-50', bar: 'bg-' + token + '-700'});
  });
  it('clamps finite values and rejects non-finite input at the public API boundary', () => {
    expect(getBand(-1)).toBe('needs-work');
    expect(getBand(101)).toBe('strong');
    for (const value of [NaN, Infinity, -Infinity]) expect(() => getBand(value)).toThrow(RangeError);
  });
});
