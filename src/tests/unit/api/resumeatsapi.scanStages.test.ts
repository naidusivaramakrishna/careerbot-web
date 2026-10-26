import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enhanceResume: vi.fn(),
  getResume: vi.fn(),
  isAuthenticated: vi.fn(),
}));
vi.mock("@/api/enhancerApi", () => ({ enhanceResume: mocks.enhanceResume }));
vi.mock("@/api/parserApi", () => ({ getResume: mocks.getResume }));
vi.mock("@/api/authApi", () => ({ isAuthenticated: mocks.isAuthenticated }));
vi.mock("@/lib/tracing", () => ({ logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn() }));
vi.mock("@/lib/correlationId", () => ({ getCorrelationId: () => "corr-1" }));

import { processResumeComplete } from "@/api/resumeatsapi";
import targetRoleRequiredBody from "@/tests/fixtures/enhancer/__fixtures__/targetRoleRequired.json";

const file = () => new File(["x"], "resume.pdf", { type: "application/pdf" });
const parsedOk = { resume_id: "src-1", cache_hit: false, parsed_data: { contact: { name: "Asha" }, headline: "Software Developer" } };
const parsedNoRole = { resume_id: "src-1", cache_hit: false, parsed_data: { contact: { name: "Asha" } } };

function mockParse(body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, status: 200, headers: { get: () => null }, json: async () => body, text: async () => JSON.stringify(body),
  }));
}

describe("processResumeComplete reports what it is really doing", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mocks.enhanceResume.mockReset();
    mocks.getResume.mockReset().mockResolvedValue({});
    mocks.isAuthenticated.mockReset().mockResolvedValue(true);
  });

  it("announces each stage in order, as it starts", async () => {
    mockParse(parsedOk);
    const order: string[] = [];
    mocks.enhanceResume.mockImplementation(async () => {
      order.push("enhance-called");
      return { success: true, enhanced_resume_id: "enh-1", ats_display: { score: 70, sections: [] }, enhancer_state: { resume: {} } };
    });

    const result = await processResumeComplete(file(), { onStage: (stage) => order.push(stage) });

    expect(order).toEqual(["parsing", "scoring", "enhance-called", "finishing"]);
    expect(result.success).toBe(true);
  });

  it("does not announce scoring when the parse itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 500, headers: { get: () => null }, text: async () => "boom", json: async () => ({}),
    }));
    const stages: string[] = [];

    const result = await processResumeComplete(file(), { onStage: (stage) => stages.push(stage) });

    expect(stages).toEqual(["parsing"]);
    expect(result.success).toBe(false);
    expect(mocks.enhanceResume).not.toHaveBeenCalled();
  });

  it("sends the role the user typed with the enhance request", async () => {
    mockParse(parsedOk);
    mocks.enhanceResume.mockResolvedValue({ success: true, enhanced_resume_id: "enh-1", ats_display: { score: 50, sections: [] }, enhancer_state: { resume: {} } });

    await processResumeComplete(file(), { targetRole: "  Software Developer " });

    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: "src-1", mode: "auto", target_role: "Software Developer" });
  });

  it("asks again, and sends no scan request, when the typed role is a placeholder the API rejects", async () => {
    mockParse(parsedNoRole);

    const result = await processResumeComplete(file(), { targetRole: "na" });

    expect(result).toMatchObject({ success: false, code: "target_role_required" });
    expect(mocks.enhanceResume).not.toHaveBeenCalled();
  });

  it("sends the role the resume names when the user typed none", async () => {
    mockParse(parsedOk);
    mocks.enhanceResume.mockResolvedValue({ success: true, enhanced_resume_id: "enh-1", ats_display: { score: 50, sections: [] }, enhancer_state: { resume: {} } });

    await processResumeComplete(file());

    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: "src-1", mode: "auto", target_role: "Software Developer" });
  });

  it("asks for a role, and sends no scan request, when the resume names none", async () => {
    mockParse(parsedNoRole);
    const stages: string[] = [];

    const result = await processResumeComplete(file(), { onStage: (stage) => stages.push(stage) });

    expect(result).toMatchObject({ success: false, code: "target_role_required" });
    expect(mocks.enhanceResume).not.toHaveBeenCalled();                  // nothing is charged without a role
    expect(stages).toEqual(["parsing"]);
  });

  it("parses the file once: the role typed afterwards is scored on the parse already done", async () => {
    mockParse(parsedNoRole);
    mocks.enhanceResume.mockResolvedValue({ success: true, enhanced_resume_id: "enh-1", ats_display: { score: 50, sections: [] }, enhancer_state: { resume: {} } });
    const stages: string[] = [];

    const first = await processResumeComplete(file());
    expect(first).toMatchObject({ success: false, code: "target_role_required" });
    const kept = (first as { parsed?: unknown }).parsed;
    expect(kept).toMatchObject({ resume_id: "src-1" });                    // handed back so the caller can reuse it

    const second = await processResumeComplete(file(), { targetRole: "Support Engineer", parsed: kept as never, onStage: (stage) => stages.push(stage) });

    expect(second).toMatchObject({ success: true });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);                     // one upload + parse for the whole scan
    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: "src-1", mode: "auto", target_role: "Support Engineer" });
    expect(stages).toEqual(["scoring", "finishing"]);                      // no "parsing" stage: it was already done
  });

  it("still asks again, without parsing again, when the kept parse has no role and none is typed", async () => {
    mockParse(parsedNoRole);
    const first = await processResumeComplete(file());

    const again = await processResumeComplete(file(), { parsed: (first as { parsed?: unknown }).parsed as never });

    expect(again).toMatchObject({ success: false, code: "target_role_required" });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(mocks.enhanceResume).not.toHaveBeenCalled();
  });

  it("stamps a new scanned_at when the parser answers from cache and the stored scan is reused", async () => {
    const stored = {
      resume_id: "src-1", enhanced_resume_id: "enh-1", scanned_at: "2026-10-01T09:00:00.000Z",
      target_role: "Software Developer", ats_score: { final_score: 70, score_status: "ok" },
    };
    localStorage.setItem("atsAnalysis_src-1", JSON.stringify(stored));
    mockParse({ ...parsedOk, cache_hit: true });

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: true, enhanced_resume_id: "enh-1" });
    expect(mocks.enhanceResume).not.toHaveBeenCalled();                            // reused, no credits
    const scannedAt = (result as { scanned_at?: string }).scanned_at;
    expect(scannedAt).toBeTruthy();
    expect(scannedAt).not.toBe(stored.scanned_at);                                  // a new scan, as far as the report can tell
    for (const key of ["atsAnalysis_src-1", "atsAnalysisData"]) {
      expect(JSON.parse(localStorage.getItem(key)!).scanned_at).toBe(scannedAt);    // the report reads what was stored
    }
  });

  it("does not reuse a stored scan made for another role than the one typed", async () => {
    const stored = { resume_id: "src-1", enhanced_resume_id: "enh-1", target_role: "Software Developer", ats_score: { score_status: "ok" } };
    localStorage.setItem("atsAnalysis_src-1", JSON.stringify(stored));
    localStorage.setItem("atsAnalysisData", JSON.stringify(stored));
    mockParse({ ...parsedOk, cache_hit: true });
    mocks.enhanceResume.mockResolvedValue({ success: true, enhanced_resume_id: "enh-2", ats_display: { score: 50, sections: [] }, enhancer_state: { resume: {} } });

    const result = await processResumeComplete(file(), { targetRole: "Data Analyst" });

    expect(mocks.enhanceResume).toHaveBeenCalledWith({ resume_id: "src-1", mode: "auto", target_role: "Data Analyst" });
    expect(result).toMatchObject({ success: true, enhanced_resume_id: "enh-2", target_role: "Data Analyst" });
  });

  it("still reuses the stored scan when the typed role is the one it was made for", async () => {
    const stored = { resume_id: "src-1", enhanced_resume_id: "enh-1", target_role: "Software Developer", ats_score: { score_status: "ok" } };
    localStorage.setItem("atsAnalysis_src-1", JSON.stringify(stored));
    mockParse({ ...parsedOk, cache_hit: true });

    const result = await processResumeComplete(file(), { targetRole: " software developer " });

    expect(mocks.enhanceResume).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, enhanced_resume_id: "enh-1" });
  });

  it("stamps a new scanned_at on the legacy stored scan too, and migrates it", async () => {
    const legacy = { resume_id: "src-1", enhanced_resume_id: "enh-1", scanned_at: "2026-10-01T09:00:00.000Z", ats_score: { score_status: "ok" } };
    localStorage.setItem("atsAnalysisData", JSON.stringify(legacy));
    mockParse({ ...parsedOk, cache_hit: true });

    const result = await processResumeComplete(file());

    const scannedAt = (result as { scanned_at?: string }).scanned_at;
    expect(scannedAt).not.toBe(legacy.scanned_at);
    expect(JSON.parse(localStorage.getItem("atsAnalysis_src-1")!).scanned_at).toBe(scannedAt);
  });

  it("returns the API's error code so the page can ask for a missing role", async () => {
    mockParse(parsedOk);
    mocks.enhanceResume.mockRejectedValue(Object.assign(new Error(targetRoleRequiredBody.error.message), {
      status: 422,
      __raw: targetRoleRequiredBody,
    }));

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: false, code: "target_role_required" });
    if (!result.success) expect(result.error).toContain("could not tell which role");
  });

  it("has no code for an ordinary failure", async () => {
    mockParse(parsedOk);
    mocks.enhanceResume.mockRejectedValue(new Error("Something broke"));

    const result = await processResumeComplete(file());

    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBeUndefined();
  });
});
