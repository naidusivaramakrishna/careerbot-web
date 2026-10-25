/**
 * The API's machine-readable error code (`target_role_required`, `contact_name_required`,
 * `no_evidence_section`, ...) from an error thrown by the API layer, or undefined when it sent none.
 *
 * careerbot-api answers `{ success: false, error: { message, error_code, details: { error, ... } } }`;
 * the code lives in `details.error`.
 */
export function apiErrorCode(err: unknown): string | undefined {
  const raw = (err as { __raw?: unknown } | null)?.__raw;
  const error = raw && typeof raw === "object" ? (raw as Record<string, unknown>).error : undefined;
  const details = error && typeof error === "object" ? (error as Record<string, unknown>).details : undefined;
  const code = details && typeof details === "object" ? (details as Record<string, unknown>).error : undefined;
  return typeof code === "string" ? code : undefined;
}

/** Sent when a resume names no role to score it for (e.g. a fresher with no headline). */
export const TARGET_ROLE_REQUIRED = "target_role_required";
