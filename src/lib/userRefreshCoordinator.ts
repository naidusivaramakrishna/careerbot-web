import type { AxiosResponse } from 'axios';

/**
 * Single-flight guard for the raw POST /api/backend/auth/refresh network
 * call, shared by every path that can trigger a USER access-token refresh:
 *
 *   - http.ts's response interceptor (reactive, fires on an ordinary 401)
 *   - useTokenRefresh.ts (proactive, on a timer/tab-focus)
 *   - chatbotApi.ts's attachment-download 403 handler
 *
 * (authApi.refreshAccessToken() is the shared entry point for the second
 * and third; this coordinator is what additionally unifies BOTH of those
 * with the first.)
 *
 * The backend's refresh_token is single-use/rotating (see http.ts and
 * useTokenRefresh.ts's own comments), so two concurrent POSTs race: the
 * loser's token has already been consumed by the winner and fails, even
 * though the session itself is perfectly fine -- in the worst case, that
 * false failure logs the user out. Every caller must join the SAME
 * in-flight attempt instead of starting its own.
 *
 * Deliberately has NO dependency on http.ts or authApi.ts (both import
 * this, not each other) to avoid a circular import between them. It only
 * dedupes the network call itself -- each caller still builds its own
 * request config (headers, etc.) and does its own post-processing on the
 * (possibly shared) response, so nothing here needs to know their
 * individual concerns (token bookkeeping, event dispatching, redirect
 * decisions, queued-request retries).
 *
 * Admin refresh is a separate endpoint/flow (refreshAdminToken) and is not
 * part of this coordinator.
 */
let inFlightUserRefreshPost: Promise<AxiosResponse<unknown>> | null = null;

export function coordinatedUserRefreshPost<T>(
  post: () => Promise<AxiosResponse<T>>,
): Promise<AxiosResponse<T>> {
  if (inFlightUserRefreshPost) return inFlightUserRefreshPost as Promise<AxiosResponse<T>>;
  const promise = post().finally(() => {
    if (inFlightUserRefreshPost === promise) inFlightUserRefreshPost = null;
  });
  inFlightUserRefreshPost = promise as Promise<AxiosResponse<unknown>>;
  return promise;
}
