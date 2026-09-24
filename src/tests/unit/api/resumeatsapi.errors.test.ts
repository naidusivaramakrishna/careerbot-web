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
const textResponse = (body: string, status: number) => new Response(body, { status });

describe("processResumeComplete error reporting", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(enhanceResume).mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("shows the friendly scanned-resume message on the OCR path, not the raw backend text", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { message: "Large images detected in PDF" } }, 422));

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: false });
    expect((result as { error: string }).error).toMatch(/scanned or image-based resume/i);
    expect((result as { error: string }).error).not.toMatch(/large images detected/i);
  });

  it("does not surface a success response's message as an error when resume_id is missing", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "Resume parsed successfully" }));

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: false });
    expect((result as { error: string }).error).toMatch(/did not return a resume ID/i);
    expect((result as { error: string }).error).not.toMatch(/parsed successfully/i);
  });

  it("does not blame ATS analysis when the parse step itself returns a 500", async () => {
    fetchMock.mockResolvedValueOnce(textResponse("Internal Server Error", 500));

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: false });
    expect((result as { error: string }).error).not.toMatch(/after your resume was parsed/i);
    expect((result as { error: string }).error).toMatch(/could not (read|parse|process)/i);
    expect(enhanceResume).not.toHaveBeenCalled();
  });

  it("labels a 500 from the enhance step as an ATS analysis failure", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ resume_id: "r-1", parsed_data: {} }));
    vi.mocked(enhanceResume).mockRejectedValueOnce(new Error("Internal Server Error"));

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: false });
    expect((result as { error: string }).error).toMatch(/ATS analysis could not be completed after your resume was parsed/i);
  });

  it("still returns a cached analysis when localStorage quota is exceeded on the cache hit", async () => {
    const cachedPayload = { resume_id: "r-1", ats_score: { score_status: "ok" }, finalWeightedScore: 71 };
    vi.mocked(window.localStorage.getItem).mockImplementation((key: string) =>
      key === "atsAnalysis_r-1" ? JSON.stringify(cachedPayload) : null);
    vi.mocked(window.localStorage.setItem).mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });
    fetchMock.mockResolvedValueOnce(jsonResponse({ resume_id: "r-1", cache_hit: true, parsed_data: {} }));

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: true, finalWeightedScore: 71 });
    expect(enhanceResume).not.toHaveBeenCalled();
  });
});
