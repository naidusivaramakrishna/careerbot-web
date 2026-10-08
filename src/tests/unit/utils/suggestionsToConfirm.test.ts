import { describe, expect, it } from "vitest";
import type { ResumeData } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { suggestionsToConfirm } from "@/app/(resume)/builder/creation/_utils/suggestionSection";

const resumeWith = (personalInfo: Record<string, string>) =>
  ({ personalInfo: { fullname: "Shravya P", email: "s@example.com", ...personalInfo } }) as unknown as ResumeData;

const locationCard = {
  id: "contact_issue_0",
  section: "Contact",
  message: "Missing location — consider adding city/country for recruiter context",
  fix_type: "manual",
  status: "pending",
};
const githubCard = { ...locationCard, id: "contact_issue_1", message: "Missing GitHub profile" };

describe("suggestionsToConfirm — cards a saved section has satisfied", () => {
  it("confirms the Contact location card once Location is filled (the Personal Info Save)", () => {
    const result = suggestionsToConfirm(resumeWith({ location: "Vijayawada" }), [locationCard], "Personal Info");
    expect(result).toHaveLength(1);
    expect(result[0].suggestion.id).toBe("contact_issue_0");
    expect(result[0].value).toBe("Vijayawada");
    expect(result[0].explicitlyTargeted).toBe(false);
  });

  it("does not confirm while Location is still empty", () => {
    expect(suggestionsToConfirm(resumeWith({ location: "  " }), [locationCard], "Personal Info")).toEqual([]);
  });

  it("only confirms the cards whose field is now filled", () => {
    const result = suggestionsToConfirm(
      resumeWith({ location: "Pune" }),
      [locationCard, githubCard],
      "Personal Info",
    );
    expect(result.map((r) => r.suggestion.id)).toEqual(["contact_issue_0"]);
  });

  it("ignores cards already fixed, non-manual cards, and cards of other sections", () => {
    const resume = resumeWith({ location: "Pune" });
    expect(suggestionsToConfirm(resume, [{ ...locationCard, status: "fixed" }], "Personal Info")).toEqual([]);
    expect(suggestionsToConfirm(resume, [{ ...locationCard, fix_type: "auto" }], "Personal Info")).toEqual([]);
    expect(suggestionsToConfirm(resume, [locationCard], "Education")).toEqual([]);
  });

  it("confirms a stale card whose data already satisfies it, even when the value did not change (the reported bug)", () => {
    // Location was already saved earlier ("Vijayawada") but the card was never cleared. The
    // user clicks Manual Fix, so the field "starts" as Vijayawada, and re-enters the same value.
    const resume = resumeWith({ location: "Vijayawada" });
    const result = suggestionsToConfirm(resume, [locationCard], "Personal Info", {
      id: "contact_issue_0",
      initialValue: "Vijayawada",
    });
    expect(result.map((r) => r.suggestion.id)).toEqual(["contact_issue_0"]);
    expect(result[0].explicitlyTargeted).toBe(true);
  });

  it("a targeted card that is NOT objectively satisfied still needs a changed value", () => {
    const semanticCard = {
      id: "summary_issue_0",
      section: "Summary",
      message: "Make your summary more impactful with measurable results",
      fix_type: "manual",
      status: "pending",
    };
    const resume = {
      personalInfo: {},
      professionalSummary: { summary: "Same summary text as before." },
    } as unknown as ResumeData;
    const unchanged = suggestionsToConfirm(resume, [semanticCard], "Professional Summary", {
      id: "summary_issue_0",
      initialValue: "Same summary text as before.",
    });
    expect(unchanged).toEqual([]);
    const changed = suggestionsToConfirm(resume, [semanticCard], "Professional Summary", {
      id: "summary_issue_0",
      initialValue: "An older summary.",
    });
    expect(changed).toHaveLength(1);
  });

  it("an explicitly targeted card whose field changed is confirmed", () => {
    const resume = resumeWith({ location: "Vijayawada" });
    const changed = suggestionsToConfirm(resume, [locationCard], "Personal Info", {
      id: "contact_issue_0",
      initialValue: "",
    });
    expect(changed).toHaveLength(1);
    expect(changed[0].explicitlyTargeted).toBe(true);
  });

  it("a card for a different field is not confirmed by an explicit target elsewhere", () => {
    const result = suggestionsToConfirm(resumeWith({ location: "Pune" }), [locationCard, githubCard], "Personal Info", {
      id: "contact_issue_1",
      initialValue: "",
    });
    // github is targeted but still empty -> skipped; location is satisfied structurally.
    expect(result.map((r) => r.suggestion.id)).toEqual(["contact_issue_0"]);
  });
});
