import { describe, expect, it } from "vitest";
import { cleanTargetRole, resolveTargetRole } from "./targetRole";

describe("resolveTargetRole", () => {
  it("takes an explicit role first, then the builder's target role, the headline and the latest job", () => {
    expect(resolveTargetRole({ target_role: "Data Analyst", headline: "Backend Developer" })).toBe("Data Analyst");
    expect(resolveTargetRole({ professionalSummary: { targetRole: "QA Engineer" }, headline: "Backend Developer" })).toBe("QA Engineer");
    expect(resolveTargetRole({ headline: "Backend Developer | Python" })).toBe("Backend Developer");
    expect(resolveTargetRole({ headline: [{ value: "Full Stack Developer" }] })).toBe("Full Stack Developer");
    expect(resolveTargetRole({ experience: [{ role: "Support Engineer" }] })).toBe("Support Engineer");
  });

  it.each(["work_experience", "workExperience", "professional_experience"])("finds the latest job title under %s", (key) => {
    expect(resolveTargetRole({ [key]: [{ title: "Data Engineer" }] })).toBe("Data Engineer");
    expect(resolveTargetRole({ headline: "", [key]: [{ role: "" }, { job_title: "QA Engineer" }] })).toBe("QA Engineer");
  });

  it("returns null when the resume names no role, so the user is asked", () => {
    expect(resolveTargetRole({})).toBeNull();
    expect(resolveTargetRole(null)).toBeNull();
    expect(resolveTargetRole({ headline: "", experience: [] })).toBeNull();
  });

  it.each(["string", "N/A", "none", "  ", "role", "Target_Role", "Not specified", "x"])("does not take the placeholder %p as a role", (value) => {
    expect(resolveTargetRole({ target_role: value })).toBeNull();
  });

  it("does not take a status word from the headline as the role", () => {
    expect(resolveTargetRole({ headline: "Fresher | Seeking opportunities" })).toBeNull();
    expect(resolveTargetRole({ headline: "Student" })).toBeNull();
    expect(resolveTargetRole({ headline: "Fresher | Backend Developer" })).toBe("Backend Developer");   // a real role after it still counts
  });

  it("finds the role in a stored resume document, whose parsed content sits under parsed_data", () => {
    // GET /parser/get_resume returns the database document: file_name, owner ... and parsed_data.
    const doc = { _id: "r-1", file_name: "cv.pdf", parsed_data: { headline: "Software Developer", experience: [{ role: "Intern" }] } };
    expect(resolveTargetRole(doc)).toBe("Software Developer");
    expect(resolveTargetRole({ _id: "r-1", parsed_data: { work_experience: [{ title: "Data Engineer" }] } })).toBe("Data Engineer");
    expect(resolveTargetRole({ target_role: "Data Analyst", parsed_data: { headline: "Backend Developer" } })).toBe("Data Analyst");
    expect(resolveTargetRole({ _id: "r-1", parsed_data: {} })).toBeNull();
    // v1 parser output keeps the content in an llm_data wrapper; the top level still comes first
    expect(resolveTargetRole({ parsed_data: { llm_data: { experience: [{ role: "QA Engineer" }] } } })).toBe("QA Engineer");
    expect(resolveTargetRole({ headline: "Backend Developer", llm_data: { experience: [{ role: "QA Engineer" }] } })).toBe("Backend Developer");
  });
});

describe("cleanTargetRole (a role the user typed)", () => {
  it("trims a typed role and keeps any role the API accepts", () => {
    expect(cleanTargetRole("  Software Developer ")).toBe("Software Developer");
    expect(cleanTargetRole("QA")).toBe("QA");
    expect(cleanTargetRole("Student")).toBe("Student");   // a headline status word, but a role the user chose
  });

  it.each([undefined, "", " ", "x", "na", "N/A", "role", "target_role", "not specified", "string"])("rejects %p as the API does", (value) => {
    expect(cleanTargetRole(value)).toBeNull();
  });
});
