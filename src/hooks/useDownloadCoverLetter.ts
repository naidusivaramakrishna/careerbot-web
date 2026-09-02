"use client";

import { useCallback, useRef, useState } from "react";
import {
  downloadCoverLetter,
  CoverLetterApiError,
  type DownloadCoverLetterParams,
} from "@/api/coverLetterApi";

export interface UseDownloadCoverLetterOptions {
  onSuccess?: (letterId: string, params: DownloadCoverLetterParams) => void;
  onError?: (
    letterId: string,
    params: DownloadCoverLetterParams,
    error: CoverLetterApiError,
  ) => void;
}

export interface UseDownloadCoverLetterResult {
  mutate: (letterId: string, params: DownloadCoverLetterParams) => Promise<void>;
  isLoading: boolean;
  error: CoverLetterApiError | null;
}

export function useDownloadCoverLetter(
  options: UseDownloadCoverLetterOptions = {},
): UseDownloadCoverLetterResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CoverLetterApiError | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (letterId: string, params: DownloadCoverLetterParams) => {
      setIsLoading(true);
      setError(null);
      try {
        await downloadCoverLetter(letterId, params);
        optionsRef.current.onSuccess?.(letterId, params);
      } catch (err) {
        const mapped =
          err instanceof CoverLetterApiError
            ? err
            : new CoverLetterApiError({
                reason: "unknown",
                message: err instanceof Error ? err.message : String(err),
              });
        setError(mapped);
        optionsRef.current.onError?.(letterId, params, mapped);
        throw mapped;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { mutate, isLoading, error };
}
