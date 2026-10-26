/**
 * Inline editor (builder page): opening a section hides the other sections; Cancel (or a save)
 * brings the whole list back.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

vi.mock("@/api/resumeApi", () => ({
  deleteResumeSection: vi.fn(),
  updateResume: vi.fn(),
  getAllResumes: vi.fn().mockResolvedValue([]),
  autoSaveResume: vi.fn(),
  transformCustomSectionsForBackend: (sections: unknown) => sections,
}));
vi.mock("@/api/enhancerApi", () => ({
  autoSaveEnhancedResume: vi.fn(),
  updateEnhancedResume: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({ useResume: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => ({ get: () => null }) }));
vi.mock("@/app/(resume)/builder/creation/_components/editor/AddNewSection", () => ({
  default: () => <div>Add new sections area</div>,
}));
vi.mock("@/app/(resume)/builder/creation/_components/editor/CustomSectionEditor", () => ({ default: () => null }));

import EditorTab from "@/app/(resume)/builder/creation/_components/editor/EditorTab";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";

const SECTIONS = [
  { name: "Personal Info", ai: false },
  { name: "Education", ai: false },
  { name: "Skills", ai: false },
];

const renderTab = (inline: boolean) => {
  vi.mocked(useResume).mockReturnValue({
    setSectionOrder: vi.fn(),
    selectedTemplate: 1,
    setSelectedTemplate: vi.fn(),
    setCompletionStatus: vi.fn(),
    removeCustomSection: vi.fn(),
    addCustomSection: vi.fn(),
    bumpResumeSavedVersion: vi.fn(),
    resumeData: { customSections: [] },
    resumeId: "r1",
    resumeSource: "builder",
    enhancedDataVersion: 0,
    resumeSavedVersion: 0,
    isLoadingResume: false,
    enhancedSuggestions: [],
  } as never);
  return render(
    <EditorTab
      inline={inline}
      sections={SECTIONS}
      extraSections={[]}
      activeSection={null}
      formData={{}}
      errors={{}}
      sectionComponents={{ Education: () => <div>Education form fields</div> }}
      handleDeleteSection={vi.fn()}
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
};

describe("EditorTab inline editor focuses on the open section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists every section until one is opened", () => {
    renderTab(true);
    expect(screen.getByText("Personal Info")).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Resume Progress")).toBeInTheDocument();
    expect(screen.getByText("Add New Sections")).toBeInTheDocument();
  });

  it("hides the other sections (and the add-section area) while one is open, and shows them again on Cancel", () => {
    renderTab(true);

    fireEvent.click(screen.getByText("Education"));

    expect(screen.getByText("Education form fields")).toBeInTheDocument();
    expect(screen.getByText("Education")).toBeInTheDocument();
    expect(screen.queryByText("Personal Info")).not.toBeInTheDocument();
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    expect(screen.queryByText("Add New Sections")).not.toBeInTheDocument();
    // progress stays visible
    expect(screen.getByText("Resume Progress")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Personal Info")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Resume Progress")).toBeInTheDocument();
    expect(screen.getByText("Add New Sections")).toBeInTheDocument();
    expect(screen.queryByText("Education form fields")).not.toBeInTheDocument();
  });

  it("collapses the open section from its own header and brings the list back", () => {
    renderTab(true);
    fireEvent.click(screen.getByText("Education"));
    expect(screen.queryByText("Skills")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Education"));

    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.queryByText("Education form fields")).not.toBeInTheDocument();
  });

  it("keeps showing every section in the non-inline (modal) editor", () => {
    renderTab(false);
    fireEvent.click(screen.getByText("Education"));
    expect(screen.getByText("Personal Info")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
  });
});
