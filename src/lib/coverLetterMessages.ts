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
    "The job match is moderate. Review the letter against the job post before sending.",
  W_COVER_LETTER_THIN_RESUME:
    "Your resume has limited evidence for this role. Add stronger resume details if the draft feels generic.",
  W_COVER_LETTER_UNBACKED_CLAIM:
    "One unsupported claim was removed to keep the letter accurate.",
  W_COVER_LETTER_VERIFIER_UNCLEAR:
    "Some claims could not be verified with high confidence. Check names, tools, and achievements.",
  W_COVER_LETTER_LOW_CONFIDENCE_FACT:
    "Some resume details were parsed with lower confidence. Review facts before exporting.",
  W_COVER_LETTER_INVALID_JD:
    "The job description was not fully parsed. Recheck the role requirements in the draft.",
  W_COVER_LETTER_FALLBACK_USED:
    "The draft used a fallback generation path. Review tone and role fit before exporting.",
  W_COVER_LETTER_SHORT:
    "The draft is shorter than usual. Add more detail if it feels thin.",
  W_COVER_LETTER_LONG:
    "The draft is longer than recommended. Trim before exporting.",
} as const satisfies Record<string, string>;

/**
 * Fallback for an unknown warning code (forward-compatibility:
 * the AI layer may add new codes; the FE shouldn't crash on them).
 * Log the unknown code to Sentry/equivalent + render this string.
 */
export const UNKNOWN_WARNING_MESSAGE =
  "Review the draft for accuracy, tone, and role fit before exporting.";

/** Resolve a backend warning code to human copy + unknown fallback. */
export function warningMessage(code: string): string {
  return (
    (WARNING_MESSAGES as Record<string, string>)[code] ??
    "Review the draft for accuracy, tone, and role fit before exporting."
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
  short_letter_warning:
    "The draft is shorter than usual. Add more detail if it feels thin.",
  long_letter_warning:
    "The draft is longer than recommended. Trim before exporting.",
  review_required:
    "The draft requires review before use.",
  unsupported_required_jd_skill:
    "The role requires a skill that your resume does not currently support. Review the requirement before applying.",
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
  | "generation_in_progress"
  | "download_unavailable"
  | "unknown";

export const ERROR_MESSAGES: Record<CoverLetterApiErrorReason, string> = {
  body_too_large:
    "Your input is too large. Please trim the JD and try again.",
  validation:
    "Some of the fields aren't valid. Please check and try again.",
  rate_limit:
    "You've made too many requests in a short window. Please try again in a moment.",
  upstream_contract:
    "The generation service returned an invalid response. Please try again.",
  upstream_generation:
    "The AI generation service is temporarily unavailable. Please try again.",
  unavailable:
    "Cover letter generation is temporarily unavailable. Please try again later.",
  timeout:
    "Generation is taking longer than expected and may still complete. Check History before trying again.",
  unauthorized:
    "Your session has expired. Please sign in again.",
  not_found:
    "We couldn't find that cover letter.",
  generation_in_progress:
    "Your cover letter is still being generated. Please wait a moment, then check History.",
  download_unavailable:
    "Failed cover letters can't be downloaded.",
  unknown:
    "Something went wrong. Please try again.",
};
