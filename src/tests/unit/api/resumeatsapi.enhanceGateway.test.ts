import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Uses the real enhancerApi (safePost) so the test covers what reaches
// processResumeComplete when the gateway in front of careerbot-api answers
// /resume/enhance with a 502/503/504 and a non-JSON body.
const mockHttpClient = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() }));

vi.mock("@/lib/http", () => ({ default: mockHttpClient }));
vi.mock("@/api/authApi", () => ({ isAuthenticated: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/correlationId", () => ({ getCorrelationId: () => "corr-1" }));
vi.mock("@/lib/tracing", () => ({
  logApiRequest: vi.fn(), logApiResponse: vi.fn(), logApiError: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  default: { api: { request: vi.fn() }, debug: vi.fn() },
}));
vi.mock("@/api/parserApi", () => ({ getResume: vi.fn() }));

import { processResumeComplete } from "@/api/resumeatsapi";

const file = () => new File(["x"], "resume.pdf", { type: "application/pdf" });
const parsedOk = () =>
  new Response(JSON.stringify({ resume_id: "r-1", parsed_data: {} }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

function gatewayError(status: number, statusText: string, body: string) {
  const config = { headers: new AxiosHeaders(), url: "/resume/enhance", method: "post" };
  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    config,
    {},
    { status, statusText, data: body, headers: {}, config },
  );
}

const nginxPage = (status: number, statusText: string) =>
  `<html>\r\n<head><title>${status} ${statusText}</title></head>\r\n<body>\r\n<center><h1>${status} ${statusText}</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n`;

describe("processResumeComplete with a gateway 5xx from the enhance step", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    mockHttpClient.post.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each([
    [502, "Bad Gateway"],
    [503, "Service Temporarily Unavailable"],
    [504, "Gateway Time-out"],
  ])("shows the friendly ATS-analysis message for a %i HTML body, not the raw page", async (status, statusText) => {
    fetchMock.mockResolvedValueOnce(parsedOk());
    mockHttpClient.post.mockRejectedValueOnce(gatewayError(status, statusText, nginxPage(status, statusText)));

    const result = await processResumeComplete(file());

    expect(result).toMatchObject({ success: false });
    const error = (result as { error: string }).error;
    expect(error).toMatch(/ATS analysis could not be completed after your resume was parsed/i);
    expect(error).not.toMatch(/<html|nginx/i);
  });

  it("keeps a non-5xx enhance error's own message (for example a 402 credits error)", async () => {
    fetchMock.mockResolvedValueOnce(parsedOk());
    const config = { headers: new AxiosHeaders(), url: "/resume/enhance", method: "post" };
    mockHttpClient.post.mockRejectedValueOnce(new AxiosError(
      "Request failed with status code 402", AxiosError.ERR_BAD_REQUEST, config, {},
      { status: 402, statusText: "Payment Required", data: { detail: "Insufficient credits" }, headers: {}, config },
    ));

    const result = await processResumeComplete(file());

    expect((result as { error: string }).error).toMatch(/don't have enough credits/i);
  });
});
