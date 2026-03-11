import { useEffect } from 'react';
import { refreshAccessToken } from '@/api/authApi';
import { refreshAdminToken } from '@/api/adminAuthApi';
import { logger } from '@/lib/logger';

/**
 * Hook for proactive token refresh
 *
 * - Access token expires in 30 minutes
 * - Refresh token 5 minutes before expiry (at 25 min mark)
 * - Automatically handles token refresh in the background
 * - Only runs when user is authenticated
 *
 * Usage: Call this hook in a root layout or provider that wraps authenticated pages
 *
 * @param isAuthenticated - Whether user is currently authenticated
 * @param tokenExpiryMs - Token expiry time in milliseconds (default: 30 * 60 * 1000 = 30 mins)
 */
const LAST_REFRESH_KEY = 'token_last_refreshed_at';

const getLastRefreshedAt = (): number => {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(LAST_REFRESH_KEY) || '0', 10);
};

const setLastRefreshedAt = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_REFRESH_KEY, Date.now().toString());
};

export const useTokenRefresh = (
  isAuthenticated: boolean = true,
  tokenExpiryMs: number = 30 * 60 * 1000, // 30 minutes
  pathname?: string // optional pathname to detect admin routes
) => {
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshBeforeExpiryMs = tokenExpiryMs - 5 * 60 * 1000; // 25 minutes
    const isAdminRoute = pathname?.startsWith('/admin');

    const dispatchTokenRefreshed = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(isAdminRoute ? 'adminTokenUpdated' : 'tokenUpdated'));
      }
    };

    const doRefresh = async () => {
      try {
        logger.info(`[Token Refresh] Attempting to refresh ${isAdminRoute ? 'admin' : 'user'} access token...`);
        if (isAdminRoute) {
          await refreshAdminToken();
        } else {
          await refreshAccessToken();
        }
        setLastRefreshedAt();
        logger.info('[Token Refresh] Token refreshed successfully');
        dispatchTokenRefreshed();
      } catch (error) {
        logger.error('[Token Refresh] Failed to refresh token:', error);
        // Error handling is done in the http interceptor
        // which will redirect to login if refresh fails
      }
    };

    // On mount: only refresh if token is close to expiry or already expired
    // Avoids unnecessary refresh on every page load/navigation
    const lastRefreshedAt = getLastRefreshedAt();
    if (lastRefreshedAt === 0) {
      // No timestamp found - user just logged in or cleared storage
      // Set current time and skip mount refresh (token is fresh from login)
      setLastRefreshedAt();
      logger.info('[Token Refresh] No refresh timestamp found, initializing (token assumed fresh from login)');
    } else {
      const timeSinceLastRefresh = Date.now() - lastRefreshedAt;
      if (timeSinceLastRefresh >= refreshBeforeExpiryMs) {
        logger.info(`[Token Refresh] Token may be stale (${Math.round(timeSinceLastRefresh / 1000 / 60)} mins since last refresh), refreshing on mount...`);
        doRefresh();
      } else {
        logger.info(`[Token Refresh] Token is fresh (${Math.round(timeSinceLastRefresh / 1000 / 60)} mins since last refresh), skipping mount refresh`);
      }
    }

    logger.info(`[Token Refresh] Setting up token refresh interval every ${refreshBeforeExpiryMs / 1000 / 60} minutes`);

    const refreshTimer = setInterval(doRefresh, refreshBeforeExpiryMs);

    // Refresh token when tab comes back into focus (handles long idle periods)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.info('[Token Refresh] Tab came into focus, checking if refresh needed...');
        const lastRefreshedAt = getLastRefreshedAt();
        const timeSinceLastRefresh = Date.now() - lastRefreshedAt;
        if (timeSinceLastRefresh >= refreshBeforeExpiryMs) {
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