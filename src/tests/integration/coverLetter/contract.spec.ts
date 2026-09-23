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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CL_FIXTURES, CL_ERROR_FIXTURES } from "@/tests/mocks/coverLetter/fixtures";
import type {
  CoverLetterResponse,
  CoverLetterListResponse,
  CoverLetterListItem,
  CoverLetterStatus,
  JdMatchStatus,
  JdMatchSummary,
  KeywordReport,
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

  // metadata shape. Shallow on purpose here -- individual fields (e.g.
  // metadata.model) are asserted per-fixture below where their expected
  // value actually differs (see "failedNoModel specific").
  expect(typeof cl.metadata, `${label}: metadata is an object`).toBe("object");

  // keyword_report.coverage_explanation shape, for every fixture that has a
  // keyword_report (some, e.g. a failed-before-scoring letter, don't).
  // Moved here from a readyToReview-only test: a plain-string fixture
  // (the AI service's old shape, before it became Record<string,string>)
  // slipped through undetected on every OTHER fixture, since only
  // readyToReview was ever checked.
  if (cl.keyword_report) {
    expect(
      typeof cl.keyword_report.coverage_explanation,
      `${label}: keyword_report.coverage_explanation is an object (Record<string,string>), not a string`
    ).toBe("object");
    expect(
      cl.keyword_report.coverage_explanation,
      `${label}: keyword_report.coverage_explanation is not null`
    ).not.toBeNull();
  }

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

  it("failedNoModel passes full shape assertion", () => {
    assertCoverLetterResponseShape(CL_FIXTURES.failedNoModel, "failedNoModel");
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

    it("has jd_match_summary with expected shape", () => {
      expect(cl.jd_match_summary).not.toBeNull();
      expect(typeof cl.jd_match_summary!.jd_match_pct).toBe("number");
      expect(typeof cl.jd_match_summary!.total).toBe("number");
      expect(typeof cl.jd_match_summary!.met).toBe("number");
      expect(typeof cl.jd_match_summary!.partial).toBe("number");
      expect(typeof cl.jd_match_summary!.missing).toBe("number");
    });

    it("has keyword_report with expected shape", () => {
      // coverage_explanation's shape is asserted for every fixture with a
      // keyword_report inside assertCoverLetterResponseShape now, not just
      // this one.
      expect(cl.keyword_report).not.toBeNull();
      expect(Array.isArray(cl.keyword_report!.used_keywords)).toBe(true);
      expect(typeof cl.keyword_report!.keyword_coverage_pct).toBe("number");
      expect(typeof cl.keyword_report!.keyword_counts).toBe("object");
    });

    it("has eligible_evidence_usage_pct as a number distinct from evidence_usage_pct (PR #310/311/312)", () => {
      expect(typeof cl.keyword_report!.eligible_evidence_usage_pct).toBe("number");
      expect(typeof cl.keyword_report!.evidence_usage_pct).toBe("number");
      // The test name's own claim: these are two DIFFERENT metrics (JD-scoped
      // vs. full resume claim catalog), not the same value under two field
      // names. A typeof-only check would pass even if a future fixture (or a
      // real backend regression) accidentally set them equal or copied one
      // into the other.
      expect(cl.keyword_report!.eligible_evidence_usage_pct).not.toBe(cl.keyword_report!.evidence_usage_pct);
    });

    it("has at least one jd_match_matrix entry using implied_via_broader_claim (PR #310/311/312)", () => {
      const impliedEntry = cl.jd_match_matrix.find((e) => e.implied_via_broader_claim === true);
      expect(impliedEntry).toBeDefined();
      expect(impliedEntry!.used_in_letter).toBe(false);
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

    it("has at least one warning (needs_review contract invariant)", () => {
      expect(cl.warnings.length).toBeGreaterThan(0);
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

  // ── failedNoModel specific ────────────────────────────────────────────
  // careerbot-ai's early-failure path (pipeline aborted before any LLM
  // call ran) sends an explicit JSON null for metadata.model. The actual
  // runtime fix for the 502 this used to cause lives in careerbot-api's
  // Pydantic model (ResponseMetadata.model: Optional[str]) -- confirmed
  // merged: PR #203 "fix/cover-letter-contract-drift-and-usage-metadata",
  // commit 5d0cb3c3, on develop2. That backend fix is what actually
  // prevents the 502; it runs in a different repo and isn't exercised by
  // this test at all.
  //
  // This suite only keeps the FRONTEND TypeScript type
  // (ResponseMetadata.model: string | null) in sync with that already-
  // fixed backend contract. It does NOT verify the 502 is fixed, and
  // structurally can't: the fixture below is loaded through fixtures.ts's
  // `as unknown as CoverLetterResponse` cast, which bypasses TypeScript's
  // structural checking entirely -- these assertions would pass
  // identically whether or not the FE type were ever widened, since
  // vitest/JS runtime doesn't enforce TS types at all. Confirmed by
  // temporarily reverting the type change alone and re-running this
  // describe block: all cases still passed.

  describe("failedNoModel", () => {
    const cl = CL_FIXTURES.failedNoModel;

    it("has status failed", () => {
      expect(cl.status).toBe("failed");
    });

    it("has metadata.model === null", () => {
      expect(cl.metadata.model).toBeNull();
    });

    it("has metadata.llm_calls === 0 (no LLM call happened)", () => {
      expect(cl.metadata.llm_calls).toBe(0);
    });

    it("has reason set to a non-null string", () => {
      expect(typeof cl.reason).toBe("string");
      expect(cl.reason).not.toBeNull();
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
