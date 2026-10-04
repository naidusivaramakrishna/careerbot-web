/**
 * Regression test for a real report: entering only the (optional) Target
 * Role in the Professional Summary editor updated the live preview
 * immediately, without clicking Save and while Summary (the field marked
 * required, "*") was still empty.
 *
 * Root cause: ProfessionalSummary.tsx wrote Target Role/Summary straight
 * into the shared ResumeContext on every keystroke, and the live preview
 * reads that SAME context -- so it reflected every keystroke instantly,
 * independent of Save or autosave timing. Fixed by keeping a local draft
 * until Summary has real content, then committing both fields into the
 * shared context (which the preview observes) from that point on.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/lib/http", () => ({ default: {}, httpClient: {} }));
vi.mock("@/lib/tracing", () => ({
  logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn(), api: { request: vi.fn() } },
}));
vi.mock("@/api/resumeApi", () => ({
  getResumeById: vi.fn(),
  getDefaultTemplate: vi.fn(async () => ({ template_id: "modern_blue" })),
}));
vi.mock("@/api/enhancerApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/enhancerApi")>()),
  getEnhancedResume: vi.fn(),
}));
vi.mock("@/app/(resume)/templates/_utils/sectionOrder", () => ({
  getSectionOrder: vi.fn(() => ["Personal Info", "Professional Summary"]),
}));

import { ResumeProvider, useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { getEnhancedResume } from "@/api/enhancerApi";
import ProfessionalSummary from "@/app/(resume)/builder/creation/_components/editor/sections/ProfessionalSummary";

type Ctx = ReturnType<typeof useResume>;
let latest: Ctx;
const Consumer = () => {
  latest = useResume();
  return (
    <>
      <p>Name: {latest.resumeData.personalInfo.fullname || "empty"}</p>
      <ProfessionalSummary />
    </>
  );
};

describe("ProfessionalSummary — no live preview update from Target Role alone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(getEnhancedResume).mockResolvedValue({
      id: "enhanced-1",
      enhanced_data: {
        personalInfo: { fullname: "Bhavana", email: "bhavana@example.com" },
        professionalSummary: { summary: "", targetRole: "" },
      },
    } as never);
  });

  it("does not commit Target Role into the shared context (what the preview reads) until Summary has content", async () => {
    render(
      <ResumeProvider resumeId="enhanced-1" source="enhanced">
        <Consumer />
      </ResumeProvider>,
    );
    await screen.findByText("Name: Bhavana");

    const roleInput = screen.getByPlaceholderText("e.g., Frontend Developer, Data Analyst");
    await act(async () => {
      fireEvent.change(roleInput, { target: { value: "AI Engineer" } });
    });

    // The input itself shows what was typed...
    expect(roleInput).toHaveValue("AI Engineer");
    // ...but the shared context (and so the live preview) must NOT yet.
    expect(latest.resumeData.professionalSummary.targetRole).toBe("");
    expect(latest.resumeData.professionalSummary.summary).toBe("");

    // Now the user fills in Summary (the actually-required field).
    const summaryBox = document.querySelector('[contenteditable="true"]') as HTMLElement;
    expect(summaryBox).toBeTruthy();
    await act(async () => {
      summaryBox.innerHTML = "AI Engineer with 3 years of experience.";
      fireEvent.input(summaryBox);
    });

    await waitFor(() => {
      expect(latest.resumeData.professionalSummary.summary).toBe("AI Engineer with 3 years of experience.");
    });
    // Once Summary has content, Target Role commits too.
    expect(latest.resumeData.professionalSummary.targetRole).toBe("AI Engineer");
  });
});
