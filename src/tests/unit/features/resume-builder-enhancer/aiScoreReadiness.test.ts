import { describe, it, expect } from "vitest";
import { getAiScoreReadiness, joinLabels } from "@/app/(resume)/builder/creation/_utils/aiScoreReadiness";

const SUMMARY = "Backend developer with five years of experience building APIs.";

// all 7 core sections filled in
const core7 = {
  personalInfo: { fullname: "Asha Rao", email: "asha@example.com" },
  professionalSummary: { summary: SUMMARY },
  education: [{ school: "IIT", degree: "B.Tech" }],
  categorizedSkills: { programming_languages: ["Python"] },
  workExperience: [{ company: "Acme", role: "Engineer" }],
  projects: [{ title: "Resume Parser" }],
  certifications: [{ name: "AWS Certified Solutions Architect" }],
};

const missing = (r: ReturnType<typeof getAiScoreReadiness>) => r.items.filter((i) => !i.done).map((i) => i.label);

describe("getAiScoreReadiness - the 7 core sections", () => {
  it("lists the 7 core sections in order, and is eligible when all are filled in", () => {
    const r = getAiScoreReadiness(core7);
    expect(r.items.map((i) => i.label)).toEqual([
      "Personal Info", "Professional Summary", "Education", "Skills", "Work Experience", "Projects", "Certifications",
    ]);
    expect(r.doneCount).toBe(7);
    expect(r.eligible).toBe(true);
  });

  it("counts the sections as they are completed", () => {
    expect(getAiScoreReadiness({}).doneCount).toBe(0);
    expect(getAiScoreReadiness({ personalInfo: core7.personalInfo }).doneCount).toBe(1);
    expect(getAiScoreReadiness({ personalInfo: core7.personalInfo, professionalSummary: core7.professionalSummary, education: core7.education }).doneCount).toBe(3);
    expect(getAiScoreReadiness({ ...core7, certifications: [] }).doneCount).toBe(6);
  });

  it.each([
    ["Personal Info", { personalInfo: { fullname: "Asha Rao" } }],
    ["Professional Summary", { professionalSummary: { summary: "Too short" } }],
    ["Education", { education: [] }],
    ["Skills", { categorizedSkills: {} }],
    ["Work Experience", { workExperience: [] }],
    ["Projects", { projects: [] }],
    ["Certifications", { certifications: [] }],
  ])("is not eligible while %s is missing", (label, patch) => {
    const r = getAiScoreReadiness({ ...core7, ...patch });
    expect(r.eligible).toBe(false);
    expect(missing(r)).toEqual([label]);
  });

  it("is not unlocked by many sections that are not core", () => {
    const r = getAiScoreReadiness({
      hobbies: ["Reading"], interests: ["Chess"], languages: ["English"], awards: [{ title: "A" }],
      volunteering: [{ org: "NGO" }], publications: [{ title: "P" }], patents: [{ title: "Q" }],
      achievements: [{ title: "A" }, { title: "B" }],
    });
    expect(r.eligible).toBe(false);
    expect(r.doneCount).toBe(0);
  });

  it("accepts a fresher's internship as their Work Experience", () => {
    const fresher = { ...core7, workExperience: [], internships: [{ company: "Acme", role: "Intern" }] };
    expect(getAiScoreReadiness(fresher).eligible).toBe(true);
    expect(getAiScoreReadiness({ ...fresher, internships: [] }).eligible).toBe(false);
  });

  it("does not count entries with nothing in them", () => {
    const r = getAiScoreReadiness({ ...core7, projects: [{ title: "", description: "" }] });
    expect(missing(r)).toEqual(["Projects"]);
  });

  it("copes with missing or odd data", () => {
    expect(getAiScoreReadiness(undefined).eligible).toBe(false);
    expect(getAiScoreReadiness(null).eligible).toBe(false);
    expect(getAiScoreReadiness({ ...core7, professionalSummary: SUMMARY }).eligible).toBe(true);
  });
});

describe("joinLabels", () => {
  it("reads naturally", () => {
    expect(joinLabels([])).toBe("");
    expect(joinLabels(["Skills"])).toBe("Skills");
    expect(joinLabels(["Skills", "Education"])).toBe("Skills and Education");
    expect(joinLabels(["Personal Info", "Skills", "Education"])).toBe("Personal Info, Skills and Education");
  });
});
