import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScoreTab from "@/app/(resume)/builder/creation/_components/score/ScoreTab";

const { resumeState } = vi.hoisted(() => ({
  resumeState: {
    enhancedAtsScore: {
      final_score: 50,
      profile: "Professional",
      section_breakdown: {
        Skills: { percentage: 80, weight: 15, deductions: [] },
        Projects: { percentage: 20, weight: 15, deductions: [] },
      },
    } as Record<string, unknown>,
    enhancedSuggestions: [] as Array<Record<string, unknown>>,
    applyAutoFix: vi.fn(),
    undoFix: vi.fn(),
    resumeData: {},
    resumeId: "enhanced-1",
    resumeSource: "enhanced",
    completionStatus: {},
  },
}));

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: () => resumeState,
}));
vi.mock("@/app/(resume)/builder/creation/_context/ScoreContext", () => ({
  useScore: () => ({
    canonicalScore: null,
    canonicalStatus: "not_calculated",
    lastCalculatedAt: null,
    setCanonicalScore: vi.fn(),
    setCanonicalStatus: vi.fn(),
    markScoreStale: vi.fn(),
  }),
}));
vi.mock("@/app/(resume)/builder/creation/_hooks/useResumeScorePreview", () => ({
  useResumeScorePreview: () => ({ score: 0, band: "weak", suggestions: [] }),
}));

describe("ScoreTab guided fixing", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("Next best fix targets the weakest section and expands it", () => {
    resumeState.enhancedSuggestions = [
      { id: "s1", section: "Skills", message: "Add Docker to Skills", fix_type: "manual", status: "pending" },
      { id: "p1", section: "Projects", message: "Quantify your project impact", fix_type: "manual", status: "pending" },
    ];
    render(<ScoreTab />);

    const next = screen.getByRole("button", { name: /Next best fix · Projects/ });
    expect(next).toHaveTextContent("Quantify your project impact");

    fireEvent.click(next);
    expect(screen.getByRole("button", { name: "Collapse Projects ATS recommendations" })).toBeInTheDocument();
    expect(document.getElementById("ats-fix-p1")).not.toBeNull();
  });

  it("shows a +pts chip on a card once its fix raises the score, and removes it on Undo", () => {
    resumeState.enhancedSuggestions = [
      { id: "s1", section: "Skills", message: "Add Docker to Skills", fix_type: "auto", status: "pending" },
    ];
    const { rerender } = render(<ScoreTab />);
    fireEvent.click(screen.getByRole("button", { name: "Expand Skills ATS recommendations" }));

    resumeState.enhancedAtsScore = { ...resumeState.enhancedAtsScore, final_score: 54 };
    resumeState.enhancedSuggestions = [
      { id: "s1", section: "Skills", message: "Add Docker to Skills", fix_type: "auto", status: "fixed", undoAvailable: true },
    ];
    rerender(<ScoreTab />);

    expect(screen.getByText("+4 pts")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("+4");

    resumeState.enhancedSuggestions = [
      { id: "s1", section: "Skills", message: "Add Docker to Skills", fix_type: "auto", status: "pending" },
    ];
    rerender(<ScoreTab />);
    expect(screen.queryByText("+4 pts")).not.toBeInTheDocument();
  });

  it("shows an all-done banner instead of Next best fix when nothing is pending", () => {
    resumeState.enhancedAtsScore = { ...resumeState.enhancedAtsScore, final_score: 60 };
    resumeState.enhancedSuggestions = [
      { id: "s1", section: "Skills", message: "Add Docker to Skills", fix_type: "auto", status: "fixed" },
    ];
    render(<ScoreTab />);
    expect(screen.queryByRole("button", { name: /Next best fix/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("All recommendations addressed").length).toBeGreaterThan(0);
  });
});
