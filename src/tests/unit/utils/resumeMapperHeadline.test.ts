import { describe, it, expect } from "vitest";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";

// The export prints the parsed headline under the name unless a target role is set. The editor only shows the
// target role, so a headline it could not show kept printing: it is shown as the target role now.
describe("the title line under the name", () => {
  it("shows the headline the parser read when no target role is set", () => {
    const mapped = mapParserOutputToBuilderData({ contact: { name: "Shravya P" }, headline: "Intern" } as never);
    expect(mapped.professionalSummary.targetRole).toBe("Intern");
  });

  it("prefers the target role the user set over the headline", () => {
    const mapped = mapParserOutputToBuilderData({
      contact: { name: "Shravya P" },
      headline: "Intern",
      professionalSummary: { summary: "x", targetRole: "Data Analyst" },
    } as never);
    expect(mapped.professionalSummary.targetRole).toBe("Data Analyst");
  });

  it("uses the first usable headline segment, as the scan does, not the whole string", () => {
    const mapped = mapParserOutputToBuilderData({
      contact: { name: "Shravya P" },
      headline: "Fresher | Open to work | Data Analyst",
    } as never);
    expect(mapped.professionalSummary.targetRole).toBe("Data Analyst");
  });

  it("shows nothing when the headline is only a situation, not a role", () => {
    const mapped = mapParserOutputToBuilderData({ contact: { name: "Shravya P" }, headline: "Fresher | Open to work" } as never);
    expect(mapped.professionalSummary.targetRole).toBe("");
  });

  it("shows nothing when the resume has neither", () => {
    const mapped = mapParserOutputToBuilderData({ contact: { name: "Shravya P" } } as never);
    expect(mapped.professionalSummary.targetRole).toBe("");
  });
});
