/**
 * /prep/notes (moved from /notes/generate). Notes that already exist can be
 * generated again (Regenerate, same request as "Generate My Notes"), and the
 * experience level is sent as one of the levels the interview-prep contract
 * accepts: fresher, mid or senior.
 */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ generateNotes: vi.fn(), getNotes: vi.fn(), updateNotes: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/api/interviewPrepApi", () => api);
vi.mock("@/api/resumeApi", () => ({
  getAllResumesUnified: vi.fn().mockResolvedValue({ builder_resumes: [], enhanced_resumes: [{ id: "r1", display_name: "My resume" }] }),
}));
vi.mock("@/api/enhancerApi", () => ({ parseResumeForEnhancer: vi.fn() }));
vi.mock("@/app/(interview)/mock-interview/_context/MockInterviewContext", () => ({
  useMockInterview: () => ({ setNotesGenerated: vi.fn(), progressLoading: false }),
}));

import NotesPage from "@/app/(interview)/prep/notes/page";

// The page is large and renders several async steps; on a loaded CI runner a
// render alone has taken longer than the 5 s default (web #213, 2026-10-14).
const WAIT = { timeout: 10_000 } as const;

const savedNotes = { notes: { self_introduction: { script: "I am a developer." }, hr_answers: [] } };

describe("Prep notes page", { timeout: 30_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem("current_resume_id", "r1");
    api.generateNotes.mockResolvedValue(savedNotes);
  });

  it("offers Regenerate once notes exist, and sends the same request as Generate", async () => {
    api.getNotes.mockResolvedValue(savedNotes);
    render(<NotesPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Regenerate/ }, WAIT));

    await waitFor(() => expect(api.generateNotes).toHaveBeenCalledTimes(1), WAIT);
    expect(api.generateNotes).toHaveBeenCalledWith({ resume_id: "r1", target_role: undefined, experience_level: "fresher" });
  });

  it("says so when Regenerate fails, and keeps the notes it had", async () => {
    api.getNotes.mockResolvedValue(savedNotes);
    api.generateNotes.mockRejectedValue(new Error("502"));
    render(<NotesPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Regenerate/ }, WAIT));

    expect(await screen.findByRole("alert", {}, WAIT)).toHaveTextContent("Failed to generate notes. Please try again.");
    expect(screen.getByRole("button", { name: /Regenerate/ })).toBeTruthy();
  });

  it("shows Generate My Notes, not Regenerate, before any notes exist", async () => {
    api.getNotes.mockResolvedValue({ notes: {} });
    render(<NotesPage />);

    expect(await screen.findByRole("button", { name: /Generate My Notes/ }, WAIT)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Regenerate/ })).toBeNull();
  });

  it.each([
    ["Fresher", "fresher"],
    ["Mid", "mid"],
    ["Senior", "senior"],
  ])("sends the %s level as %s", async (label, sent) => {
    api.getNotes.mockResolvedValue({ notes: {} });
    render(<NotesPage />);

    fireEvent.click(await screen.findByRole("button", { name: label }, WAIT));
    fireEvent.click(screen.getByRole("button", { name: /Generate My Notes/ }));

    await waitFor(() => expect(api.generateNotes).toHaveBeenCalledWith(expect.objectContaining({ experience_level: sent })), WAIT);
  });
});
