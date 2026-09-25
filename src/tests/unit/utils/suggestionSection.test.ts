import { describe, expect, it } from "vitest";
import { getChangedSatisfiedManualSuggestions, getSectionValue, isStructuralSuggestionSatisfied } from "@/app/(resume)/builder/creation/_utils/suggestionSection";
import type { ResumeData } from "@/app/(resume)/builder/creation/_context/ResumeContext";

const resume = {
  projects: [
    { title: "Inventory Platform", description: "Led development and reduced processing time by 40%." },
  ],
  internships: [
    { company: "Acme", role: "Intern", description: "Coordinated release testing." },
  ],
  workExperience: [
    { company: "Legacy Co", role: "Engineer", description: "Maintained an old service." },
  ],
} as ResumeData;

describe("cross-cutting ATS suggestion routing", () => {
  it("reads project content for a Leadership suggestion shown in Projects", () => {
    expect(getSectionValue(resume, "Leadership", undefined, "Projects"))
      .toContain("Led development");
    expect(getSectionValue(resume, "Leadership", undefined, "Projects"))
      .not.toContain("Maintained an old service");
  });

  it("reads internship content for ContentQuality shown in Internships", () => {
    expect(getSectionValue(resume, "ContentQuality", undefined, "Internships"))
      .toContain("Coordinated release testing");
  });

  it("keeps Work Experience as the default owner for cross-cutting suggestions", () => {
    expect(getSectionValue(resume, "Leadership", undefined, "Work Experience"))
      .toContain("Maintained an old service");
  });
});

describe("enhanced Save → apply selection", () => {
  const educationResume = {
    education: [
      { school: "First", degree: "B.Tech", startDate: "Aug 2021", endDate: "May 2025", scoreValue: "86", scoreType: "Percentage" },
      { school: "Second", degree: "Intermediate", startDate: "Jun 2019", endDate: "Mar 2021", scoreValue: "90", scoreType: "Percentage" },
    ],
  } as ResumeData;

  const suggestions = [
    { id: "education_issue_0", section: "Education", fix_type: "manual", message: "Education entry 1: Year of completion is missing." },
    { id: "education_issue_1", section: "Education", fix_type: "manual", message: "Education entry 2: Grade or score is missing." },
  ];

  it("applies only the Education field changed in this Save", () => {
    expect(getChangedSatisfiedManualSuggestions(
      educationResume,
      suggestions,
      "Education",
      { education_issue_0: "", education_issue_1: "90 Percentage" },
    ).map(s => s.id)).toEqual(["education_issue_0"]);
  });

  it("does not replay an unchanged or already-fixed manual suggestion", () => {
    expect(getChangedSatisfiedManualSuggestions(
      educationResume,
      [{ ...suggestions[0], status: "fixed" }, suggestions[1]],
      "Education",
      { education_issue_0: "", education_issue_1: "90 Percentage" },
    )).toEqual([]);
  });
});
describe("isStructuralSuggestionSatisfied", () => {
  const base = { projects: [], certifications: [] } as ResumeData;

  it("requires the project count stated by the ATS suggestion", () => {
    const suggestion = { message: "No projects listed. Adding 2 projects will boost your score." };
    expect(isStructuralSuggestionSatisfied({ ...base, projects: [{ title: "One" }] }, suggestion)).toBe(false);
    expect(isStructuralSuggestionSatisfied({ ...base, projects: [{ title: "One" }, { title: "Two" }] }, suggestion)).toBe(true);
  });

  it("resolves certification presence but never guesses semantic quality", () => {
    expect(isStructuralSuggestionSatisfied(
      { ...base, certifications: [{ name: "AWS" }] },
      { message: "Add at least one certification relevant to your role." },
    )).toBe(true);
    expect(isStructuralSuggestionSatisfied(
      { ...base, projects: [{ title: "One" }] },
      { message: "Add leadership signals to project bullets." },
    )).toBe(false);
  });

  it("targets the exact Education field and entry required by a suggestion", () => {
    const education = [
      { school: "First", degree: "B.Tech", startDate: "Aug 2021", endDate: "May 2025", scoreValue: "86", scoreType: "Percentage" as const },
      { school: "Second", degree: "Intermediate", startDate: "", endDate: "Mar 2021", scoreValue: "", scoreType: "Percentage" as const },
    ];
    const graduation = { section: "Education", message: "Education entry 1: Year of completion is missing." };
    const grade = { section: "Education", message: "Education entry 1: Grade or score is missing." };
    const duration = { section: "Education", message: "Education entry 2: Both start and end dates are missing." };

    expect(getSectionValue({ ...base, education }, "Education", graduation)).toBe("May 2025");
    expect(getSectionValue({ ...base, education }, "Education", grade)).toBe("86 Percentage");
    expect(isStructuralSuggestionSatisfied({ ...base, education }, graduation)).toBe(true);
    expect(isStructuralSuggestionSatisfied({ ...base, education }, grade)).toBe(true);
    expect(isStructuralSuggestionSatisfied({ ...base, education }, duration)).toBe(false);
  });

  it("only counts Work Experience mentions as demonstrating a listed skill", () => {
    // Regression: reproduced via a live /enhance/apply response where a skill
    // ("Flask") textually present in a Project's description still came back
    // with technical_skills[].evidence_count: 0 / strength: "not_used" — the
    // AI scorer only recognizes Work Experience evidence for this deduction,
    // matching the suggestion's own wording ("use it in your work experience").
    // Treating Projects/Internships text as evidence made Save auto-submit
    // /enhance/apply for these suggestions, which the backend then rejected.
    const suggestion = { section: "Skills", message: "'Flask' is listed but not demonstrated anywhere." };
    expect(isStructuralSuggestionSatisfied(
      { ...base, projects: [{ title: "News Hub", description: "Built using Flask for the backend." }] },
      suggestion,
    )).toBe(false);
    expect(isStructuralSuggestionSatisfied(
      { ...base, internships: [{ company: "Acme", role: "Intern", description: "Used Flask daily." }] },
      suggestion,
    )).toBe(false);
    expect(isStructuralSuggestionSatisfied(
      { ...base, workExperience: [{ company: "Acme", role: "Engineer", description: "Built APIs with Flask." }] },
      suggestion,
    )).toBe(true);
  });

  it("confirms a *_score_gap suggestion once a project/internship has enough bullet points", () => {
    // Regression: this message template ("X scored 0/0. Add N+ bullet points
    // per Y...") had no matching branch, so Save on the ATS report page could
    // never auto-confirm projects_score_gap/internships_score_gap no matter
    // how much content was added — SectionTipsPanel's own "Mark as done"
    // control is hidden on that page by design, relying entirely on this
    // function via EditorTab's save handler.
    const projectSuggestion = { section: "Projects", message: "Projects scored 0/0. Add 3+ bullet points per project with tech stack, your role, and measurable outcomes." };
    expect(isStructuralSuggestionSatisfied(
      { ...base, projects: [{ title: "News Hub", description: "<div>One</div><div>Two</div>" }] },
      projectSuggestion,
    )).toBe(false);
    expect(isStructuralSuggestionSatisfied(
      { ...base, projects: [{ title: "News Hub", description: "<div>One</div><div>Two</div><div>Three</div>" }] },
      projectSuggestion,
    )).toBe(true);

    const internshipSuggestion = { section: "Internships", message: "Internships scored 0/0. Add 2+ bullet points per internship with technologies used and measurable outcomes." };
    expect(isStructuralSuggestionSatisfied(
      { ...base, internships: [{ company: "Acme", role: "Intern", description: "<div>Only one</div>" }] },
      internshipSuggestion,
    )).toBe(false);
    expect(isStructuralSuggestionSatisfied(
      { ...base, internships: [{ company: "Acme", role: "Intern", description: "<div>One</div><div>Two</div>" }] },
      internshipSuggestion,
    )).toBe(true);
  });
});
