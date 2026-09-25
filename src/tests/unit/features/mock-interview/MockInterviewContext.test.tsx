import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  recoverSession: vi.fn(),
  getUserProgress: vi.fn(),
  getNotes: vi.fn(),
  logger: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock("@/api/userApi", () => ({
  getProfile: mocks.getProfile,
}));

vi.mock("@/api/mockInterviewApi", () => ({
  recoverSession: mocks.recoverSession,
  getUserProgress: mocks.getUserProgress,
}));

vi.mock("@/api/interviewPrepApi", () => ({
  getNotes: mocks.getNotes,
}));

vi.mock("@/lib/logger", () => ({
  default: mocks.logger,
}));

const importContext = async () => await import("@/app/(interview)/mock-interview/_context/MockInterviewContext");

function progress(overrides = {}) {
  return {
    total_sessions: 7,
    practice_rounds: 2,
    live_sessions: 1,
    avg_score: 7.4,
    score_trend: [6.5, 7.4],
    last_activity: "2026-07-17T09:00:00Z",
    ...overrides,
  };
}

function Consumer({ useMockInterview }: { useMockInterview: () => any }) {
  const {
    stageState,
    userId,
    activeSession,
    progressLoading,
    setNotesGenerated,
    setEnglishRead,
    setPracticeAnswered,
    setPracticeTotal,
    setReadinessPassed,
    dismissActiveSession,
  } = useMockInterview();

  return (
    <div>
      <p>User: {userId ?? "none"}</p>
      <p>Loading: {String(progressLoading)}</p>
      <p>Active: {activeSession?.session_id ?? "none"}</p>
      <p>Notes: {String(stageState.notes_generated)}</p>
      <p>English: {String(stageState.english_read)}</p>
      <p>Practice: {stageState.practice_answered}/{stageState.practice_total}</p>
      <p>Readiness: {String(stageState.readiness_passed)}</p>
      <p>History: {stageState.history_count}</p>
      <button onClick={() => setNotesGenerated(true)}>set notes</button>
      <button onClick={() => setEnglishRead(true)}>set english</button>
      <button onClick={() => setPracticeAnswered(4)}>set answered</button>
      <button onClick={() => setPracticeTotal(6)}>set total</button>
      <button onClick={() => setReadinessPassed(true)}>set readiness</button>
      <button onClick={dismissActiveSession}>dismiss</button>
    </div>
  );
}

async function renderProvider() {
  const { MockInterviewProvider, useMockInterview } = await importContext();
  return render(
    <MockInterviewProvider>
      <Consumer useMockInterview={useMockInterview} />
    </MockInterviewProvider>
  );
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getProfile.mockResolvedValue({ id: "user-123" });
  mocks.recoverSession.mockResolvedValue({ active_session: null });
  mocks.getUserProgress.mockResolvedValue(progress());
  mocks.getNotes.mockRejectedValue(new Error("no notes"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MockInterviewContext", () => {
  it("bootstraps user, notes, active practice progress, and history without gating live interview", async () => {
    mocks.recoverSession.mockResolvedValue({
      active_session: {
        session_id: "practice-session-1",
        type: "hr_practice",
        status: "in_progress",
        last_activity: "2026-07-17T09:00:00Z",
        questions_remaining: 4,
      },
    });
    mocks.getNotes.mockResolvedValue({
      resume_id: "resume-1",
      target_role: "Frontend Developer",
      notes: { self_introduction: "Hello" },
      updated_at: "2026-07-17T09:00:00Z",
      source: "ai",
    });
    // getNotes is gated on a resume id in localStorage, not the user id —
    // the bootstrap effect skips the call entirely without one.
    localStorage.setItem("current_resume_id", "resume-1");

    await renderProvider();

    await waitFor(() => expect(screen.getByText("User: user-123")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("Notes: true")).toBeInTheDocument());
    expect(screen.getByText("Active: practice-session-1")).toBeInTheDocument();
    expect(screen.getByText("Practice: 6/10")).toBeInTheDocument();
    expect(screen.getByText("History: 7")).toBeInTheDocument();
    expect(screen.getByText("Loading: false")).toBeInTheDocument();
    expect(mocks.getNotes).toHaveBeenCalledWith("resume-1");

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.getByText("Active: none")).toBeInTheDocument();
  });

  it("keeps practice optional when only a live session exists", async () => {
    mocks.recoverSession.mockResolvedValue({
      active_session: {
        session_id: "live-session-1",
        type: "live_hr",
        status: "in_progress",
        last_activity: "2026-07-17T09:00:00Z",
        questions_remaining: 5,
      },
    });
    mocks.getUserProgress.mockResolvedValue(progress({ total_sessions: 1, practice_rounds: 0, live_sessions: 1 }));

    await renderProvider();

    await waitFor(() => expect(screen.getByText("Active: live-session-1")).toBeInTheDocument());
    expect(screen.getByText("Practice: 0/0")).toBeInTheDocument();
    expect(screen.getByText("History: 1")).toBeInTheDocument();
  });

  it("exposes setter functions for local stage state", async () => {
    await renderProvider();
    await waitFor(() => expect(screen.getByText("Loading: false")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /set notes/i }));
    fireEvent.click(screen.getByRole("button", { name: /set english/i }));
    fireEvent.click(screen.getByRole("button", { name: /set answered/i }));
    fireEvent.click(screen.getByRole("button", { name: /set total/i }));
    fireEvent.click(screen.getByRole("button", { name: /set readiness/i }));

    expect(screen.getByText("Notes: true")).toBeInTheDocument();
    expect(screen.getByText("English: true")).toBeInTheDocument();
    expect(screen.getByText("Practice: 4/6")).toBeInTheDocument();
    expect(screen.getByText("Readiness: true")).toBeInTheDocument();
  });

  it("falls back safely when bootstrap APIs fail", async () => {
    mocks.getProfile.mockRejectedValue(new Error("profile down"));
    mocks.recoverSession.mockRejectedValue(new Error("session down"));
    mocks.getUserProgress.mockRejectedValue(new Error("progress down"));

    await renderProvider();

    await waitFor(() => expect(screen.getByText("Loading: false")).toBeInTheDocument());
    expect(screen.getByText("User: none")).toBeInTheDocument();
    expect(screen.getByText("Active: none")).toBeInTheDocument();
    expect(screen.getByText("Practice: 0/0")).toBeInTheDocument();
    expect(screen.getByText("History: 0")).toBeInTheDocument();
    expect(mocks.getNotes).not.toHaveBeenCalled();
  });

  it("throws a clear error when used outside the provider", async () => {
    const { useMockInterview } = await importContext();
    const Broken = () => {
      useMockInterview();
      return null;
    };

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Broken />)).toThrow("useMockInterview must be used inside MockInterviewProvider");
    consoleError.mockRestore();
  });
});
