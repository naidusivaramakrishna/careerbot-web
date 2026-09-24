import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  LineChart: ({ children, data }: { children: React.ReactNode; data?: { score: number }[] }) => (
    <div data-testid="progress-chart" data-scores={JSON.stringify((data ?? []).map((d) => d.score))}>{children}</div>
  ),
  Line: () => <div data-testid="line-chart" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

const importHistoryPage = async () => (await import("@/app/(interview)/mock-interview/history/page")).default;

// GET /live/history: finished sessions have score: null (known backend gap);
// sessions that never finished have score: 0.0. Neither is a real score.
function liveSession(overrides: Record<string, unknown> = {}) {
  return {
    session_id: "session-1",
    type: "live_hr",
    status: "completed",
    created_at: "2026-07-17T09:00:00Z",
    duration_s: 1260,
    question_count: 6,
    score: null,
    pressure_tag: null,
    ...overrides,
  };
}

function unfinishedSession(overrides: Record<string, unknown> = {}) {
  return liveSession({ status: "active", score: 0.0, duration_s: null, question_count: undefined, ...overrides });
}

function report(overrides: Record<string, unknown> = {}) {
  return {
    report_id: "report-1",
    session_id: "session-1",
    user_id: "user-123",
    type: "live_hr",
    overall_score: 84,
    // Live realtime reports carry *_score keys and score_source; overall_score is 0-100.
    scores: { hr_score: 84 },
    score_source: "openai_realtime_text/turn_timeout",
    answers: Array.from({ length: 6 }, (_, i) => ({ question_text: `Q${i + 1}`, score: 8 })),
    duration_seconds: 1260,
    pressure_tag: null,
    created_at: "2026-07-17T09:00:00Z",
    ...overrides,
  };
}

// The row is a div[role="button"]; scope queries to it because the score also
// appears in the summary panel.
const sessionRow = (index = 0) => screen.getAllByText(/Mock Interview$/)[index].closest('[role="button"]') as HTMLElement;
const statCard = (label: string) => screen.getByText(label).closest("div")!.parentElement!;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
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

afterEach(() => {
  vi.useRealTimers();
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
    expect(within(sessionRow()).getByText("…/100")).toBeInTheDocument();

    await waitFor(() => expect(within(sessionRow()).getByText("84/100")).toBeInTheDocument());
    expect(mocks.getReport).toHaveBeenCalledWith("session-1");
    expect(mocks.getReport).not.toHaveBeenCalledWith("session-2");

    // Practice sessions are excluded from the list entirely.
    expect(screen.queryByText(/practice/i)).not.toBeInTheDocument();

    expect(within(sessionRow()).getByText("6 questions")).toBeInTheDocument();
    expect(within(sessionRow()).getByText("21 min")).toBeInTheDocument();

    fireEvent.click(sessionRow());
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/report/session-1");
  });

  it("takes duration and question count from the report when the list does not send them", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [liveSession({ duration_s: null, question_count: undefined })],
    });
    mocks.getReport.mockResolvedValue(report({ duration_seconds: 906.1, answers: [{ score: 2 }, { score: 3 }, { score: 4 }] }));

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    // No fabricated "0 min" while the report is loading.
    await waitFor(() => expect(screen.getByText("HR Mock Interview")).toBeInTheDocument());
    expect(within(sessionRow()).queryByText(/0 min/)).not.toBeInTheDocument();

    await waitFor(() => expect(within(sessionRow()).getByText("15 min")).toBeInTheDocument());
    expect(within(sessionRow()).getByText("3 questions")).toBeInTheDocument();
  });

  it("shows pressure tag and 'Questions pending' when no question count is available", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [liveSession({ question_count: undefined, pressure_tag: "pressure_affected" })],
    });
    mocks.getReport.mockResolvedValue(report({ answers: undefined }));

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

    await waitFor(() => expect(within(sessionRow(0)).getByText("84/100")).toBeInTheDocument());
    await waitFor(() => expect(within(sessionRow(1)).getByText("60/100")).toBeInTheDocument());

    // Total Sessions comes from userProgress.live_sessions (6), not the raw session count.
    expect(within(statCard("Total Sessions")).getByText("6")).toBeInTheDocument();
    // Avg of 84 and 60 = 72; best = 84.
    expect(within(statCard("Avg Score")).getByText("72")).toBeInTheDocument();
    expect(within(statCard("Best Score")).getByText("84")).toBeInTheDocument();
  });

  it("lists only completed sessions, requests only their reports, and keeps unfinished ones out of the stats", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [
        liveSession({ session_id: "done-1" }),
        unfinishedSession({ session_id: "active-1", status: "active" }),
        unfinishedSession({ session_id: "abandoned-1", status: "abandoned" }),
        unfinishedSession({ session_id: "recovering-1", status: "recovering" }),
      ],
    });
    mocks.getReport.mockResolvedValue(report({ session_id: "done-1", overall_score: 40 }));

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(within(sessionRow(0)).getByText("40/100")).toBeInTheDocument());

    // Unfinished sessions have no report, so none is requested (they would fail).
    expect(mocks.getReport).toHaveBeenCalledTimes(1);
    expect(mocks.getReport).toHaveBeenCalledWith("done-1");

    // Unfinished sessions are not listed at all.
    expect(screen.getAllByText(/Mock Interview$/)).toHaveLength(1);
    expect(screen.queryByText("—/100")).not.toBeInTheDocument();

    // Only the one completed session feeds the figures; the counts are separate.
    expect(within(statCard("Avg Score")).getByText("40")).toBeInTheDocument();
    expect(within(statCard("Total Sessions")).getByText("1 completed")).toBeInTheDocument();
    expect(screen.getByText("Completed sessions").parentElement).toHaveTextContent("1");
  });

  it("shows an empty state, with a hint, when sessions exist but none has finished", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [unfinishedSession({ session_id: "active-1" }), unfinishedSession({ session_id: "abandoned-1", status: "abandoned" })],
    });

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    expect(await screen.findByText("No completed interview sessions found.")).toBeInTheDocument();
    expect(screen.getByText(/did not finish are not listed/i)).toBeInTheDocument();
    expect(mocks.getReport).not.toHaveBeenCalled();
  });

  it("includes completed sessions on other pages in the stats, loading them in batches under the report limit", async () => {
    vi.useFakeTimers();
    // 12 completed sessions (2 pages). Scores: session-1 = 10 ... session-12 = 120 is invalid,
    // so use 10,20,...,90 then 100,100,100 to keep within 0-100.
    const scores = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 100, 100];
    const sessions = scores.map((_, i) =>
      liveSession({ session_id: `session-${i + 1}`, created_at: `2026-07-${String(20 - i).padStart(2, "0")}T09:00:00Z` })
    );
    mocks.getLiveHistory.mockResolvedValue({ sessions });
    mocks.getReport.mockImplementation((id: string) =>
      Promise.resolve(report({ session_id: id, overall_score: scores[Number(id.split("-")[1]) - 1] }))
    );

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });

    // First batch: 8 requests (under the ~10/min limit), page 1 first.
    expect(mocks.getReport).toHaveBeenCalledTimes(8);
    expect(screen.getByRole("status")).toHaveTextContent(/loading scores for 4 completed sessions/i);

    // The remaining 4 (including the 2 that are only on page 2) load after the gap.
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(mocks.getReport).toHaveBeenCalledTimes(12);

    // Average of all 12 = 750 / 12 = 62.5 -> 63; best = 100. Page 2 rows were never opened.
    expect(within(statCard("Avg Score")).getByText("63")).toBeInTheDocument();
    expect(within(statCard("Best Score")).getByText("100")).toBeInTheDocument();
    expect(screen.getByText(/across 12 completed sessions/i)).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a low 0-100 score as sent (8/100), not multiplied into 80", async () => {
    mocks.getReport.mockResolvedValue(report({ overall_score: 8 }));

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(within(sessionRow()).getByText("8/100")).toBeInTheDocument());
    expect(within(sessionRow()).queryByText("80/100")).not.toBeInTheDocument();
    expect(within(statCard("Best Score")).getByText("8")).toBeInTheDocument();
  });

  it("reads scores remembered from an earlier visit without requesting them again", async () => {
    localStorage.setItem(
      "mock_interview_report_summaries_v1",
      JSON.stringify({ "session-1": { score: 77, duration_min: 12, question_count: 5 } })
    );

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(within(sessionRow()).getByText("77/100")).toBeInTheDocument());
    expect(within(sessionRow()).getByText("5 questions")).toBeInTheDocument();
    expect(mocks.getReport).not.toHaveBeenCalled();
  });

  it("remembers a fetched score on this device, and never remembers a failure", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      sessions: [liveSession({ session_id: "ok-1" }), liveSession({ session_id: "bad-1", created_at: "2026-07-16T09:00:00Z" })],
    });
    mocks.getReport.mockImplementation((id: string) =>
      id === "ok-1" ? Promise.resolve(report({ session_id: id, overall_score: 66 })) : Promise.reject(new Error("rate limited"))
    );

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);
    await waitFor(() => expect(within(sessionRow(1)).getByText("—/100")).toBeInTheDocument());

    const cache = JSON.parse(localStorage.getItem("mock_interview_report_summaries_v1") ?? "{}");
    expect(cache["ok-1"]).toMatchObject({ score: 66 });
    expect(cache["bad-1"]).toBeUndefined();
  });

  it("plots the score chart oldest to newest so it reads left to right over time", async () => {
    mocks.getLiveHistory.mockResolvedValue({
      // API order: newest first.
      sessions: [
        liveSession({ session_id: "new", created_at: "2026-07-19T09:00:00Z" }),
        liveSession({ session_id: "mid", created_at: "2026-07-18T09:00:00Z" }),
        liveSession({ session_id: "old", created_at: "2026-07-17T09:00:00Z" }),
      ],
    });
    const byId: Record<string, number> = { new: 70, mid: 50, old: 30 };
    mocks.getReport.mockImplementation((id: string) => Promise.resolve(report({ session_id: id, overall_score: byId[id] })));

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByTestId("progress-chart")).toHaveAttribute("data-scores", "[30,50,70]"));
    // "Latest change" compares the newest two scored sessions: 70 - 50.
    expect(screen.getByText("Latest change").parentElement).toHaveTextContent("+20");
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

    await waitFor(() => expect(within(sessionRow(0)).getByText("84/100")).toBeInTheDocument());
    await waitFor(() => expect(within(sessionRow(1)).getByText("—/100")).toBeInTheDocument());
    expect(screen.queryByText("0/100")).not.toBeInTheDocument();

    // A single successful score (84) must not be dragged down by the failed
    // row's placeholder: avg and best both stay at 84, not (84+0)/2 = 42.
    expect(within(statCard("Avg Score")).getByText("84")).toBeInTheDocument();
    expect(within(statCard("Best Score")).getByText("84")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/1 completed session could not be scored/i);
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

    // Clicking Retry must not also trigger the row's own click handler.
    expect(mocks.push).not.toHaveBeenCalled();

    await waitFor(() => expect(within(sessionRow()).getByText("84/100")).toBeInTheDocument());
    expect(mocks.getLiveHistory).toHaveBeenCalledTimes(1);
    expect(mocks.getReport).toHaveBeenCalledTimes(2);
    expect(within(statCard("Avg Score")).getByText("84")).toBeInTheDocument();
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
    await waitFor(() => expect(within(sessionRow()).getByText("79/100")).toBeInTheDocument());
    expect(mocks.getLiveHistory).toHaveBeenCalledTimes(2);
  });

  it("shows the empty state when there are no live sessions", async () => {
    mocks.getLiveHistory.mockResolvedValue({ sessions: [] });

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText("No completed interview sessions found.")).toBeInTheDocument());
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

    await waitFor(() => expect(within(sessionRow()).getByText("84/100")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /^back$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export my data/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^mock$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^all$/i })).not.toBeInTheDocument();
  });
});
