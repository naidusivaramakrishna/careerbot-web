import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScoreTab from "@/app/(resume)/builder/creation/_components/score/ScoreTab";

const { resumeState } = vi.hoisted(() => ({
  resumeState: {
    enhancedAtsScore: {
      final_score: 70,
      profile: "Professional",
      section_breakdown: {
        Keywords: { percentage: 97, weight: 15, deductions: [] },
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

const manual = [
  { id: "cloud", section: "Keywords", message: "if relevant, add cloud platforms and services (AWS/Azure/GCP)", fix_type: "manual", status: "pending" },
  { id: "cicd", section: "Keywords", message: "if relevant, include containerization and CI/CD tooling", fix_type: "manual", status: "pending" },
];
const children = ["Docker", "REST API", "AWS"].map((term) => ({
  id: term.toLowerCase().replace(/\W+/g, "-"),
  section: "Keywords",
  message: `Add '${term}' to Technical Skills`,
  fix_type: "auto",
  status: "pending",
}));
const bulk = {
  id: "fix-all",
  section: "Keywords",
  message: "Add all at once: 'Docker', 'REST API', 'AWS'",
  fix_type: "auto",
  status: "fixed",
  undoAvailable: true,
};

describe("ScoreTab enhancement progress counts", () => {
  it("counts every keyword covered by a fixed 'Add all at once' card", () => {
    resumeState.enhancedSuggestions = [...manual, ...children, bulk];
    render(<ScoreTab />);

    // 3 keywords fixed + 2 manual pending: only the 2 still open are counted
    // the Progress card counts the recommendations addressed (3 of 5), as a bar
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "ATS recommendations addressed" })).toHaveAttribute("aria-valuenow", "3");
    expect(screen.getByText("2 recommendations left. Each fix you confirm updates your ATS score.")).toBeInTheDocument();
    // the section's red badge counts only what is still left to fix
    expect(screen.getByRole("img", { name: "2 suggestions pending" })).toHaveTextContent("2");
  });

  it("does not count the pending bulk card on top of its own child cards", () => {
    resumeState.enhancedSuggestions = [...manual, ...children, { ...bulk, status: "pending", undoAvailable: false }];
    render(<ScoreTab />);

    // 3 child cards + 2 manual; the bulk card is a shortcut, not a 6th issue.
    expect(screen.getByRole("img", { name: "5 suggestions pending" })).toHaveTextContent("5");
  });

  it("overall progress equals the sum of the section lists it displays", () => {
    resumeState.enhancedSuggestions = [
      ...manual,
      ...children,
      bulk,
      // Its section is not in the score breakdown, so no section lists it.
      { id: "orphan", section: "Unlisted", message: "Orphan finding", fix_type: "manual", status: "pending" },
    ];
    render(<ScoreTab />);

    // the unlisted finding is counted nowhere (no badge of 3, and no card for it)
    expect(screen.getByRole("img", { name: "2 suggestions pending" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "3 suggestions pending" })).not.toBeInTheDocument();
    expect(screen.queryByText("Orphan finding")).not.toBeInTheDocument();
  });

  it("does not announce the score that is simply loading in as a gain", () => {
    const loaded = resumeState.enhancedAtsScore;
    resumeState.enhancedSuggestions = [...manual];
    (resumeState as { enhancedAtsScore: unknown }).enhancedAtsScore = null;
    const { rerender } = render(<ScoreTab />);

    (resumeState as { enhancedAtsScore: unknown }).enhancedAtsScore = loaded;
    rerender(<ScoreTab />);

    expect(screen.queryByRole("status")).toBeNull();
  });
});
