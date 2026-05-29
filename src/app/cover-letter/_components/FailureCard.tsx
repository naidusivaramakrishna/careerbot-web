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

const NEXT_ACTIONS = [
  "Pick a different JD that matches your background more",
  "Update your resume to include relevant projects/skills",
  "Use the \"note to writer\" field to lean into niche experience",
];

export default function FailureCard({ letter }: FailureCardProps) {
  const [diagOpen, setDiagOpen] = useState(false);
  const reason = letter.reason as CoverLetterReason | null;
  const reasonCopy = reason ? FAILED_REASON_MESSAGES[reason] : null;
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
          What to try next:
        </h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          {NEXT_ACTIONS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <Link
        href="/cover-letter/new"
        className="block w-full text-center bg-[#2557a7] hover:bg-[#1e4a94] text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
      >
        Try a different JD
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
