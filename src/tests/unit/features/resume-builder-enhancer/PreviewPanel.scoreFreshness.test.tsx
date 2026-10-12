import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { selectPreviewScore } from "@/app/(resume)/builder/creation/_components/PreviewPanel";
import { ScoreProvider, useScore } from "@/app/(resume)/builder/creation/_context/ScoreContext";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("PreviewPanel score freshness", () => {
  it("uses the canonical score consistently while it is stale", () => {
    expect(selectPreviewScore(31, 88, "stale")).toBe(88);
    expect(selectPreviewScore(31, 88, "ready")).toBe(88);
  });

  it("marks a cached score stale rather than treating it as a fresh server score", async () => {
    localStorage.setItem("current_resume_id", "resume-1");
    localStorage.setItem("resume_score_resume-1", JSON.stringify({
      score: 88,
      calculatedAt: Date.now() - 60_000,
    }));

    let score!: ReturnType<typeof useScore>;
    const GrabScore = () => {
      score = useScore();
      return null;
    };

    render(<ScoreProvider><GrabScore /></ScoreProvider>);
    await act(async () => {});

    expect(score.canonicalScore).toBe(88);
    expect(score.canonicalStatus).toBe("stale");
  });
});
