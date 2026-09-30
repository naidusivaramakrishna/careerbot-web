import { describe, expect, it } from "vitest";
import {
  findCustomSectionByName,
  hasRenderableCustomSectionContent,
  isRedundantCustomSectionFieldLabel,
  normalizeCustomSectionName,
} from "@/app/(resume)/builder/creation/_utils/customSectionIdentity";
import { mapParserOutputToBuilderData } from "@/utils/resumeMappers";

describe("custom section identity and empty-shell persistence", () => {
  it("matches names case-insensitively and ignores surrounding whitespace", () => {
    const strengths = { id: "strengths-id", sectionName: "Strengths", fields: [] };

    expect(findCustomSectionByName([strengths], "  strengths ")).toBe(strengths);
    expect(normalizeCustomSectionName(" Core   Strengths ")).toBe("core strengths");
  });

  it("hides empty definitions from previews until a field has content", () => {
    expect(hasRenderableCustomSectionContent({
      id: "strengths-id",
      sectionName: "Strengths",
      fields: [{ id: "field-1", fieldName: "Core Strengths", fieldType: "list", value: ["", "  "] }],
    })).toBe(false);

    expect(hasRenderableCustomSectionContent({
      id: "strengths-id",
      sectionName: "Strengths",
      fields: [{ id: "field-1", fieldName: "Core Strengths", fieldType: "list", value: ["Leadership"] }],
    })).toBe(true);
  });
  it("keeps an empty persisted section so its editor can add the first field", () => {
    const mapped = mapParserOutputToBuilderData({
      customSections: [{
        id: "strengths-id",
        sectionName: "Strengths",
        fields: [],
        items: [],
      }],
    });

    expect(mapped.customSections).toEqual([{
      id: "strengths-id",
      sectionName: "Strengths",
      fields: [],
    }]);
  });

  describe("isRedundantCustomSectionFieldLabel", () => {
    it("is true for the backend's Strengths backfill shape (one field named the same as the section)", () => {
      const section = {
        sectionName: "Strengths",
        fields: [{ id: "field-1", fieldName: "Strengths", fieldType: "list" as const, value: ["Leadership"] }],
      };
      expect(isRedundantCustomSectionFieldLabel(section, section.fields[0])).toBe(true);
    });

    it("is case/whitespace-insensitive, matching findCustomSectionByName's own matching rules", () => {
      const section = {
        sectionName: "  strengths ",
        fields: [{ id: "field-1", fieldName: "Strengths", fieldType: "list" as const, value: ["Leadership"] }],
      };
      expect(isRedundantCustomSectionFieldLabel(section, section.fields[0])).toBe(true);
    });

    it("is false when the section has more than one field, even if one matches the name", () => {
      const section = {
        sectionName: "Strengths",
        fields: [
          { id: "field-1", fieldName: "Strengths", fieldType: "list" as const, value: ["Leadership"] },
          { id: "field-2", fieldName: "Source", fieldType: "text" as const, value: "Parsed resume" },
        ],
      };
      expect(isRedundantCustomSectionFieldLabel(section, section.fields[0])).toBe(false);
    });

    it("is false when the single field's name differs from the section name", () => {
      const section = {
        sectionName: "Tools",
        fields: [{ id: "field-1", fieldName: "Languages", fieldType: "list" as const, value: ["Python"] }],
      };
      expect(isRedundantCustomSectionFieldLabel(section, section.fields[0])).toBe(false);
    });
  });
});

