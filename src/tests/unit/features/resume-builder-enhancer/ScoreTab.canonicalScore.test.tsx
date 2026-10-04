/**
 * Regression test for the builder (non-enhanced) score panel.
 *
 * PreviewPanel, rather than this conditionally mounted tab, marks a score stale
 * when resume data changes. A freshly calculated server score remains ready
 * until the user edits the resume.
 */
import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ScoreProvider, useScore } from "@/app/(resume)/builder/creation/_context/ScoreContext";
import ScoreTab from "@/app/(resume)/builder/creation/_components/score/ScoreTab";

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: () => ({
    resumeData: {},
    resumeId: "builder-1",
    resumeSource: "builder",
    completionStatus: {},
    enhancedAtsScore: null,
    enhancedSuggestions: [],
    applyAutoFix: vi.fn(),
    undoFix: vi.fn(),
  }),
}));

vi.mock("@/app/(resume)/builder/creation/_hooks/useResumeScorePreview", () => ({
  useResumeScorePreview: () => ({ score: 30, band: "weak", suggestions: [] }),
}));

type ScoreApi = ReturnType<typeof useScore>;
let scoreApi: ScoreApi;
const Grab = () => {
  scoreApi = useScore();
  return null;
};

const renderPanel = () =>
  render(
    <ScoreProvider>
      <Grab />
      <ScoreTab />
    </ScoreProvider>,
  );

describe("ScoreTab — canonical builder score display", () => {
  it("shows the server score once it is calculated, not the live preview", async () => {
    renderPanel();

    // Before any calculation the preview is the only number available.
    expect(screen.getByText("Preview Score")).toBeInTheDocument();

    await act(async () => { scoreApi.setCanonicalScore(88, "1 Jan 2026, 10:00"); });

    expect(scoreApi.canonicalStatus).toBe("ready");
    expect(screen.getByText("ATS Score")).toBeInTheDocument();
    expect(screen.getByText("1 Jan 2026, 10:00")).toBeInTheDocument();
    expect(screen.queryByText("Preview Score")).not.toBeInTheDocument();
    expect(screen.queryByText(/Score may be outdated/)).not.toBeInTheDocument();
  });

  it("falls back to the preview score while no server score exists", async () => {
    renderPanel();

    await act(async () => { scoreApi.setCanonicalStatus("error"); });

    expect(screen.getByText("Preview Score")).toBeInTheDocument();
    expect(screen.queryByText("ATS Score")).not.toBeInTheDocument();
  });
});
