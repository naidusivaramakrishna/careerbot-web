/**
 * Cover-letter API client.
 *
 * 1:1 with careerbot-api's 4 routes (live-verified end-to-end
 * 2026-05-25; see RUNBOOK_COVER_LETTER_API_ROLLOUT.txt § live
 * golden-path):
 *
 *   POST   /api/v1/cover-letter/generate       generateCoverLetter
 *   GET    /api/v1/cover-letter/{letter_id}    getCoverLetter
 *   GET    /api/v1/cover-letter                listCoverLetters
 *   DELETE /api/v1/cover-letter/{letter_id}    deleteCoverLetter
 *
 * Goes through `httpClient` (axios wrapper at src/lib/http.ts)
 * which injects Authorization, X-Tenant-Id, and X-Correlation-ID
 * automatically — so this file NEVER deals with auth or tenant.
 *
 * Spec: cover-letter-docs/COVER_LETTER_FRONTEND_IMPLEMENTATION_BLUEPRINT_2026_05_25.txt §4.
 */
import axios from "axios";
import { httpClient } from "@/lib/http";
import type {
  CoverLetterExportFormat,
  CoverLetterGenerateRequest,
  CoverLetterListResponse,
  CoverLetterResponse,
  CoverLetterTemplateCatalogResponse,
  ListCoverLettersParams,
} from "@/types/coverLetter";
import type { CoverLetterApiErrorReason } from "@/lib/coverLetterMessages";

const BASE = "/cover-letter";

// ── error class ────────────────────────────────────────────────
/**
 * Thrown by every function in this file on a non-success outcome.
 *
 * `reason` is the canonical FE-side classification mapped from the
 * backend response (see `mapError`). Components branch on `reason`,
 * NOT on the backend's free-text `message` (which would couple FE
 * UI to backend copy and re-introduce the existence-leak P0-7 from
 * the auth-flow review).
 *
 * `validationErrors` is populated only when reason === "validation"
 * (422 + backend `details.validation_errors[]` array) — drives
 * the form's inline field errors.
 */
export class CoverLetterApiError extends Error {
  readonly reason: CoverLetterApiErrorReason;
  readonly status: number | undefined;
  readonly validationErrors?: Array<{ field: string; message: string }>;
  readonly backendErrorCode?: string;
  /** Number of seconds the caller can retry after (parsed from
   *  Retry-After header on 429; undefined otherwise). */
  readonly retryAfterSeconds?: number;

  constructor(args: {
    reason: CoverLetterApiErrorReason;
    status?: number;
    message?: string;
    validationErrors?: Array<{ field: string; message: string }>;
    backendErrorCode?: string;
    retryAfterSeconds?: number;
  }) {
    super(args.message ?? args.reason);
    this.name = "CoverLetterApiError";
    this.reason = args.reason;
    this.status = args.status;
    this.validationErrors = args.validationErrors;
    this.backendErrorCode = args.backendErrorCode;
    this.retryAfterSeconds = args.retryAfterSeconds;
  }
}

// ── canonical 7-status error mapping (impl blueprint §4) ───────
function mapError(err: unknown): CoverLetterApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as
      | {
          success?: boolean;
          error?: {
            message?: string;
            error_code?: string;
            details?: {
              validation_errors?: Array<{
                field?: string;
                message?: string;
              }>;
            };
          };
          detail?: string | Array<{
            loc?: Array<string | number>;
            msg?: string;
            message?: string;
          }>;
        }
      | undefined;
    const backendErrorCode = data?.error?.error_code;
    const detailMessage = typeof data?.detail === "string" ? data.detail : undefined;
    const message = data?.error?.message ?? detailMessage ?? err.message;

    // Per impl-blueprint §4 canonical 7-status map. 402 is NOT in
    // V1 (free feature; paid-tier deferred).
    if (status === 401 || status === 403) {
      return new CoverLetterApiError({
        reason: "unauthorized",
        status,
        message,
        backendErrorCode,
      });
    }
    if (status === 404) {
      return new CoverLetterApiError({
        reason: "not_found",
        status,
        message,
        backendErrorCode,
      });
    }
    if (status === 409) {
      return new CoverLetterApiError({
        reason: "download_unavailable",
        status,
        message,
        backendErrorCode,
      });
    }
    if (status === 413) {
      return new CoverLetterApiError({
        reason: "body_too_large",
        status,
        message,
        backendErrorCode,
      });
    }
    if (status === 422) {
      const explicit = data?.error?.details?.validation_errors ?? [];
      const fastApi = Array.isArray(data?.detail)
        ? data.detail.map((item) => ({
            field: Array.isArray(item.loc)
              ? item.loc.filter((part) => part !== "body").join(".")
              : "request",
            message: item.msg ?? item.message ?? "Invalid value",
          }))
        : [];
      const validationErrors = [...explicit, ...fastApi]
        .filter((v) => v.field && v.message)
        .map((v) => ({ field: v.field as string, message: v.message as string }));
      return new CoverLetterApiError({
        reason: "validation",
        status,
        message,
        validationErrors,
        backendErrorCode,
      });
    }
    if (status === 429) {
      const retryAfter = err.response?.headers?.["retry-after"];
      const retryAfterSeconds =
        typeof retryAfter === "string" && /^\d+$/.test(retryAfter)
          ? Number(retryAfter)
          : undefined;
      return new CoverLetterApiError({
        reason: "rate_limit",
        status,
        message,
        backendErrorCode,
        retryAfterSeconds,
      });
    }
    if (status === 502) {
      // Distinguish contract-drift from generic upstream error via
      // backend error_code. The backend uses a code like
      // "UPSTREAM_CONTRACT_ERROR" for the AI-422 path.
      const isContract =
        (backendErrorCode ?? "").toUpperCase().includes("CONTRACT");
      return new CoverLetterApiError({
        reason: isContract ? "upstream_contract" : "upstream_generation",
        status,
        message,
        backendErrorCode,
      });
    }
    if (status === 503) {
      return new CoverLetterApiError({
        reason: "unavailable",
        status,
        message,
        backendErrorCode,
      });
    }
    if (status === 504) {
      return new CoverLetterApiError({
        reason: "timeout",
        status,
        message,
        backendErrorCode,
      });
    }
    // Anything else (incl. network / no-response) → unknown.
    return new CoverLetterApiError({
      reason: "unknown",
      status,
      message,
      backendErrorCode,
    });
  }

  // Non-axios error (shouldn't happen — httpClient always throws
  // axios errors). Treat as unknown.
  return new CoverLetterApiError({
    reason: "unknown",
    message: err instanceof Error ? err.message : String(err),
  });
}

// ── debug-metadata strip (defense in depth; backend also forces) ─
function stripDebugMetadata(
  body: CoverLetterGenerateRequest,
): CoverLetterGenerateRequest {
  // Force `include_debug_metadata: false` regardless of what the
  // form passed (V1 NEVER returns or persists debug; backend
  // blueprint §5). This survives a future caller forgetting to
  // set the flag.
  return {
    ...body,
    options: {
      ...(body.options ?? { include_debug_metadata: false }),
      include_debug_metadata: false,
    },
  };
}

// ── 1. generate (POST /generate) ───────────────────────────────
/**
 * @param idempotencyKey  Per the wireframes §B.4 contract: minted
 *   once per submission, immutable for the in-flight mutation, and
 *   re-used on Retry. NEVER include null / empty — the backend's
 *   Header field has `min_length=1`.
 */
export async function generateCoverLetter(
  body: CoverLetterGenerateRequest,
  idempotencyKey: string,
): Promise<CoverLetterResponse> {
  if (!idempotencyKey) {
    throw new CoverLetterApiError({
      reason: "validation",
      message: "Idempotency-Key is required for generate.",
    });
  }
  try {
    const { data } = await httpClient.post<CoverLetterResponse>(
      `${BASE}/generate`,
      stripDebugMetadata(body),
      {
        timeout: 120000,
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );
    return data;
  } catch (err) {
    throw mapError(err);
  }
}

// ── 2. retrieve (GET /{letter_id}) ─────────────────────────────
/**
 * Returns the letter, OR null on a 404 (treat "deleted / not
 * yours / not found" identically — backend §3 no
 * existence-disclosure). Any other error throws.
 */
export async function getCoverLetter(
  letterId: string,
): Promise<CoverLetterResponse | null> {
  try {
    const { data } = await httpClient.get<CoverLetterResponse>(
      `${BASE}/${encodeURIComponent(letterId)}`,
    );
    return data;
  } catch (err) {
    const mapped = mapError(err);
    if (mapped.reason === "not_found") {
      return null;
    }
    throw mapped;
  }
}

// ── 3. list (GET /) ────────────────────────────────────────────
export async function listCoverLetters(
  params: ListCoverLettersParams = {},
): Promise<CoverLetterListResponse> {
  try {
    const { data } = await httpClient.get<CoverLetterListResponse>(BASE, {
      params: {
        ...(params.limit !== undefined && { limit: params.limit }),
        ...(params.cursor && { cursor: params.cursor }),
      },
    });
    return data;
  } catch (err) {
    throw mapError(err);
  }
}

// ── 4. soft-delete (DELETE /{letter_id}) ───────────────────────
/**
 * Returns true iff the backend confirmed the soft-delete (204);
 * returns false on a 404 (treat as "already gone" — idempotent
 * from the user's POV). Other errors throw.
 */
export async function listCoverLetterTemplates(): Promise<CoverLetterTemplateCatalogResponse> {
  try {
    const { data } = await httpClient.get<CoverLetterTemplateCatalogResponse>(
      `${BASE}/templates`,
    );
    return data;
  } catch (err) {
    throw mapError(err);
  }
}

export interface DownloadCoverLetterParams {
  format: CoverLetterExportFormat;
  template_id: string;
}

export async function downloadCoverLetter(
  letterId: string,
  params: DownloadCoverLetterParams,
): Promise<void> {
  try {
    const response = await httpClient.get<Blob>(
      `${BASE}/${encodeURIComponent(letterId)}/download`,
      {
        params,
        responseType: "blob",
      },
    );
    triggerBlobDownload(
      response.data,
      filenameFromDisposition(response.headers?.["content-disposition"])
        ?? fallbackDownloadFilename(params.format),
    );
  } catch (err) {
    const mapped = mapError(err);
    if (mapped.reason === "not_found") {
      throw new CoverLetterApiError({
        reason: "download_unavailable",
        status: mapped.status,
        message: mapped.message,
        backendErrorCode: mapped.backendErrorCode,
      });
    }
    throw mapped;
  }
}

export async function deleteCoverLetter(letterId: string): Promise<boolean> {
  try {
    await httpClient.delete(
      `${BASE}/${encodeURIComponent(letterId)}`,
    );
    return true;
  } catch (err) {
    const mapped = mapError(err);
    if (mapped.reason === "not_found") {
      return false;
    }
    throw mapped;
  }
}

// ── re-export the canonical error class for hook consumers ─────
function filenameFromDisposition(disposition: unknown): string | null {
  if (typeof disposition !== "string") return null;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
}

function fallbackDownloadFilename(format: CoverLetterExportFormat): string {
  return `cover-letter.${format}`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export type { CoverLetterApiErrorReason } from "@/lib/coverLetterMessages";
