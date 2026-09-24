import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getLiveHistory: vi.fn(),
  getReport: vi.fn(),
  userId: "user-123" as string | null,
  userProgress: null as any,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/api/mockInterviewApi", () => ({
  getLiveHistory: mocks.getLiveHistory,
  getReport: mocks.getReport,
}));

vi.mock("@/app/(interview)/mock-interview/_context/MockInterviewContext", () => ({
  useMockInterview: () => ({
    userId: mocks.userId,
    userProgress: mocks.userProgress,
  }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div data-testid="line-chart" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

const importHistoryPage = async () => (await import("@/app/(interview)/mock-interview/history/page")).default;

function liveSession(overrides: Record<string, unknown> = {}) {
  return {
    session_id: "session-1",
    type: "live_hr",
    status: "completed",
    created_at: "2026-07-17T09:00:00Z",
    duration_s: 1260,
    question_count: 6,
    score: null, // /live/history always returns null — known backend gap
    pressure_tag: null,
    ...overrides,
  };
}

function report(overrides: Record<string, unknown> = {}) {
  return {
    report_id: "report-1",
    session_id: "session-1",
    user_id: "user-123",
    type: "live_hr",
    overall_score: 84,
    scores: { overall: 8.4 },
    answers: [],
    pressure_tag: null,
    created_at: "2026-07-17T09:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.userId = "user-123";
  mocks.userProgress = {
    total_sessions: 9,
    practice_rounds: 3,
    live_sessions: 6,
    avg_score: 8.2,
    score_trend: [7.2, 8.2],
    last_activity: "2026-07-17T09:00:00Z",
  };
  mocks.getLiveHistory.mockResolvedValue({ sessions: [liveSession()] });
  mocks.getReport.mockResolvedValue(report());
});

describe("MockInterview HistoryPage", () => {
  it("loads sessions, filters out practice sessions, and resolves the score per row from the report", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [
        liveSession({ session_id: "session-1", type: "live_hr" }),
        liveSession({ session_id: "session-2", type: "practice_hr" }),
      ],
    });
    mocks.getReport.mockResolvedValue(report({ session_id: "session-1", overall_score: 84 }));

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    expect(screen.getByText(/loading sessions/i)).toBeInTheDocument();

    // Score badge starts in the loading state until GET /report/{id} resolves.
    await waitFor(() => expect(screen.getByText("HR Mock Interview")).toBeInTheDocument());
    expect(screen.getByText("…/100")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("84/100")).toBeInTheDocument());
    expect(mocks.getReport).toHaveBeenCalledWith("session-1");
    expect(mocks.getReport).not.toHaveBeenCalledWith("session-2");

    // Practice sessions are excluded from the list entirely, not shown differently.
    expect(screen.queryByText(/practice/i)).not.toBeInTheDocument();

    expect(screen.getByText("6 questions")).toBeInTheDocument();
    expect(screen.getByText("21 min")).toBeInTheDocument();

    // The row is a div[role="button"] (not a real <button>) so a nested
    // retry control can be accessible without invalid button-in-button markup.
    fireEvent.click(screen.getByText("HR Mock Interview").closest('[role="button"]')!);
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/report/session-1");
  });

  it("shows pressure tag and 'Questions pending' when question_count is missing", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [liveSession({ question_count: undefined, pressure_tag: "pressure_affected" })],
    });

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText("Questions pending")).toBeInTheDocument());
    expect(screen.getByText("Pressure affected")).toBeInTheDocument();
  });

  it("computes stats from resolved scores only, not the userProgress total", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [
        liveSession({ session_id: "session-1" }),
        liveSession({ session_id: "session-2", created_at: "2026-07-16T09:00:00Z" }),
      ],
    });
    mocks.getReport.mockImplementation((id: string) =>
      Promise.resolve(report({ session_id: id, overall_score: id === "session-1" ? 84 : 60 }))
    );

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    // Total Sessions comes from userProgress.live_sessions (6), not the raw session count.
    await waitFor(() => expect(screen.getByText("84/100")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("60/100")).toBeInTheDocument());

    // The label sits in an inner flex row; the value is a sibling of that
    // row, one level up in the outer stat card.
    const totalSessionsCard = screen.getByText("Total Sessions").closest("div")!.parentElement!;
    expect(within(totalSessionsCard).getByText("6")).toBeInTheDocument();

    // Avg of 84 and 60 = 72; best = 84.
    const avgCard = screen.getByText("Avg Score").closest("div")!.parentElement!;
    expect(within(avgCard).getByText("72")).toBeInTheDocument();
    const bestCard = screen.getByText("Best Score").closest("div")!.parentElement!;
    expect(within(bestCard).getByText("84")).toBeInTheDocument();
  });

  it("excludes a row whose report fetch fails from the score badge and the stats/chart, instead of scoring it 0", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [
        liveSession({ session_id: "session-1" }),
        liveSession({ session_id: "session-2", created_at: "2026-07-16T09:00:00Z" }),
      ],
    });
    mocks.getReport.mockImplementation((id: string) =>
      id === "session-1"
        ? Promise.resolve(report({ session_id: id, overall_score: 84 }))
        : Promise.reject(new Error("rate limited"))
    );

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText("84/100")).toBeInTheDocument());
    // The failed row must never render as a real (and lowest-tier-styled) score.
    expect(screen.queryByText("0/100")).not.toBeInTheDocument();
    expect(await screen.findByText("—/100")).toBeInTheDocument();

    // A single successful score (84) must not be dragged down by the failed
    // row's placeholder — avg and best both stay at 84, not (84+0)/2 = 42.
    const avgCard = screen.getByText("Avg Score").closest("div")!.parentElement!;
    expect(within(avgCard).getByText("84")).toBeInTheDocument();
    const bestCard = screen.getByText("Best Score").closest("div")!.parentElement!;
    expect(within(bestCard).getByText("84")).toBeInTheDocument();
  });

  it("retries a single failed row's score without navigating to its report or re-fetching the whole list", async () => {
    mocks.getLiveHistory.mockResolvedValue({ sessions: [liveSession({ session_id: "session-1" })] });
    mocks.getReport
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockResolvedValueOnce(report({ session_id: "session-1", overall_score: 84 }));

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    const retryButton = await screen.findByRole("button", { name: /^retry$/i });
    fireEvent.click(retryButton);

    // Clicking Retry must not also trigger the row's own click handler
    // (view report) via event bubbling.
    expect(mocks.push).not.toHaveBeenCalled();

    await waitFor(() => expect(screen.getByText("84/100")).toBeInTheDocument());
    expect(mocks.getLiveHistory).toHaveBeenCalledTimes(1);
    expect(mocks.getReport).toHaveBeenCalledTimes(2);

    const avgCard = screen.getByText("Avg Score").closest("div")!.parentElement!;
    expect(within(avgCard).getByText("84")).toBeInTheDocument();
  });

  it("shows API failure state and recovers through retry", async () => {
    mocks.getLiveHistory
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce({ sessions: [liveSession({ session_id: "retry-session" })] });
    mocks.getReport.mockResolvedValue(report({ session_id: "retry-session", overall_score: 79 }));

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText(/could not load session history/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByText("79/100")).toBeInTheDocument());
    expect(mocks.getLiveHistory).toHaveBeenCalledTimes(2);
  });

  it("shows the empty state when there are no live sessions", async () => {
    mocks.getLiveHistory.mockResolvedValue({ sessions: [] });

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText("No live interview sessions found.")).toBeInTheDocument());
  });

  it("paginates when there are more than 10 sessions", async () => {
    const sessions = Array.from({ length: 12 }, (_, i) =>
      liveSession({ session_id: `session-${i + 1}`, created_at: `2026-07-${(i % 28) + 1}T09:00:00Z` })
    );
    mocks.getLiveHistory.mockResolvedValue({ sessions });
    mocks.getReport.mockImplementation((id: string) => Promise.resolve(report({ session_id: id, overall_score: 50 })));

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument());
    expect(screen.getAllByText("HR Mock Interview")).toHaveLength(10);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    await waitFor(() => expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument());
    expect(screen.getAllByText("HR Mock Interview")).toHaveLength(2);
  });

  it("does not render the removed back, export, or filter controls", async () => {
    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText("84/100")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /^back$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export my data/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^mock$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^all$/i })).not.toBeInTheDocument();
  });
});
