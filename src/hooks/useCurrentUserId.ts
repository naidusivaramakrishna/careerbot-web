"use client";

/**
 * useCurrentUserId — resolves the signed-in user's id via the
 * existing server-side route `/api/auth/stream-token` (verifies
 * the httpOnly access_token cookie + returns `sub` from the JWT).
 *
 * Same pattern as `useNotificationStream`. The user_id is required
 * by `mintIdempotencyKey(userId)` (idempotencyKey.ts) so cover-
 * letter retries hit the backend cache deterministically.
 *
 * Cache: the id is captured in a module-scoped ref so the second
 * render of any hook consumer is synchronous (no extra round-trip).
 * Invalidated on 401 — caller re-mounts after sign-in.
 *
 * Spec: impl-blueprint §9 WEB-3.2 (idempotency key plumbing).
 */
import { useEffect, useRef, useState } from "react";

// Module-scoped cache (one tab = one user; sign-out reloads
// the page so this resets naturally).
let cachedUserId: string | null = null;

export interface UseCurrentUserIdResult {
  userId: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCurrentUserId(): UseCurrentUserIdResult {
  const [userId, setUserId] = useState<string | null>(cachedUserId);
  const [isLoading, setIsLoading] = useState(cachedUserId === null);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (cachedUserId !== null) {
      // Already resolved — nothing to do.
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/stream-token");
        if (!res.ok) {
          throw new Error(`stream-token returned ${res.status}`);
        }
        const data = (await res.json()) as { user_id?: string };
        if (!data.user_id) {
          throw new Error("stream-token missing user_id");
        }
        cachedUserId = data.user_id;
        if (mountedRef.current) {
          setUserId(data.user_id);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { userId, isLoading, error };
}
