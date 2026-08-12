import { describe, it, expect } from "vitest";
import {
  getMatchBand,
  getMatchLabel,
  getMatchAlignmentLabel,
} from "@/app/cover-letter/_utils/matchLabel";

describe("matchLabel band boundaries", () => {
  it.each([
    [14, "very-low"],
    [15, "low"],
    [29, "low"],
    [30, "low"],
    [34, "low"],
    [35, "moderate"],
    [49, "moderate"],
    [50, "moderate"],
    [69, "moderate"],
    [70, "good"],
    [84, "good"],
    [85, "excellent"],
    [100, "excellent"],
  ])("getMatchBand(%i) === %s", (score, expected) => {
    expect(getMatchBand(score)).toBe(expected);
  });

  it("restores the Excellent Match tier at 85+", () => {
    expect(getMatchLabel(85)).toBe("Excellent Match");
    expect(getMatchLabel(100)).toBe("Excellent Match");
  });

  it("still labels 70-84 as Good Match", () => {
    expect(getMatchLabel(70)).toBe("Good Match");
    expect(getMatchLabel(84)).toBe("Good Match");
  });

  it("keeps JDMatchMatrix's original 70/35 alignment boundaries", () => {
    expect(getMatchAlignmentLabel(70)).toBe("Strong JD alignment");
    expect(getMatchAlignmentLabel(69)).toBe("Moderate JD alignment");
    expect(getMatchAlignmentLabel(35)).toBe("Moderate JD alignment");
    expect(getMatchAlignmentLabel(34)).toBe("Low JD alignment");
  });

  it("treats excellent scores as Strong JD alignment too", () => {
    expect(getMatchAlignmentLabel(95)).toBe("Strong JD alignment");
  });
});
