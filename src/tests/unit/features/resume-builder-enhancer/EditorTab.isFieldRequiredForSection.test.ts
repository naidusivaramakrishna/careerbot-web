/**
 * Location is optional in Personal Info, matching the form (no asterisk,
 * `required: false`). It used to be a required carve-out in Save validation, so
 * a user who undid an ATS-added location could not Save with the box empty.
 */
import { describe, it, expect } from "vitest";
import { isFieldRequiredForSection } from "@/app/(resume)/builder/creation/_components/editor/EditorTab";

describe("isFieldRequiredForSection (Location is optional everywhere)", () => {
  it("keeps Location optional in Personal Info", () => {
    expect(isFieldRequiredForSection("location", "Personal Info")).toBe(false);
  });

  it("keeps Location optional in every other section", () => {
    expect(isFieldRequiredForSection("location", "Work Experience")).toBe(false);
    expect(isFieldRequiredForSection("location", "Education")).toBe(false);
    expect(isFieldRequiredForSection("location", null)).toBe(false);
  });

  it("is case-insensitive on the field key", () => {
    expect(isFieldRequiredForSection("Location", "Personal Info")).toBe(false);
  });

  it("still requires an ordinary non-optional field regardless of section", () => {
    expect(isFieldRequiredForSection("fullname", "Personal Info")).toBe(true);
    expect(isFieldRequiredForSection("company", "Work Experience")).toBe(true);
  });

  it("still treats other globally-optional fields as optional in Personal Info", () => {
    expect(isFieldRequiredForSection("linkedin url", "Personal Info")).toBe(false);
  });
});
