/**
 * Regression tests for transformCustomSectionsForBackend (P1).
 *
 * Two issues from review, both reproduced against this file's actual
 * behavior before the fix:
 *
 * 1. `items` is now always sent as `[]`, contradicting the comment above
 *    BackendCustomSection.fields, which claimed `fields` was sent
 *    "alongside" a populated `items`. Verified against the backend
 *    (careerbot-api): PR #184 ("fix/resume-builder-skills-export-png",
 *    commit 46f09e95, merged to develop2) updated both
 *    resume_export/pdf.py and resume_export/docx.py to read `fields`
 *    directly via a `renderable_fields` list, so sending `items: []` is
 *    safe for those two export paths -- this test locks in the *shape*
 *    the backend now expects (items: [], fields: populated), and the
 *    comment above BackendCustomSection documents the verification so it
 *    doesn't silently drift out of date again.
 *
 * 2. The empty-section filter (skip a section with no fields, or where
 *    every field is blank) was silently dropped as a side effect of this
 *    file's last rewrite. Restored, and covered here so it can't regress
 *    unnoticed a second time.
 */
import { describe, it, expect } from "vitest";
import { transformCustomSectionsForBackend } from "@/api/resumeApi";
import type { CustomSection } from "@/app/(resume)/builder/creation/_context/ResumeContext";

function section(overrides: Partial<CustomSection> = {}): CustomSection {
  return {
    id: "custom_123",
    sectionName: "Patents",
    fields: [
      { id: "f1", fieldName: "Patent Number", fieldType: "text", value: "US-123456" },
    ],
    ...overrides,
  };
}

describe("transformCustomSectionsForBackend", () => {
  it("sends items as an empty array and fields populated (backend PR #184 reads fields directly)", () => {
    const result = transformCustomSectionsForBackend([section()]);
    expect(result).toHaveLength(1);
    expect(result[0].items).toEqual([]);
    expect(result[0].fields).toEqual([
      { id: "f1", fieldName: "Patent Number", fieldType: "text", value: "US-123456" },
    ]);
  });

  it("carries sectionName and a stable 'custom' icon through", () => {
    const result = transformCustomSectionsForBackend([section({ sectionName: "Speaking Engagements" })]);
    expect(result[0].sectionName).toBe("Speaking Engagements");
    expect(result[0].icon).toBe("custom");
  });

  it("omits id for a locally-generated custom_ id (not yet persisted), keeps a real backend id", () => {
    const [localOnly, persisted] = transformCustomSectionsForBackend([
      section({ id: "custom_1700000000000_0" }),
      section({ id: "real-backend-id-abc" }),
    ]);
    expect(localOnly.id).toBeUndefined();
    expect(persisted.id).toBe("real-backend-id-abc");
  });

  it("keeps a section with no fields so it can be reopened to add the first field", () => {
    const result = transformCustomSectionsForBackend([section({ fields: [] })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sectionName: "Patents", items: [], fields: [] });
  });

  it("keeps field definitions even while their values are blank", () => {
    const fields = [
      { id: "f1", fieldName: "Notes", fieldType: "text" as const, value: "   " },
      { id: "f2", fieldName: "Tags", fieldType: "list" as const, value: [] },
    ];
    const result = transformCustomSectionsForBackend([section({ fields })]);
    expect(result).toHaveLength(1);
    expect(result[0].fields).toEqual(fields);
  });

  it("keeps a section where at least one field has real content", () => {
    const result = transformCustomSectionsForBackend([
      section({
        fields: [
          { id: "f1", fieldName: "Notes", fieldType: "text", value: "   " },
          { id: "f2", fieldName: "Tags", fieldType: "list", value: ["conference"] },
        ],
      }),
    ]);
    expect(result).toHaveLength(1);
  });

  it("keeps populated and empty editable section definitions", () => {
    const result = transformCustomSectionsForBackend([
      section({ id: "s1", sectionName: "Patents" }),
      section({ id: "s2", sectionName: "Blank Section", fields: [] }),
      section({ id: "s3", sectionName: "Speaking", fields: [
        { id: "f1", fieldName: "Event", fieldType: "text", value: "PyCon" },
      ] }),
    ]);
    expect(result.map((s) => s.sectionName)).toEqual(["Patents", "Blank Section", "Speaking"]);
  });
});
