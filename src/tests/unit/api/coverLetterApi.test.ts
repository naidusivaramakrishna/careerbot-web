/**
 * Unit tests for src/api/coverLetterApi.ts
 *
 * Covers:
 *   - CoverLetterApiError class construction
 *   - mapError() (exercised through public API functions)
 *       — all 10 HTTP status mappings
 *       — 502 CONTRACT vs non-CONTRACT distinction
 *       — 429 Retry-After header parsing
 *       — 422 validation_errors extraction (backend schema + FastAPI array)
 *       — non-axios error fallback
 *   - generateCoverLetter()
 *       — guard: throws validation when idempotency key is empty
 *       — strips include_debug_metadata regardless of input
 *       — returns data on success
 *       — re-throws mapped error on failure
 *   - getCoverLetter()
 *       — returns data on success
 *       — returns null on 404
 *       — throws mapped error on non-404 error
 *       — URL-encodes letterId
 *   - listCoverLetters()
 *       — omits limit/cursor when not provided
 *       — passes limit and cursor when provided
 *       — does not pass cursor when null
 *   - deleteCoverLetter()
 *       — returns true on 204
 *       — returns false on 404
 *       — throws mapped error on other errors
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock httpClient (must come before importing coverLetterApi) ────────────
// vi.mock() is hoisted, so we define the mock object inline

vi.mock("@/lib/http", () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import after mocking
import {
  generateCoverLetter,
  getCoverLetter,
  listCoverLetters,
  deleteCoverLetter,
  CoverLetterApiError,
} from "@/api/coverLetterApi";
import { httpClient as mockHttpClient } from "@/lib/http";

// ── Axios error factory ────────────────────────────────────────────────────
// axios.isAxiosError checks `err.isAxiosError === true`. We do not need
// to import axios itself to create a compatible error object.

function makeAxiosError(
  status: number,
  data?: object,
  headers?: Record<string, string>
): Error & { isAxiosError: true; response: object } {
  const err = new Error(`Request failed with status code ${status}`) as Error & {
    isAxiosError: true;
    response: object;
  };
  err.isAxiosError = true;
  err.response = {
    status,
    data: data ?? {},
    headers: headers ?? {},
  };
  return err;
}

function makeNetworkError(): Error & { isAxiosError: true } {
  const err = new Error("Network Error") as Error & { isAxiosError: true };
  err.isAxiosError = true;
  // No .response — simulates a connection failure.
  return err;
}

// ── CoverLetterApiError ────────────────────────────────────────────────────

describe("CoverLetterApiError", () => {
  it("sets name to 'CoverLetterApiError'", () => {
    const err = new CoverLetterApiError({ reason: "unknown" });
    expect(err.name).toBe("CoverLetterApiError");
  });

  it("sets reason", () => {
    const err = new CoverLetterApiError({ reason: "timeout" });
    expect(err.reason).toBe("timeout");
  });

  it("defaults message to reason when no message provided", () => {
    const err = new CoverLetterApiError({ reason: "unavailable" });
    expect(err.message).toBe("unavailable");
  });

  it("uses provided message over reason", () => {
    const err = new CoverLetterApiError({
      reason: "validation",
      message: "Field X is required",
    });
    expect(err.message).toBe("Field X is required");
  });

  it("sets status when provided", () => {
    const err = new CoverLetterApiError({ reason: "not_found", status: 404 });
    expect(err.status).toBe(404);
  });

  it("sets validationErrors when provided", () => {
    const errors = [{ field: "jd_id", message: "required" }];
    const err = new CoverLetterApiError({
      reason: "validation",
      validationErrors: errors,
    });
    expect(err.validationErrors).toEqual(errors);
  });

  it("sets retryAfterSeconds when provided", () => {
    const err = new CoverLetterApiError({
      reason: "rate_limit",
      retryAfterSeconds: 30,
    });
    expect(err.retryAfterSeconds).toBe(30);
  });

  it("sets backendErrorCode when provided", () => {
    const err = new CoverLetterApiError({
      reason: "upstream_contract",
      backendErrorCode: "UPSTREAM_CONTRACT_ERROR",
    });
    expect(err.backendErrorCode).toBe("UPSTREAM_CONTRACT_ERROR");
  });

  it("is an instance of Error", () => {
    const err = new CoverLetterApiError({ reason: "unknown" });
    expect(err).toBeInstanceOf(Error);
  });
});

// ── mapError via generateCoverLetter (each HTTP status) ───────────────────

describe("error mapping (via generateCoverLetter)", () => {
  const validBody = {
    parsed_resume_id: "resume-1",
    jd_id: "jd-1",
    options: { include_debug_metadata: false as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function expectReason(
    status: number,
    data?: object,
    headers?: Record<string, string>
  ) {
    mockHttpClient.post.mockRejectedValueOnce(
      makeAxiosError(status, data, headers)
    );
    try {
      await generateCoverLetter(validBody, "idem-key");
      throw new Error("expected to throw");
    } catch (err) {
      return err as CoverLetterApiError;
    }
  }

  it("maps 401 → unauthorized", async () => {
    const err = await expectReason(401);
    expect(err.reason).toBe("unauthorized");
    expect(err.status).toBe(401);
  });

  it("maps 403 → unauthorized", async () => {
    const err = await expectReason(403);
    expect(err.reason).toBe("unauthorized");
    expect(err.status).toBe(403);
  });

  it("maps 404 → not_found (but generateCoverLetter re-throws)", async () => {
    const err = await expectReason(404);
    expect(err.reason).toBe("not_found");
  });

  it("maps 409 → download_unavailable", async () => {
    const err = await expectReason(409);
    expect(err.reason).toBe("download_unavailable");
  });

  it("maps 413 → body_too_large", async () => {
    const err = await expectReason(413);
    expect(err.reason).toBe("body_too_large");
  });

  it("maps 422 → validation with validationErrors from backend schema", async () => {
    const data = {
      success: false,
      error: {
        message: "Validation failed",
        error_code: "VALIDATION_ERROR",
        details: {
          validation_errors: [
            { field: "resume_schema_version", message: "unsupported version" },
            { field: "options.candidate_note", message: "too long" },
          ],
        },
      },
    };
    const err = await expectReason(422, data);
    expect(err.reason).toBe("validation");
    expect(err.status).toBe(422);
    expect(err.validationErrors).toHaveLength(2);
    expect(err.validationErrors![0].field).toBe("resume_schema_version");
    expect(err.validationErrors![1].field).toBe("options.candidate_note");
  });

  it("maps 422 → validation with FastAPI detail array", async () => {
    const data = {
      detail: [
        { loc: ["body", "jd_id"], msg: "field required", message: "field required" },
      ],
    };
    const err = await expectReason(422, data);
    expect(err.reason).toBe("validation");
    expect(err.validationErrors).toHaveLength(1);
    expect(err.validationErrors![0].field).toBe("jd_id");
    expect(err.validationErrors![0].message).toBe("field required");
  });

  it("maps 429 → rate_limit", async () => {
    const err = await expectReason(429);
    expect(err.reason).toBe("rate_limit");
    expect(err.status).toBe(429);
  });

  it("maps 429 → rate_limit and parses numeric Retry-After header", async () => {
    const err = await expectReason(429, {}, { "retry-after": "60" });
    expect(err.reason).toBe("rate_limit");
    expect(err.retryAfterSeconds).toBe(60);
  });

  it("maps 429 with non-numeric Retry-After → retryAfterSeconds undefined", async () => {
    const err = await expectReason(429, {}, { "retry-after": "Thu, 01 Jan 2030" });
    expect(err.reason).toBe("rate_limit");
    expect(err.retryAfterSeconds).toBeUndefined();
  });

  it("maps 502 with CONTRACT in error_code → upstream_contract", async () => {
    const data = {
      success: false,
      error: { message: "contract drift", error_code: "UPSTREAM_CONTRACT_ERROR" },
    };
    const err = await expectReason(502, data);
    expect(err.reason).toBe("upstream_contract");
    expect(err.status).toBe(502);
  });

  it("maps 502 without CONTRACT in error_code → upstream_generation", async () => {
    const data = {
      success: false,
      error: { message: "ai service failed", error_code: "GENERATION_FAILED" },
    };
    const err = await expectReason(502, data);
    expect(err.reason).toBe("upstream_generation");
  });

  it("maps 503 → unavailable", async () => {
    const err = await expectReason(503);
    expect(err.reason).toBe("unavailable");
    expect(err.status).toBe(503);
  });

  it("maps 504 → timeout", async () => {
    const err = await expectReason(504);
    expect(err.reason).toBe("timeout");
    expect(err.status).toBe(504);
  });

  it("maps 500 → unknown", async () => {
    const err = await expectReason(500);
    expect(err.reason).toBe("unknown");
    expect(err.status).toBe(500);
  });

  it("maps a network error (no response) → unknown", async () => {
    mockHttpClient.post.mockRejectedValueOnce(makeNetworkError());
    try {
      await generateCoverLetter(validBody, "idem-key");
      throw new Error("expected to throw");
    } catch (err) {
      const apiErr = err as CoverLetterApiError;
      expect(apiErr.reason).toBe("unknown");
      expect(apiErr.status).toBeUndefined();
    }
  });

  it("maps a plain non-axios Error → unknown", async () => {
    mockHttpClient.post.mockRejectedValueOnce(new Error("non-axios failure"));
    try {
      await generateCoverLetter(validBody, "idem-key");
      throw new Error("expected to throw");
    } catch (err) {
      const apiErr = err as CoverLetterApiError;
      expect(apiErr.reason).toBe("unknown");
    }
  });
});

// ── generateCoverLetter() ─────────────────────────────────────────────────

describe("generateCoverLetter()", () => {
  const validBody = {
    parsed_resume_id: "resume-1",
    jd_id: "jd-1",
    options: { include_debug_metadata: false as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws a validation CoverLetterApiError when idempotency key is empty string", async () => {
    await expect(generateCoverLetter(validBody, "")).rejects.toMatchObject({
      name: "CoverLetterApiError",
      reason: "validation",
    });
    expect(mockHttpClient.post).not.toHaveBeenCalled();
  });

  it("forces include_debug_metadata: false regardless of caller input", async () => {
    mockHttpClient.post.mockResolvedValueOnce({ data: { letter_id: "x" } });

    // Pass a body without options to exercise the default branch.
    const bodyWithoutOptions = {
      parsed_resume_id: "resume-2",
      jd_id: "jd-2",
    } as Parameters<typeof generateCoverLetter>[0];

    await generateCoverLetter(bodyWithoutOptions, "key-123");

    const sentBody = mockHttpClient.post.mock.calls[0][1];
    expect(sentBody.options.include_debug_metadata).toBe(false);
  });

  it("includes Idempotency-Key header in the request", async () => {
    mockHttpClient.post.mockResolvedValueOnce({ data: { letter_id: "y" } });
    await generateCoverLetter(validBody, "idem-abc");

    const config = mockHttpClient.post.mock.calls[0][2];
    expect(config.headers["Idempotency-Key"]).toBe("idem-abc");
  });

  it("returns the response data on success", async () => {
    const responseData = { letter_id: "abc", status: "ready_to_review" };
    mockHttpClient.post.mockResolvedValueOnce({ data: responseData });

    const result = await generateCoverLetter(validBody, "idem-key");
    expect(result).toEqual(responseData);
  });

  it("throws a mapped CoverLetterApiError on HTTP failure", async () => {
    mockHttpClient.post.mockRejectedValueOnce(makeAxiosError(503));
    await expect(generateCoverLetter(validBody, "idem-key")).rejects.toMatchObject({
      reason: "unavailable",
    });
  });
});

// ── getCoverLetter() ──────────────────────────────────────────────────────

describe("getCoverLetter()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the response data on success", async () => {
    const data = { letter_id: "abc", status: "ready_to_review" };
    mockHttpClient.get.mockResolvedValueOnce({ data });

    const result = await getCoverLetter("abc");
    expect(result).toEqual(data);
  });

  it("returns null on a 404", async () => {
    mockHttpClient.get.mockRejectedValueOnce(makeAxiosError(404));
    const result = await getCoverLetter("missing-id");
    expect(result).toBeNull();
  });

  it("throws a mapped error on non-404 errors", async () => {
    mockHttpClient.get.mockRejectedValueOnce(makeAxiosError(503));
    await expect(getCoverLetter("some-id")).rejects.toMatchObject({
      reason: "unavailable",
    });
  });

  it("URL-encodes the letterId in the request path", async () => {
    mockHttpClient.get.mockResolvedValueOnce({ data: {} });
    await getCoverLetter("letter id with spaces");

    const url: string = mockHttpClient.get.mock.calls[0][0];
    expect(url).toContain("letter%20id%20with%20spaces");
  });
});

// ── listCoverLetters() ────────────────────────────────────────────────────

describe("listCoverLetters()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits limit and cursor when called with no arguments", async () => {
    mockHttpClient.get.mockResolvedValueOnce({ data: { items: [], next_cursor: null } });
    await listCoverLetters();

    const config = mockHttpClient.get.mock.calls[0][1];
    expect(config.params).not.toHaveProperty("limit");
    expect(config.params).not.toHaveProperty("cursor");
  });

  it("passes limit when provided", async () => {
    mockHttpClient.get.mockResolvedValueOnce({ data: { items: [], next_cursor: null } });
    await listCoverLetters({ limit: 10 });

    const config = mockHttpClient.get.mock.calls[0][1];
    expect(config.params.limit).toBe(10);
  });

  it("passes cursor when provided as non-empty string", async () => {
    mockHttpClient.get.mockResolvedValueOnce({ data: { items: [], next_cursor: null } });
    await listCoverLetters({ cursor: "next-page-cursor" });

    const config = mockHttpClient.get.mock.calls[0][1];
    expect(config.params.cursor).toBe("next-page-cursor");
  });

  it("omits cursor when null is provided", async () => {
    mockHttpClient.get.mockResolvedValueOnce({ data: { items: [], next_cursor: null } });
    await listCoverLetters({ cursor: null });

    const config = mockHttpClient.get.mock.calls[0][1];
    expect(config.params).not.toHaveProperty("cursor");
  });

  it("returns the response data on success", async () => {
    const responseData = { items: [{ letter_id: "x" }], next_cursor: null };
    mockHttpClient.get.mockResolvedValueOnce({ data: responseData });

    const result = await listCoverLetters();
    expect(result).toEqual(responseData);
  });

  it("throws a mapped error on failure", async () => {
    mockHttpClient.get.mockRejectedValueOnce(makeAxiosError(401));
    await expect(listCoverLetters()).rejects.toMatchObject({
      reason: "unauthorized",
    });
  });
});

// ── deleteCoverLetter() ───────────────────────────────────────────────────

describe("deleteCoverLetter()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true on a successful 204 response", async () => {
    mockHttpClient.delete.mockResolvedValueOnce({ status: 204 });
    const result = await deleteCoverLetter("letter-to-delete");
    expect(result).toBe(true);
  });

  it("returns false on a 404 (treat as already deleted)", async () => {
    mockHttpClient.delete.mockRejectedValueOnce(makeAxiosError(404));
    const result = await deleteCoverLetter("already-gone");
    expect(result).toBe(false);
  });

  it("throws a mapped error on non-404 errors", async () => {
    mockHttpClient.delete.mockRejectedValueOnce(makeAxiosError(401));
    await expect(deleteCoverLetter("locked-letter")).rejects.toMatchObject({
      reason: "unauthorized",
    });
  });

  it("URL-encodes the letterId in the request path", async () => {
    mockHttpClient.delete.mockResolvedValueOnce({ status: 204 });
    await deleteCoverLetter("letter/with/slashes");

    const url: string = mockHttpClient.delete.mock.calls[0][0];
    expect(url).toContain("letter%2Fwith%2Fslashes");
  });
});
