"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listCoverLetterTemplates,
  CoverLetterApiError,
} from "@/api/coverLetterApi";
import type { CoverLetterTemplate } from "@/types/coverLetter";

export const FALLBACK_COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
  {
    template_id: "classic",
    name: "Classic",
    description: "Clean professional cover letter with traditional formatting",
    supports: ["pdf", "docx"],
    is_default: true,
  },
  {
    template_id: "modern",
    name: "Modern",
    description: "Contemporary cover letter with clean header and subtle accent style",
    supports: ["pdf", "docx"],
    is_default: false,
  },
  {
    template_id: "compact",
    name: "Compact",
    description: "Dense one-page cover letter layout optimized for space",
    supports: ["pdf", "docx"],
    is_default: false,
  },
];

export interface UseCoverLetterTemplatesResult {
  templates: CoverLetterTemplate[];
  isLoading: boolean;
  error: CoverLetterApiError | null;
  refetch: () => Promise<void>;
}

export function useCoverLetterTemplates(): UseCoverLetterTemplatesResult {
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>(
    FALLBACK_COVER_LETTER_TEMPLATES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<CoverLetterApiError | null>(null);
  const requestSeqRef = useRef(0);

  const load = useCallback(async () => {
    const mySeq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await listCoverLetterTemplates();
      if (mySeq !== requestSeqRef.current) return;
      setTemplates(response.templates.length ? response.templates : FALLBACK_COVER_LETTER_TEMPLATES);
    } catch (err) {
      if (mySeq !== requestSeqRef.current) return;
      setTemplates(FALLBACK_COVER_LETTER_TEMPLATES);
      setError(
        err instanceof CoverLetterApiError
          ? err
          : new CoverLetterApiError({
              reason: "unknown",
              message: err instanceof Error ? err.message : String(err),
            }),
      );
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

  return { templates, isLoading, error, refetch: load };
}
