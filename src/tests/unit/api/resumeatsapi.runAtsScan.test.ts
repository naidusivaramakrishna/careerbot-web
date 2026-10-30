import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enhanceResume: vi.fn(),
  getResume: vi.fn(),
}));
vi.mock("@/api/enhancerApi", () => ({ enhanceResume: mocks.enhanceResume }));
vi.mock("@/api/parserApi", () => ({ getResume: mocks.getResume }));
vi.mock("@/lib/tracing", () => ({ logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn() }));
vi.mock("@/lib/correlationId", () => ({ getCorrelationId: () => "corr-1" }));

import { runAtsScan } from "@/api/resumeatsapi";
import { TARGET_ROLE_REQUIRED } from "@/utils/apiErrorCode";

// What GET /parser/get_resume/ returns: the stored document, with the parsed resume under parsed_data.
const storedDoc = (parsed: Record<string, unknown>) => ({ _id: "r-1", owner: "u", file_name: "cv.pdf", parsed_data: parsed });

describe("runAtsScan (dashboard ATS step) finds the role on the stored resume", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mocks.enhanceResume.mockReset().mockResolvedValue({
      success: true, enhanced_resume_id: "enh-1", ats_display: { score: 72, sections: [] }, enhancer_state: { resume: {} },
    });
    mocks.getResume.mockReset();
  });

  it("scores for the headline kept in the document's parsed_data", async () => {
    mocks.getResume.mockResolvedValue(storedDoc({ contact: { name: "Asha" }, headline: "Software Developer" }));

    await expect(runAtsScan("r-1")).resolves.toBe(72);
    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: "r-1", mode: "manual", target_role: "Software Developer" });
  });

  it("scores for the latest job kept in the v1 parser's llm_data wrapper", async () => {
    mocks.getResume.mockResolvedValue(storedDoc({ contact: { name: "Asha" }, llm_data: { experience: [{ title: "Data Engineer" }] } }));

    await expect(runAtsScan("r-1")).resolves.toBe(72);
    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: "r-1", mode: "manual", target_role: "Data Engineer" });
  });

  it("uses a role the caller passes without reading the resume", async () => {
    await runAtsScan("r-1", "  Data Analyst ");

    expect(mocks.getResume).not.toHaveBeenCalled();
    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: "r-1", mode: "manual", target_role: "Data Analyst" });
  });

  it("keeps the fixes the scan applied in the stored scan, so the report can list them", async () => {
    mocks.getResume.mockResolvedValue(storedDoc({ headline: "Software Developer" }));
    const applied = [{ suggestion_id: "suggested_summary_0", auto: true, suggestion: { id: "suggested_summary_0" } }];
    mocks.enhanceResume.mockResolvedValue({
      success: true, enhanced_resume_id: "enh-1", ats_display: { score: 72, sections: [] }, enhancer_state: { resume: {} }, applied_fixes: applied,
    });

    await runAtsScan("r-1");

    for (const key of ["atsAnalysis_r-1", "atsAnalysisData"]) {
      expect(JSON.parse(localStorage.getItem(key)!).applied_fixes).toEqual(applied);
    }
  });

  it("asks for a role, without calling enhance, when the resume names none", async () => {
    mocks.getResume.mockResolvedValue(storedDoc({ contact: { name: "Asha" } }));

    await expect(runAtsScan("r-1")).rejects.toMatchObject({ code: TARGET_ROLE_REQUIRED });
    expect(mocks.enhanceResume).not.toHaveBeenCalled();
  });

  it("reports a failed resume read as it is, not as a missing role", async () => {
    mocks.getResume.mockRejectedValue(Object.assign(new Error("Your session has expired. Please sign in again."), { status: 401 }));

    const scan = runAtsScan("r-1");

    await expect(scan).rejects.toThrow("Your session has expired. Please sign in again.");
    await expect(scan).rejects.not.toMatchObject({ code: TARGET_ROLE_REQUIRED });
    expect(mocks.enhanceResume).not.toHaveBeenCalled();
  });

  it.each(["x", "na", "Not specified", "role"])("does not send the typed placeholder %p, which the API rejects", async (typed) => {
    mocks.getResume.mockResolvedValue(storedDoc({ contact: { name: "Asha" } }));

    await expect(runAtsScan("r-1", typed)).rejects.toMatchObject({ code: TARGET_ROLE_REQUIRED });
    expect(mocks.enhanceResume).not.toHaveBeenCalled();
  });
});
