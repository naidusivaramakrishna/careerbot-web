import { describe, expect, it } from "vitest";
import type { ResumeData } from "@/app/(resume)/builder/creation/_context/ResumeContext";
import { findSoftSkillSuggestion, suggestionsToConfirm } from "@/app/(resume)/builder/creation/_utils/suggestionSection";

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

describe("soft-skill count cards (soft_skills_low / soft_skills_missing)", () => {
  const softCard = {
    id: "soft_skills_low",
    section: "Skills",
    message: "Only a few soft skills listed — add at least 3 soft skills (e.g. Communication, Problem Solving, Teamwork) to reach full score.",
    fix_type: "manual",
    status: "pending",
  };
  const skillsResume = {
    skills: [],
    categorizedSkills: {
      programming_languages: [], frameworks: [], soft_skills: [], project_management: [], marketing_sales: [],
      custom_categories: [{ id: "c1", name: "Soft Skills", skills: ["Quick Learner", "Teamwork", "Good Communication"] }],
      hidden_predefined_categories: [], skill_id_map: {},
    },
  } as unknown as ResumeData;

  it("is never confirmed with the whole skills list as if it were one soft skill", () => {
    // /enhance/apply appends `value` as ONE soft skill, so a joined list would be
    // stored as a single bogus entry. A soft-skill card is confirmed per added chip.
    const result = suggestionsToConfirm(skillsResume, [softCard], "Skills", {
      id: "soft_skills_low",
      initialValue: "Quick Learner, Teamwork",
    });

    expect(result).toEqual([]);
  });
});

describe("findSoftSkillSuggestion — which card a newly added chip confirms", () => {
  const card = (over: Record<string, unknown>) => ({
    id: "soft_skills_low", section: "Skills", message: "Only a few soft skills listed", fix_type: "manual", status: "pending", ...over,
  });

  it("returns the pending soft-skill card when a skill is added to the Soft Skills category", () => {
    expect(findSoftSkillSuggestion([card({})], "Soft Skills")?.id).toBe("soft_skills_low");
    expect(findSoftSkillSuggestion([card({ id: "soft_skills_missing", message: "No soft skills found" })], "soft_skills")?.id)
      .toBe("soft_skills_missing");
  });

  it("matches a skills_issue_* card only when its message is about soft skills", () => {
    expect(findSoftSkillSuggestion([card({ id: "skills_issue_2", message: "Add at least 3 soft skills" })], "Soft Skills")?.id)
      .toBe("skills_issue_2");
    expect(findSoftSkillSuggestion([card({ id: "skills_issue_2", message: "Add Docker to your skills" })], "Soft Skills"))
      .toBeUndefined();
  });

  it("does not treat a category that merely contains 'soft' as the Soft Skills category", () => {
    expect(findSoftSkillSuggestion([card({})], "Software Tools")).toBeUndefined();
    expect(findSoftSkillSuggestion([card({})], "Microsoft Office")).toBeUndefined();
    expect(findSoftSkillSuggestion([card({})], "  soft_skills ")?.id).toBe("soft_skills_low");
  });

  it("ignores skills added to any other category", () => {
    expect(findSoftSkillSuggestion([card({})], "Tools")).toBeUndefined();
    expect(findSoftSkillSuggestion([card({})], "Programming Languages")).toBeUndefined();
  });

  it("ignores fixed cards, non-manual cards and cards of other sections", () => {
    expect(findSoftSkillSuggestion([card({ status: "fixed" })], "Soft Skills")).toBeUndefined();
    expect(findSoftSkillSuggestion([card({ fix_type: "auto" })], "Soft Skills")).toBeUndefined();
    expect(findSoftSkillSuggestion([card({ section: "Summary" })], "Soft Skills")).toBeUndefined();
  });
});
