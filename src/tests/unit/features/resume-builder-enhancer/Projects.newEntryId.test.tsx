/**
 * P1 regression: a brand-new, never-saved project must stay id-less.
 *
 * A client-generated id made the entry look "saved" to two consumers:
 *  - EditorTab's autosave only sends items that have `id || _id` (new rows are
 *    supposed to be created on an explicit Save), so an id-less draft is
 *    skipped but one with a made-up id was autosaved.
 *  - removeProject only deletes locally when the entry has no id; with a made-up
 *    id it called the DELETE API for an id the server never assigned.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Projects from "@/app/(resume)/builder/creation/_components/editor/sections/Projects";
import { useResume } from "@/app/(resume)/builder/creation/_context/ResumeContext";

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: vi.fn(),
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

describe("Projects: new unsaved entries have no client-made id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("current_resume_id", "resume-123");
  });

  it("writes a freshly typed project to context without an id", () => {
    const setResumeData = vi.fn();
    mockedUseResume.mockReturnValue({
      resumeData: { projects: [] },
      setResumeData,
      resumeSource: "builder",
    } as never);

    render(<Projects />);
    fireEvent.change(screen.getByPlaceholderText("Project Title"), { target: { value: "Portfolio site" } });

    let state: { projects: Array<Record<string, unknown>> } = { projects: [] };
    for (const [arg] of setResumeData.mock.calls) {
      if (typeof arg === "function") state = arg(state);
    }

    expect(state.projects).toHaveLength(1);
    expect(state.projects[0]).toMatchObject({ title: "Portfolio site" });
    expect(state.projects[0].id).toBeUndefined();
    expect(state.projects[0]._id).toBeUndefined();
  });
});
