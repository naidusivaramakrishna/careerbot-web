"use client";

/**
 * useHasParsedResume — boolean gate for "does the user have ANY
 * parsed resume on file?".
 *
 * Drives the cover-letter NoResumePrompt screen (wireframes §7C):
 * the /cover-letter/new route renders NoResumePrompt when this
 * returns false, otherwise the generate form.
 *
 * Endpoint: GET /api/v1/resumes/all  →  AllResumesResponse
 *   hasResume = builder_resumes.length > 0
 *               || enhanced_resumes.length > 0
 *
 * The same predicate is used by the existing Sidebar smartNav
 * (src/components/layout/Sidebar.tsx:443-448).
 *
 * Loading state convention:
 *   hasResume === null  while loading (vs. false to avoid flashing
 *                       NoResumePrompt on initial render).
 *   On any fetch error, hasResume falls back to FALSE — safer to
 *   nudge the user to /resume/parser than to render a form that
 *   would fail when submitted.
 *
 * Spec: impl-blueprint §8.E + cover-letter-docs/COVER_LETTER_WEB_Q2_RESUME_ENDPOINT.txt.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getAllResumesUnified } from "@/api/resumeApi";

export interface UseHasParsedResumeResult {
  hasResume: boolean | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useHasParsedResume(): UseHasParsedResumeResult {
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const requestSeqRef = useRef(0);

  const load = useCallback(async () => {
    const mySeq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllResumesUnified();
      if (mySeq !== requestSeqRef.current) return;
      // Cover-letter generate needs the FULL parsed resume blob;
      // only `builder_resumes` carry that shape. `enhanced_resumes`
      // are summary metadata only and can't be embedded in the
      // request (Codex WEB-3.1 P2). Keep this hook aligned with
      // useLatestParsedResume's source-of-truth filter so the gate
      // and the content are consistent. A user with only enhanced
      // resumes is routed to /resume/parser (NoResumePrompt) to
      // produce a builder-shape resume.
      const has = (response.builder_resumes?.length ?? 0) > 0;
      setHasResume(has);
    } catch (err) {
      if (mySeq !== requestSeqRef.current) return;
      const mapped = err instanceof Error ? err : new Error(String(err));
      setError(mapped);
      // Fail-safe to FALSE so the user gets routed to /resume/parser
      // rather than seeing a form that would 401/timeout on submit.
      setHasResume(false);
    } finally {
      if (mySeq === requestSeqRef.current) {
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

  return { hasResume, isLoading, error, refetch: load };
}
