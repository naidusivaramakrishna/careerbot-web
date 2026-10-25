import { describe, expect, it } from "vitest";
import { resolveTargetRole } from "./targetRole";

describe("resolveTargetRole", () => {
  it("takes an explicit role first, then the builder's target role, the headline and the latest job", () => {
    expect(resolveTargetRole({ target_role: "Data Analyst", headline: "Backend Developer" })).toBe("Data Analyst");
    expect(resolveTargetRole({ professionalSummary: { targetRole: "QA Engineer" }, headline: "Backend Developer" })).toBe("QA Engineer");
    expect(resolveTargetRole({ headline: "Backend Developer | Python" })).toBe("Backend Developer");
    expect(resolveTargetRole({ headline: [{ value: "Full Stack Developer" }] })).toBe("Full Stack Developer");
    expect(resolveTargetRole({ experience: [{ role: "Support Engineer" }] })).toBe("Support Engineer");
  });

  it("returns null when the resume names no role, so the user is asked", () => {
    expect(resolveTargetRole({})).toBeNull();
    expect(resolveTargetRole(null)).toBeNull();
    expect(resolveTargetRole({ headline: "", experience: [] })).toBeNull();
  });

  it.each(["string", "N/A", "none", "  "])("does not take the placeholder %p as a role", (value) => {
    expect(resolveTargetRole({ target_role: value })).toBeNull();
  });

  it("does not take a status word from the headline as the role", () => {
    expect(resolveTargetRole({ headline: "Fresher | Seeking opportunities" })).toBeNull();
    expect(resolveTargetRole({ headline: "Student" })).toBeNull();
    expect(resolveTargetRole({ headline: "Fresher | Backend Developer" })).toBe("Backend Developer");   // a real role after it still counts
  });
});
