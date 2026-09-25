import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Overview from "@/app/(jobs)/jobmatch/_components/Overview";
import { getMatchAnalytics, getResume, matchResumeAndJD, parseResume } from "@/api/parserApi";
import { getExtensionSession } from "@/api/extensionApi";
import { writeJobmatchSessionSnapshot } from "@/utils/jobmatchSession";

vi.mock("@/api/parserApi", () => ({
  parseResume: vi.fn(), parseJDFile: vi.fn(), parseJDText: vi.fn(), parseJDUrl: vi.fn(),
  matchResumeAndJD: vi.fn(), getResume: vi.fn(), getMatchAnalytics: vi.fn(),
}));
vi.mock("@/api/extensionApi", () => ({ getExtensionSession: vi.fn() }));
vi.mock("@/utils/jobmatchSession", () => ({ writeJobmatchSessionSnapshot: vi.fn(() => true) }));
vi.mock("sonner", () => ({ toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
vi.mock("@/app/(jobs)/jobmatch/_components/analysis/MatchResultsOverview", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (p: any) => <div data-testid="results-overview"><button onClick={p.onDetails}>Open details</button></div>,
}));
vi.mock("@/app/(jobs)/jobmatch/_components/analysis/AnalysisContent", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (p: any) => <div data-testid="detailed-analysis"><button onClick={p.onBackToUpload}>Back from details</button></div>,
}));
vi.mock("@/app/(jobs)/jobmatch/_components/ui/LoadingAnimation", () => ({ default: () => <div>Analyzing</div> }));
vi.mock("@/app/(jobs)/jobmatch/_components/wizard/JobMatchStartCard", () => ({ default: () => <div>Start card</div> }));
vi.mock("@/components/ErrorPopupModal", () => ({ default: () => null }));

const REASON = "Needs 8+ years of experience";
const ineligible = { data: { match_id: "m1", match_result: { eligible: false, reason: REASON } }, match_id: "m1" };
const eligible = { data: { match_id: "m2", ats_score: 80, match_result: { eligible: true } }, match_id: "m2" };

// An extension session that carries a stored resume and a stored job description ID.
const session = (overrides: Record<string, unknown> = {}) =>
  ({ session_id: "s1", resume_id: "resume-old", jd_id: "jd-1", job_description: null, ...overrides }) as never;

beforeEach(() => {
  vi.mocked(getResume).mockResolvedValue({ file_name: "Resume.pdf" } as never);
  vi.mocked(getMatchAnalytics).mockResolvedValue(undefined as never);
  vi.mocked(getExtensionSession).mockResolvedValue(session());
  // Overview scrolls to the results; jsdom does not implement scrollTo.
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("Overview: extension session with a stored job description ID", () => {
  it("keeps Analyze Match enabled after a failed analysis, so it can be retried", async () => {
    vi.mocked(matchResumeAndJD).mockResolvedValue(ineligible as never);
    render(<Overview sessionId="s1" />);

    expect(await screen.findByText(REASON)).toBeTruthy();
    expect(matchResumeAndJD).toHaveBeenCalledTimes(1);
    const analyze = screen.getByRole("button", { name: /Analyze Match/ });
    expect(analyze).toBeEnabled();

    vi.mocked(matchResumeAndJD).mockResolvedValue(eligible as never);
    fireEvent.click(analyze);
    await waitFor(() => expect(matchResumeAndJD).toHaveBeenCalledTimes(2));
  });

  it("does not require 200 characters of text when the extension supplied a stored ID", async () => {
    vi.mocked(getExtensionSession).mockResolvedValue(session({ job_description: "Short JD" }));
    vi.mocked(matchResumeAndJD).mockResolvedValue(ineligible as never);
    render(<Overview sessionId="s1" />);

    await screen.findByText(REASON);
    expect(screen.getByRole("button", { name: /Analyze Match/ })).toBeEnabled();
  });
});

describe("Overview: eligibility", () => {
  it("shows the reason and returns to the Review step when the resume is not eligible", async () => {
    vi.mocked(matchResumeAndJD).mockResolvedValue(ineligible as never);
    render(<Overview sessionId="s1" />);

    expect(await screen.findByText(REASON)).toBeTruthy();
    expect(screen.getByText("Step 3 of 4")).toBeTruthy();
    expect(screen.queryByTestId("results-overview")).toBeNull();
    expect(writeJobmatchSessionSnapshot).not.toHaveBeenCalled();
  });
});

describe("Overview: results screens", () => {
  it("shows the results overview first, then the detailed analysis, and back again", async () => {
    vi.mocked(matchResumeAndJD).mockResolvedValue(eligible as never);
    render(<Overview sessionId="s1" />);

    expect(await screen.findByTestId("results-overview", undefined, { timeout: 4000 })).toBeTruthy();
    expect(writeJobmatchSessionSnapshot).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Open details" }));
    expect(screen.getByTestId("detailed-analysis")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back from details" }));
    expect(screen.getByTestId("results-overview")).toBeTruthy();
    expect(screen.queryByTestId("detailed-analysis")).toBeNull();
  });
});

describe("Overview: replacing the resume from an extension session", () => {
  it("analyzes the newly chosen file, not the resume stored in the session", async () => {
    vi.mocked(matchResumeAndJD).mockResolvedValue(ineligible as never);
    render(<Overview sessionId="s1" />);
    await screen.findByText(REASON);

    fireEvent.click(screen.getByRole("button", { name: "Replace" }));
    const file = new File(["resume"], "New.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Choose resume file"), { target: { files: [file] } });

    vi.mocked(parseResume).mockResolvedValue({ resume_id: "resume-new" } as never);
    vi.mocked(matchResumeAndJD).mockResolvedValue(eligible as never);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze Match/ }));

    await waitFor(() => expect(parseResume).toHaveBeenCalledWith(file));
    await waitFor(() => expect(matchResumeAndJD).toHaveBeenLastCalledWith("resume-new", "jd-1"));
  });
});
