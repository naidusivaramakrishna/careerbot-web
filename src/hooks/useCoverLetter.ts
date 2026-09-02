"use client";

/**
 * useCoverLetter — fetch a single letter by id.
 *
 * GET /api/v1/cover-letter/{letterId} via getCoverLetter().
 *
 * 404 contract (backend §3 no existence-disclosure): deleted /
 * not-yours / never-existed all collapse to `letter === null` +
 * `error === null`. Callers render "Letter not found" on that
 * combination. Other errors surface in `error`.
 *
 * Spec: impl-blueprint §8.C.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCoverLetter,
  CoverLetterApiError,
} from "@/api/coverLetterApi";
import type { CoverLetterResponse } from "@/types/coverLetter";

export interface UseCoverLetterResult {
  letter: CoverLetterResponse | null;
  isLoading: boolean;
  error: CoverLetterApiError | null;
  refetch: () => Promise<void>;
}

export function useCoverLetter(letterId: string | null): UseCoverLetterResult {
  const [letter, setLetter] = useState<CoverLetterResponse | null>(null);
  const [isLoading, setIsLoading] = useState(letterId !== null);
  const [error, setError] = useState<CoverLetterApiError | null>(null);

  const requestSeqRef = useRef(0);

  const load = useCallback(async () => {
    if (!letterId) {
      setLetter(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    const mySeq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCoverLetter(letterId);
      if (mySeq !== requestSeqRef.current) return;
      // result is null on 404 — caller treats as "not found".
      setLetter(result);
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
      setLetter(null);
    } finally {
      if (mySeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [letterId]);

  useEffect(() => {
    void load();
    return () => {
      requestSeqRef.current += 1;
    };
  }, [load]);

  return { letter, isLoading, error, refetch: load };
}
