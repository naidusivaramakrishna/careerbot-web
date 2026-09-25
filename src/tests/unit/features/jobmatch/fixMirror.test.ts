import { describe, expect, it } from "vitest";
import {
  addBullet,
  addCertification,
  certificationName,
  removeBullet,
  removeCertification,
  shiftHighlightsAfterRemoval,
} from "../../../../app/(jobs)/jobmatch/_components/_lib/utils/fixMirror";

describe("certification mirror", () => {
  const base = {
    certifications: [
      { name: "AWS Certified Solutions Architect - Associate", issuedBy: "AWS" },
      "Certified Kubernetes Administrator (CKA)",
    ],
  };

  it("appends the fix's certification so the preview shows it (the CBAP case)", () => {
    const result = addCertification(base, "CBAP certification");
    expect(result.status).toBe("added");
    expect(result.index).toBe(2);
    expect(result.sections.certifications.at(-1)).toBe("CBAP certification");
    expect(base.certifications).toHaveLength(2);
  });

  it("creates the list when the resume had no certifications", () => {
    const result = addCertification({ certifications: [] }, "CBAP");
    expect(result.sections.certifications).toEqual(["CBAP"]);
    expect(result.index).toBe(0);
    expect(addCertification({}, "CBAP").sections.certifications).toEqual(["CBAP"]);
  });

  it("is idempotent and case-insensitive, like the backend", () => {
    const result = addCertification(base, "  certified kubernetes administrator (cka) ");
    expect(result.status).toBe("present");
    expect(result.sections).toBe(base);
    expect(result.index).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(addCertification(base, "   ").status).toBe("invalid");
  });

  it("numbers the highlight index over named certifications only, matching the preview filter", () => {
    const sections = { certifications: [{ name: "" }, "PMP", null] };
    expect(addCertification(sections, "CBAP").index).toBe(1);
  });

  it("removes every matching entry on undo and reports the displayed positions", () => {
    const added = addCertification(base, "CBAP certification").sections;
    const result = removeCertification(added, "cbap CERTIFICATION");
    expect(result.removed).toEqual([2]);
    expect(result.sections.certifications).toEqual(base.certifications);
  });

  it("leaves sections untouched when there is nothing to undo", () => {
    const result = removeCertification(base, "Nope");
    expect(result.sections).toBe(base);
    expect(result.removed).toEqual([]);
  });

  it("reads the same name fields as the preview", () => {
    expect(certificationName({ certificate_name: " X " })).toBe("X");
    expect(certificationName({ issuedBy: "AWS" })).toBe("");
    expect(certificationName(null)).toBe("");
  });

  it("shifts later highlights down when an earlier certification is undone", () => {
    expect(shiftHighlightsAfterRemoval(["2", "3", "4"], [2])).toEqual(["2", "3"]);
    expect(shiftHighlightsAfterRemoval(["0", "5"], [1])).toEqual(["0", "4"]);
  });
});

describe("added-bullet mirror", () => {
  const sections = {
    experience: [
      { company: "Acme", responsibilities: ["Built APIs"], achievements: ["Cut costs"] },
      { company: "Older Co", description: "Did things" },
    ],
    projects: [{ title: "Side project", description: ["x"] }],
    internships: [],
  };

  it("appends to the first entry's first existing bullet list, like append_resume_bullet", () => {
    const result = addBullet(sections, "experience", "Led stakeholder workshops");
    expect(result.status).toBe("added");
    expect(result.entryIndex).toBe(0);
    expect(result.sections.experience[0].achievements).toEqual(["Cut costs", "Led stakeholder workshops"]);
    expect(result.sections.experience[0].responsibilities).toEqual(["Built APIs"]);
    expect(sections.experience[0].achievements).toEqual(["Cut costs"]);
  });

  it("creates achievements when the entry has no bullet list", () => {
    const result = addBullet(sections, "projects", "Shipped it");
    expect(result.sections.projects[0].achievements).toEqual(["Shipped it"]);
  });

  it("is idempotent", () => {
    const result = addBullet(sections, "experience", "  Cut costs ");
    expect(result.status).toBe("present");
    expect(result.sections).toBe(sections);
  });

  it("refuses unknown sections and sections with nothing to append to", () => {
    expect(addBullet(sections, "education", "x").status).toBe("invalid");
    expect(addBullet(sections, "internships", "x").status).toBe("invalid");
    expect(addBullet(sections, "experience", " ").status).toBe("invalid");
  });

  it("removes the bullet from every list on undo", () => {
    const added = addBullet(sections, "experience", "Led stakeholder workshops").sections;
    const result = removeBullet(added, "experience", "Led stakeholder workshops");
    expect(result.entryIndexes).toEqual([0]);
    expect(result.sections.experience[0].achievements).toEqual(["Cut costs"]);
  });

  it("leaves sections untouched when the bullet is not present", () => {
    const result = removeBullet(sections, "experience", "missing");
    expect(result.sections).toBe(sections);
    expect(result.entryIndexes).toEqual([]);
  });
});
