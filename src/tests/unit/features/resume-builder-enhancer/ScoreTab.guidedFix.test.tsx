import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
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

  it("keeps the spotlight for its full time after a second click, and leaves no timer behind on unmount", () => {
    vi.useFakeTimers();
    try {
      resumeState.enhancedSuggestions = [
        { id: "p1", section: "Projects", message: "Quantify your project impact", fix_type: "manual", status: "pending" },
      ];
      const { unmount } = render(<ScoreTab />);
      const next = screen.getByRole("button", { name: /Next best fix · Projects/ });
      const card = () => document.getElementById("ats-fix-p1")!;

      fireEvent.click(next);
      act(() => { vi.advanceTimersByTime(2000); });
      fireEvent.click(next); // the first click's 2.6 s timer must not end this spotlight early
      act(() => { vi.advanceTimersByTime(1000); });
      expect(card().className).toContain("ring-2");
      act(() => { vi.advanceTimersByTime(1700); });
      expect(card().className).not.toContain("ring-2");

      fireEvent.click(next);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
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
