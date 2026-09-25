import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Overview from "@/app/(jobs)/jobmatch/_components/Overview";
import { getMatchAnalytics, getResume, matchResumeAndJD, parseJDFile, parseJDText, parseResume } from "@/api/parserApi";
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

describe("Overview: editing the job description after an extension session", () => {
  const NEW_JD = "We are hiring a backend engineer to own our payments platform. ".repeat(5);

  it("analyzes the edited job description, not the stored one", async () => {
    vi.mocked(matchResumeAndJD).mockResolvedValue(ineligible as never);
    render(<Overview sessionId="s1" />);
    await screen.findByText(REASON);
    expect(matchResumeAndJD).toHaveBeenLastCalledWith("resume-old", "jd-1");

    fireEvent.click(screen.getByRole("button", { name: "Edit job description" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Job description" }), { target: { value: NEW_JD } });

    vi.mocked(parseJDText).mockResolvedValue({ jd_id: "jd-new" } as never);
    vi.mocked(matchResumeAndJD).mockResolvedValue(eligible as never);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: /Analyze Match/ }));

    await waitFor(() => expect(parseJDText).toHaveBeenCalledWith(NEW_JD.trim()));
    await waitFor(() => expect(matchResumeAndJD).toHaveBeenLastCalledWith("resume-old", "jd-new"));
  });

  it("does not let the user continue with a job description they emptied", async () => {
    vi.mocked(getExtensionSession).mockResolvedValue(session({ job_description: "Short JD" }));
    vi.mocked(matchResumeAndJD).mockResolvedValue(ineligible as never);
    render(<Overview sessionId="s1" />);
    await screen.findByText(REASON);

    fireEvent.click(screen.getByRole("button", { name: "Edit job description" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Job description" }), { target: { value: "" } });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
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

// Generous waits: these go through a full analysis run and flake with the 1 s default on a loaded machine.
const SLOW = { timeout: 5000 };
const TEST_TIMEOUT = 20000;

describe("Overview: replacing the job description with a file after an extension session", () => {
  it("analyzes the uploaded file, not the stored job description ID", async () => {
    vi.mocked(matchResumeAndJD).mockResolvedValue(ineligible as never);
    render(<Overview sessionId="s1" />);
    await screen.findByText(REASON, undefined, SLOW);
    expect(matchResumeAndJD).toHaveBeenLastCalledWith("resume-old", "jd-1");

    fireEvent.click(screen.getByRole("button", { name: "Edit job description" }));
    vi.mocked(parseJDFile).mockResolvedValue({ jd_id: "jd-file", jd_text: "Parsed JD text" } as never);
    const file = new File(["%PDF"], "New JD.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Choose job description file"), { target: { files: [file] } });
    await waitFor(() => expect(parseJDFile).toHaveBeenCalledWith(file), SLOW);

    vi.mocked(matchResumeAndJD).mockResolvedValue(eligible as never);
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }, SLOW));
    fireEvent.click(screen.getByRole("button", { name: /Analyze Match/ }));

    await waitFor(() => expect(matchResumeAndJD).toHaveBeenLastCalledWith("resume-old", "jd-file"), SLOW);
  }, TEST_TIMEOUT);
});

describe("Overview: the wizard during analysis", () => {
  it("stays open on Escape and backdrop clicks while the match is running", async () => {
    vi.mocked(matchResumeAndJD).mockReturnValue(new Promise(() => {}) as never); // never settles
    render(<Overview sessionId="s1" />);

    const dialog = await screen.findByRole("dialog", undefined, SLOW);
    await waitFor(() => expect(matchResumeAndJD).toHaveBeenCalled(), SLOW);
    expect(screen.getByText("Step 4 of 4")).toBeTruthy();

    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent.click(dialog.parentElement!); // the backdrop

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Step 4 of 4")).toBeTruthy();
    expect(screen.getByText("Analyzing")).toBeTruthy();
  }, TEST_TIMEOUT);
});
