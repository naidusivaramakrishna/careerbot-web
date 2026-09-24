import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MatchResultsOverview from "@/app/(jobs)/jobmatch/_components/analysis/MatchResultsOverview";

afterEach(cleanup);
describe("results overview navigation", () => {
  it("uses distinct bar fills and widths for good, average, bad and unavailable scores", () => {
    render(<MatchResultsOverview matchResults={{data: {ats_score: 78, match_result: {
      Technical_Skills_Check: {match_score: 85},
      Soft_Skills_Check: {match_score: 70},
      Experience_Check: {match_score: 68},
      Education_Check: {execution_failed: true},
      Certifications_Check: {match_score: 52},
    }}}} resumeName="Resume.pdf" jobDescriptionName="Role.txt" onDetails={vi.fn()} onBack={vi.fn()}/>);
    // The table lists every category the detailed page shows, so look rows up by
    // label instead of assuming how many bars there are.
    const fill = (label: string) => screen.getByRole("progressbar", {name: `${label} match score`}).firstElementChild as HTMLElement;
    const labels = ["Technical Skills", "Soft Skills", "Experience", "Education", "Certifications"];
    expect(labels.map(label => fill(label).getAttribute("data-tone"))).toEqual(["good", "good", "average", "unavailable", "bad"]);
    expect(labels.map(label => fill(label).style.width)).toEqual(["85%", "70%", "68%", "0%", "52%"]);
    expect(fill("Capabilities").getAttribute("data-tone")).toBe("unavailable");
  });
  it("displays analysis data and opens existing details without rerunning analysis", () => {
    const onDetails = vi.fn();
    const onBack = vi.fn();
    render(<MatchResultsOverview matchResults={{data: {ats_score: 67}}} resumeName="Resume.pdf" jobDescriptionName="Role.txt" onDetails={onDetails} onBack={onBack}/>);
    expect(screen.getByText("Fair Match")).toBeTruthy();
    expect(screen.getByText("Resume.pdf")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", {name: "View Detailed Analysis"}));
    expect(onDetails).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", {name: "Back to Job Match"}));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
