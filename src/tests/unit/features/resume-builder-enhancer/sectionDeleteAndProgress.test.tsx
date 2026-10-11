/**
 * Section delete (SectionItem: success toast, onDeleted only after the delete
 * landed; isSectionKnownEmpty decides whether the preview must re-render) and the
 * "Resume Sections n/m" progress count (sectionHasSavedData).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const deleteResumeSection = vi.fn();
const updateResume = vi.fn();
const updateEnhancedResume = vi.fn();
vi.mock("@/api/resumeApi", () => ({
  deleteResumeSection: (...args: unknown[]) => deleteResumeSection(...args),
  updateResume: (...args: unknown[]) => updateResume(...args),
  getAllResumes: vi.fn().mockResolvedValue([]),
  autoSaveResume: vi.fn(),
  transformCustomSectionsForBackend: (sections: unknown) => sections,
}));
vi.mock("@/api/enhancerApi", () => ({
  autoSaveEnhancedResume: vi.fn(),
  updateEnhancedResume: (...args: unknown[]) => updateEnhancedResume(...args),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({ useResume: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => ({ get: () => null }) }));
vi.mock("@/app/(resume)/builder/creation/_components/editor/AddNewSection", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/editor/CustomSectionEditor", () => ({ default: () => null }));

import { toast } from "sonner";
import SectionItem from "@/app/(resume)/builder/creation/_components/editor/SectionItem";
import EditorTab from "@/app/(resume)/builder/creation/_components/editor/EditorTab";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import {
  isSectionKnownEmpty,
  sectionHasSavedData,
} from "@/app/(resume)/builder/creation/_utils/sectionPayloadKeys";

const renderItem = (props: { onDeleteAsync?: () => Promise<void> } = {}) => {
  const onDelete = vi.fn();
  const onDeleted = vi.fn();
  const view = render(
    <SectionItem
      title="Bar Admissions and Licenses"
      icon={null}
      ai={false}
      isActive={false}
      onToggle={vi.fn()}
      onDelete={onDelete}
      onDeleted={onDeleted}
      resumeId="r1"
      sectionKey="bar_admissions_and_licenses"
      {...props}
    />,
  );
  return { ...view, onDelete, onDeleted };
};

const confirmDelete = (container: HTMLElement) => {
  fireEvent.mouseEnter(container.firstChild as HTMLElement);
  fireEvent.click(screen.getByRole("button", { name: "Delete section" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
};

describe("SectionItem delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
  });

  it("deletes through the section route, then toasts and calls onDeleted", async () => {
    deleteResumeSection.mockResolvedValueOnce(undefined);
    const { container, onDelete, onDeleted } = renderItem();

    confirmDelete(container);

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(deleteResumeSection).toHaveBeenCalledWith("r1", "bar_admissions_and_licenses");
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Section deleted successfully.");
  });

  it("uses the section's own async delete (custom sections) and still calls onDeleted", async () => {
    const onDeleteAsync = vi.fn().mockResolvedValue(undefined);
    const { container, onDeleted } = renderItem({ onDeleteAsync });

    confirmDelete(container);

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(onDeleteAsync).toHaveBeenCalledTimes(1);
    expect(deleteResumeSection).not.toHaveBeenCalled();
  });

  it("neither toasts success nor calls onDeleted when the delete fails", async () => {
    deleteResumeSection.mockRejectedValueOnce(new Error("400"));
    const { container, onDelete, onDeleted } = renderItem();

    confirmDelete(container);

    await waitFor(() => expect(window.alert).toHaveBeenCalled());
    expect(onDelete).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

// The sidebar delete of a tile EditorTab renders (real EditorTab + SectionItem).
describe("EditorTab section-tile delete", () => {
  const saved = [{ id: "cs-1", sectionName: "Strengths", fields: [{ label: "Item", value: "Mentoring" }] }];
  const renderTab = (tile: string, resumeSource: "builder" | "enhanced" = "builder") => {
    const ctx = {
      setSectionOrder: vi.fn(),
      removeCustomSection: vi.fn(),
      bumpResumeSavedVersion: vi.fn(),
      resumeData: { customSections: saved },
      resumeId: "r1",
      resumeSource,
      enhancedDataVersion: 0,
      resumeSavedVersion: 0,
      isLoadingResume: false,
      enhancedSuggestions: [],
    };
    vi.mocked(useResume).mockReturnValue(ctx as never);
    const handleDeleteSection = vi.fn();
    render(
      <EditorTab
        sections={[{ name: tile, ai: false }]}
        extraSections={[]}
        activeSection={null}
        formData={{}}
        errors={{}}
        sectionComponents={{}}
        handleDeleteSection={handleDeleteSection}
        handleAddSection={vi.fn()}
        handleChange={vi.fn()}
        handleBlur={vi.fn()}
        setActiveSection={vi.fn()}
        handleDragEnd={vi.fn()}
        completionStatus={{}}
        clearErrors={vi.fn()}
        setErrors={vi.fn()}
      />,
    );
    fireEvent.mouseEnter(screen.getByText(tile));
    fireEvent.click(screen.getByRole("button", { name: "Delete section" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    return { ctx, handleDeleteSection };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
    updateResume.mockResolvedValue({ customSections: [] });
    updateEnhancedResume.mockResolvedValue({});
  });

  it.each(["builder", "enhanced"] as const)(
    "%s: a tile with no custom-section entry is removed locally, without replacing the saved list",
    async (source) => {
      // A legacy ghost: its name survived in the stored section order, but no
      // custom section of that name exists. Sending the local list as the full
      // replacement could only overwrite the server's newer sections.
      const { ctx, handleDeleteSection } = renderTab("Old Ghost", source);
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Section deleted successfully."));
      expect(handleDeleteSection).toHaveBeenCalledWith(0);
      expect(ctx.setSectionOrder).toHaveBeenCalledTimes(1);
      expect(updateResume).not.toHaveBeenCalled();
      expect(updateEnhancedResume).not.toHaveBeenCalled();
      expect(deleteResumeSection).not.toHaveBeenCalled();
    },
  );

  it("control: a saved custom section is removed from the saved list", async () => {
    const { ctx } = renderTab("Strengths");
    await waitFor(() => expect(updateResume).toHaveBeenCalledTimes(1));
    expect(updateResume.mock.calls[0][0]).toBe("r1");
    expect(updateResume.mock.calls[0][1]).toMatchObject({ customSections: [] });
    expect(ctx.removeCustomSection).toHaveBeenCalledWith("cs-1");
  });

  it("a fixed section still uses the section DELETE route", async () => {
    deleteResumeSection.mockResolvedValueOnce(undefined);
    renderTab("Achievements");
    await waitFor(() => expect(deleteResumeSection).toHaveBeenCalledWith("r1", "achievements"));
    expect(updateResume).not.toHaveBeenCalled();
  });
});

describe("isSectionKnownEmpty (re-render the preview only after deleting content)", () => {
  it("is true for a domain section with no filled entry", () => {
    expect(isSectionKnownEmpty({ barAdmissionsAndLicenses: [] }, "Bar Admissions and Licenses")).toBe(true);
    expect(isSectionKnownEmpty({ barAdmissionsAndLicenses: [{ name: " ", year: "" }] }, "Bar Admissions and Licenses")).toBe(true);
    expect(isSectionKnownEmpty({}, "Sea Service Record")).toBe(true);
  });

  it("is false once an entry has content", () => {
    expect(isSectionKnownEmpty({ barAdmissionsAndLicenses: [{ id: "a", name: "NY Bar" }] }, "Bar Admissions and Licenses")).toBe(false);
  });

  it("checks a custom section by its name", () => {
    const data = { customSections: [{ sectionName: "Side  Projects", fields: [{ value: "" }] }] };
    expect(isSectionKnownEmpty(data, "side projects")).toBe(true);
    data.customSections[0].fields[0].value = "CLI tool";
    expect(isSectionKnownEmpty(data, "side projects")).toBe(false);
  });

  it("treats an unknown section as having content (the safe default)", () => {
    expect(isSectionKnownEmpty({}, "Personal Info")).toBe(false);
  });
});

describe("sectionHasSavedData (progress count)", () => {
  it("counts Personal Info only once name, email and phone are set", () => {
    const pi = { fullname: "Ada", email: "ada@example.com", phone: "" };
    expect(sectionHasSavedData({ personalInfo: pi }, "Personal Info")).toBe(false);
    expect(sectionHasSavedData({ personalInfo: { ...pi, phone: "+1 555" } }, "Personal Info")).toBe(true);
  });

  it("reads Professional Summary from the object or a plain string", () => {
    expect(sectionHasSavedData({ professionalSummary: { summary: "Engineer" } }, "Professional Summary")).toBe(true);
    expect(sectionHasSavedData({ professionalSummary: { summary: "  " } }, "Professional Summary")).toBe(false);
    expect(sectionHasSavedData({ professionalSummary: "Engineer" }, "Professional Summary")).toBe(true);
  });

  it("counts a list section with a filled entry, and Skills from either shape", () => {
    expect(sectionHasSavedData({ certificatesAndClearances: [{ name: "CISSP" }] }, "Certificates and Clearances")).toBe(true);
    expect(sectionHasSavedData({ certificatesAndClearances: [] }, "Certificates and Clearances")).toBe(false);
    expect(sectionHasSavedData({ categorizedSkills: { frameworks: ["React"] } }, "Skills")).toBe(true);
    expect(sectionHasSavedData({ skills: [] }, "Skills")).toBe(false);
  });

  it("does not count Skills from category metadata alone (an empty added category, hidden built-ins)", () => {
    const categorizedSkills = {
      programming_languages: [],
      custom_categories: [{ id: "c1", name: "", skills: [] as string[] }],
      hidden_predefined_categories: ["frameworks"],
      skill_id_map: {},
    };
    expect(sectionHasSavedData({ categorizedSkills }, "Skills")).toBe(false);
    expect(isSectionKnownEmpty({ categorizedSkills }, "Skills")).toBe(true);

    categorizedSkills.custom_categories[0].skills.push("Docker");
    expect(sectionHasSavedData({ categorizedSkills }, "Skills")).toBe(true);
    expect(isSectionKnownEmpty({ categorizedSkills }, "Skills")).toBe(false);
  });

  it("counts a custom section only when every field has a value", () => {
    const fields = [{ value: "a" }, { value: "" }];
    expect(sectionHasSavedData({ customSections: [{ sectionName: "Talks", fields }] }, "Talks")).toBe(false);
    fields[1].value = "b";
    expect(sectionHasSavedData({ customSections: [{ sectionName: "Talks", fields }] }, "Talks")).toBe(true);
  });
});
