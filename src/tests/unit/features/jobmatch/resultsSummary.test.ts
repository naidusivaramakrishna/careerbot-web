import { describe, expect, it } from "vitest";
import { resultsSummary, resultColor } from "../../../../app/(jobs)/jobmatch/_components/analysis/resultsSummary";

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
    expect(resultColor(20)).toBe("#DC2626");
    expect(resultColor(60)).toBe("#CA8A04");
    expect(resultColor(80)).toBe("#07845E");
  });
});
