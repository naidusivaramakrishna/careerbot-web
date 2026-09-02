"use client";

/**
 * useGenerateCoverLetter — fire-and-forget mutation for POST /generate.
 *
 * KEY CONTRACT (Codex impl-r1 P1#6 + impl-r2 P2#5):
 *   The mutation INPUT (`{ body, attemptKey }`) is captured in a
 *   useRef when `mutate()` is called. Both `body` AND `attemptKey`
 *   are IMMUTABLE for the in-flight request — a form edit during
 *   flight cannot race-clear them. A manual Retry MUST resend the
 *   same captured pair so the backend's Idempotency-Key cache hit
 *   returns the original letter without re-billing the AI.
 *
 * A FRESH submission (user edited the form and clicks Generate
 * again) builds a NEW attempt object: new body, new key. The
 * abandoned attempt's key stays "in the wild" (the backend may
 * still finish + persist it; reconciliation is via the list
 * refetch, NOT via key reuse — see wireframes §B.2 cancel
 * semantics).
 *
 * Spec: impl-blueprint §8.B.
 */
import { useCallback, useRef, useState } from "react";
import {
  generateCoverLetter,
  CoverLetterApiError,
} from "@/api/coverLetterApi";
import type {
  CoverLetterGenerateRequest,
  CoverLetterResponse,
} from "@/types/coverLetter";

export interface GenerateAttempt {
  body: CoverLetterGenerateRequest;
  attemptKey: string;
}

export interface UseGenerateCoverLetterOptions {
  /** Called with the parsed response on a 2xx outcome. */
  onSuccess?: (response: CoverLetterResponse, attempt: GenerateAttempt) => void;
  /** Called with the typed error on any failure. */
  onError?: (error: CoverLetterApiError, attempt: GenerateAttempt) => void;
}

export interface UseGenerateCoverLetterResult {
  /** Trigger the mutation. Captures the attempt immutably. */
  mutate: (attempt: GenerateAttempt) => Promise<void>;
  /** Re-fire the LAST captured attempt (same body, same key). */
  retry: () => Promise<void>;
  /** Stop waiting on the in-flight request. Doesn't cancel the
   *  server-side work — see wireframes §B.2. */
  abort: () => void;
  isLoading: boolean;
  data: CoverLetterResponse | null;
  error: CoverLetterApiError | null;
}

export function useGenerateCoverLetter(
  options: UseGenerateCoverLetterOptions = {},
): UseGenerateCoverLetterResult {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<CoverLetterResponse | null>(null);
  const [error, setError] = useState<CoverLetterApiError | null>(null);

  // The current in-flight attempt — captured at mutate() time,
  // immutable for the duration of the request. Re-set on the next
  // mutate() (which represents a fresh submission, NOT a retry).
  const currentAttemptRef = useRef<GenerateAttempt | null>(null);

  // Sequence number used to invalidate stale responses (caller
  // aborted, unmounted, or fired a fresh mutate).
  const requestSeqRef = useRef(0);

  // Latched callbacks so the inner async closure sees the LATEST
  // onSuccess/onError without re-creating mutate on every render.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const runWithAttempt = useCallback(async (attempt: GenerateAttempt) => {
    currentAttemptRef.current = attempt;
    const mySeq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await generateCoverLetter(attempt.body, attempt.attemptKey);
      if (mySeq !== requestSeqRef.current) {
        // Abandoned. Don't update state; don't fire onSuccess.
        return;
      }
      setData(response);
      optionsRef.current.onSuccess?.(response, attempt);
    } catch (err) {
      if (mySeq !== requestSeqRef.current) return;
      const mapped =
        err instanceof CoverLetterApiError
          ? err
          : new CoverLetterApiError({
              reason: "unknown",
              message: err instanceof Error ? err.message : String(err),
            });
      setError(mapped);
      optionsRef.current.onError?.(mapped, attempt);
    } finally {
      if (mySeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const mutate = useCallback(
    async (attempt: GenerateAttempt) => {
      // Fresh submission: any previous attempt is abandoned. The
      // requestSeq bump inside runWithAttempt invalidates any
      // in-flight result tied to the old attempt.
      await runWithAttempt(attempt);
    },
    [runWithAttempt],
  );

  const retry = useCallback(async () => {
    const last = currentAttemptRef.current;
    if (!last) return;
    await runWithAttempt(last);
  }, [runWithAttempt]);

  const abort = useCallback(() => {
    // Bump the seq so the in-flight result (if any) is dropped on
    // arrival. The actual network request continues; the backend
    // may still finish + persist (wireframes §B.2 cancel notes).
    requestSeqRef.current += 1;
    setIsLoading(false);
  }, []);

  return { mutate, retry, abort, isLoading, data, error };
}
