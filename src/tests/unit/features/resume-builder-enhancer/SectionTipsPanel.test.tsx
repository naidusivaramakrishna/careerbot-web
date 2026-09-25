import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// SectionTipsPanel's contract (SectionTipsPanel.tsx): ScoreTab's Section
// Breakdown is the single place ATS Enhancer suggestions are shown. The editor
// panel renders ONLY the caller's static help, even when the resume context
// holds pending enhancer suggestions for the same section. The context mock
// below supplies such suggestions so these tests fail if the panel ever goes
// back to rendering them (as it did before this PR).
const mocks = vi.hoisted(() => ({
  suggestions: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", () => ({
  useResume: () => ({
    resumeSource: "enhanced",
    resumeData: {
      personalInfo: { location: "" },
      professionalSummary: { summary: "" },
      education: [], projects: [], internships: [], workExperience: [], certifications: [],
    },
    enhancedSuggestions: mocks.suggestions,
  }),
}));

import SectionTipsPanel from "@/app/(resume)/builder/creation/_components/editor/SectionTipsPanel";

describe("SectionTipsPanel renders only static editor help", () => {
  beforeEach(() => {
    mocks.suggestions = [
      {
        id: "contact_issue_0", section: "Contact", fix_type: "manual", status: "pending",
        message: "Missing location — consider adding city/country for recruiter context.",
      },
      {
        id: "contact_issue_1", section: "Contact", fix_type: "auto", status: "pending",
        message: "Missing GitHub profile.",
      },
    ];
  });

  it("renders the caller's static tips", () => {
    render(<SectionTipsPanel sectionKey="PersonalInfo" staticTips={<p>Static tips</p>} />);
    expect(screen.getByText("Static tips")).toBeInTheDocument();
  });

  it("does not render pending enhancer suggestions or any fix controls", () => {
    render(<SectionTipsPanel sectionKey="PersonalInfo" staticTips={<p>Static tips</p>} />);
    expect(screen.queryByText(/missing location/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/missing github profile/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not render fixed suggestions either", () => {
    mocks.suggestions = [{
      id: "contact_issue_0", section: "Contact", fix_type: "manual", status: "fixed", undoAvailable: true,
      message: "Missing location — consider adding city/country for recruiter context.",
    }];
    render(<SectionTipsPanel sectionKey="PersonalInfo" staticTips={<p>Static tips</p>} />);
    expect(screen.queryByText(/missing location/i)).not.toBeInTheDocument();
    expect(screen.getByText("Static tips")).toBeInTheDocument();
  });

  it("renders static help for per-entry panels regardless of entry content", () => {
    render(<SectionTipsPanel sectionKey="Education" entryContent={[]} staticTips={<p>Education help</p>} />);
    expect(screen.getByText("Education help")).toBeInTheDocument();
  });
});
