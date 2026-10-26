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
