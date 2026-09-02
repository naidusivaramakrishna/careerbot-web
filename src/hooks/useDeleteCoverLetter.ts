"use client";

/**
 * useDeleteCoverLetter — soft-delete mutation for DELETE /{id}.
 *
 * Idempotent from the user's POV (wireframes §G):
 *   - 204 → resolves to true; caller refetches list + navigates.
 *   - 404 → resolves to FALSE (already gone). Caller still
 *           navigates back; does NOT toast an error.
 *   - other errors → reject with the typed CoverLetterApiError;
 *                    caller toasts "Couldn't delete. Try again."
 *
 * Spec: impl-blueprint §8.D.
 */
import { useCallback, useRef, useState } from "react";
import {
  deleteCoverLetter,
  CoverLetterApiError,
} from "@/api/coverLetterApi";

export interface UseDeleteCoverLetterOptions {
  /** Called on a 2xx OR 404 outcome (both are "letter is gone"). */
  onSettled?: (letterId: string, wasNewlyDeleted: boolean) => void;
  /** Called on a non-404 error. */
  onError?: (letterId: string, error: CoverLetterApiError) => void;
}

export interface UseDeleteCoverLetterResult {
  mutate: (letterId: string) => Promise<boolean>;
  isLoading: boolean;
  error: CoverLetterApiError | null;
}

export function useDeleteCoverLetter(
  options: UseDeleteCoverLetterOptions = {},
): UseDeleteCoverLetterResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CoverLetterApiError | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(async (letterId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const wasNewlyDeleted = await deleteCoverLetter(letterId);
      // wasNewlyDeleted is false on 404 (already gone). Both are
      // "letter is gone now" from the user's POV — fire onSettled
      // for either; caller refetches list + navigates.
      optionsRef.current.onSettled?.(letterId, wasNewlyDeleted);
      return wasNewlyDeleted;
    } catch (err) {
      const mapped =
        err instanceof CoverLetterApiError
          ? err
          : new CoverLetterApiError({
              reason: "unknown",
              message: err instanceof Error ? err.message : String(err),
            });
      setError(mapped);
      optionsRef.current.onError?.(letterId, mapped);
      throw mapped;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}
