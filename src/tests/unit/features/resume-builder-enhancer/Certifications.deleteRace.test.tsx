/**
 * Regression test for the Certifications delete-vs-in-flight-autosave race (P2).
 *
 * removeCertification cancels a QUEUED autosave before calling DELETE, but a
 * debounced autosave that has already fired (its timer consumed, its PATCH
 * awaiting a response) isn't cancelled by that -- the stale, pre-delete PATCH
 * can still land at the backend after DELETE and resurrect the item there.
 *
 * The fix: the "resume-item-deleted" dispatch now carries an `awaitInFlight`
 * container. EditorTab's listener (simulated here, since EditorTab itself is
 * a large, separately-tested component) populates it with the in-flight
 * autosave's promise when one exists. removeCertification must await that
 * promise before calling the delete API, so DELETE is always the request
 * that reaches the backend last.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Certifications from "@/app/(resume)/builder/creation/_components/editor/sections/Certifications";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { useValidation } from "@/app/(resume)/builder/creation/_hooks/useValidation";
import { deleteResumeSectionItem } from "@/api/resumeApi";

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: vi.fn(),
}));
vi.mock("@/app/(resume)/builder/creation/_hooks/useValidation", () => ({
  useValidation: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock("@/api/resumeApi", () => ({
  deleteResumeSectionItem: vi.fn(),
}));
vi.mock("@/api/enhancerApi", () => ({
  deleteSectionItemFromEnhancedResume: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock("../SectionTipsPanel", () => ({ default: () => null }));
vi.mock("../MonthYearPicker", () => ({ default: () => null }));

const mockedUseResume = vi.mocked(useResume);
const mockedUseValidation = vi.mocked(useValidation);
const mockedDelete = vi.mocked(deleteResumeSectionItem);

// The delete button is icon-only (no accessible name) -- find it by its
// Trash2 icon's lucide class rather than by role/name.
function getDeleteButton(container: HTMLElement): HTMLButtonElement {
  const buttons = Array.from(container.querySelectorAll("button"));
  const match = buttons.find((btn) => btn.querySelector("svg.lucide-trash-2"));
  if (!match) throw new Error("Delete button (Trash2 icon) not found");
  return match;
}

describe("Certifications delete — awaits an in-flight autosave before DELETE (P2 regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("current_resume_id", "resume-123");

    mockedUseResume.mockReturnValue({
      resumeData: {
        certifications: [
          { id: "cert-1", name: "AWS SAA", issuedBy: "Amazon", year: "2024" },
        ],
      },
      setResumeData: vi.fn(),
      resumeSource: "builder",
    } as never);

    mockedUseValidation.mockReturnValue({
      errors: {},
      validateRequired: vi.fn(() => true),
      clearError: vi.fn(),
      clearSectionIndexErrors: vi.fn(),
      reindexErrors: vi.fn(),
      setFieldError: vi.fn(),
    } as never);
  });

  it("waits for the in-flight autosave promise before calling the delete API", async () => {
    let resolveAutosave: () => void = () => {};
    const inFlightAutosave = new Promise<void>((resolve) => {
      resolveAutosave = resolve;
    });

    // Stand-in for EditorTab's cancelStaleSectionAutosave listener: hands
    // back the in-flight promise via the same awaitInFlight contract.
    const onItemDeleted = (event: Event) => {
      const detail = (event as CustomEvent<{ awaitInFlight?: { promise?: Promise<void> } }>).detail;
      if (detail?.awaitInFlight) {
        detail.awaitInFlight.promise = inFlightAutosave;
      }
    };
    window.addEventListener("resume-item-deleted", onItemDeleted);

    mockedDelete.mockResolvedValue(undefined as never);

    const { container } = render(<Certifications />);
    fireEvent.click(getDeleteButton(container));

    // The delete handler must be blocked on the in-flight promise -- give
    // pending microtasks a chance to run, then assert DELETE has NOT fired.
    await Promise.resolve();
    await Promise.resolve();
    expect(mockedDelete).not.toHaveBeenCalled();

    resolveAutosave();
    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("resume-123", "certifications", "cert-1"));

    window.removeEventListener("resume-item-deleted", onItemDeleted);
  });

  it("calls the delete API immediately when nothing is in flight", async () => {
    // No listener populates awaitInFlight -- the common case.
    mockedDelete.mockResolvedValue(undefined as never);

    const { container } = render(<Certifications />);
    fireEvent.click(getDeleteButton(container));

    await waitFor(() => expect(mockedDelete).toHaveBeenCalledWith("resume-123", "certifications", "cert-1"));
  });
});
