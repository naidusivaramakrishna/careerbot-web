/**
 * Regression test for the builder (non-enhanced) score panel.
 *
 * ScoreTab marks a freshly calculated canonical score stale on the very next
 * commit: its first effect runs on [resumeData, canonicalScore, canonicalStatus]
 * and calls markScoreStale() as soon as canonicalStatus becomes "ready" with a
 * non-null score. "ready" therefore only ever survives a single render, and
 * "stale" is the steady state for every server-calculated score.
 *
 * So the panel MUST keep rendering the canonical server score while the status
 * is "stale" (with the existing "Score may be outdated / Recalculate" pill as
 * the signal), otherwise the result of the Calculate ATS Score flow is never
 * visible at all and the user only ever sees the client-side preview number.
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

    // ScoreTab's own effect has already flipped this to "stale" by now.
    expect(scoreApi.canonicalStatus).toBe("stale");
    expect(screen.getByText("ATS Score")).toBeInTheDocument();
    expect(screen.getByText("1 Jan 2026, 10:00")).toBeInTheDocument();
    expect(screen.queryByText("Preview Score")).not.toBeInTheDocument();
    // The stale pill stays, so the user is still told to recalculate.
    expect(screen.getByText(/Score may be outdated/)).toBeInTheDocument();
  });

  it("falls back to the preview score while no server score exists", async () => {
    renderPanel();

    await act(async () => { scoreApi.setCanonicalStatus("error"); });

    expect(screen.getByText("Preview Score")).toBeInTheDocument();
    expect(screen.queryByText("ATS Score")).not.toBeInTheDocument();
  });
});
