"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CoverLetterApiError,
  getDefaultCoverLetterResume,
} from "@/api/coverLetterApi";
import type { CoverLetterDefaultResumeResponse } from "@/types/coverLetter";

export interface UseDefaultCoverLetterResumeResult {
  defaultResume: CoverLetterDefaultResumeResponse | null;
  isLoading: boolean;
  error: CoverLetterApiError | null;
  refetch: () => Promise<void>;
}

export function useDefaultCoverLetterResume(): UseDefaultCoverLetterResumeResult {
  const [defaultResume, setDefaultResume] =
    useState<CoverLetterDefaultResumeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<CoverLetterApiError | null>(null);
  const requestSeqRef = useRef(0);

  const load = useCallback(async () => {
    const requestSeq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDefaultCoverLetterResume();
      if (requestSeq !== requestSeqRef.current) return;
      setDefaultResume(result);
    } catch (err) {
      if (requestSeq !== requestSeqRef.current) return;
      const mapped =
        err instanceof CoverLetterApiError
          ? err
          : new CoverLetterApiError({
              reason: "unknown",
              message: err instanceof Error ? err.message : String(err),
            });
      setError(mapped);
      setDefaultResume(null);
    } finally {
      if (requestSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      requestSeqRef.current += 1;
    };
  }, [load]);

  return { defaultResume, isLoading, error, refetch: load };
}
