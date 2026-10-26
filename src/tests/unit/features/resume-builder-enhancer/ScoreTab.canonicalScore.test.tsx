/**
 * Builder (non-enhanced) score panel.
 *
 * PreviewPanel, rather than this conditionally mounted tab, marks a score stale
 * when resume data changes. A freshly calculated server score remains ready
 * until the user edits the resume.
 *
 * The AI score is requested once the IMPORTANT sections are filled in (not after "any N sections"),
 * replaces the static preview score, and follows later edits section by section.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ScoreProvider, useScore } from "@/app/(resume)/builder/creation/_context/ScoreContext";
import ScoreTab from "@/app/(resume)/builder/creation/_components/score/ScoreTab";
import { getBuilderScore, triggerScoreCalculation } from "@/api/resumeApi";

const { resumeState } = vi.hoisted(() => ({ resumeState: { data: {} as Record<string, unknown> } }));

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: () => ({
    resumeData: resumeState.data,
    resumeId: "builder-1",
    resumeSource: "builder",
    completionStatus: {},
    enhancedAtsScore: null,
    enhancedSuggestions: [],
    applyAutoFix: vi.fn(),
    undoFix: vi.fn(),
  }),
}));

vi.mock("@/api/resumeApi", () => ({
  triggerScoreCalculation: vi.fn(),
  getBuilderScore: vi.fn(),
}));

vi.mock("@/app/(resume)/builder/creation/_hooks/useResumeScorePreview", () => ({
  useResumeScorePreview: () => ({
    score: 30,
    band: "weak",
    breakdown: {
      contact: 10, summary: 7, education: 15, skills: 6, evidence: 12, metrics: 5,
      certifications: 3, formatting: 5, achievements: 0, languages: 0, extras: 0,
    },
    suggestions: [
      { id: "skills-count", severity: "warning", message: "Add more skills (aim for 10+)", section: "Skills" },
      { id: "metrics-add", severity: "info", message: "Add quantified results (numbers, percentages) to achievements", section: "Experience" },
    ],
  }),
}));

const mockTrigger = vi.mocked(triggerScoreCalculation);
const mockGetScore = vi.mocked(getBuilderScore);

const COMPLETE_RESUME = {
  personalInfo: { fullname: "Asha Rao", email: "asha@example.com" },
  professionalSummary: { summary: "Backend developer with five years of experience building APIs." },
  education: [{ school: "IIT", degree: "B.Tech" }],
  categorizedSkills: { programming_languages: ["Python"] },
  workExperience: [{ company: "Acme", role: "Engineer" }],
  projects: [{ title: "Resume Parser" }],
  certifications: [{ name: "AWS Certified Solutions Architect" }],
};

type ScoreApi = ReturnType<typeof useScore>;
let scoreApi: ScoreApi;
const Grab = () => {
  scoreApi = useScore();
  return null;
};

const renderPanel = (onFixNow?: () => void) =>
  render(
    <ScoreProvider>
      <Grab />
      <ScoreTab onFixNow={onFixNow} />
    </ScoreProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  resumeState.data = {};
  mockTrigger.mockResolvedValue(undefined);
  mockGetScore.mockRejectedValue({ response: { status: 404 } });
});

describe("ScoreTab — canonical builder score display", () => {
  it("shows the server score once it is calculated, not the live preview", async () => {
    renderPanel();

    // Before any calculation the preview is the only number available.
    expect(screen.getByText("Preview Score")).toBeInTheDocument();

    await act(async () => { scoreApi.setCanonicalScore(88, "1 Jan 2026, 10:00"); });

    expect(scoreApi.canonicalStatus).toBe("ready");
    expect(screen.getByText("1 Jan 2026, 10:00")).toBeInTheDocument();
    expect(screen.queryByText("Preview Score")).not.toBeInTheDocument();
    expect(screen.queryByText(/Score may be outdated/)).not.toBeInTheDocument();
  });

  it("falls back to the preview score while no server score exists", async () => {
    renderPanel();

    await act(async () => { scoreApi.setCanonicalStatus("error"); });

    expect(screen.getByText("Preview Score")).toBeInTheDocument();
    expect(screen.queryByText(/ATS friendly/)).not.toBeInTheDocument();
  });
});

describe("ScoreTab — builder score layout", () => {
  it("shows the overall score, section breakdown from the real preview values and top improvements", () => {
    const onFixNow = vi.fn();
    renderPanel(onFixNow);

    expect(screen.getByText("Overall Resume Score")).toBeInTheDocument();
    expect(screen.getByText("Needs Work")).toBeInTheDocument();

    // breakdown percentages = points earned / points possible
    expect(screen.getByRole("progressbar", { name: "Contact Information" })).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("progressbar", { name: "Professional Summary" })).toHaveAttribute("aria-valuenow", "70");
    expect(screen.getByRole("progressbar", { name: "Work Experience" })).toHaveAttribute("aria-valuenow", "80");
    expect(screen.getByRole("progressbar", { name: "Skills" })).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByRole("progressbar", { name: "Certifications" })).toHaveAttribute("aria-valuenow", "60");

    // improvements come from the live suggestions and open the matching editor section
    expect(screen.getByText("Improvements")).toBeInTheDocument();
    // each section is a collapsed group with a red count of what is left; open them to reach the fix buttons
    expect(screen.queryByText("Dismiss")).not.toBeInTheDocument();
    for (const header of screen.getAllByRole("button", { expanded: false })) fireEvent.click(header);
    expect(screen.getAllByRole("img", { name: /suggestions? pending/ }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Add more skills/ }));
    expect(onFixNow).toHaveBeenCalledWith("Skills", undefined);
    fireEvent.click(screen.getByRole("button", { name: /Add quantified results/ }));
    expect(onFixNow).toHaveBeenCalledWith("Work Experience", undefined);
  });
});

describe("ScoreTab — when the AI score is requested", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("does not ask the AI while the core sections are missing, and says which ones", async () => {
    // plenty of filled sections, but none of the core 7
    resumeState.data = { hobbies: ["Reading"], interests: ["Chess"], languages: ["English"], awards: [{ title: "A" }] };
    renderPanel(vi.fn());
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(mockTrigger).not.toHaveBeenCalled();
    expect(screen.getByText("Preview Score")).toBeInTheDocument();
    expect(screen.getByText(/Add the remaining 7 core sections to unlock your ATS score/)).toBeInTheDocument();
    // the missing core sections are named, and each one opens in the editor
    for (const label of ["Personal Info", "Professional Summary", "Education", "Skills", "Work Experience", "Projects", "Certifications"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText("0/7")).toBeInTheDocument();
    // seven steps, none filled
    const steps = screen.getAllByTitle("0 of 7 sections complete");
    expect(steps).toHaveLength(7);
    for (const step of steps) expect(step).toHaveStyle({ background: "rgb(229, 231, 235)" });
  });

  it("shows how far along the 7 core sections are, and still does not ask the AI at 6 of 7", async () => {
    resumeState.data = { ...COMPLETE_RESUME, certifications: [] };
    const onFixNow = vi.fn();
    renderPanel(onFixNow);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(mockTrigger).not.toHaveBeenCalled();
    expect(screen.getByText("6/7")).toBeInTheDocument();
    // one section left: say which
    expect(screen.getByText(/One core section left: add/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Certifications" }));
    expect(onFixNow).toHaveBeenCalledWith("Certifications");
    // filled from the left by how many sections are complete (six), whichever section is the missing one
    const steps = screen.getAllByTitle("6 of 7 sections complete");
    expect(steps.map((step) => step.style.background)).toEqual([
      ...Array(6).fill("rgb(29, 79, 168)"),
      "rgb(229, 231, 235)",
    ]);
  });

  it("asks the AI once the 7 core sections are complete, then shows the AI score and each AI section", async () => {
    resumeState.data = COMPLETE_RESUME;
    mockGetScore.mockResolvedValue({
      resume_id: "builder-1", score: 76, calculated_at: "", status: "completed",
      section_breakdown: {
        personalInfo: { score: 65, max_pts: 5 },
        professionalSummary: { score: 60, max_pts: 8 },
        workExperience: { score: 85, max_pts: 29 },
        skills: { score: 58.9, max_pts: 16 },
        atsCompatibility: { score: 85, max_pts: 4 },
      },
    });
    renderPanel();
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });

    expect(mockTrigger).toHaveBeenCalledTimes(1);
    expect(scoreApi.canonicalScore).toBe(76);
    expect(scoreApi.canonicalStatus).toBe("ready");
    expect(screen.queryByText("Preview Score")).not.toBeInTheDocument();

    // per-section rows are the AI's own scores, only for the sections it scored
    expect(screen.getByRole("progressbar", { name: "Contact Information" })).toHaveAttribute("aria-valuenow", "65");
    expect(screen.getByRole("progressbar", { name: "Skills" })).toHaveAttribute("aria-valuenow", "59");
    expect(screen.getByRole("progressbar", { name: "ATS Compatibility" })).toHaveAttribute("aria-valuenow", "85");
    expect(screen.queryByRole("progressbar", { name: "Certifications" })).not.toBeInTheDocument();
  });

  it("keeps the static score and lists what the server still needs when it refuses (422)", async () => {
    resumeState.data = COMPLETE_RESUME;
    mockTrigger.mockRejectedValue({
      response: { status: 422, data: { completeness: { missing_required_fields: ["skills", "personal_info.email"] } } },
    });
    renderPanel();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    expect(scoreApi.canonicalStatus).toBe("not_calculated");
    expect(screen.getByText("Preview Score")).toBeInTheDocument();
    expect(screen.getByText("Still needed: Skills and your email.")).toBeInTheDocument();
  });

  it("waits for the new score instead of accepting the old one while the score is out of date", async () => {
    resumeState.data = COMPLETE_RESUME;
    // the server keeps returning the OLD score (status stale) until the new one is stored
    mockGetScore
      .mockResolvedValueOnce({ resume_id: "builder-1", score: 70, calculated_at: "", status: "stale", section_breakdown: null })
      .mockResolvedValueOnce({ resume_id: "builder-1", score: 70, calculated_at: "", status: "stale", section_breakdown: null })
      .mockResolvedValue({ resume_id: "builder-1", score: 82, calculated_at: "", status: "completed", section_breakdown: { skills: { score: 90 } } });
    renderPanel();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });

    // 1st poll (stale 70) and 2nd poll (stale 70) are not accepted; the 3rd (completed 82) is
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    expect(scoreApi.canonicalScore).not.toBe(70);
    await act(async () => { await vi.advanceTimersByTimeAsync(6100); });
    expect(scoreApi.canonicalScore).toBe(82);
    expect(screen.getByRole("progressbar", { name: "Skills" })).toHaveAttribute("aria-valuenow", "90");
  });

  it("recalculates on its own after the score goes stale and the edits settle", async () => {
    resumeState.data = COMPLETE_RESUME;
    mockGetScore.mockResolvedValue({ resume_id: "builder-1", score: 76, calculated_at: "", status: "completed", section_breakdown: { skills: { score: 59 } } });
    renderPanel();
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    expect(mockTrigger).toHaveBeenCalledTimes(1);

    // the user adds a section: PreviewPanel marks the score stale
    await act(async () => { scoreApi.markScoreStale(); });
    expect(screen.getByText(/Score may be outdated/)).toBeInTheDocument();

    await act(async () => { await vi.advanceTimersByTimeAsync(7000); });
    expect(mockTrigger).toHaveBeenCalledTimes(1); // still settling

    await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
    expect(mockTrigger).toHaveBeenCalledTimes(2);
  });

  it("does not recalculate a stale score while the important sections are incomplete", async () => {
    resumeState.data = { hobbies: ["Reading"] };
    renderPanel();
    await act(async () => { scoreApi.setCanonicalScore(60); scoreApi.markScoreStale(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(20000); });

    expect(mockTrigger).not.toHaveBeenCalled();
  });
});
