import { useEffect } from 'react';
import { refreshAccessToken } from '@/api/authApi';
import { refreshAdminToken } from '@/api/adminAuthApi';
import { logger } from '@/lib/logger';

/**
 * Hook for proactive token refresh with retry logic
 *
 * ✅ PREVENTS USER LOGOUT: Refreshes token 10 minutes before expiry
 * - Uses actual token expiry from backend (dynamically adjusts)
 * - Fallback to 30 minutes if backend value unavailable
 * - Automatically handles token refresh in the background
 * - Refreshes on mount if token is stale (>50% of lifetime)
 * - Refreshes when tab comes back into focus
 * - Retries failed refreshes up to 3 times (1-minute intervals)
 * - Logs user out with clear message if all retries fail
 * - Only runs when user is authenticated
 *
 * Usage: Call this hook in a root layout or provider that wraps authenticated pages
 *
 * @param isAuthenticated - Whether user is currently authenticated
 * @param tokenExpiryMs - Token expiry time in milliseconds (default: 30 * 60 * 1000 = 30 mins, overridden by backend)
 * @param pathname - Current pathname to detect admin routes
 */
const LAST_REFRESH_KEY = 'token_last_refreshed_at';
const TOKEN_EXPIRY_SECONDS_KEY = 'token_expires_in_seconds';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 60 * 1000; // 1 minute
const DEFAULT_TOKEN_EXPIRY_SECONDS = 30 * 60; // 30 minutes fallback

// Prevent concurrent refresh requests (token rotation vulnerability)
let isRefreshing = false;
let refreshStartTime = 0;
const REFRESH_TIMEOUT_MS = 30 * 1000; // 30 second timeout to prevent hung refreshes

const getTokenExpirySeconds = (): number => {
  if (typeof window === 'undefined') return DEFAULT_TOKEN_EXPIRY_SECONDS;
  const stored = localStorage.getItem(TOKEN_EXPIRY_SECONDS_KEY);
  return stored ? parseInt(stored, 10) : DEFAULT_TOKEN_EXPIRY_SECONDS;
};

const getLastRefreshedAt = (): number => {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(LAST_REFRESH_KEY) || '0', 10);
};

const setLastRefreshedAt = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString());
};

const handleUserSessionExpired = () => {
  logger.error('[Token Refresh] User session expired - clearing tokens and redirecting to login');

  if (typeof window !== 'undefined') {
    // Clear user auth tokens only
    document.cookie = 'access_token=; Max-Age=0; path=/;';
    document.cookie = 'refresh_token=; Max-Age=0; path=/;';
    localStorage.removeItem(LAST_REFRESH_KEY);

    // Redirect to login with reason
    window.location.href = '/?showLogin=true&reason=session_expired';
  }
};

export const useTokenRefresh = (
  isAuthenticated: boolean = true,
  tokenExpiryMs: number = 30 * 60 * 1000, // 30 minutes - default (overridden by backend value)
  pathname?: string // optional pathname to detect admin routes
) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    // Use actual token expiry from backend if available, otherwise use passed param or default
    const actualTokenExpirySeconds = getTokenExpirySeconds();
    const actualTokenExpiryMs = actualTokenExpirySeconds * 1000;
    // Refresh 10 minutes before expiry (more conservative buffer to prevent edge cases)
    // This ensures token is refreshed well before it expires, preventing logout
    const refreshBeforeExpiryMs = actualTokenExpiryMs - 10 * 60 * 1000;
    const isAdminRoute = pathname?.startsWith('/admin');

    logger.info(`[Token Refresh] Using token expiry: ${actualTokenExpirySeconds}s, will refresh at: ${(actualTokenExpiryMs - refreshBeforeExpiryMs) / 1000 / 60}min mark`);

    const dispatchTokenRefreshed = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(isAdminRoute ? 'adminTokenUpdated' : 'tokenUpdated'));
      }
    };

    const doRefreshWithRetry = async (attempt: number = 1): Promise<boolean> => {
      try {
        logger.info(`[Token Refresh] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS}: Refreshing user access token...`);
        await refreshAccessToken();
        setLastRefreshedAt();
        logger.info('[Token Refresh] ✅ Token refreshed successfully');
        dispatchTokenRefreshed();
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const statusCode = (error as any)?.response?.status;
        const detail = (error as any)?.response?.data?.detail;
        logger.error(`[Token Refresh] ❌ Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed:`, {
          message: errorMsg,
          status: statusCode,
          detail: detail,
          fullError: error
        });

        // If we haven't exhausted retries, schedule another attempt
        if (attempt < MAX_RETRY_ATTEMPTS) {
          // Update timestamp on retry to keep isSessionFresh() from timing out
          // This prevents http.ts interceptor from logging user out during retry window
          setLastRefreshedAt();
          logger.info(`[Token Refresh] Scheduling retry in ${RETRY_DELAY_MS / 1000 / 60} minute...`);
          setTimeout(() => {
            doRefreshWithRetry(attempt + 1);
          }, RETRY_DELAY_MS);
          return false;
        }

        // All retries failed - session is expired
        logger.error('[Token Refresh] All retry attempts failed. User session has expired.');
        handleUserSessionExpired();
        return false;
      }
    };

    // Only apply retry logic to user routes (not admin)
    const doRefresh = async () => {
      // Prevent concurrent refresh requests to avoid token rotation issues
      // Also check if a previous refresh is stuck (timeout)
      if (isRefreshing) {
        const timeSinceRefreshStart = Date.now() - refreshStartTime;
        if (timeSinceRefreshStart < REFRESH_TIMEOUT_MS) {
          logger.debug('[Token Refresh] Already refreshing, skipping concurrent request');
          return;
        }
        // Timeout exceeded - force reset
        logger.warn('[Token Refresh] Previous refresh timed out, resetting state');
        isRefreshing = false;
      }

      // Check if we're actually in the refresh window to avoid unnecessary refreshes
      const timeSinceLastRefresh = Date.now() - getLastRefreshedAt();

      // Only refresh if we're within the buffer window (10 min before expiry)
      if (timeSinceLastRefresh < refreshBeforeExpiryMs) {
        logger.debug(`[Token Refresh] Not yet time to refresh (${Math.round(timeSinceLastRefresh / 1000 / 60)} min since last, need ${Math.round(refreshBeforeExpiryMs / 1000 / 60)} min)`);
        return;
      }

      if (isAdminRoute) {
        // Admin token refresh - keep original logic, no retries
        try {
          logger.info('[Token Refresh] Refreshing admin token...');
          await refreshAdminToken();
          setLastRefreshedAt();
          logger.info('[Token Refresh] Admin token refreshed successfully');
          dispatchTokenRefreshed();
        } catch (error) {
          logger.error('[Token Refresh] Failed to refresh admin token:', error);
        }
      } else {
        // User token refresh - use retry logic with concurrency protection
        isRefreshing = true;
        refreshStartTime = Date.now();
        try {
          await doRefreshWithRetry(1);
        } finally {
          isRefreshing = false;
          refreshStartTime = 0;
        }
      }
    };

    // On mount: refresh if token is close to expiry (within refresh window) or if it's been a while
    // This proactively prevents logout by ensuring token is always fresh
    const lastRefreshedAt = getLastRefreshedAt();
    if (lastRefreshedAt === 0) {
      // No timestamp found - user just logged in or cleared storage
      // Set current time and skip mount refresh (token is fresh from login)
      setLastRefreshedAt();
      logger.info('[Token Refresh] No refresh timestamp found, initializing (token assumed fresh from login)');
    } else {
      const timeSinceLastRefresh = Date.now() - lastRefreshedAt;
      // Refresh if close to expiry window OR if it's been more than half the token lifetime
      const halfExpiryMs = actualTokenExpiryMs / 2;
      if (timeSinceLastRefresh >= refreshBeforeExpiryMs || timeSinceLastRefresh >= halfExpiryMs) {
        logger.info(`[Token Refresh] Token may be stale (${Math.round(timeSinceLastRefresh / 1000 / 60)} mins since last refresh), refreshing on mount...`);
        doRefresh();
      } else {
        logger.info(`[Token Refresh] Token is fresh (${Math.round(timeSinceLastRefresh / 1000 / 60)} mins since last refresh), skipping mount refresh`);
      }
    }

    // Interval should be LESS than refresh buffer to catch multiple refreshes
    // If token expires in 30min and we refresh at 20min mark, interval should be ~15min
    // so we refresh at 15min, 30min (catch at 20min), etc. before hitting expiry
    const refreshIntervalMs = Math.max(5 * 60 * 1000, refreshBeforeExpiryMs / 2); // 5 min or half the buffer
    const intervalMinutes = Math.round(refreshIntervalMs / 1000 / 60);
    logger.info(`[Token Refresh] Setting up token refresh interval every ${intervalMinutes} minutes (will refresh 10 minutes before expiry)`);

    const refreshTimer = setInterval(doRefresh, refreshIntervalMs);

    // Refresh token when tab comes back into focus (handles long idle periods)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.info('[Token Refresh] Tab came into focus, checking if refresh needed...');
        const lastRefreshedAt = getLastRefreshedAt();
        const timeSinceLastRefresh = Date.now() - lastRefreshedAt;
        // Refresh if close to expiry (within 10 minute window) OR if it's been more than half the expiry time
        const halfExpiryMs = actualTokenExpiryMs / 2;
        if (timeSinceLastRefresh >= refreshBeforeExpiryMs || timeSinceLastRefresh >= halfExpiryMs) {
          logger.info('[Token Refresh] Token stale after idle period, refreshing now...');
          doRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      logger.info('[Token Refresh] Cleared token refresh timer and visibility listener');
    };
  }, [isAuthenticated, tokenExpiryMs, pathname]);
};

/**
 * Manual token refresh (for when you need to refresh immediately)
 *
 * @returns Promise that resolves when token is refreshed
 */
export const manualTokenRefresh = async (): Promise<void> => {
  try {
    logger.info('[Manual Token Refresh] Refreshing token...');
    await refreshAccessToken();
    logger.info('[Manual Token Refresh] Token refreshed successfully');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('tokenRefreshed'));
    }
  } catch (error) {
    logger.error('[Manual Token Refresh] Failed to refresh token:', error);
    throw error;
  }
};