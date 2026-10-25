import { describe, expect, it } from "vitest";
import { isAiScanResponse, normalizeScanResponse } from "./aiScanResponse";
import aiFixtures from "../tests/fixtures/enhancer/__fixtures__/ai.json";
import oldFixtures from "../tests/fixtures/enhancer/__fixtures__/old.json";

const { post_enhance: aiPost, get: aiGet, apply: aiApply, delete_fix: aiDelete, autosave: aiAutosave, bulk: aiBulk } = aiFixtures;
const { post_enhance: oldPost, get: oldGet, apply: oldApply, delete_fix: oldDelete, autosave: oldAutosave, bulk: oldBulk } = oldFixtures;


// fixtures are arbitrary JSON bodies
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

const cases: Array<[string, Rec, Rec]> = [
  ["POST /resume/enhance", aiPost, oldPost],
  ["GET /resume/enhance/{id}", aiGet, oldGet],
  ["apply fix", aiApply, oldApply],
  ["delete fix", aiDelete, oldDelete],
  ["autosave", aiAutosave, oldAutosave],
];

const ids = (list: Rec[] | undefined) => (list ?? []).map((s) => s.id);

describe.each(cases)("normalizeScanResponse: %s", (_name, ai, old) => {
  const out = normalizeScanResponse(ai) as Rec;

  it("recognises the AI format and converts it", () => {
    expect(isAiScanResponse(ai)).toBe(true);
    expect(isAiScanResponse(out)).toBe(false);
  });

  it("gives the editor the same resume", () => {
    expect(out.enhanced_data).toEqual(ai.resume_json);
    expect(out.enhancer_state.resume).toEqual(ai.resume_json);
  });

  it("keeps the score and the section scores", () => {
    expect(out.ats_display.score).toBe(old.ats_display.score);
    expect(out.ats_score.final_score).toBe(old.ats_breakdown.final_score);
    for (const [name, row] of Object.entries<Rec>(old.ats_breakdown.section_breakdown ?? {})) {
      const got = out.ats_score.section_breakdown[name];
      expect(got, name).toBeDefined();
      expect(got.score).toBe(row.score);
      expect(got.max_pts).toBe(row.max_pts);
    }
  });

  it("lists the same individual fixes as before, in order, with the same messages", () => {
    expect(ids(out.suggestions)).toEqual(ids(old.suggestions));
    for (const [i, fix] of (old.suggestions as Rec[]).entries()) {
      expect(out.suggestions[i].section).toBe(fix.section);
      expect(out.suggestions[i].fix_type).toBe(fix.fix_type);
    }
  });

  it("keeps the apply-all offers as bulk suggestions and out of the individual list", () => {
    expect(ids(out.ats_display.bulk_suggestions)).toEqual(ids(old.ats_display.bulk_suggestions));
    expect(ids(out.suggestions).some((id) => id === "apply_all_fixes" || String(id).endsWith("_apply_all"))).toBe(false);
  });

  it("keeps completeness, section order and the API's own fields", () => {
    expect(out.ats_display.completeness).toEqual(old.ats_display.completeness);
    expect(out.ats_display.recommended_section_order).toEqual(old.ats_display.recommended_section_order);
    if ("applied_fixes" in old) expect(out.applied_fixes).toEqual(old.applied_fixes);
    expect(out.enhanced_resume_id).toBe(old.enhanced_resume_id);
  });
});

describe("normalizeScanResponse: bulk save", () => {
  it("converts the wrapped record and keeps the wrapper fields", () => {
    const out = normalizeScanResponse(aiBulk) as Rec;
    expect(out.message).toBe(aiBulk.message);
    expect(out.enhanced_resume.enhanced_data).toEqual(aiBulk.enhanced_resume.resume_json);
    expect(ids(out.enhanced_resume.suggestions)).toEqual(ids(oldBulk.suggestions));
  });
});

describe("normalizeScanResponse: other payloads", () => {
  it("returns a non-AI payload untouched", () => {
    const legacy = { ats_display: { score: 80 }, suggestions: [] };
    expect(normalizeScanResponse(legacy)).toBe(legacy);
    expect(normalizeScanResponse(null)).toBeNull();
    expect(normalizeScanResponse({ message: "ok" })).toEqual({ message: "ok" });
  });

  it("marks a read-only fix (ui_action) as info", () => {
    const raw = {
      resume_json: {},
      sections: [{ name: "Career", fixes: [{ id: "x_gap", fix_type: "manual", ui_action: "review_content", reason: "r" }] }],
      suggestions: [],
    };
    const out = normalizeScanResponse(raw) as Rec;
    expect(out.suggestions[0].fix_type).toBe("info");
  });
});
