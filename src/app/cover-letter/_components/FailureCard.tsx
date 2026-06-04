"use client";

import { useState } from "react";
import Link from "next/link";
import { XCircle, ChevronDown, ChevronUp } from "lucide-react";
import type {
  CoverLetterReason,
  CoverLetterResponse,
} from "@/types/coverLetter";
import { FAILED_REASON_MESSAGES } from "@/lib/coverLetterMessages";

/**
 * Screen E — failure card (status === "failed").
 *
 * Diagnostic-only; no draft to render. Surfaces the reason via
 * the FAILED_REASON_MESSAGES exhaustive Record (impl-blueprint §6),
 * suggests recovery actions, and offers a [Try a different JD] CTA
 * that routes back to /cover-letter/new (no prefill — Codex
 * impl-r1 P1#1 / wireframes §F).
 *
 * Spec: wireframes §7.
 */
export interface FailureCardProps {
  /** The full response (we read reason + generation_status.reasons
   *  + grounding.* for the advanced diagnostic block). */
  letter: CoverLetterResponse;
}

type FailureRecovery = {
  title: string;
  actions: string[];
  cta: string;
};

const DEFAULT_RECOVERY: FailureRecovery = {
  title: "What to try next:",
  actions: [
    "Paste a shorter, cleaner JD with the core responsibilities",
    "Keep the letter length at the default or lower range",
    "Try again in a moment",
  ],
  cta: "Try again",
};

const RECOVERY_BY_REASON: Partial<Record<CoverLetterReason, FailureRecovery>> = {
  llm_budget_exceeded: {
    title: "What to try next:",
    actions: [
      "Try again in a moment; this is usually temporary",
      "Shorten the JD to the responsibilities and requirements only",
      "Use a lower letter length in advanced settings",
    ],
    cta: "Try again",
  },
  invalid_jd: {
    title: "What to try next:",
    actions: [
      "Paste the full job posting text instead of a summary",
      "Remove unrelated page text, navigation, ads, or duplicate content",
      "Try a different JD if this posting is incomplete",
    ],
    cta: "Try a different JD",
  },
  low_jd_match: {
    title: "What to try next:",
    actions: [
      "Pick a JD that matches your background more closely",
      "Update your resume to include relevant projects and skills",
      "Use the note field to highlight relevant niche experience",
    ],
    cta: "Try a different JD",
  },
  insufficient_grounding: {
    title: "What to try next:",
    actions: [
      "Upload a more detailed resume with projects, impact, and tools",
      "Add concrete achievements before generating again",
      "Use the note field for role-specific evidence the resume supports",
    ],
    cta: "Update resume or retry",
  },
  claim_catalog_empty: {
    title: "What to try next:",
    actions: [
      "Upload a resume with more concrete work, project, or education details",
      "Add measurable achievements and relevant skills",
      "Try again after the resume is parsed successfully",
    ],
    cta: "Update resume or retry",
  },
  parser_confidence_too_low: {
    title: "What to try next:",
    actions: [
      "Upload a text-based PDF or DOCX resume",
      "Avoid scanned image resumes where possible",
      "Check that the parsed resume includes your experience and skills",
    ],
    cta: "Upload resume again",
  },
};

export default function FailureCard({ letter }: FailureCardProps) {
  const [diagOpen, setDiagOpen] = useState(false);
  const reason = letter.reason as CoverLetterReason | null;
  const reasonCopy = reason ? FAILED_REASON_MESSAGES[reason] : null;
  const recovery = reason
    ? RECOVERY_BY_REASON[reason] ?? DEFAULT_RECOVERY
    : DEFAULT_RECOVERY;
  const reasonsList = letter.generation_status?.reasons ?? [];
  const grounding = letter.grounding ?? {};

  return (
    <div className="rounded-2xl border border-red-100 bg-white shadow-sm p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-3">
          <XCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          No draft could be made
        </h2>
        {reason && (
          <p className="mt-1 text-sm font-mono text-gray-500">
            reason: {reason}
          </p>
        )}
      </div>

      {reasonCopy && (
        <p className="text-gray-700 mb-6 text-center">{reasonCopy}</p>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {recovery.title}
        </h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          {recovery.actions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <Link
        href="/cover-letter/new"
        className="block w-full text-center bg-[#2557a7] hover:bg-[#1e4a94] text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
      >
        {recovery.cta}
      </Link>

      {/* Advanced diagnostics — collapsed by default */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setDiagOpen((v) => !v)}
          aria-expanded={diagOpen}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2557a7] rounded"
        >
          Diagnostic details (advanced)
          {diagOpen ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        {diagOpen && (
          <dl className="mt-3 text-xs font-mono space-y-1 text-gray-600">
            <DiagRow label="reasons" value={JSON.stringify(reasonsList)} />
            <DiagRow
              label="claim_catalog_size"
              value={String(grounding.claim_catalog_size ?? "—")}
            />
            <DiagRow
              label="high_confidence_claims"
              value={String(grounding.high_confidence_claims ?? "—")}
            />
            <DiagRow
              label="coverage_status"
              value={grounding.coverage_status ?? "—"}
            />
          </dl>
        )}
      </div>
    </div>
  );
}

function DiagRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 truncate">{value}</dd>
    </div>
  );
}
