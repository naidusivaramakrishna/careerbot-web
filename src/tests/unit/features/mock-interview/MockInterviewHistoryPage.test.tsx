import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getLiveHistory: vi.fn(),
  exportUserData: vi.fn(),
  userId: "user-123" as string | null,
  userProgress: {
    total_sessions: 9,
    practice_rounds: 3,
    live_sessions: 6,
    avg_score: 8.2,
    score_trend: [7.2, 8.2],
    last_activity: "2026-07-17T09:00:00Z",
  } as any,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/api/mockInterviewApi", () => ({
  getLiveHistory: mocks.getLiveHistory,
  exportUserData: mocks.exportUserData,
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

function liveSession(overrides = {}) {
  return {
    session_id: "session-1",
    type: "live_hr",
    status: "completed",
    created_at: "2026-07-17T09:00:00Z",
    duration_s: 1260,
    question_count: 6,
    score: 8.4,
    pressure_tag: null,
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
  mocks.getLiveHistory.mockResolvedValue({
    sessions: [
      liveSession(),
      liveSession({ session_id: "session-2", type: "practice_hr", score: 6.1, question_count: undefined, pressure_tag: "pressure_affected" }),
    ],
  });
  mocks.exportUserData.mockResolvedValue({ exported_at: "2026-07-17T09:00:00Z", sessions: [] });
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:mock-history") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

describe("MockInterview HistoryPage", () => {
  it("loads sessions, renders mapped stats, filters mock sessions, and opens reports", async () => {
    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    expect(screen.getByText(/loading sessions/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("84/100")).toBeInTheDocument());

    expect(screen.getByText("Session History")).toBeInTheDocument();
    expect(screen.getAllByText("9").length).toBeGreaterThan(0);
    expect(screen.getByText("/ 100 across sessions")).toBeInTheDocument();
    expect(screen.getAllByText("21 min").length).toBeGreaterThan(0);
    expect(screen.getByText("6 questions")).toBeInTheDocument();
    expect(screen.getByText("Questions pending")).toBeInTheDocument();
    expect(screen.getByText("Pressure affected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Mock$/i }));
    expect(screen.queryByText("Practice Session")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mock interview mock/i }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview/report/session-1");
  });

  it("shows API failure state and recovers through retry", async () => {
    mocks.getLiveHistory.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce({
      sessions: [liveSession({ session_id: "retry-session", score: 7.9 })],
    });

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText(/could not load session history/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByText("79/100")).toBeInTheDocument());
    expect(mocks.getLiveHistory).toHaveBeenCalledTimes(2);
  });

  it("handles empty history and disabled export without a user id", async () => {
    mocks.userId = null;
    mocks.userProgress = null;
    mocks.getLiveHistory.mockResolvedValue({ sessions: [] });

    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    await waitFor(() => expect(screen.getByText(/no all sessions found/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /export my data/i })).toBeDisabled();
  });

  it("exports user data and surfaces export failures", async () => {
    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);
    await waitFor(() => expect(screen.getByText("84/100")).toBeInTheDocument());

    const originalCreateElement = document.createElement.bind(document);
    const linkClick = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);
      if (tagName.toLowerCase() === "a") {
        Object.defineProperty(element, "click", { configurable: true, value: linkClick });
      }
      return element;
    });

    fireEvent.click(screen.getByRole("button", { name: /export my data/i }));
    await waitFor(() => expect(mocks.exportUserData).toHaveBeenCalledWith("user-123"));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-history");

    mocks.exportUserData.mockRejectedValueOnce(new Error("export failed"));
    fireEvent.click(screen.getByRole("button", { name: /export my data/i }));
    await waitFor(() => expect(screen.getByText(/export failed/i)).toBeInTheDocument());
  });

  it("navigates back to the mock interview entry page", async () => {
    const HistoryPage = await importHistoryPage();
    render(<HistoryPage />);

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(mocks.push).toHaveBeenCalledWith("/mock-interview");
  });
});
