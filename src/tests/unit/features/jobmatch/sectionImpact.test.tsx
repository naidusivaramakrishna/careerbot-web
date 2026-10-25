/**
 * A section's impact label must come from the same place in the report and in
 * Recommendations: the severity of its outstanding fixes.
 *
 * It was fixed per section in the report (STAR Pattern Medium, Experience Low)
 * while Recommendations labelled the same items by severity, so a critical STAR
 * bullet read "High Impact" in one tab and "Medium Impact" in the other.
 */
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ScoreBreakdown from "@/app/(jobs)/jobmatch/_components/analysis/ScoreBreakdown";
import { impactFromPenalties } from "@/lib/job-match/sectionImpact";

afterEach(cleanup);

const row = (over: Record<string, unknown>) => ({
  suggestion_id: "s1", category: "star_pattern", severity: "critical", fix_type: "auto", ...over,
});

describe("impactFromPenalties", () => {
  it("critical is High, important Medium, nice_to_have Low", () => {
    expect(impactFromPenalties([row({ severity: "critical" })], ["star_pattern"], "low")).toBe("high");
    expect(impactFromPenalties([row({ severity: "important" })], ["star_pattern"], "low")).toBe("medium");
    expect(impactFromPenalties([row({ severity: "nice_to_have" })], ["star_pattern"], "high")).toBe("low");
  });

  it("takes the highest severity among the section's rows", () => {
    const rows = [row({ severity: "nice_to_have", suggestion_id: "a" }), row({ severity: "critical", suggestion_id: "b" })];
    expect(impactFromPenalties(rows, ["star_pattern"], "low")).toBe("high");
  });

  it("ignores other sections, notes without a suggestion_id, and the apply-all parents", () => {
    const rows = [
      row({ category: "experience" }),
      row({ suggestion_id: undefined }),
      row({ is_bulk_parent: true }),
      row({ is_master: true, category: "all" }),
    ];
    expect(impactFromPenalties(rows, ["star_pattern"], "medium")).toBe("medium");
  });

  it("falls back when there are no fix rows or the data is unusable", () => {
    expect(impactFromPenalties([], ["star_pattern"], "medium")).toBe("medium");
    expect(impactFromPenalties(undefined, ["star_pattern"], "low")).toBe("low");
    expect(impactFromPenalties("nope", ["star_pattern"], "high")).toBe("high");
    expect(impactFromPenalties([null, 3], ["star_pattern"], "low")).toBe("low");
  });
});

describe("ScoreBreakdown impact labels follow the fixes", () => {
  const card = (label: string) => screen.getByText(label).closest("[data-analysis-section]") as HTMLElement;

  it("a critical STAR and Experience fix reads High Impact (was Medium / Low)", () => {
    render(<ScoreBreakdown matchResult={{
      STAR_Pattern_Check: { match_score: "20.0%" },
      Experience_Check: { match_score: "60%" },
      Match_Penalties: { penalties: [
        row({ suggestion_id: "bullet_fix_1", category: "star_pattern", severity: "critical" }),
        row({ suggestion_id: "bullet_fix_2", category: "experience", severity: "critical" }),
      ] },
    }} />);
    expect(within(card("STAR Pattern")).getByText("High Impact")).toBeTruthy();
    expect(within(card("Experience")).getByText("High Impact")).toBeTruthy();
  });

  it("only nice-to-have skill fixes read Low Impact (was High)", () => {
    render(<ScoreBreakdown matchResult={{
      Technical_Skills_Check: { match_score: "90%", missing_nice_to_have_skills: [{ skill: "R" }] },
      Match_Penalties: { penalties: [row({ suggestion_id: "suggest_add_skill_5", category: "technical_skills", severity: "nice_to_have" })] },
    }} />);
    expect(within(card("Hard Skills")).getByText("Low Impact")).toBeTruthy();
  });

  it("a section with no fix rows keeps its old fixed label", () => {
    render(<ScoreBreakdown matchResult={{ STAR_Pattern_Check: { match_score: "20.0%" }, Match_Penalties: { penalties: [] } }} />);
    expect(within(card("STAR Pattern")).getByText("Medium Impact")).toBeTruthy();
  });
});
