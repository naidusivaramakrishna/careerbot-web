import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AnalysisContent from "@/app/(jobs)/jobmatch/_components/analysis/AnalysisContent";

vi.mock("@/api/parserApi", () => ({ matcherEnhanceApply: vi.fn(), matcherEnhanceRemove: vi.fn(), matcherUpdateSections: vi.fn(), downloadResumePdf: vi.fn() }));
vi.mock("@/app/(jobs)/jobmatch/_components/resume/ResumePreview", () => ({ default: () => <div>Resume document</div> }));
vi.mock("@/app/(jobs)/jobmatch/_components/resume/JobMatchSectionEditor", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });
const props = {
  jdText: "A role requiring React and SQL.",
  onBackToUpload: vi.fn(),
  parsedResumeData: { id: "resume-test", filename: "Resume.pdf", parsed_data: { contact: { name: "Test Candidate" }, skills: ["React"], summary: "Developer" } },
  matchResults: { data: { id: "match-test", ats_score: 78, resume_id: "resume-test", match_result: {
    Technical_Skills_Check: { match_score: 85, matched_critical_skills: [{ skill: "React" }], missing_critical_skills: [{ skill: "SQL" }] },
    Soft_Skills_Check: { match_score: 72 },
    Match_Penalties: { penalties: [{ suggestion_id: "sql", category: "technical_skills", target: "SQL", fix_type: "auto", severity: "important", penalty: -4, message: "SQL is missing" }] },
  } } },
};
describe("detailed report views", () => {
  it("keeps the original breakdown and puts the compact suggestions table in Recommendations", () => {
    render(<AnalysisContent {...props}/>);
    expect(screen.getByText("Hard Skills")).toBeTruthy();
    expect(screen.queryByRole("columnheader", {name: "Recommendation"})).toBeNull();
    fireEvent.click(screen.getByRole("button", {name: "Recommendations"}));
    expect(screen.getByRole("columnheader", {name: "Recommendation"})).toBeTruthy();
    expect(screen.getByRole("button", {name: "Apply Fix"})).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", {name: "Filter recommendations"}), {target: {value: "high"}});
    expect(screen.getByText("No recommendations at this priority.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", {name: "Breakdown"}));
    expect(screen.getByText("Hard Skills")).toBeTruthy();
  });
  it("shows real keywords and supports preview zoom and comparison", () => {
    render(<AnalysisContent {...props}/>);
    fireEvent.click(screen.getByRole("button", {name: "Keywords"}));
    expect(screen.getByRole("heading", {name: "Matched Keywords"})).toBeTruthy();
    expect(screen.getByText("SQL")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", {name: "Zoom in"}));
    expect(screen.getByLabelText("Preview zoom").textContent).toBe("110%");
    fireEvent.click(screen.getByRole("button", {name: "Compare Side by Side"}));
    expect(screen.getByRole("button", {name: "Close Comparison"})).toBeTruthy();
    expect(screen.getByText("Resume document")).toBeTruthy();
    expect(screen.getByText(/A role requiring/)).toBeTruthy();
    expect(screen.getByRole("region", {name: "Job description comparison"})).toBeTruthy();
    expect(screen.queryByRole("complementary", {name: "Job match score, suggestions and actionable fixes"})).toBeNull();
    fireEvent.click(screen.getByRole("button", {name: "Zoom in job description"}));
    expect(screen.getByLabelText("Job description zoom").textContent).toBe("110%");
    fireEvent.click(screen.getByRole("button", {name: "Close Comparison"}));
    expect(screen.queryByRole("region", {name: "Job description comparison"})).toBeNull();
    expect(screen.getByRole("heading", {name: "Matched Keywords"})).toBeTruthy();
  });
});


