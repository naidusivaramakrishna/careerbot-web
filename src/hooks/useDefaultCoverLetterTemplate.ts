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

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getDefaultCoverLetterTemplate();
      if (mounted.current) setDefaultTemplate(result.template);
    } catch (err) {
      if (mounted.current) setError(err instanceof CoverLetterApiError ? err : null);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refetch();
    return () => { mounted.current = false; };
  }, [refetch]);

  const setDefault = useCallback(async (templateId: CoverLetterTemplateId) => {
    setIsSaving(true);
    setError(null);
    try {
      const result = await setDefaultCoverLetterTemplate({ template_id: templateId });
      if (mounted.current) setDefaultTemplate(result.template);
      return result.template;
    } catch (err) {
      const mapped = err instanceof CoverLetterApiError ? err : null;
      if (mounted.current) setError(mapped);
      throw err;
    } finally {
      if (mounted.current) setIsSaving(false);
    }
  }, []);

  return { defaultTemplate, isLoading, isSaving, error, refetch, setDefault };
}
