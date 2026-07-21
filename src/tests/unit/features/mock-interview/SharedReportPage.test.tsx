import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByText("8.6")).toBeInTheDocument();
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

    await waitFor(() => expect(screen.getByText("6.2")).toBeInTheDocument());
    expect(screen.queryByText("Score Breakdown")).not.toBeInTheDocument();
    expect(screen.queryByText("Question Breakdown")).not.toBeInTheDocument();
    expect(screen.queryByText(/Grade:/)).not.toBeInTheDocument();
  });
});
