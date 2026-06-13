/**
 * Unit tests for src/lib/coverLetterMessages.ts
 *
 * Covers:
 *   - warningMessage()  — known codes, unknown codes, fallback
 *   - WARNING_MESSAGES  — all expected keys present, all values non-empty
 *   - FAILED_REASON_MESSAGES — exhaustive over CoverLetterReason, all non-empty
 *   - ERROR_MESSAGES — exhaustive over CoverLetterApiErrorReason, all non-empty
 */

import {
  warningMessage,
  WARNING_MESSAGES,
  FAILED_REASON_MESSAGES,
  ERROR_MESSAGES,
  UNKNOWN_WARNING_MESSAGE,
} from "@/lib/coverLetterMessages";
import type { CoverLetterApiErrorReason } from "@/lib/coverLetterMessages";
import type { CoverLetterReason } from "@/types/coverLetter";

// ── warningMessage() ───────────────────────────────────────────────────────

describe("warningMessage()", () => {
  it("returns the correct message for W_COVER_LETTER_LOW_JD_MATCH", () => {
    expect(warningMessage("W_COVER_LETTER_LOW_JD_MATCH")).toBe(
      WARNING_MESSAGES.W_COVER_LETTER_LOW_JD_MATCH
    );
  });

  it("returns the correct message for W_COVER_LETTER_THIN_RESUME", () => {
    expect(warningMessage("W_COVER_LETTER_THIN_RESUME")).toBe(
      WARNING_MESSAGES.W_COVER_LETTER_THIN_RESUME
    );
  });

  it("returns the correct message for W_COVER_LETTER_UNBACKED_CLAIM", () => {
    expect(warningMessage("W_COVER_LETTER_UNBACKED_CLAIM")).toBe(
      WARNING_MESSAGES.W_COVER_LETTER_UNBACKED_CLAIM
    );
  });

  it("returns the correct message for W_COVER_LETTER_VERIFIER_UNCLEAR", () => {
    expect(warningMessage("W_COVER_LETTER_VERIFIER_UNCLEAR")).toBe(
      WARNING_MESSAGES.W_COVER_LETTER_VERIFIER_UNCLEAR
    );
  });

  it("returns the correct message for W_COVER_LETTER_LOW_CONFIDENCE_FACT", () => {
    expect(warningMessage("W_COVER_LETTER_LOW_CONFIDENCE_FACT")).toBe(
      WARNING_MESSAGES.W_COVER_LETTER_LOW_CONFIDENCE_FACT
    );
  });

  it("returns the correct message for W_COVER_LETTER_INVALID_JD", () => {
    expect(warningMessage("W_COVER_LETTER_INVALID_JD")).toBe(
      WARNING_MESSAGES.W_COVER_LETTER_INVALID_JD
    );
  });

  it("returns the correct message for W_COVER_LETTER_FALLBACK_USED", () => {
    expect(warningMessage("W_COVER_LETTER_FALLBACK_USED")).toBe(
      WARNING_MESSAGES.W_COVER_LETTER_FALLBACK_USED
    );
  });

  it("returns UNKNOWN_WARNING_MESSAGE for an unrecognized code", () => {
    expect(warningMessage("W_COVER_LETTER_FUTURE_CODE")).toBe(
      UNKNOWN_WARNING_MESSAGE
    );
  });

  it("returns UNKNOWN_WARNING_MESSAGE for an empty string", () => {
    expect(warningMessage("")).toBe(UNKNOWN_WARNING_MESSAGE);
  });

  it("is case-sensitive — lowercase known code returns fallback", () => {
    expect(warningMessage("w_cover_letter_low_jd_match")).toBe(
      UNKNOWN_WARNING_MESSAGE
    );
  });
});

// ── WARNING_MESSAGES completeness ──────────────────────────────────────────

describe("WARNING_MESSAGES", () => {
  const EXPECTED_KEYS = [
    "W_COVER_LETTER_LOW_JD_MATCH",
    "W_COVER_LETTER_THIN_RESUME",
    "W_COVER_LETTER_UNBACKED_CLAIM",
    "W_COVER_LETTER_VERIFIER_UNCLEAR",
    "W_COVER_LETTER_LOW_CONFIDENCE_FACT",
    "W_COVER_LETTER_INVALID_JD",
    "W_COVER_LETTER_FALLBACK_USED",
  ];

  it.each(EXPECTED_KEYS)("has key %s", (key) => {
    expect(WARNING_MESSAGES).toHaveProperty(key);
  });

  it.each(EXPECTED_KEYS)("value for %s is a non-empty string", (key) => {
    const value = (WARNING_MESSAGES as Record<string, string>)[key];
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThan(0);
  });
});

// ── FAILED_REASON_MESSAGES exhaustiveness ─────────────────────────────────

describe("FAILED_REASON_MESSAGES", () => {
  const ALL_REASONS: CoverLetterReason[] = [
    "insufficient_grounding",
    "invalid_jd",
    "low_jd_match",
    "verifier_unclear",
    "fallback_unusable",
    "llm_budget_exceeded",
    "parser_confidence_too_low",
    "claim_catalog_empty",
    "unbacked_claim_removed",
    "low_confidence_fact_used",
    "thin_claim_catalog",
  ];

  it.each(ALL_REASONS)("has a message for reason '%s'", (reason) => {
    expect(FAILED_REASON_MESSAGES).toHaveProperty(reason);
  });

  it.each(ALL_REASONS)("message for '%s' is a non-empty string", (reason) => {
    const message = FAILED_REASON_MESSAGES[reason];
    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
  });
});

// ── ERROR_MESSAGES exhaustiveness ─────────────────────────────────────────

describe("ERROR_MESSAGES", () => {
  const ALL_API_REASONS: CoverLetterApiErrorReason[] = [
    "body_too_large",
    "validation",
    "rate_limit",
    "upstream_contract",
    "upstream_generation",
    "unavailable",
    "timeout",
    "unauthorized",
    "not_found",
    "download_unavailable",
    "unknown",
  ];

  it.each(ALL_API_REASONS)("has a message for reason '%s'", (reason) => {
    expect(ERROR_MESSAGES).toHaveProperty(reason);
  });

  it.each(ALL_API_REASONS)("message for '%s' is a non-empty string", (reason) => {
    const message = ERROR_MESSAGES[reason];
    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
  });
});
