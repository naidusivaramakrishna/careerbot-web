/**
 * Cover-letter contract types — TS mirror of the CL-1.2 Pydantic
 * schemas on both careerbot-ai and careerbot-api.
 *
 * Source of truth: kept in lock-step with
 *   careerbot-api  app/services/cover_letter_service/schemas.py
 *   careerbot-ai   src/services/cover_letter/schemas.py
 *
 * Sibling-invariant sweep rule: any change to the backend Pydantic
 * schemas changes this file IN THE SAME COMMIT. The JSON snapshot
 * fixtures in src/tests/mocks/coverLetter/fixtures/ exercise the
 * parser to catch drift.
 *
 * Spec: cover-letter-docs/COVER_LETTER_FRONTEND_IMPLEMENTATION_BLUEPRINT_2026_05_25.txt §5.
 */

// ── closed enums (Literal types reject unknown values) ─────────
export type CoverLetterStatus = "ready_to_review" | "needs_review" | "failed";

export type CoverLetterTone = "professional";

export type CoverLetterExportFormat = "pdf" | "docx";

export type CoverLetterTemplateId = "classic" | "modern" | "compact";

export type AppContextSource = "user" | "jd" | "unknown";

export type JdMatchStatus =
  | "met"
  | "partial"
  | "not_found"
  | "not_addressed";

export type WarningSeverity = "info" | "warning" | "error";

export type CoverageStatus = "sufficient" | "thin" | "low_confidence";

export type CoverLetterReason =
  | "insufficient_grounding"
  | "invalid_jd"
  | "low_jd_match"
  | "verifier_unclear"
  | "fallback_unusable"
  | "llm_budget_exceeded"
  | "parser_confidence_too_low"
  | "claim_catalog_empty"
  | "unbacked_claim_removed"
  | "low_confidence_fact_used"
  | "thin_claim_catalog";

// Supported resume-parser schema versions on the request — must
// match `_SUPPORTED_RESUME_SCHEMA_VERSIONS` in the api-side schema.
export type ResumeSchemaVersion = "2.0" | "2.1" | "2.5";

// ── request types ──────────────────────────────────────────────
export interface ApplicationContext {
  company_name?: string | null;
  role_title?: string | null;
  hiring_manager_name?: string | null;
  candidate_signature_name?: string | null;
  include_contact_details?: boolean; // default false (server side)
  source?: AppContextSource; // default 'unknown'
}

export interface GenerateOptions {
  tone?: CoverLetterTone;
  /** 200..500; default 250 */
  min_words?: number;
  /** 200..500; default 400 */
  max_words?: number;
  /** max 300 chars */
  candidate_note?: string | null;
  /**
   * MUST be `false` in V1 (defense in depth — backend also forces
   * it). See wireframes §B.1 SECURITY INVARIANTS.
   */
  include_debug_metadata: false;
}

export interface CoverLetterGenerateRequest {
  parsed_resume_id: string;
  jd_id: string;
  application_context?: ApplicationContext | null;
  options?: GenerateOptions;
}

export interface CoverLetterFormSubmit {
  job_description: string;
  application_context?: ApplicationContext | null;
  options?: GenerateOptions;
}

// ── response sub-types ─────────────────────────────────────────
export interface CoverLetter {
  greeting: string;
  opening: string;
  body: string[];
  closing: string;
  signature: string;
}

export interface GenerationStatus {
  /** Mirrors the top-level status; asserted equal server-side. */
  status: CoverLetterStatus;
  degraded?: boolean;
  fallback_used?: boolean;
  sentences_regenerated?: number;
  sentences_stripped?: number;
  generic_intent_sentences_inserted?: number;
  /** ALWAYS true in V1 — output is a draft, never "ready to send". */
  requires_user_review: true;
  reasons?: CoverLetterReason[];
}

export interface JdMatchMatrixEntry {
  requirement: string;
  status: JdMatchStatus;
  supporting_claim_ids?: string[];
  used_in_letter?: boolean;
}

export interface Grounding {
  claim_catalog_size?: number;
  high_confidence_claims?: number;
  low_confidence_claims_used?: number;
  parser_warnings_used?: string[];
  coverage_status?: CoverageStatus;
}

export interface ResponseMetadata {
  word_count?: number;
  tone?: CoverLetterTone;
  prompt_version?: string;
  verification_policy_version?: string;
  tokens_used?: number;
  llm_calls?: number;
  model?: string;
}

export interface CoverLetterWarning {
  code: string;
  severity: WarningSeverity;
  message: string;
  field?: string | null;
}

// ── top-level response ─────────────────────────────────────────
/**
 * GET /api/v1/cover-letter/{id}  +  POST /api/v1/cover-letter/generate.
 *
 * Status invariants (server-enforced):
 *   - status === generation_status.status (asserted equal)
 *   - status === "failed"  → cover_letter / plain_text MUST be null,
 *                            reason MUST be set
 *   - status !== "failed"  → cover_letter / plain_text MUST be present,
 *                            reason MUST be null
 */
export interface CoverLetterResponse {
  letter_id: string;
  /** ISO-8601 UTC string (JSON serialization of datetime). */
  created_at: string;
  status: CoverLetterStatus;
  cover_letter: CoverLetter | null;
  plain_text: string | null;
  generation_status: GenerationStatus;
  jd_match_matrix: JdMatchMatrixEntry[];
  grounding: Grounding;
  metadata: ResponseMetadata;
  warnings: CoverLetterWarning[];
  reason: CoverLetterReason | null;
}

// ── list view ──────────────────────────────────────────────────
/**
 * One row on GET /api/v1/cover-letter (list endpoint).
 *
 * Backend's `CoverLetterListItem` is EXACTLY these fields and
 * ONLY these fields. Don't add presentational fields (status pill
 * color, preview snippet, warning count) here — derive them in the
 * component layer. See wireframes §A.2 row contract.
 */
export interface CoverLetterListItem {
  letter_id: string;
  created_at: string;
  status: CoverLetterStatus;
  role_title: string | null;
  company_name: string | null;
  word_count: number;
}

export interface CoverLetterListResponse {
  items: CoverLetterListItem[];
  next_cursor: string | null;
}

// ── pagination params ──────────────────────────────────────────
export interface CoverLetterTemplateSection {
  enabled?: boolean;
  order?: number;
  label?: string;
  description?: string | null;
  includes?: string[] | null;
  default_text?: string | null;
  placeholder?: string | null;
}

export interface CoverLetterTemplatePlaceholder {
  label?: string;
  type?: string;
  required?: boolean;
  example?: string | null;
  auto_fill?: string | null;
}

export interface CoverLetterTemplate {
  template_id: CoverLetterTemplateId;
  name: string;
  description: string;
  supports: CoverLetterExportFormat[];
  is_default: boolean;
  sections?: Record<string, CoverLetterTemplateSection> | null;
  placeholders?: Record<string, CoverLetterTemplatePlaceholder> | null;
}

export interface CoverLetterTemplateCatalogResponse {
  templates: CoverLetterTemplate[];
}

export interface ListCoverLettersParams {
  /** 1..100; default 20 (server default). */
  limit?: number;
  /** Opaque base64 cursor from the previous response's next_cursor. */
  cursor?: string | null;
}
