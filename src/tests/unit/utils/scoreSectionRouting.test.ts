import { describe, expect, it } from "vitest";
import { getScoreSectionAction } from "@/app/(resume)/builder/creation/_utils/scoreSectionRouting";

describe("score section routing", () => {
  it("routes Career Progression to the existing Work Experience editor", () => {
    expect(getScoreSectionAction("CareerProgression")).toEqual({
      editorSection: "Work Experience",
      entryIndex: undefined,
    });
  });

  it("does not route source-format or ATS diagnostic categories to empty forms", () => {
    expect(getScoreSectionAction("Formatting")).toBeNull();
    expect(getScoreSectionAction("ATS Compatibility")).toBeNull();
  });

  it("routes an identified content entry to its actual owner", () => {
    expect(getScoreSectionAction("ContentQuality", "Project 2: Add measurable outcomes.")).toEqual({
      editorSection: "Projects",
      entryIndex: 1,
    });
    expect(getScoreSectionAction("ContentQuality", "Internship 1: Add technologies used.")).toEqual({
      editorSection: "Internships",
      entryIndex: 0,
    });
  });

  it("routes the bare 'content' token the same as 'ContentQuality'", () => {
    // Regression: live suggestions carry this category as the bare word
    // "content", not "Content Quality"/"ContentQuality" — the exact-match
    // check against "contentquality" silently dropped these, so "Edit & save"
    // on a buzzword_overuse/content-quality card did nothing at all.
    expect(getScoreSectionAction("content", "Project 2: Add measurable outcomes.")).toEqual({
      editorSection: "Projects",
      entryIndex: 1,
    });
    expect(getScoreSectionAction("content", "Internship 1: Add technologies used.")).toEqual({
      editorSection: "Internships",
      entryIndex: 0,
    });
  });

  it("does not reintroduce raw unknown category names as editor sections", () => {
    expect(getScoreSectionAction("UnmappedDiagnostic")).toBeNull();
  });
});
