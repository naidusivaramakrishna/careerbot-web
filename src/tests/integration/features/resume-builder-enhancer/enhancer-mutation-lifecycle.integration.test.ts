import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server, resetMSWServer, useHandler } from "../../shared/msw-server";
import {
  applyFix,
  deleteFix,
  getEnhancedResume,
  updateEnhancedResume,
} from "@/api/enhancerApi";
import {
  fixedEducationSnapshot,
  pendingEducationSnapshot,
  undoneEducationSnapshot,
} from "@/tests/fixtures/enhancer/canonicalSnapshots";

const API_V1 = "http://localhost/api/v1";
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * This is deliberately stateful. A mutation test that returns unrelated canned
 * responses cannot detect the regressions we had: data looked updated until a
 * refresh restored a duplicate or an old score/card.
 */
describe("enhancer canonical mutation lifecycle", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => resetMSWServer());
  afterAll(() => server.close());

  it("persists Education save/apply/undo snapshots across a fresh GET without duplicates", async () => {
    let state = clone(pendingEducationSnapshot);
    let applyCount = 0;
    // useHandler registers one handler per call (server.use(handler) in
    // msw-server.ts). Passing all four handlers to a single call would only
    // register the first — the rest are silently dropped as extra arguments —
    // leaving the PATCH/POST routes below unhandled.
    useHandler(http.get("*/api/v1/resume/enhance/:enhancedId", () => HttpResponse.json(state)));
    useHandler(http.patch("*/api/v1/resume/enhance/:enhancedId", () => {
      // Exact request-body shape is covered by enhancerApi.contract.test.ts.
      // This lifecycle test models the server-owned state transition instead.
      state = {
        ...state,
        revision: state.revision + 1,
        enhanced_data: {
          ...state.enhanced_data,
          education: [{ ...state.enhanced_data.education[0], endDate: "May 2025" }],
        },
      } as typeof state;
      return HttpResponse.json(state);
    }));
    useHandler(http.post("*/api/v1/resume/enhance/apply", () => {
      applyCount += 1;
      state = clone(fixedEducationSnapshot);
      return HttpResponse.json({ ...state, was_applied: applyCount === 1, already_applied: applyCount > 1 });
    }));
    useHandler(http.post("*/api/v1/resume/enhance/delete-fix", () => {
      state = clone(undoneEducationSnapshot);
      return HttpResponse.json(state);
    }));

    const initial = await getEnhancedResume("enhanced-test-1");
    expect(initial.ats_score?.final_score).toBe(60);
    expect(initial.enhanced_data.education).toHaveLength(1);

    await updateEnhancedResume("enhanced-test-1", {
      enhanced_sections: {
        education: [{ ...initial.enhanced_data.education[0], endDate: "May 2025" }],
      },
    });
    const fixed = await applyFix({
      enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0", fix_type: "manual", value: "May 2025",
    });
    expect(fixed.ats_score?.final_score).toBe(64);
    expect(fixed.applied_fixes).toEqual([expect.objectContaining({ suggestion_id: "education_issue_0" })]);

    const refreshedFixed = await getEnhancedResume("enhanced-test-1");
    expect(refreshedFixed.enhanced_data.education).toEqual([
      expect.objectContaining({ id: "edu-1", endDate: "May 2025" }),
    ]);
    expect(refreshedFixed.ats_score?.section_breakdown?.Education?.percentage).toBe(100);

    await deleteFix({ enhancer_state: "enhanced-test-1", suggestion_id: "education_issue_0" });
    const refreshedUndone = await getEnhancedResume("enhanced-test-1");
    expect(refreshedUndone.ats_score?.final_score).toBe(60);
    expect(refreshedUndone.suggestions).toEqual([
      expect.objectContaining({ id: "education_issue_0" }),
    ]);
    expect(refreshedUndone.enhanced_data.education).toHaveLength(1);
  });
});
