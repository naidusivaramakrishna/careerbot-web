import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/authApi", () => ({ isAuthenticated: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/correlationId", () => ({ getCorrelationId: () => "corr-1" }));
vi.mock("@/lib/tracing", () => ({
  logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn(),
}));
vi.mock("@/api/enhancerApi", () => ({ enhanceResume: vi.fn() }));
vi.mock("@/api/parserApi", () => ({ getResume: vi.fn() }));

import { enhanceResume } from "@/api/enhancerApi";
import { processResumeComplete } from "@/api/resumeatsapi";

const file = () => new File(["x"], "resume.pdf", { type: "application/pdf" });
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const realLocalSetItem = vi.mocked(window.localStorage.setItem).getMockImplementation()!;
const realLocalGetItem = vi.mocked(window.localStorage.getItem).getMockImplementation()!;

// Same lookup order as the report page (atslogin/report/page.tsx).
const readReport = (key: string) => window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);

describe("ATS analysis storage when localStorage is full", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    fetchMock.mockReset();
    vi.mocked(enhanceResume).mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.mocked(window.localStorage.setItem).mockImplementation(realLocalSetItem);
    vi.mocked(window.localStorage.getItem).mockImplementation(realLocalGetItem);
    vi.unstubAllGlobals();
  });

  it("does not leave an older localStorage report shadowing the fresh sessionStorage copy", async () => {
    const stale = JSON.stringify({ resume_id: "r-1", enhanced_resume_id: "enh-old", finalWeightedScore: 40 });
    window.localStorage.setItem("atsAnalysis_r-1", stale);
    window.localStorage.setItem("atsAnalysisData", stale);
    vi.mocked(window.localStorage.setItem).mockImplementation((key: string, value: string) => {
      if (key.startsWith("atsAnalysis")) throw new DOMException("quota", "QuotaExceededError");
      realLocalSetItem(key, value);
    });
    fetchMock.mockResolvedValueOnce(jsonResponse({ resume_id: "r-1", parsed_data: {} }));
    vi.mocked(enhanceResume).mockResolvedValueOnce({
      success: true,
      enhanced_resume_id: "enh-new",
      ats_display: { score: 72 },
    } as never);

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: true, enhanced_resume_id: "enh-new" });
    expect(JSON.parse(readReport("atsAnalysis_r-1")!).enhanced_resume_id).toBe("enh-new");
    expect(JSON.parse(readReport("atsAnalysisData")!).enhanced_resume_id).toBe("enh-new");
  });

  it("reuses a report that only fits in sessionStorage on a parser cache hit instead of enhancing again", async () => {
    const cachedPayload = { resume_id: "r-1", ats_score: { score_status: "ok" }, finalWeightedScore: 71 };
    window.sessionStorage.setItem("atsAnalysis_r-1", JSON.stringify(cachedPayload));
    fetchMock.mockResolvedValueOnce(jsonResponse({ resume_id: "r-1", cache_hit: true, parsed_data: {} }));

    const result = await processResumeComplete(file());

    expect(enhanceResume).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: true, finalWeightedScore: 71 });
  });
});
