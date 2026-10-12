/**
 * Regression test for a reported bug: CGPA-to-percentage conversion in the
 * Education editor used a straight *10 multiplier, overstating the result
 * (e.g. CGPA 8.6 showed as 86% instead of 81.7%).
 *
 * Verified against CBSE's own official conversion factor: Percentage =
 * CGPA * 9.5 (not *10). This is the standard used by CBSE and most Indian
 * institutions on the 10-point scale.
 */
import { describe, it, expect } from "vitest";
import { scoreAsPercentage, convertScoreValue, validateScoreValue } from "@/app/(resume)/builder/creation/_components/editor/sections/Education";

describe("scoreAsPercentage — CGPA uses the CBSE 9.5 factor, not 10", () => {
  it("converts CGPA 8.6 to 81.7%, not 86%", () => {
    expect(scoreAsPercentage("8.6", "CGPA")).toBeCloseTo(81.7, 5);
  });

  it("converts CGPA 8.0 to 76%, not 80% (CBSE's own worked example)", () => {
    expect(scoreAsPercentage("8.0", "CGPA")).toBeCloseTo(76, 5);
  });

  it("converts CGPA 9.8 to 93.1%, not 98%", () => {
    expect(scoreAsPercentage("9.8", "CGPA")).toBeCloseTo(93.1, 5);
  });

  it("still converts a 4.0-scale GPA using *25 (unrelated scale, unaffected by this fix)", () => {
    expect(scoreAsPercentage("3.5", "GPA")).toBeCloseTo(87.5, 5);
  });
});

describe("convertScoreValue — Score Type dropdown conversion uses the same 9.5 factor", () => {
  it("converts CGPA 8.6 to Percentage as 81.7", () => {
    expect(convertScoreValue("8.6", "CGPA", "Percentage")).toBe("81.7");
  });

  it("round-trips Percentage back to CGPA using /9.5", () => {
    expect(convertScoreValue("81.7", "Percentage", "CGPA")).toBe("8.6");
  });
});

/**
 * Boundary coverage for the conversion (PR #144 review).
 *
 * *10 -> *9.5 moved the inverse off the CGPA scale: 100% was exactly 10.00,
 * now 10.53. The first review fix CLAMPED to 10 -- wrong: it collapsed every
 * grade from 95.1% to 100% onto one value, and converting back read 95%, so
 * a 98% candidate would see 95% with nothing marking the change. These lock
 * in the replacement: faithful arithmetic, with validateScoreValue (shared by
 * both writers into scoreValue) reporting the out-of-range result.
 */
describe("convertScoreValue — out-of-scale results are reported, not rewritten", () => {
  // value AND message together: the point is that each grade keeps its own
  // distinct number and is flagged, rather than being folded onto CGPA 10.
  it.each([
    ["100", "10.53", "CGPA must be between 0 and 10"],
    ["99", "10.42", "CGPA must be between 0 and 10"],
    ["98", "10.32", "CGPA must be between 0 and 10"],
    ["97", "10.21", "CGPA must be between 0 and 10"],
    ["96", "10.11", "CGPA must be between 0 and 10"],
    ["95", "10", null],
    ["94.91", "9.99", null],
  ])("Percentage %s -> CGPA %s, flagged: %s", (from, expected, message) => {
    const converted = convertScoreValue(from, "Percentage", "CGPA");
    expect(converted).toBe(expected);
    expect(validateScoreValue(converted, "CGPA")).toBe(message);
  });

  it("a percentage above 95 round-trips back to itself, not down to 95", () => {
    // The clamp broke exactly this: 98 -> CGPA 10 -> 95. Faithful arithmetic
    // returns the candidate's number give or take compactNumber's 2dp
    // (96 -> 10.11 -> 96.04), far under the 3 points the clamp removed.
    for (const pct of ["96", "97", "98", "99", "100"]) {
      const back = Number(convertScoreValue(convertScoreValue(pct, "Percentage", "CGPA"), "CGPA", "Percentage"));
      expect(back).toBeCloseTo(Number(pct), 1);
      expect(back).toBeGreaterThan(95);
    }
  });

  it("a perfect 4.0 GPA keeps its true CGPA equivalent and is flagged", () => {
    expect(convertScoreValue("4", "GPA", "CGPA")).toBe("10.53");
    expect(validateScoreValue("10.53", "CGPA")).toBe("CGPA must be between 0 and 10");
  });
});

describe("validateScoreValue — the one range rule both writers into scoreValue share", () => {
  // "98.4/100" Marks: an "earned/total" pair, not a point on a fixed scale.
  it.each([
    ["10", "CGPA", null], ["0", "CGPA", null], ["8.6", "CGPA", null],
    ["10.53", "CGPA", "CGPA must be between 0 and 10"],
    ["-1", "CGPA", "CGPA must be between 0 and 10"],
    ["4", "GPA", null], ["4.2", "GPA", "GPA must be between 0 and 4"],
    ["100", "Percentage", null],
    ["101", "Percentage", "Percentage must be between 0 and 100"],
    ["abc", "CGPA", "Score must be a number for CGPA"],
    ["98.4/100", "Marks", null], ["", "CGPA", null], ["   ", "CGPA", null],
  ] as const)("validateScoreValue(%s, %s)", (value, type, expected) => {
    expect(validateScoreValue(value, type)).toBe(expected);
  });

  it("accepts a percentage typed with its suffix", () => {
    expect(validateScoreValue("85%", "Percentage")).toBeNull();
  });

  it("inherits parseFloat's tolerance of trailing junk (pre-existing, documented)", () => {
    // convertScoreValue returns "8.5/10" verbatim; validateScoreValue reads
    // it with parseFloat -- the call the original blur validator used --
    // which stops at the slash and sees a valid 8.5. Asserted as-is rather
    // than tightened: a strict check would newly reject values already
    // stored by every previous release. Observation O-1 in the review.
    const passedThrough = convertScoreValue("8.5/10", "CGPA", "Percentage");
    expect(passedThrough).toBe("8.5/10");
    expect(validateScoreValue(passedThrough, "Percentage")).toBeNull();
  });
});

describe("scoreAsPercentage — non-numeric and empty inputs yield null, never 0", () => {
  // "8.5/10" and "85%" under CGPA: Number() rejects both, so convertScoreValue
  // returns the raw value rather than silently mis-scaling it.
  it.each([
    ["", "CGPA"], ["   ", "CGPA"], ["abc", "CGPA"], ["8.5/10", "CGPA"],
    ["85%", "CGPA"], ["abc", "Percentage"], ["abc", "Marks"], ["0/0", "Marks"],
  ] as const)("scoreAsPercentage(%s, %s) is null", (value, type) => {
    expect(scoreAsPercentage(value, type)).toBeNull();
  });

  it("a genuine zero is 0, not null", () => {
    expect(scoreAsPercentage("0", "CGPA")).toBe(0);
    expect(scoreAsPercentage("0", "Percentage")).toBe(0);
  });

  it("an undefined score type yields null", () => {
    expect(scoreAsPercentage("8.5", undefined)).toBeNull();
  });

  it("leaves a value it cannot parse untouched instead of writing a wrong number", () => {
    expect(convertScoreValue("abc", "CGPA", "Percentage")).toBe("abc");
    expect(convertScoreValue("8.5/10", "CGPA", "Percentage")).toBe("8.5/10");
  });
});

describe("convertScoreValue — CGPA round-trips are stable to 2dp", () => {
  it.each(["0", "1", "4.75", "6.3", "7.77", "8.5", "8.6", "9.1", "9.99", "10"])(
    "CGPA %s survives a round-trip through Percentage",
    (cgpa) => {
      const percentage = convertScoreValue(cgpa, "CGPA", "Percentage");
      expect(convertScoreValue(percentage, "Percentage", "CGPA")).toBe(cgpa);
    },
  );
});
