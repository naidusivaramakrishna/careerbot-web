import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const { mockPush, mockGetEnhanced } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetEnhanced: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("source=enhanced"),
  useParams: () => ({ resumeId: "enhanced-5" }),
}));

vi.mock("@/api/enhancerApi", () => ({
  getEnhancedResume: mockGetEnhanced,
}));

import { toast } from "sonner";
import Header from "@/app/(resume)/builder/creation/_components/Header";

describe("Resume Enhancer header — Use for Cover Letter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows the heading and the cover letter button on the Enhancer page", () => {
    render(<Header />);
    expect(screen.getByRole("heading", { name: "Resume Builder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use for Cover Letter/i })).toBeInTheDocument();
  });

  it("opens the cover letter page with the upload the enhanced resume was made from", async () => {
    mockGetEnhanced.mockResolvedValue({ id: "enhanced-5", original_resume_id: "parsed-9" });
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: /Use for Cover Letter/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(mockGetEnhanced).toHaveBeenCalledWith("enhanced-5");
    expect(mockPush).toHaveBeenCalledWith("/cover-letter/new?resume_id=parsed-9&resume_source=parser");
  });

  it("explains instead of navigating when the original upload cannot be found", async () => {
    mockGetEnhanced.mockResolvedValue({ id: "enhanced-5" });
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: /Use for Cover Letter/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Use for Cover Letter/i })).toBeEnabled();
  });

  it("does the same when the record cannot be loaded", async () => {
    mockGetEnhanced.mockRejectedValue(new Error("boom"));
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: /Use for Cover Letter/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("hands over with the same query names the cover letter page reads", () => {
    // Header builds ?resume_id=<id>&resume_source=parser; the cover letter page must read exactly those.
    const page = readFileSync(path.resolve(process.cwd(), "src/app/cover-letter/new/page.tsx"), "utf8");
    expect(page).toContain('searchParams.get("resume_id")');
    expect(page).toContain('searchParams.get("resume_source")');
    expect(page).toMatch(/requestedResumeSourceParam === "builder" \|\| requestedResumeSourceParam === "parser"/);
  });
});
