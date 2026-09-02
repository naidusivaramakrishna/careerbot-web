"use client";

/**
 * useCoverLetterList — paginated cover-letter history.
 *
 * GET /api/v1/cover-letter via listCoverLetters().
 *
 * Returns:
 *   items          accumulated rows across pages
 *   nextCursor     null when the last page has been served
 *   isLoading      true while a fetch is in flight
 *   error          CoverLetterApiError | null
 *   refetch        re-fetch from page 1 (drops items + cursor);
 *                  the cache-invalidation primitive used by
 *                  useGenerateCoverLetter / useDeleteCoverLetter
 *                  via the caller's onSuccess callback.
 *   fetchNextPage  load the next page (no-op when no cursor)
 *
 * Spec: impl-blueprint §8.A.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  listCoverLetters,
  CoverLetterApiError,
} from "@/api/coverLetterApi";
import type {
  CoverLetterListItem,
  ListCoverLettersParams,
} from "@/types/coverLetter";

export interface UseCoverLetterListResult {
  items: CoverLetterListItem[];
  nextCursor: string | null;
  isLoading: boolean;
  error: CoverLetterApiError | null;
  refetch: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
}

export function useCoverLetterList(
  initialParams: ListCoverLettersParams = {},
): UseCoverLetterListResult {
  const [items, setItems] = useState<CoverLetterListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<CoverLetterApiError | null>(null);

  // Keep the initial params stable across renders without a useMemo
  // dance. Caller can pass an inline object; we capture once.
  const paramsRef = useRef(initialParams);

  // Cancel any in-flight request on unmount or refetch. The api
  // client doesn't currently expose an AbortSignal wiring; this
  // ref tracks an "is the result still wanted?" flag instead.
  const requestSeqRef = useRef(0);

  const loadPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      const mySeq = ++requestSeqRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const response = await listCoverLetters({
          limit: paramsRef.current.limit,
          cursor: cursor ?? undefined,
        });
        if (mySeq !== requestSeqRef.current) {
          // Stale response — caller refetched or unmounted.
          return;
        }
        setItems((prev) => (append ? [...prev, ...response.items] : response.items));
        setNextCursor(response.next_cursor);
      } catch (err) {
        if (mySeq !== requestSeqRef.current) return;
        setError(
          err instanceof CoverLetterApiError
            ? err
            : new CoverLetterApiError({
                reason: "unknown",
                message: err instanceof Error ? err.message : String(err),
              }),
        );
      } finally {
        if (mySeq === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const refetch = useCallback(async () => {
    // Reset cursor state then load from the top.
    setNextCursor(null);
    await loadPage(null, /* append */ false);
  }, [loadPage]);

  const fetchNextPage = useCallback(async () => {
    if (!nextCursor) return;
    await loadPage(nextCursor, /* append */ true);
  }, [loadPage, nextCursor]);

  useEffect(() => {
    void loadPage(null, false);
    return () => {
      // Invalidate any in-flight result so a late response
      // doesn't setState on an unmounted component.
      requestSeqRef.current += 1;
    };
  }, [loadPage]);

  return { items, nextCursor, isLoading, error, refetch, fetchNextPage };
}
