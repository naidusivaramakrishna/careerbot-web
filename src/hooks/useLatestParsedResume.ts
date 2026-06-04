"use client";

/**
 * useLatestParsedResume — fetches the user's most-recently-updated
 * parsed resume + its schema_version, ready to embed in a
 * CoverLetterGenerateRequest body.
 *
 * Endpoint: GET /api/v1/resumes/all  →  AllResumesResponse
 * (same endpoint as useHasParsedResume; ONE network round-trip
 * serves both gate + content). The hook picks the latest item
 * by updated_at (falls back to created_at, then to array order).
 *
 * Q2 ANSWER (b) Option B1 — V1 has no resume picker; the latest
 * parsed resume is used by default. See
 * cover-letter-docs/COVER_LETTER_WEB_Q2_RESUME_ENDPOINT.txt.
 *
 * Returns:
 *   resume                The full parsed resume JSON blob, or null.
 *   resumeSchemaVersion   "2.0" | "2.1" | "2.5" — read from
 *                         resume.resume_schema_version with a
 *                         "2.0" default if absent.
 *   isLoading             true while the fetch is in flight.
 *   error                 fetch error, if any.
 *   refetch               re-issue the GET.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getAllResumesUnified } from "@/api/resumeApi";
import { hasCoverLetterUsableResume } from "@/lib/coverLetterResume";
import type { ResumeSchemaVersion } from "@/types/coverLetter";

interface ParsedResumeBlob {
  resume_schema_version?: string;
  updated_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface UseLatestParsedResumeResult {
  resume: ParsedResumeBlob | null;
  resumeSchemaVersion: ResumeSchemaVersion;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DEFAULT_SCHEMA: ResumeSchemaVersion = "2.0";

/** Normalize one of {2.0, 2.1, 2.5} → keep as-is; anything else
 *  → DEFAULT_SCHEMA. Defensive against backend drift. */
function coerceSchemaVersion(value: unknown): ResumeSchemaVersion {
  if (value === "2.0" || value === "2.1" || value === "2.5") {
    return value;
  }
  return DEFAULT_SCHEMA;
}

/** Read a timestamp-like value off the blob; returns 0 on miss
 *  so the sort puts undated rows last. */
function blobTimestamp(b: ParsedResumeBlob): number {
  const candidates = [b.updated_at, b.created_at].filter(
    (x): x is string => typeof x === "string",
  );
  for (const c of candidates) {
    const t = Date.parse(c);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

export function useLatestParsedResume(): UseLatestParsedResumeResult {
  const [resume, setResume] = useState<ParsedResumeBlob | null>(null);
  const [schemaVersion, setSchemaVersion] =
    useState<ResumeSchemaVersion>(DEFAULT_SCHEMA);
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

      // Only `builder_resumes` are FULL parsed-resume JSON blobs.
      // `enhanced_resumes` from this endpoint are summary metadata
      // (IDs / score / display name / timestamps) — NOT the parsed
      // content the cover-letter contract requires (Codex WEB-3.1
      // P2). If a user has only enhanced resumes (no builder), this
      // hook returns null and the page falls back to NoResumePrompt.
      const pool: ParsedResumeBlob[] = ((response.builder_resumes ??
        []) as ParsedResumeBlob[]).filter(hasCoverLetterUsableResume);
      if (pool.length === 0) {
        setResume(null);
        setSchemaVersion(DEFAULT_SCHEMA);
        return;
      }
      // Pick the most-recently-updated.
      const latest = pool
        .slice()
        .sort((a, b) => blobTimestamp(b) - blobTimestamp(a))[0];
      setResume(latest);
      setSchemaVersion(coerceSchemaVersion(latest.resume_schema_version));
    } catch (err) {
      if (mySeq !== requestSeqRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      setResume(null);
      setSchemaVersion(DEFAULT_SCHEMA);
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

  return {
    resume,
    resumeSchemaVersion: schemaVersion,
    isLoading,
    error,
    refetch: load,
  };
}
