/**
 * Boundary coverage for the profile resume-import CGPA conversion (PR #144
 * review); this path had no test. Out-of-range matters more here than in the
 * builder: import POSTs this value after DELETING the user's education rows
 * (RightSection.tsx:139-146 then :227-240, one catch around the loop), so a
 * rejected cgpa loses every row with no field error. Hence reported absent
 * rather than clamped to 10, which would relabel a 98% student as a 10.
 */
import { describe, it, expect } from "vitest";
import { mapResumeToProfile } from "@/app/(user)/profile/_utils/resumeMapper";
import type { ResumeExtractResponse } from "@/api/resumeParsingApi";

// mapResumeToProfile returns {} unless the response carries parsed_data
// (resumeMapper.ts:40, :47).
const withGrade = (grade: unknown) =>
  ({
    parsed_data: {
      education: [{ college: "Example University", degree: "B.Tech", branch: "CSE", grade }],
    },
  } as unknown as ResumeExtractResponse);

const cgpaFor = (grade: unknown) => mapResumeToProfile(withGrade(grade)).education?.[0]?.cgpa;

describe("mapResumeToProfile — education CGPA", () => {
  it.each([["8.5", 8.5], ["10", 10], ["0", 0], ["9.99", 9.99]])(
    "passes a value already on the 10-point scale through unchanged: %s",
    (grade, expected) => { expect(cgpaFor(grade)).toBe(expected); },
  );

  it.each([["85%", 8.95], ["85", 8.95], ["95%", 10], ["76", 8]])(
    "converts a percentage with the CBSE 9.5 factor: %s -> %s",
    (grade, expected) => { expect(cgpaFor(grade)).toBeCloseTo(expected as number, 2); },
  );

  // "450/500" is a total-marks string parseFloat reads as a bare 450.
  it.each([["100%"], ["100"], ["99"], ["96"], ["450/500"], ["-5"]])(
    "omits cgpa when the conversion lands off the 10-point scale: %s",
    (grade) => { expect(cgpaFor(grade)).toBeUndefined(); },
  );

  it.each([[null], [undefined], [""], ["   "], ["Distinction"], ["First Class"]])(
    "omits cgpa for a missing or non-numeric grade: %s",
    (grade) => { expect(cgpaFor(grade)).toBeUndefined(); },
  );

  it("never returns a value above the max=\"10\" the profile form declares", () => {
    for (let pct = 0; pct <= 200; pct++) {
      const value = cgpaFor(String(pct));
      if (value === undefined) continue;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
  });
});
