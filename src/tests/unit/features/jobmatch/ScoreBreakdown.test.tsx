import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ScoreBreakdown from "@/app/(jobs)/jobmatch/_components/analysis/ScoreBreakdown";

afterEach(cleanup);

// parseScore(null) returns 0, so a card guarded only by `!== undefined`
// renders a fabricated red "0%" for a block whose score is null.
describe("ScoreBreakdown optional cards", () => {
  it("hides the Leadership card when its score is null", () => {
    render(<ScoreBreakdown matchResult={{ Leadership_Check: { match_score: null, reason: "n/a" } }} />);
    expect(screen.queryByText("Leadership")).toBeNull();
  });

  it("hides the Career Progression card when its score is null", () => {
    render(<ScoreBreakdown matchResult={{ Career_Progression_Check: { match_score: null } }} />);
    expect(screen.queryByText("Career Progression")).toBeNull();
  });

  it("still shows the Leadership card when a score is present", () => {
    render(<ScoreBreakdown matchResult={{ Leadership_Check: { match_score: "60.0%", reason: "Some ownership signals" } }} />);
    expect(screen.getByText("Leadership")).toBeTruthy();
  });
});
