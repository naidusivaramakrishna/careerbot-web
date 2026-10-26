import { describe, expect, it } from "vitest";
import { countUserAppliedFixes, userAppliedFixes } from "@/utils/appliedFixes";

describe("userAppliedFixes", () => {
  const ledger = [
    { suggestion_id: "a", status: "applied", auto: true },
    { suggestion_id: "b", status: "applied" },
    { suggestion_id: "c", status: "applied", auto: false },
  ];

  it("leaves out the fixes the scan applied by itself", () => {
    expect(userAppliedFixes(ledger).map((f) => (f as { suggestion_id: string }).suggestion_id)).toEqual(["b", "c"]);
    expect(countUserAppliedFixes(ledger)).toBe(2);
  });

  it("is zero for an all-automatic list, an empty list, or something that is not a list", () => {
    expect(countUserAppliedFixes([ledger[0]])).toBe(0);
    expect(countUserAppliedFixes([])).toBe(0);
    expect(countUserAppliedFixes(undefined)).toBe(0);
    expect(countUserAppliedFixes("nope")).toBe(0);
  });
});
