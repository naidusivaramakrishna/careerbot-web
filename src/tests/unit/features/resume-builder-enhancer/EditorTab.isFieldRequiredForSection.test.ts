/**
 * Regression test for the Personal Info "Location" required-field carve-out
 * (P2).
 *
 * The base branch had:
 *   const isRequired = isRequiredField(key) ||
 *     (openModalSection === "Personal Info" && key.toLowerCase() === "location");
 * with a comment: "location is globally optional (Work Experience etc.) but
 * required for Personal Info". This PR's rewrite of validateSectionFields
 * dropped the Personal-Info carve-out entirely (`isRequiredField(key)` on its
 * own), silently making Location optional everywhere, including Personal
 * Info, and untested. Restored the carve-out and pulled the combined check
 * into isFieldRequiredForSection so it's covered directly.
 */
import { describe, it, expect } from "vitest";
import { isFieldRequiredForSection } from "@/app/(resume)/builder/creation/_components/editor/EditorTab";

describe("isFieldRequiredForSection (Location required-field carve-out, P2 regression)", () => {
  it("requires Location in Personal Info", () => {
    expect(isFieldRequiredForSection("location", "Personal Info")).toBe(true);
  });

  it("keeps Location optional in every other section", () => {
    expect(isFieldRequiredForSection("location", "Work Experience")).toBe(false);
    expect(isFieldRequiredForSection("location", "Education")).toBe(false);
    expect(isFieldRequiredForSection("location", null)).toBe(false);
  });

  it("is case-insensitive on both the field key and the section name check", () => {
    expect(isFieldRequiredForSection("Location", "Personal Info")).toBe(true);
  });

  it("still requires an ordinary non-optional field regardless of section", () => {
    expect(isFieldRequiredForSection("fullname", "Personal Info")).toBe(true);
    expect(isFieldRequiredForSection("company", "Work Experience")).toBe(true);
  });

  it("still treats other globally-optional fields as optional in Personal Info", () => {
    expect(isFieldRequiredForSection("linkedin url", "Personal Info")).toBe(false);
  });
});
