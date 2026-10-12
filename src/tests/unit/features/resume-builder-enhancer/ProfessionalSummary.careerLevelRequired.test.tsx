/**
 * Regression test for a requested workflow change: Career Level (Fresher /
 * Experienced) must have NO default selection -- both toggle buttons start
 * inactive -- and, since AI Writer's prompt materially differs by level
 * (years of experience, metrics, tone), generating suggestions must require
 * an explicit choice, the same way it already requires Target Role.
 * Previously careerLevel defaulted to "experienced", so a user who never
 * touched the toggle silently got that prompt without ever choosing it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockGenerateSuggestions = vi.fn();

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
vi.mock("@/app/(resume)/builder/creation/_hooks/useAISuggestions", () => ({
  useAISuggestions: () => ({
    loadingIndex: null,
    suggestions: {},
    activePopup: null,
    setActivePopup: vi.fn(),
    generateSuggestions: mockGenerateSuggestions,
  }),
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

describe("ProfessionalSummary — Career Level has no default and is required for AI Writer", () => {
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
    // jsdom doesn't implement Element.scrollTo -- handleAIWriterClick calls
    // it to scroll the Summary box into view on a successful AI Writer
    // click, unrelated to what these tests are checking.
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
  });

  it("renders neither Fresher nor Experienced as active by default", async () => {
    render(
      <ResumeProvider resumeId="enhanced-1" source="enhanced">
        <Consumer />
      </ResumeProvider>,
    );
    await screen.findByText("Name: Bhavana");

    const fresherBtn = screen.getByRole("button", { name: "Fresher" });
    const experiencedBtn = screen.getByRole("button", { name: "Experienced" });

    // Neither toggle carries the active ("selected") style class.
    expect(fresherBtn.className).not.toContain("bg-[#2557a7]");
    expect(experiencedBtn.className).not.toContain("bg-[#2557a7]");
  });

  it("blocks AI Writer and shows a hint when Career Level is not selected, even with a Target Role filled in", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: /AI Writer/ }));

    expect(mockGenerateSuggestions).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/select a career level/i)).toBeInTheDocument();
    });
  });

  it("allows AI Writer once both Target Role and Career Level are set", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Experienced" }));
    fireEvent.click(screen.getByRole("button", { name: /AI Writer/ }));

    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(1);
    const [, prompt] = mockGenerateSuggestions.mock.calls[0];
    expect(prompt).toContain("EXPERIENCED professional");
  });

  it("reflects Fresher in the generated prompt when that level is selected", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Fresher" }));
    fireEvent.click(screen.getByRole("button", { name: /AI Writer/ }));

    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(1);
    const [, prompt] = mockGenerateSuggestions.mock.calls[0];
    expect(prompt).toContain("FRESHER or RECENT GRADUATE");
  });
});
