"use client";

import { useCallback, useRef, useState } from "react";
import {
  updateCoverLetter,
  CoverLetterApiError,
} from "@/api/coverLetterApi";
import type {
  CoverLetterResponse,
  CoverLetterUpdateRequest,
} from "@/types/coverLetter";

export interface UseUpdateCoverLetterOptions {
  onSuccess?: (letterId: string, letter: CoverLetterResponse) => void;
  onNotFound?: (letterId: string) => void;
  onError?: (letterId: string, error: CoverLetterApiError) => void;
}

export interface UseUpdateCoverLetterResult {
  mutate: (
    letterId: string,
    body: CoverLetterUpdateRequest,
  ) => Promise<CoverLetterResponse | null>;
  isLoading: boolean;
  error: CoverLetterApiError | null;
}

export function useUpdateCoverLetter(
  options: UseUpdateCoverLetterOptions = {},
): UseUpdateCoverLetterResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CoverLetterApiError | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (
      letterId: string,
      body: CoverLetterUpdateRequest,
    ): Promise<CoverLetterResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const letter = await updateCoverLetter(letterId, body);
        if (letter === null) {
          optionsRef.current.onNotFound?.(letterId);
          return null;
        }
        optionsRef.current.onSuccess?.(letterId, letter);
        return letter;
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
    },
    [],
  );

  return { mutate, isLoading, error };
}
