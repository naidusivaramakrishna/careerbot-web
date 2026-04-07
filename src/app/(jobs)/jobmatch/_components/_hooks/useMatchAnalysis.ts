"use client";

import { useState, useCallback, useMemo } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useMatchAnalysis = (initialMatchResults: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [matchResults, setMatchResults] = useState<any>(initialMatchResults);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolveResumeId = useCallback((parsedResumeData?: any): string | null => {
    // Try all possible locations for resume ID
    const candidate =
      parsedResumeData?.resume_id ||
      parsedResumeData?.id ||
      parsedResumeData?._id ||
      parsedResumeData?.data?.resume_id ||
      parsedResumeData?.data?.id ||
      parsedResumeData?.data?._id ||
      matchResults?.data?.resume_id ||
      matchResults?.resume_id ||
      null;

    return candidate;
  }, [matchResults]);

  const score = useMemo(() => {
    const raw = matchResults?.data?.ats_score || "0";
    const parsed = parseFloat(String(raw).replace("%", ""));
    return Math.min(100, Math.max(0, isNaN(parsed) ? 0 : parsed));
  }, [matchResults]);

  return {
    matchResults,
    setMatchResults,
    resolveResumeId,
    score,
  };
};
