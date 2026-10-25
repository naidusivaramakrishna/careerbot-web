import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OVERVIEW_BREAKDOWN_LABELS } from "@/app/(jobs)/jobmatch/_components/analysis/MatchResultsOverview";
import { resultsSummary } from "@/app/(jobs)/jobmatch/_components/analysis/resultsSummary";
import MatchResultsOverview from "@/app/(jobs)/jobmatch/_components/analysis/MatchResultsOverview";

afterEach(cleanup);
describe("results overview navigation", () => {
  it("uses distinct bar fills and widths for green, info, rose and neutral scores", () => {
    render(<MatchResultsOverview matchResults={{data: {ats_score: 78, match_result: {
      Technical_Skills_Check: {match_score: 85},
      Soft_Skills_Check: {match_score: 70},
      Experience_Check: {match_score: 68},
      Education_Check: {execution_failed: true},
      Job_Title_Check: {match_score: 52},
    }}}} resumeName="Resume.pdf" jobDescriptionName="Role.txt" onDetails={vi.fn()} onBack={vi.fn()}/>);
    // The overview table only shows the categories most directly tied to job
    // fit (OVERVIEW_BREAKDOWN_LABELS) — the rest live on the detailed
    // analysis page only — so look rows up by label instead of assuming how
    // many bars there are.
    const fill = (label: string) => screen.getByRole("progressbar", {name: `${label} match score`}).firstElementChild as HTMLElement;
    const labels = ["Technical Skills", "Soft Skills", "Experience", "Education", "Job Title Match"];
    // Job Match's shared score bands: 85-100 green, 70-84 info, 55-69 warning, 0-54 rose, null neutral.
    expect(labels.map(label => fill(label).getAttribute("data-tone"))).toEqual(["green", "info", "warning", "neutral", "rose"]);
    expect(labels.map(label => fill(label).className)).toEqual(["bg-success-700", "bg-info-700", "bg-warning-700", "bg-[#475467]", "bg-error-700"]);
    expect(labels.map(label => fill(label).style.width)).toEqual(["85%", "70%", "68%", "0%", "52%"]);
    // Capabilities and Certifications are detailed-analysis-only categories now.
    expect(screen.queryByRole("progressbar", {name: "Capabilities match score"})).toBeNull();
    expect(screen.queryByRole("progressbar", {name: "Certifications match score"})).toBeNull();
  });
  it("displays analysis data and opens existing details without rerunning analysis", () => {
    const onDetails = vi.fn();
    const onBack = vi.fn();
    render(<MatchResultsOverview matchResults={{data: {ats_score: 67}}} resumeName="Resume.pdf" jobDescriptionName="Role.txt" onDetails={onDetails} onBack={onBack}/>);
    expect(screen.getByText("Fair match")).toBeTruthy();
    expect(screen.getByText("Resume.pdf")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", {name: "View Detailed Analysis"}));
    expect(onDetails).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", {name: "Back to Job Match"}));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

describe("the View buttons open the report page, not a popup", () => {
  const renderOverview = (onDetails = vi.fn()) => {
    render(
      <MatchResultsOverview
        matchResults={{data: {ats_score: 67}}}
        resumeName="Resume.pdf"
        jobDescriptionName="Role.txt"
        onDetails={onDetails}
        onBack={vi.fn()}
      />
    );
    return onDetails;
  };

  it("View Job Description opens the detailed analysis on the job description tab", () => {
    const onDetails = renderOverview();
    fireEvent.click(screen.getByRole("button", {name: "View Job Description in detailed analysis"}));
    expect(onDetails).toHaveBeenCalledOnce();
    expect(onDetails).toHaveBeenCalledWith("jd");
  });

  it("View Resume opens the detailed analysis on the resume tab", () => {
    const onDetails = renderOverview();
    fireEvent.click(screen.getByRole("button", {name: "View Your Resume in detailed analysis"}));
    expect(onDetails).toHaveBeenCalledWith("resume");
  });

  it("View Detailed Analysis passes no tab, so the caller's default (resume) applies", () => {
    const onDetails = renderOverview();
    fireEvent.click(screen.getByRole("button", {name: "View Detailed Analysis"}));
    expect(onDetails).toHaveBeenCalledOnce();
    expect(onDetails.mock.calls[0]).toEqual([]);
  });

  it("the keyword stat cards also pass no tab (never a click event)", () => {
    const onDetails = renderOverview();
    fireEvent.click(screen.getByText("Matched Keywords").closest("button") as HTMLElement);
    expect(onDetails).toHaveBeenCalledOnce();
    expect(onDetails.mock.calls[0]).toEqual([]);
  });

  it("never opens a dialog", () => {
    renderOverview();
    fireEvent.click(screen.getByRole("button", {name: "View Job Description in detailed analysis"}));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

// ── Added by review: pin the cross-file label coupling ──────────────────────
// The quick-glance table filters summary.breakdown by literal label. The labels
// are declared in MatchResultsOverview.tsx and produced in resultsSummary.ts, so
// a rename on either side silently drops a row — no error, the table just renders
// five categories instead of six. These six are all unconditional rows in
// resultsSummary.ts, so an empty match still produces every label (score null).
describe("OVERVIEW_BREAKDOWN_LABELS stays in sync with resultsSummary", () => {
  it("every overview label is still produced by resultsSummary", () => {
    const produced = resultsSummary({ data: { ats_score: 70 } }).breakdown.map(r => r.label);
    for (const label of OVERVIEW_BREAKDOWN_LABELS) {
      expect(produced, `"${label}" is no longer produced by resultsSummary.ts`).toContain(label);
    }
  });

  it("the filter keeps exactly the six overview rows", () => {
    const summary = resultsSummary({ data: { ats_score: 70 } });
    expect(summary.breakdown.filter(r => OVERVIEW_BREAKDOWN_LABELS.includes(r.label)))
      .toHaveLength(OVERVIEW_BREAKDOWN_LABELS.length);
  });
});
