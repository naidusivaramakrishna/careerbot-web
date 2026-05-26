/**
 * Closed-list copy lookups for the cover-letter feature.
 *
 * Single source of truth for human-readable text shown to the user.
 * Each lookup is exhaustive over its corresponding closed enum on
 * the contract — a TypeScript `Record<EnumValue, string>` makes the
 * exhaustiveness check structural.
 *
 * Spec: cover-letter-docs/COVER_LETTER_FRONTEND_IMPLEMENTATION_BLUEPRINT_2026_05_25.txt §6.
 * Codex P1#2 (wireframes round 1): warning codes MUST match the
 * EXACT strings the AI layer emits. Verified at
 * cb-coverletter-wt/src/services/cover_letter/pipeline.py.
 */
import type { CoverLetterReason } from "@/types/coverLetter";

// ── warning codes (AI layer emits these on .warnings[].code) ───
// Order matches the AI side's degradation-to-warning map.
export const WARNING_MESSAGES = {
  W_COVER_LETTER_LOW_JD_MATCH:
    "JD match is moderate, not strong.",
  W_COVER_LETTER_THIN_RESUME:
    "Limited evidence from your resume for this JD.",
  W_COVER_LETTER_UNBACKED_CLAIM:
    "Removed a claim that couldn't be supported.",
  W_COVER_LETTER_VERIFIER_UNCLEAR:
    "Some claims couldn't be verified with high confidence.",
  W_COVER_LETTER_LOW_CONFIDENCE_FACT:
    "Used resume facts that had low confidence.",
  W_COVER_LETTER_INVALID_JD:
    "The job description couldn't be fully parsed.",
  W_COVER_LETTER_FALLBACK_USED:
    "We used a backup generation path.",
} as const satisfies Record<string, string>;

/**
 * Fallback for an unknown warning code (forward-compatibility:
 * the AI layer may add new codes; the FE shouldn't crash on them).
 * Log the unknown code to Sentry/equivalent + render this string.
 */
export const UNKNOWN_WARNING_MESSAGE =
  "There's a generation note we haven't surfaced yet — check the draft carefully.";

/** Resolve a backend warning code to human copy + unknown fallback. */
export function warningMessage(code: string): string {
  return (
    (WARNING_MESSAGES as Record<string, string>)[code] ??
    UNKNOWN_WARNING_MESSAGE
  );
}

// ── failure reasons (only present when status === "failed") ────
export const FAILED_REASON_MESSAGES: Record<CoverLetterReason, string> = {
  low_jd_match:
    "Your resume doesn't align closely enough with this JD for an honest, grounded letter.",
  insufficient_grounding:
    "We didn't find enough concrete claims in your resume to back up a letter.",
  invalid_jd:
    "The job description couldn't be parsed. Check the format and try again.",
  verifier_unclear:
    "Too many claims couldn't be verified with confidence.",
  fallback_unusable:
    "Our backup generation path couldn't produce a usable draft.",
  llm_budget_exceeded:
    "We hit a temporary generation budget. Please try again.",
  parser_confidence_too_low:
    "Resume parsing was too uncertain to use as evidence.",
  claim_catalog_empty:
    "Your resume is too thin or too generic to ground a letter against this JD.",
  thin_claim_catalog:
    "Limited evidence in your resume for this specific JD.",
  unbacked_claim_removed:
    "Every meaningful claim couldn't be supported and was removed.",
  low_confidence_fact_used:
    "No high-confidence facts were available to ground the letter.",
};

// ── api / network error reasons (raised by coverLetterApi.ts) ──
// Maps the canonical reason emitted by `CoverLetterApiError.reason`
// to user-facing copy. ONE source of truth used by Form + List +
// Detail screens.
export type CoverLetterApiErrorReason =
  | "body_too_large"
  | "validation"
  | "rate_limit"
  | "upstream_contract"
  | "upstream_generation"
  | "unavailable"
  | "timeout"
  | "unauthorized"
  | "not_found"
  | "unknown";

export const ERROR_MESSAGES: Record<CoverLetterApiErrorReason, string> = {
  body_too_large:
    "Your input is too large. Please trim the JD and try again.",
  validation:
    "Some of the fields aren't valid. Please check and try again.",
  rate_limit:
    "You've made too many requests in a short window. Please try again in a moment.",
  upstream_contract:
    "Something went wrong with generation. Please try again.",
  upstream_generation:
    "Something went wrong with generation. Please try again.",
  unavailable:
    "Cover letter generation is temporarily unavailable. Please try again later.",
  timeout:
    "Generation timed out. Please try again.",
  unauthorized:
    "Your session has expired. Please sign in again.",
  not_found:
    "We couldn't find that cover letter.",
  unknown:
    "Something went wrong. Please try again.",
};
