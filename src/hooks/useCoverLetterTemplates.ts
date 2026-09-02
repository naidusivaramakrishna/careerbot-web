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
    description: "Traditional letterhead with a strong top rule and recruiter-safe spacing.",
    supports: ["pdf", "docx"],
    is_default: true,
    preview_url: "",
  },
  {
    template_id: "modern",
    name: "Modern",
    description: "Bold masthead, clean contact row, and polished SaaS-style structure.",
    supports: ["pdf", "docx"],
    is_default: false,
    preview_url: "",
  },
  {
    template_id: "compact",
    name: "Compact",
    description: "Dense one-page rhythm with tight paragraphs and clear section breaks.",
    supports: ["pdf", "docx"],
    is_default: false,
    preview_url: "",
  },
  {
    template_id: "executive",
    name: "Executive",
    description: "Premium side rail with executive profile treatment and spacious body copy.",
    supports: ["pdf", "docx"],
    is_default: false,
    preview_url: "",
  },
  {
    template_id: "minimal",
    name: "Minimal",
    description: "Open whitespace, quiet typography, and a confident editorial feel.",
    supports: ["pdf", "docx"],
    is_default: false,
    preview_url: "",
  },
  {
    template_id: "signature",
    name: "Signature",
    description: "Monogram header and signature finish for a memorable professional note.",
    supports: ["pdf", "docx"],
    is_default: false,
    preview_url: "",
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
