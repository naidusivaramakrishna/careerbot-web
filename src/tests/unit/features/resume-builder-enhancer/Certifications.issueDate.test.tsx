/**
 * P1 regression: mounting the Certifications editor must not wipe issue dates.
 *
 * resumeMappers fills `issueDate` from issueDate || year || date, but `year`
 * only from `year`. A certification that reaches the editor with just an
 * `issueDate` therefore got `year: ""` in local state, and the effect that
 * mirrors editor state back into context wrote `issueDate: entry.year` --
 * i.e. "" -- which the next enhanced autosave then sent to the server.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Certifications from "@/app/(resume)/builder/creation/_components/editor/sections/Certifications";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { useValidation } from "@/app/(resume)/builder/creation/_hooks/useValidation";

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: vi.fn(),
}));
vi.mock("@/app/(resume)/builder/creation/_hooks/useValidation", () => ({
  useValidation: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock("@/api/resumeApi", () => ({ deleteResumeSectionItem: vi.fn() }));
vi.mock("@/api/enhancerApi", () => ({ deleteSectionItemFromEnhancedResume: vi.fn() }));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock("@/app/(resume)/builder/creation/_components/editor/SectionTipsPanel", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/editor/MonthYearPicker", () => ({ default: () => null }));

const mockedUseResume = vi.mocked(useResume);
const mockedUseValidation = vi.mocked(useValidation);

function mountWith(certifications: Array<Record<string, unknown>>) {
  const setResumeData = vi.fn();
  mockedUseResume.mockReturnValue({
    resumeData: { certifications },
    setResumeData,
    resumeSource: "enhanced",
  } as never);
  mockedUseValidation.mockReturnValue({
    errors: {}, validateField: vi.fn(), validateSection: vi.fn(), clearError: vi.fn(),
  } as never);
  render(<Certifications />);
  return setResumeData;
}

// The effect calls setResumeData(prev => next); apply every updater to the
// same starting state and return the last certifications array it produced.
function lastCertifications(setResumeData: ReturnType<typeof vi.fn>, initial: Array<Record<string, unknown>>) {
  let state: { certifications: Array<Record<string, unknown>> } = { certifications: initial };
  for (const [arg] of setResumeData.mock.calls) {
    if (typeof arg === "function") state = arg(state);
  }
  return state.certifications;
}

describe("Certifications keeps issue dates that arrive as issueDate only", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("current_resume_id", "resume-123");
  });

  it("does not blank issueDate when the certification has no `year`", () => {
    const initial = [{ id: "cert-1", name: "AWS SAA", issuer: "Amazon", issueDate: "2022-05" }];
    const result = lastCertifications(mountWith(initial), initial);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "cert-1", issuer: "Amazon", issueDate: "2022-05" });
  });

  it("still uses `year` when that is what the certification carries", () => {
    const initial = [{ id: "cert-2", name: "PMP", issuedBy: "PMI", year: "2021" }];
    const result = lastCertifications(mountWith(initial), initial);

    expect(result[0]).toMatchObject({ id: "cert-2", issuer: "PMI", issueDate: "2021" });
  });
});
