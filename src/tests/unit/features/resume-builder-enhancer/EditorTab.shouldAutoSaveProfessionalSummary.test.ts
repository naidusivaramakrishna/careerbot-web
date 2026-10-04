/**
 * Regression test for a real report: entering only the (optional) Target
 * Role in the Professional Summary editor triggered autosave and updated
 * the live preview WITHOUT the user clicking Save, even though Summary
 * (the field actually marked required, "*") was still empty.
 *
 * List-based sections (Education, Projects, etc.) already skip autosaving
 * an entry until it has a backend id, which keeps an incomplete/new entry
 * out of the live preview until the user explicitly saves it. Professional
 * Summary is a single-object section with no id concept to gate on the same
 * way, so triggerAutoSave's Professional Summary branch previously fired on
 * "either summary or targetRole is non-empty" -- entering Target Role alone
 * was enough. shouldAutoSaveProfessionalSummary gates on Summary
 * specifically, matching the "required" marker in the UI.
 */
import { describe, it, expect } from "vitest";
import { shouldAutoSaveProfessionalSummary } from "@/app/(resume)/builder/creation/_components/editor/EditorTab";

describe("shouldAutoSaveProfessionalSummary (Professional Summary autosave gate)", () => {
  it("does not autosave when summary is empty, even if a target role was entered", () => {
    expect(shouldAutoSaveProfessionalSummary("")).toBe(false);
  });

  it("does not autosave when summary is whitespace-only", () => {
    expect(shouldAutoSaveProfessionalSummary("   ")).toBe(false);
  });

  it("autosaves once summary has real content", () => {
    expect(shouldAutoSaveProfessionalSummary("Full-stack developer with 3 years of experience.")).toBe(true);
  });

  it("autosaves for summary content surrounded by incidental whitespace", () => {
    expect(shouldAutoSaveProfessionalSummary("  Full-stack developer.  ")).toBe(true);
  });
});
