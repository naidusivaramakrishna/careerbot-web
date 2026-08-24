"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CoverLetterApiError,
  getDefaultCoverLetterTemplate,
  setDefaultCoverLetterTemplate,
} from "@/api/coverLetterApi";
import type { CoverLetterTemplate, CoverLetterTemplateId } from "@/types/coverLetter";

export function useDefaultCoverLetterTemplate() {
  const [defaultTemplate, setDefaultTemplate] = useState<CoverLetterTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<CoverLetterApiError | null>(null);
  const mounted = useRef(true);
  // refetch() and setDefault() both write defaultTemplate. Without ordering,
  // a GET issued before a PUT can land after it and restore the stale
  // template; two PUTs can likewise commit out of order. Every request takes
  // a ticket and only the most recently issued one is allowed to commit.
  const requestSeq = useRef(0);

  const refetch = useCallback(async () => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDefaultCoverLetterTemplate();
      if (mounted.current && seq === requestSeq.current) setDefaultTemplate(result.template);
    } catch (err) {
      // Map to null ONLY for the typed API error we know how to render; an
      // unexpected error (network failure, thrown non-Error) must not become
      // `null`, because the UI reads `error === null` as "fine". That renders
      // a failed fetch as "no default template", which is indistinguishable
      // from a user who genuinely has none.
      if (mounted.current && seq === requestSeq.current) {
        setError(
          err instanceof CoverLetterApiError
            ? err
            : new CoverLetterApiError({ reason: "unknown" }),
        );
      }
    } finally {
      if (mounted.current && seq === requestSeq.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refetch();
    return () => { mounted.current = false; };
  }, [refetch]);

  const setDefault = useCallback(async (templateId: CoverLetterTemplateId) => {
    const seq = ++requestSeq.current;
    setIsSaving(true);
    setError(null);
    try {
      const result = await setDefaultCoverLetterTemplate({ template_id: templateId });
      if (mounted.current && seq === requestSeq.current) setDefaultTemplate(result.template);
      return result.template;
    } catch (err) {
      // Same reasoning as refetch: an unexpected failure must surface, not
      // read as "no error". setDefault still rethrows either way, so the
      // caller can react too.
      const mapped =
        err instanceof CoverLetterApiError
          ? err
          : new CoverLetterApiError({ reason: "unknown" });
      if (mounted.current && seq === requestSeq.current) setError(mapped);
      throw err;
    } finally {
      if (mounted.current && seq === requestSeq.current) setIsSaving(false);
    }
  }, []);

  return { defaultTemplate, isLoading, isSaving, error, refetch, setDefault };
}
