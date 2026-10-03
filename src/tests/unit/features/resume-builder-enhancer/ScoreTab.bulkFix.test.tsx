import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScoreTab from "@/app/(resume)/builder/creation/_components/score/ScoreTab";

const { resumeState } = vi.hoisted(() => ({
  resumeState: {
    enhancedAtsScore: {
      final_score: 70,
      profile: "Professional",
      section_breakdown: {
        Skills: { percentage: 60, weight: 15, deductions: [] },
      },
    },
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

const children = [
  { id: "kubernetes", section: "Skills", message: "Add 'Kubernetes' to Technical Skills", fix_type: "auto", status: "pending" },
  { id: "docker", section: "Skills", message: "Add 'Docker' to Technical Skills", fix_type: "auto", status: "pending" },
  { id: "aws", section: "Skills", message: "Add 'AWS' to Technical Skills", fix_type: "auto", status: "pending" },
];

describe("ScoreTab grouped Fix All suggestions", () => {
  it("hides covered child cards after Fix All and restores them after Undo state", () => {
    const bulk = {
      id: "fix-all",
      section: "Skills",
      message: "Add all at once: 'Kubernetes', 'Docker', 'AWS'",
      fix_type: "auto",
      status: "fixed",
      undoAvailable: true,
    };
    resumeState.enhancedSuggestions = [
      { id: "manual", section: "Skills", message: "Add cloud platform experience", fix_type: "manual", status: "pending" },
      ...children,
      bulk,
    ];

    const { rerender } = render(<ScoreTab />);
    fireEvent.click(screen.getByRole("button", { name: "Expand Skills ATS recommendations" }));

    expect(screen.getByText("Add cloud platform experience")).toBeInTheDocument();
    expect(screen.getByText(bulk.message)).toBeInTheDocument();
    expect(screen.queryByText(children[0].message)).not.toBeInTheDocument();
    expect(screen.queryByText(children[1].message)).not.toBeInTheDocument();
    expect(screen.queryByText(children[2].message)).not.toBeInTheDocument();

    resumeState.enhancedSuggestions = [...children, { ...bulk, status: "pending", undoAvailable: false }];
    rerender(<ScoreTab />);

    expect(screen.getByText(children[0].message)).toBeInTheDocument();
    expect(screen.getByText(children[1].message)).toBeInTheDocument();
    expect(screen.getByText(children[2].message)).toBeInTheDocument();
  });
});
