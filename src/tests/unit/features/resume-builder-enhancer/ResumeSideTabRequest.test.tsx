import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// Empty resume, same shape as ResumeContext's initial state.
const emptyResume = vi.hoisted(() => ({
  personalInfo: { fullname: "", email: "", phone: "", location: "" },
  professionalSummary: { summary: "", targetRole: "" },
  education: [], workExperience: [], projects: [], skills: [], categorizedSkills: {},
  certifications: [], achievements: [], volunteering: [], references: [], internships: [],
  awards: [], hobbies: [], interests: [], languages: [], publications: [], patents: [],
}));

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: () => ({
    resumeData: emptyResume,
    setResumeData: vi.fn(),
    isLoadingResume: false,
    completionStatus: {},
    setCompletionStatus: vi.fn(),
    sectionOrder: [],
    setSectionOrder: vi.fn(),
  }),
}));
vi.mock("@/app/(resume)/builder/creation/_components/resumeSidebar/Tabs", () => ({
  default: ({ setActiveTab, onToggle }: { setActiveTab: (tab: string) => void; onToggle: () => void }) => (
    <div>
      <button onClick={() => setActiveTab("Editor")}>Editor tab</button>
      <button onClick={onToggle}>Collapse sidebar</button>
    </div>
  ),
}));
vi.mock("@/app/(resume)/builder/creation/_components/editor/EditorTab", () => ({ default: () => <div data-testid="editor-tab" /> }));
vi.mock("@/app/(resume)/builder/creation/_components/score/ScoreTab", () => ({ default: () => <div data-testid="score-tab" /> }));
vi.mock("@/app/(resume)/builder/creation/_components/resumeGPT/ResumeGPTTab", () => ({ default: () => null }));
vi.mock("@/app/(resume)/builder/creation/_components/aiReview/AIReviewTab", () => ({ default: () => null }));

import ResumeSide from "@/app/(resume)/builder/creation/_components/resumeSidebar/ResumeSide";

describe("ResumeSide tab requests from the preview toolbar", () => {
  it("switches back to the requested tab after the user moved to another tab", () => {
    const { rerender } = render(<ResumeSide initialTab="Score" />);
    expect(screen.getByTestId("score-tab")).toBeTruthy();

    fireEvent.click(screen.getByText("Editor tab"));
    expect(screen.queryByTestId("score-tab")).toBeNull();

    rerender(<ResumeSide initialTab="Score" tabRequest={{ tab: "Score", id: 1 }} />);
    expect(screen.getByTestId("score-tab")).toBeTruthy();

    // A repeated click is a new request, even for the same tab.
    fireEvent.click(screen.getByText("Editor tab"));
    rerender(<ResumeSide initialTab="Score" tabRequest={{ tab: "Score", id: 2 }} />);
    expect(screen.getByTestId("score-tab")).toBeTruthy();
  });

  it("reopens a collapsed sidebar on the requested tab", () => {
    const { rerender } = render(<ResumeSide initialTab="Score" />);
    fireEvent.click(screen.getByText("Collapse sidebar"));
    expect(screen.queryByTestId("score-tab")).toBeNull();

    rerender(<ResumeSide initialTab="Score" tabRequest={{ tab: "Score", id: 1 }} />);
    expect(screen.getByTestId("score-tab")).toBeTruthy();
  });
});
