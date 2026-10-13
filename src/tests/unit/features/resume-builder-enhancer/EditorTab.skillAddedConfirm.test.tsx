/**
 * A soft skill added as a chip goes through its own endpoint (no section Save),
 * so nothing sent the "add at least 3 soft skills" card to /enhance/apply and
 * the card, progress, score and preview highlight all stayed as they were.
 * The Skills editor now announces each added chip and EditorTab answers the
 * matching card with that one skill.
 *
 * This mounts the real EditorTab: an earlier version of this wiring used
 * `isEnhancedResume` before its declaration and crashed the page on render,
 * which no test noticed because EditorTab is mocked everywhere else.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

const ctx = vi.hoisted(() => ({
  applyManualFix: vi.fn(),
  suggestions: [] as Array<Record<string, unknown>>,
  source: "enhanced" as string,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/builder/creation/r1",
}));

vi.mock("@/app/(resume)/builder/creation/_context/ResumeContext", async importOriginal => ({
  ...(await importOriginal<object>()),
  useResume: () => ({
    setSectionOrder: vi.fn(),
    selectedTemplate: "clean_simple",
    setSelectedTemplate: vi.fn(),
    setCompletionStatus: vi.fn(),
    resumeData: {
      personalInfo: { fullname: "A B", email: "a@b.c", phone: "", location: "" },
      professionalSummary: { summary: "", targetRole: "" },
      education: [], workExperience: [], projects: [], skills: [], categorizedSkills: {},
      certifications: [], achievements: [], volunteering: [], references: [], internships: [],
      awards: [], hobbies: [], interests: [], languages: [], publications: [], patents: [],
      customSections: [],
    },
    setResumeData: vi.fn(),
    resumeId: "r1",
    addCustomSection: vi.fn(),
    removeCustomSection: vi.fn(),
    resumeSource: ctx.source,
    enhancedDataVersion: 0,
    removeEnhancedScoreSection: vi.fn(),
    syncEnhancedScore: vi.fn(),
    enhancedSuggestions: ctx.suggestions,
    applyManualFix: ctx.applyManualFix,
    bumpResumeSavedVersion: vi.fn(),
  }),
}));

import EditorTab from "@/app/(resume)/builder/creation/_components/editor/EditorTab";
import { announceSkillAdded } from "@/app/(resume)/builder/creation/_utils/skillAddedEvent";

const softCard = (over: Record<string, unknown> = {}) => ({
  id: "soft_skills_low",
  section: "Skills",
  message: "Only a few soft skills listed — add at least 3 soft skills (e.g. Communication, Problem Solving, Teamwork) to reach full score.",
  fix_type: "manual",
  status: "pending",
  ...over,
});

function mount() {
  return render(
    <EditorTab
      sections={[{ name: "Personal Info", ai: false }, { name: "Skills", ai: false }]}
      extraSections={[]}
      activeSection={null}
      setActiveSection={vi.fn()}
      formData={{}}
      errors={{}}
      sectionComponents={{}}
      handleDeleteSection={vi.fn()}
      handleAddSection={vi.fn()}
      handleChange={vi.fn()}
      handleBlur={vi.fn()}
      handleDragEnd={vi.fn()}
      setErrors={vi.fn()}
      clearErrors={vi.fn()}
      completionStatus={{}}
    />,
  );
}

beforeEach(() => {
  ctx.applyManualFix.mockReset().mockResolvedValue(undefined);
  ctx.suggestions = [softCard()];
  ctx.source = "enhanced";
});
afterEach(cleanup);

describe("EditorTab: a soft skill chip answers its ATS card", () => {
  it("mounts in enhanced mode without throwing", () => {
    expect(() => mount()).not.toThrow();
  });

  it("confirms the soft-skill card without re-sending the chip already saved by Skills", () => {
    mount();
    act(() => announceSkillAdded("  Good Communication ", "Soft Skills"));

    expect(ctx.applyManualFix).toHaveBeenCalledTimes(1);
    expect(ctx.applyManualFix).toHaveBeenCalledWith("soft_skills_low", undefined, "autosave");
  });

  it("does nothing for a skill added to another category", () => {
    mount();
    act(() => announceSkillAdded("Docker", "Tools"));

    expect(ctx.applyManualFix).not.toHaveBeenCalled();
  });

  it("does nothing when there is no pending soft-skill card", () => {
    ctx.suggestions = [softCard({ status: "fixed" })];
    mount();
    act(() => announceSkillAdded("Good Communication", "Soft Skills"));

    expect(ctx.applyManualFix).not.toHaveBeenCalled();
  });

  it("does nothing for a non-enhanced (builder) resume", () => {
    ctx.source = "builder";
    mount();
    act(() => announceSkillAdded("Good Communication", "Soft Skills"));

    expect(ctx.applyManualFix).not.toHaveBeenCalled();
  });

  it("stops listening once the editor unmounts", () => {
    const view = mount();
    view.unmount();
    act(() => announceSkillAdded("Good Communication", "Soft Skills"));

    expect(ctx.applyManualFix).not.toHaveBeenCalled();
  });

  it("a failed apply is non-fatal (the skill itself is already saved)", async () => {
    ctx.applyManualFix.mockRejectedValue(new Error("The server could not apply this fix."));
    mount();

    await act(async () => { announceSkillAdded("Good Communication", "Soft Skills"); });

    expect(ctx.applyManualFix).toHaveBeenCalledTimes(1);
  });
});
