import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const mocks = vi.hoisted(() => ({
  resume: {
    personalInfo: { location: "Vijayawada" },
    professionalSummary: { summary: "" },
    education: [], projects: [], internships: [], workExperience: [], certifications: [],
  },
  suggestions: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: () => ({
    resumeSource: "enhanced",
    resumeData: mocks.resume,
    enhancedSuggestions: mocks.suggestions,
  }),
}));

import SectionTipsPanel from "@/app/(resume)/builder/creation/_components/editor/SectionTipsPanel";

describe("SectionTipsPanel enhancer states", () => {
  beforeEach(() => {
    mocks.suggestions = [{
      id: "contact_issue_0", section: "Contact", fix_type: "manual", status: "pending",
      message: "Missing location — consider adding city/country for recruiter context.",
    }];
  });

  it("shows a pending suggestion as informational text with no interactive controls", () => {
    // Product decision: this panel no longer has its own Apply/Undo/Mark-as-
    // done actions -- editing the section and clicking Save is the only way
    // to resolve a suggestion now that Save itself triggers a real rescore.
    render(<SectionTipsPanel sectionKey="PersonalInfo" staticTips={<p>Static tips</p>} />);

    expect(screen.getByText(/missing location/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("hides a fixed suggestion from the editor modal panel", () => {
    // A resolved card is clutter inside the section editor modal -- this
    // panel is "what's still open", not a history of what's done.
    mocks.suggestions = [{
      id: "contact_issue_0", section: "Contact", fix_type: "manual", status: "fixed", undoAvailable: true,
      message: "Missing location — consider adding city/country for recruiter context.",
    }];
    render(<SectionTipsPanel sectionKey="PersonalInfo" staticTips={<p>Static tips</p>} />);

    expect(screen.queryByText(/missing location/i)).not.toBeInTheDocument();
    expect(screen.getByText("Static tips")).toBeInTheDocument();
  });

  it("still shows a pending suggestion alongside an unrelated fixed one", () => {
    mocks.suggestions = [
      {
        id: "contact_issue_0", section: "Contact", fix_type: "manual", status: "fixed", undoAvailable: true,
        message: "Missing location — consider adding city/country for recruiter context.",
      },
      {
        id: "contact_issue_1", section: "Contact", fix_type: "manual", status: "pending",
        message: "Missing GitHub profile.",
      },
    ];
    render(<SectionTipsPanel sectionKey="PersonalInfo" staticTips={<p>Static tips</p>} />);

    expect(screen.queryByText(/missing location/i)).not.toBeInTheDocument();
    expect(screen.getByText(/missing github profile/i)).toBeInTheDocument();
  });

  it("falls back to static help when a per-entry panel has no matching entry content", () => {
    render(<SectionTipsPanel sectionKey="Education" entryContent={[]} staticTips={<p>Education help</p>} />);
    expect(screen.getByText("Education help")).toBeInTheDocument();
  });
});
