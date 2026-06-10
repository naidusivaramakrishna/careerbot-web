/**
 * Integration tests — cover-letter backend contract fixtures.
 *
 * These tests are the FE's "contract-drift backstop" (Codex
 * impl-blueprint P1#2 / WEB-1.2). Every JSON snapshot under
 * src/tests/mocks/coverLetter/fixtures/ is captured from the live
 * careerbot-api backend (2026-05-25) and exercised here.
 *
 * If the backend changes its CL-1.2 response shape, one of the
 * assertions below will FAIL FIRST — before any UI regression.
 *
 * Additionally, the api-client error mapper is run against all
 * four backend-error fixtures to verify the reason classification
 * matches what coverLetterApi.ts promises to callers.
 *
 * Spec: cover-letter-docs/COVER_LETTER_FRONTEND_IMPLEMENTATION_BLUEPRINT_2026_05_25.txt §9 WEB-1.2.
 */

import { CL_FIXTURES, CL_ERROR_FIXTURES } from "@/tests/mocks/coverLetter/fixtures";
import type {
  CoverLetterResponse,
  CoverLetterListResponse,
  CoverLetterListItem,
  CoverLetterStatus,
  JdMatchStatus,
} from "@/types/coverLetter";

// ── Helpers ────────────────────────────────────────────────────────────────

function assertCoverLetterResponseShape(cl: CoverLetterResponse, label: string) {
  expect(typeof cl.letter_id, `${label}: letter_id is a string`).toBe("string");
  expect(cl.letter_id.length, `${label}: letter_id is non-empty`).toBeGreaterThan(0);

  expect(typeof cl.created_at, `${label}: created_at is a string`).toBe("string");
  expect(
    new Date(cl.created_at).getTime(),
    `${label}: created_at parses as valid ISO-8601 date`
  ).not.toBeNaN();

  const validStatuses: CoverLetterStatus[] = [
    "ready_to_review",
    "needs_review",
    "failed",
  ];
  expect(
    validStatuses.includes(cl.status),
    `${label}: status is a valid CoverLetterStatus`
  ).toBe(true);

  // Server invariant: generation_status.status must equal top-level status.
  expect(
    cl.generation_status.status,
    `${label}: generation_status.status mirrors top-level status`
  ).toBe(cl.status);

  // Server invariant: requires_user_review is ALWAYS true in V1.
  expect(
    cl.generation_status.requires_user_review,
    `${label}: requires_user_review is always true`
  ).toBe(true);

  // Server invariant: failed → cover_letter null + reason set.
  if (cl.status === "failed") {
    expect(cl.cover_letter, `${label}: failed status has null cover_letter`).toBeNull();
    expect(cl.plain_text, `${label}: failed status has null plain_text`).toBeNull();
    expect(
      cl.reason,
      `${label}: failed status has a reason set`
    ).not.toBeNull();
  } else {
    expect(cl.cover_letter, `${label}: non-failed status has cover_letter`).not.toBeNull();
    expect(cl.plain_text, `${label}: non-failed status has plain_text`).not.toBeNull();
    expect(cl.reason, `${label}: non-failed status has null reason`).toBeNull();
  }

  // jd_match_matrix shape.
  expect(Array.isArray(cl.jd_match_matrix), `${label}: jd_match_matrix is an array`).toBe(true);

  const validMatchStatuses: JdMatchStatus[] = ["met", "partial", "not_found", "not_addressed"];
  for (const entry of cl.jd_match_matrix) {
    expect(typeof entry.requirement, `${label}: matrix entry.requirement is a string`).toBe("string");
    expect(
      validMatchStatuses.includes(entry.status),
      `${label}: matrix entry.status is a valid JdMatchStatus`
    ).toBe(true);
    expect(
      Array.isArray(entry.supporting_claim_ids),
      `${label}: matrix entry.supporting_claim_ids is an array`
    ).toBe(true);
  }

  // grounding shape.
  expect(typeof cl.grounding, `${label}: grounding is an object`).toBe("object");

  // metadata shape.
  expect(typeof cl.metadata, `${label}: metadata is an object`).toBe("object");

  // warnings shape.
  expect(Array.isArray(cl.warnings), `${label}: warnings is an array`).toBe(true);
}

// ── CoverLetterResponse fixtures ──────────────────────────────────────────

describe("CL_FIXTURES — CoverLetterResponse contract", () => {
  it("readyToReview passes full shape assertion", () => {
    assertCoverLetterResponseShape(CL_FIXTURES.readyToReview, "readyToReview");
  });

  it("needsReview passes full shape assertion", () => {
    assertCoverLetterResponseShape(CL_FIXTURES.needsReview, "needsReview");
  });

  it("failedLowJdMatch passes full shape assertion", () => {
    assertCoverLetterResponseShape(CL_FIXTURES.failedLowJdMatch, "failedLowJdMatch");
  });

  // ── readyToReview specific ─────────────────────────────────────────────

  describe("readyToReview", () => {
    const cl = CL_FIXTURES.readyToReview;

    it("has status ready_to_review", () => {
      expect(cl.status).toBe("ready_to_review");
    });

    it("has a non-null cover_letter with all paragraph fields", () => {
      expect(cl.cover_letter).not.toBeNull();
      expect(typeof cl.cover_letter!.greeting).toBe("string");
      expect(typeof cl.cover_letter!.opening).toBe("string");
      expect(Array.isArray(cl.cover_letter!.body)).toBe(true);
      expect(cl.cover_letter!.body.length).toBeGreaterThan(0);
      expect(typeof cl.cover_letter!.closing).toBe("string");
      expect(typeof cl.cover_letter!.signature).toBe("string");
    });

    it("has a non-null plain_text", () => {
      expect(typeof cl.plain_text).toBe("string");
      expect(cl.plain_text!.length).toBeGreaterThan(0);
    });

    it("has word_count > 0 in metadata", () => {
      expect(cl.metadata.word_count).toBeGreaterThan(0);
    });

    it("has at least one 'met' entry in jd_match_matrix", () => {
      expect(cl.jd_match_matrix.some((e) => e.status === "met")).toBe(true);
    });

    it("has grounding.coverage_status === 'sufficient'", () => {
      expect(cl.grounding.coverage_status).toBe("sufficient");
    });

    it("has no warnings", () => {
      expect(cl.warnings).toHaveLength(0);
    });

    it("has reason === null", () => {
      expect(cl.reason).toBeNull();
    });
  });

  // ── needsReview specific ──────────────────────────────────────────────

  describe("needsReview", () => {
    const cl = CL_FIXTURES.needsReview;

    it("has status needs_review", () => {
      expect(cl.status).toBe("needs_review");
    });

    it("generation_status.degraded is true", () => {
      expect(cl.generation_status.degraded).toBe(true);
    });

    it("has a non-null plain_text", () => {
      expect(cl.plain_text).not.toBeNull();
    });

    it("has reason === null", () => {
      expect(cl.reason).toBeNull();
    });
  });

  // ── failedLowJdMatch specific ─────────────────────────────────────────

  describe("failedLowJdMatch", () => {
    const cl = CL_FIXTURES.failedLowJdMatch;

    it("has status failed", () => {
      expect(cl.status).toBe("failed");
    });

    it("has cover_letter === null", () => {
      expect(cl.cover_letter).toBeNull();
    });

    it("has plain_text === null", () => {
      expect(cl.plain_text).toBeNull();
    });

    it("has reason set to a non-null string", () => {
      expect(typeof cl.reason).toBe("string");
      expect(cl.reason).not.toBeNull();
    });

    it("has warnings for low jd match and thin resume", () => {
      expect(cl.warnings.length).toBeGreaterThan(0);
      const codes = cl.warnings.map((w) => w.code);
      expect(codes).toContain("W_COVER_LETTER_LOW_JD_MATCH");
      expect(codes).toContain("W_COVER_LETTER_THIN_RESUME");
    });

    it("has generation_status.degraded true", () => {
      expect(cl.generation_status.degraded).toBe(true);
    });

    it("all jd_match_matrix entries are not_found (unable to match)", () => {
      expect(cl.jd_match_matrix.every((e) => e.status === "not_found")).toBe(true);
    });
  });
});

// ── CoverLetterListResponse fixtures ─────────────────────────────────────

describe("CL_FIXTURES — CoverLetterListResponse contract", () => {
  function assertListResponseShape(list: CoverLetterListResponse, label: string) {
    expect(Array.isArray(list.items), `${label}: items is an array`).toBe(true);
    expect(
      list.next_cursor === null || typeof list.next_cursor === "string",
      `${label}: next_cursor is null or string`
    ).toBe(true);

    for (const item of list.items) {
      expect(typeof item.letter_id).toBe("string");
      expect(item.letter_id.length).toBeGreaterThan(0);
      expect(typeof item.created_at).toBe("string");
      expect(new Date(item.created_at).getTime()).not.toBeNaN();
      expect(typeof item.word_count).toBe("number");
      expect(item.word_count).toBeGreaterThanOrEqual(0);
      const validStatuses: CoverLetterStatus[] = [
        "ready_to_review",
        "needs_review",
        "failed",
      ];
      expect(validStatuses.includes(item.status)).toBe(true);
    }
  }

  it("listEmpty passes shape assertion", () => {
    assertListResponseShape(CL_FIXTURES.listEmpty, "listEmpty");
  });

  it("list3Items passes shape assertion", () => {
    assertListResponseShape(CL_FIXTURES.list3Items, "list3Items");
  });

  it("listWithCursor passes shape assertion", () => {
    assertListResponseShape(CL_FIXTURES.listWithCursor, "listWithCursor");
  });

  it("listEmpty has zero items", () => {
    expect(CL_FIXTURES.listEmpty.items).toHaveLength(0);
    expect(CL_FIXTURES.listEmpty.next_cursor).toBeNull();
  });

  it("listWithCursor has a non-null next_cursor", () => {
    expect(typeof CL_FIXTURES.listWithCursor.next_cursor).toBe("string");
    expect(CL_FIXTURES.listWithCursor.next_cursor!.length).toBeGreaterThan(0);
  });

  it("listWithCursor has items covering all three statuses", () => {
    const statuses = CL_FIXTURES.listWithCursor.items.map((i: CoverLetterListItem) => i.status);
    expect(statuses).toContain("ready_to_review");
    expect(statuses).toContain("needs_review");
    expect(statuses).toContain("failed");
  });

  it("failed item in listWithCursor has null role_title and company_name", () => {
    const failedItem = CL_FIXTURES.listWithCursor.items.find(
      (i: CoverLetterListItem) => i.status === "failed"
    );
    expect(failedItem).toBeDefined();
    expect(failedItem!.role_title).toBeNull();
    expect(failedItem!.company_name).toBeNull();
    expect(failedItem!.word_count).toBe(0);
  });
});

// ── Backend error fixtures — structural contract ──────────────────────────

describe("CL_ERROR_FIXTURES — backend error response shapes", () => {
  it("validation422 has success: false", () => {
    expect(CL_ERROR_FIXTURES.validation422.success).toBe(false);
  });

  it("validation422 has error.message", () => {
    expect(typeof CL_ERROR_FIXTURES.validation422.error.message).toBe("string");
  });

  it("validation422 has validation_errors array with field + message entries", () => {
    const errs =
      CL_ERROR_FIXTURES.validation422.error.details?.validation_errors ?? [];
    expect(Array.isArray(errs)).toBe(true);
    expect(errs.length).toBeGreaterThan(0);
    for (const e of errs) {
      expect(typeof e.field).toBe("string");
      expect(typeof e.message).toBe("string");
    }
  });

  it("contract502 has error_code containing 'CONTRACT'", () => {
    const code = CL_ERROR_FIXTURES.contract502.error.error_code ?? "";
    expect(code.toUpperCase()).toContain("CONTRACT");
  });

  it("unavailable503 has error_code that does NOT contain 'CONTRACT'", () => {
    const code = CL_ERROR_FIXTURES.unavailable503.error.error_code ?? "";
    expect(code.toUpperCase()).not.toContain("CONTRACT");
  });

  it("timeout504 has success: false", () => {
    expect(CL_ERROR_FIXTURES.timeout504.success).toBe(false);
  });

  it("all error fixtures have a non-empty error.message", () => {
    for (const [key, fixture] of Object.entries(CL_ERROR_FIXTURES)) {
      expect(
        typeof fixture.error.message,
        `${key}: error.message is a string`
      ).toBe("string");
      expect(
        fixture.error.message.length,
        `${key}: error.message is non-empty`
      ).toBeGreaterThan(0);
    }
  });
});

// ── API client + error fixtures round-trip ────────────────────────────────
//
// These tests run the real mapError() branch by calling getCoverLetter()
// with a mocked httpClient that rejects with each backend-error fixture
// shape. The goal: prove that the reason classification matches what
// coverLetterApi.ts documents for each error status.

import { getCoverLetter, CoverLetterApiError } from "@/api/coverLetterApi";

const mockHttpClient = {
  get: jest.fn(),
};

jest.mock("@/lib/http", () => ({
  httpClient: mockHttpClient,
}));

function makeFixtureAxiosError(
  status: number,
  fixtureData: object
): Error & { isAxiosError: true; response: object } {
  const err = new Error(`status ${status}`) as Error & {
    isAxiosError: true;
    response: object;
  };
  err.isAxiosError = true;
  err.response = { status, data: fixtureData, headers: {} };
  return err;
}

describe("API client + error fixtures round-trip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validation422 fixture → mapError → reason: 'validation' with validationErrors", async () => {
    mockHttpClient.get.mockRejectedValueOnce(
      makeFixtureAxiosError(422, CL_ERROR_FIXTURES.validation422)
    );
    let caught: CoverLetterApiError | null = null;
    try {
      await getCoverLetter("any-id");
    } catch (err) {
      caught = err as CoverLetterApiError;
    }
    expect(caught).not.toBeNull();
    expect(caught!.reason).toBe("validation");
    expect(caught!.status).toBe(422);
    expect((caught!.validationErrors ?? []).length).toBeGreaterThan(0);
  });

  it("contract502 fixture → mapError → reason: 'upstream_contract'", async () => {
    mockHttpClient.get.mockRejectedValueOnce(
      makeFixtureAxiosError(502, CL_ERROR_FIXTURES.contract502)
    );
    let caught: CoverLetterApiError | null = null;
    try {
      await getCoverLetter("any-id");
    } catch (err) {
      caught = err as CoverLetterApiError;
    }
    expect(caught!.reason).toBe("upstream_contract");
    expect(caught!.status).toBe(502);
  });

  it("unavailable503 fixture → mapError → reason: 'unavailable'", async () => {
    mockHttpClient.get.mockRejectedValueOnce(
      makeFixtureAxiosError(503, CL_ERROR_FIXTURES.unavailable503)
    );
    let caught: CoverLetterApiError | null = null;
    try {
      await getCoverLetter("any-id");
    } catch (err) {
      caught = err as CoverLetterApiError;
    }
    expect(caught!.reason).toBe("unavailable");
    expect(caught!.status).toBe(503);
  });

  it("timeout504 fixture → mapError → reason: 'timeout'", async () => {
    mockHttpClient.get.mockRejectedValueOnce(
      makeFixtureAxiosError(504, CL_ERROR_FIXTURES.timeout504)
    );
    let caught: CoverLetterApiError | null = null;
    try {
      await getCoverLetter("any-id");
    } catch (err) {
      caught = err as CoverLetterApiError;
    }
    expect(caught!.reason).toBe("timeout");
    expect(caught!.status).toBe(504);
  });

  it("readyToReview fixture is parsed without throwing when returned successfully", async () => {
    mockHttpClient.get.mockResolvedValueOnce({ data: CL_FIXTURES.readyToReview });
    const result = await getCoverLetter(CL_FIXTURES.readyToReview.letter_id);
    expect(result).not.toBeNull();
    expect(result!.letter_id).toBe(CL_FIXTURES.readyToReview.letter_id);
    expect(result!.status).toBe("ready_to_review");
  });

  it("failedLowJdMatch fixture is parsed without throwing when returned successfully", async () => {
    mockHttpClient.get.mockResolvedValueOnce({
      data: CL_FIXTURES.failedLowJdMatch,
    });
    const result = await getCoverLetter(CL_FIXTURES.failedLowJdMatch.letter_id);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("failed");
    expect(result!.cover_letter).toBeNull();
  });
});
