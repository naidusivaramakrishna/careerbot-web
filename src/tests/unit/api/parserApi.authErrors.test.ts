import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHttpClient = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/http", () => ({ default: mockHttpClient }));
vi.mock("@/lib/tracing", () => ({
  logApiRequest: vi.fn(),
  logApiResponse: vi.fn(),
  logApiError: vi.fn(),
}));

import { parseJDText } from "@/api/parserApi";

function axiosError(status: number) {
  const error = new Error(`Request failed with status ${status}`) as Error & {
    isAxiosError: true;
    response: { status: number; data: { message: string } };
    config: { headers: { "X-Skip-Auth-Redirect": string } };
  };
  error.isAxiosError = true;
  error.response = { status, data: { message: "Not authenticated" } };
  error.config = { headers: { "X-Skip-Auth-Redirect": "true" } };
  return error;
}

describe("parserApi authenticated errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps HTTP status and request config when JD parsing fails", async () => {
    mockHttpClient.post.mockRejectedValueOnce(axiosError(401));

    await expect(parseJDText("A job description", { skipAuthRedirect: true })).rejects.toMatchObject({
      status: 401,
      config: { headers: { "X-Skip-Auth-Redirect": "true" } },
      __raw: { message: "Not authenticated" },
    });
  });
});
