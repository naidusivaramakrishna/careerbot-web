import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  token: "share-token-123",
  getSharedReport: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ token: mocks.token }),
}));

vi.mock("@/api/mockInterviewApi", () => ({
  getSharedReport: mocks.getSharedReport,
}));

const importSharedReportPage = async () => (await import("@/app/(interview)/mock-interview/shared-report/[token]/page")).default;

function report(overrides = {}) {
  return {
    report_id: "report-1",
    session_id: "session-1",
    user_id: "private-user",
    type: "live_hr",
    overall_score: 8.6,
    scores: { overall: 8.6, communication: 8.2, confidence: 8.9 },
    answers: [
      {
        question_text: "Tell me about a time you led a project.",
        score: 8,
        feedback: "Clear ownership and structure.",
        key_points_hit: 3,
        key_points_total: 4,
        transcript: "Private transcript text",
        duration_s: 75,
        filler_count: 1,
      },
    ],
    recommendations: ["Add metrics."],
    pressure_tag: null,
    grade: "A",
    performance_summary: "Strong live interview performance.",
    strengths: ["Structured responses"],
    improvement_areas: ["Quantify outcomes"],
    created_at: "2026-07-17T09:00:00Z",
    duration_min: 18,
    question_count: 6,
    action_plan: ["Practice impact statements."],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.token = "share-token-123";
  mocks.getSharedReport.mockResolvedValue(report());
});

describe("SharedReportPage", () => {
  it("loads a shared report by token and renders anonymous report content", async () => {
    const SharedReportPage = await importSharedReportPage();
    render(<SharedReportPage />);

    expect(screen.getByText(/loading shared report/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Hr Mock Interview Report")).toBeInTheDocument());

    expect(mocks.getSharedReport).toHaveBeenCalledWith("share-token-123");
    // Older 0-10 report: 8.6 is 86 out of 100, matching the /report page.
    expect(screen.getByText("86")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
    expect(screen.getByText("Communication")).toBeInTheDocument();
    expect(screen.getByText("82/100")).toBeInTheDocument();
    expect(screen.getByText("Grade: A")).toBeInTheDocument();
    expect(screen.getByText("Strong live interview performance.")).toBeInTheDocument();
    expect(screen.getByText("Structured responses")).toBeInTheDocument();
    expect(screen.getByText("Quantify outcomes")).toBeInTheDocument();
    expect(screen.getByText("Tell me about a time you led a project.")).toBeInTheDocument();

    expect(screen.queryByText("private-user")).not.toBeInTheDocument();
    expect(screen.queryByText("Private transcript text")).not.toBeInTheDocument();
  });

  it("shows expired or invalid link state", async () => {
    mocks.getSharedReport.mockRejectedValue(new Error("expired"));

    const SharedReportPage = await importSharedReportPage();
    render(<SharedReportPage />);

    await waitFor(() => expect(screen.getByText("Report Not Found")).toBeInTheDocument());
    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByText(/share links expire after 7 days/i)).toBeInTheDocument();
  });

  it("handles reports with empty optional sections", async () => {
    mocks.getSharedReport.mockResolvedValue(report({
      overall_score: 6.2,
      scores: { overall: 6.2 },
      answers: [],
      strengths: [],
      improvement_areas: [],
      grade: null,
      performance_summary: "",
      question_count: 0,
    }));

    const SharedReportPage = await importSharedReportPage();
    render(<SharedReportPage />);

    await waitFor(() => expect(screen.getByText("62")).toBeInTheDocument());
    expect(screen.queryByText("Score Breakdown")).not.toBeInTheDocument();
    expect(screen.queryByText("Question Breakdown")).not.toBeInTheDocument();
    expect(screen.queryByText(/Grade:/)).not.toBeInTheDocument();
  });

  describe("live realtime report shape", () => {
    const liveReport = (overrides = {}) => ({
      report_id: "r1",
      session_id: "s1",
      user_id: "private-user",
      type: "live_hr",
      overall_score: 21.6,
      scores: { hr_score: 21.6, communication_score: 30.0, confidence_score: 22.0 },
      answers: [
        { question_id: "q1", question_text: "Tell me about yourself.", score: 1.73, note: "Lacked detail and connection to the role." },
      ],
      pressure_tag: null,
      score_source: "openai_realtime_text/turn_timeout",
      grade: "D",
      performance_summary: "Significant areas for improvement.",
      created_at: "2026-09-24T08:25:45.713000",
      ...overrides,
    });

    it("shows the overall score and category scores out of 100, not '21.6/10' with an overflowing bar", async () => {
      mocks.getSharedReport.mockResolvedValue(liveReport());
      const SharedReportPage = await importSharedReportPage();
      render(<SharedReportPage />);

      await waitFor(() => expect(screen.getByText("Hr Mock Interview Report")).toBeInTheDocument());
      expect(screen.getByText("22")).toBeInTheDocument();
      expect(screen.getByText("/ 100")).toBeInTheDocument();
      // The old, wrong displays for this payload.
      expect(screen.queryByText("21.6")).not.toBeInTheDocument();
      expect(screen.queryByText("21.6/10")).not.toBeInTheDocument();
      expect(screen.queryByText("/ 10")).not.toBeInTheDocument();

      const hr = screen.getByText("HR readiness").closest("div")!.parentElement!;
      expect(within(hr).getByText("22/100")).toBeInTheDocument();
      // The bar width is the score, never above 100%.
      expect((hr.querySelector('div[style]') as HTMLElement).style.width).toBe("22%");
      expect(screen.getByText("30/100")).toBeInTheDocument();
    });

    it("prefers the report-level competency scores (0-10) and scales them once", async () => {
      mocks.getSharedReport.mockResolvedValue(liveReport({ competency_scores: { communication: 3.7, confidence_articulation: 2.3 } }));
      const SharedReportPage = await importSharedReportPage();
      render(<SharedReportPage />);

      await waitFor(() => expect(screen.getByText("Communication")).toBeInTheDocument());
      expect(screen.getByText("37/100")).toBeInTheDocument();
      expect(screen.getByText("Confidence articulation")).toBeInTheDocument();
      expect(screen.getByText("23/100")).toBeInTheDocument();
    });

    it("keeps a low 0-100 score low (8 stays 8, not 80)", async () => {
      mocks.getSharedReport.mockResolvedValue(liveReport({ overall_score: 8, scores: { hr_score: 8 } }));
      const SharedReportPage = await importSharedReportPage();
      render(<SharedReportPage />);

      await waitFor(() => expect(screen.getByText("Hr Mock Interview Report")).toBeInTheDocument());
      expect(screen.getAllByText("8").length).toBeGreaterThan(0);
      expect(screen.queryByText("80")).not.toBeInTheDocument();
      expect(screen.getByText("8/100")).toBeInTheDocument();
    });

    it("shows the answer's note as feedback and no empty 'Key points: /' line", async () => {
      mocks.getSharedReport.mockResolvedValue(liveReport());
      const SharedReportPage = await importSharedReportPage();
      render(<SharedReportPage />);

      await waitFor(() => expect(screen.getByText("Lacked detail and connection to the role.")).toBeInTheDocument());
      expect(screen.getByText("1.7/10")).toBeInTheDocument();
      expect(screen.queryByText(/Key points/)).not.toBeInTheDocument();
    });
  });

  it("still shows key points and feedback for older reports, and keeps unrecognised score keys", async () => {
    mocks.getSharedReport.mockResolvedValue(report({ scores: { overall: 8.6, english: 7 } }));
    const SharedReportPage = await importSharedReportPage();
    render(<SharedReportPage />);

    await waitFor(() => expect(screen.getByText("Clear ownership and structure.")).toBeInTheDocument());
    expect(screen.getByText("Key points: 3/4")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("70/100")).toBeInTheDocument();
  });
});
