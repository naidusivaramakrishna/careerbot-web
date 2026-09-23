import { describe, expect, it } from "vitest";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";

describe("education score mapping", () => {
  it("preserves a user-selected Percentage score type on reload", () => {
    const mapped = mapParserOutputToBuilderData({
      education: [{ id: "edu-1", school: "Example University", scoreType: "Percentage", scoreValue: "85" }],
    });

    expect(mapped.education?.[0]).toMatchObject({
      id: "edu-1",
      scoreType: "Percentage",
      scoreValue: "85",
    });
  });

  it.each([
    ["85%", "Percentage"],
    ["85", "Percentage"],
    ["8.5", "CGPA"],
    ["3.8", "GPA"],
    ["450/500", "Marks"],
    ["8.5/10", "CGPA"],
  ])("infers %s as %s when the type is absent", (grade, expectedType) => {
    const mapped = mapParserOutputToBuilderData({
      education: [{ school: "Example University", grade }],
    });

    expect(mapped.education?.[0].scoreType).toBe(expectedType);
  });

  it("uses an explicit percentage source field before numeric inference", () => {
    const mapped = mapParserOutputToBuilderData({
      education: [{ school: "Example University", percentage: "8" }],
    });

    expect(mapped.education?.[0]).toMatchObject({ scoreType: "Percentage", scoreValue: "8" });
  });

  it.each(["78%", "90", "90%"])(
    "corrects an impossible parser CGPA/value pair for %s",
    (scoreValue) => {
      const mapped = mapParserOutputToBuilderData({
        education: [{ school: "Example University", scoreType: "CGPA", scoreValue }],
      });

      expect(mapped.education?.[0]).toMatchObject({
        scoreType: "Percentage",
        scoreValue: scoreValue.replace("%", ""),
      });
    }
  );

  it("stores an explicit percentage value without a duplicate display suffix", () => {
    const mapped = mapParserOutputToBuilderData({
      education: [{ school: "Example University", scoreType: "Percentage", scoreValue: "90%" }],
    });

    expect(mapped.education?.[0]).toMatchObject({ scoreType: "Percentage", scoreValue: "90" });
  });
});

describe("enhancer latest-edit precedence", () => {
  it("prefers canonical user-edited sections over stale llm_data after reload", () => {
    const mapped = mapParserOutputToBuilderData({
      projects: [{ id: "project-1", title: "Latest project", description: "Latest text" }],
      workExperience: [{ id: "work-1", company: "Latest company", role: "Lead" }],
      education: [{ id: "edu-1", school: "Latest university", degree: "M.Tech" }],
      certifications: [{ id: "cert-1", name: "Latest certificate", issuer: "Issuer" }],
      llm_data: {
        projects: [{ id: "project-1", title: "First ATS fix", description: "Old text" }],
        experience: [{ id: "work-1", company: "Old company", role: "Engineer" }],
        education: [{ id: "edu-1", school: "Old university", degree: "B.Tech" }],
        certifications: [{ id: "cert-1", name: "Old certificate", issuer: "Old issuer" }],
      },
    });

    expect(mapped.projects?.[0].title).toBe("Latest project");
    expect(mapped.workExperience?.[0].company).toBe("Latest company");
    expect(mapped.education?.[0].school).toBe("Latest university");
    expect(mapped.certifications?.[0].name).toBe("Latest certificate");
  });

  it("keeps an explicit empty canonical list instead of reviving stale AI content", () => {
    const mapped = mapParserOutputToBuilderData({
      projects: [],
      llm_data: { projects: [{ title: "Deleted project" }] },
    });

    expect(mapped.projects).toEqual([]);
  });

  it("preserves a legacy _id so editing an existing project cannot append a duplicate", () => {
    const mapped = mapParserOutputToBuilderData({
      projects: [{ _id: "project-legacy-id", title: "Inventory System" }],
    });

    expect(mapped.projects?.[0]).toMatchObject({
      id: "project-legacy-id",
      title: "Inventory System",
    });
  });
});

describe("current-date mapping", () => {
  it("keeps unknown internship and work end dates blank", () => {
    const mapped = mapParserOutputToBuilderData({
      internships: [{ company: "Acme", role: "Intern", start_date: null, end_date: null }],
      experience: [{ company: "Acme", role: "Engineer", start_date: "Jan 2024", end_date: null }],
    });

    expect(mapped.internships?.[0]).toMatchObject({
      startDate: "",
      endDate: "",
      currentlyWorking: false,
    });
    expect(mapped.workExperience?.[0]).toMatchObject({
      startDate: "Jan 2024",
      endDate: "",
      currentlyWorking: false,
    });
  });

  it("shows Present only for an explicit current signal", () => {
    const mapped = mapParserOutputToBuilderData({
      internships: [{ company: "Acme", role: "Intern", end_date: "Present" }],
      experience: [{ company: "Acme", role: "Engineer", currently_working: true, end_date: null }],
    });

    expect(mapped.internships?.[0]).toMatchObject({ endDate: "Present", currentlyWorking: true });
    expect(mapped.workExperience?.[0]).toMatchObject({ endDate: "Present", currentlyWorking: true });
  });
});
describe("persisted custom section mapping", () => {
  it("restores saved list fields instead of falling back to parser metadata", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [{
        id: "strengths-id",
        sectionName: "Strengths",
        fields: [{
          id: "strength-list",
          fieldName: "Core strengths",
          fieldType: "list",
          value: ["Java", "Python", "Playwright"],
        }],
      }],
      section_metadata: [{ original_name: "Stale parser section", mapped_to: "stale_parser_section" }],
      stale_parser_section: ["Do not use this"],
    });

    expect(mapped.customSections).toEqual([{
      id: "strengths-id",
      sectionName: "Strengths",
      fields: [{
        id: "strength-list",
        fieldName: "Core strengths",
        fieldType: "list",
        value: ["Java", "Python", "Playwright"],
      }],
    }]);
  });

  it("honors an explicit empty persisted collection instead of reviving stale parser data", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [],
      section_metadata: [{ original_name: "Strengths", mapped_to: "strengths" }],
      strengths: ["Java", "Python", "Playwright"],
    });

    expect(mapped.customSections).toEqual([]);
  });
});