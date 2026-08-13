// PII-safe error summary for OAuth catch blocks.
//
// Codex commit-review of b2833ca (round 1) flagged P1: raw caught
// OAuth/Axios errors were being logged via `logger.error('...:', error)`,
// which serializes the AxiosError including `config.data` and `config.headers`.
// On OAuth callback failures, that body contains:
//   - Google/LinkedIn: code + state
//   - Apple: identityToken + authorizationCode + rawNonce + fullName
// All highly sensitive. Logging them via the JWT-redacting logger still
// leaks the non-JWT fields (code, nonce, fullName).
//
// This helper extracts ONLY the HTTP status code + a generic message,
// dropping the request body entirely. Use it in every OAuth catch block:
//
//   } catch (error) {
//     logger.error('[oauth/<provider>] sign-in failed', summarizeOAuthError(error));
//     return null;
//   }

export interface OAuthErrorSummary {
  status?: number;
  message: string;
}

export function summarizeOAuthError(error: unknown): OAuthErrorSummary {
  const status =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;

  return {
    status,
    message: error instanceof Error ? error.message : 'OAuth sign-in failed',
  };
}
