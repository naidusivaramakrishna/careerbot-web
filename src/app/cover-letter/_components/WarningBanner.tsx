"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { CoverLetterWarning } from "@/types/coverLetter";
import { warningMessage } from "@/lib/coverLetterMessages";

/**
 * Screen D warning banner (status === "needs_review").
 *
 * Maps each backend warning code to its human sentence via
 * `warningMessage()`; unknown codes fall through to the
 * UNKNOWN_WARNING_MESSAGE fallback. "Show details" expands the
 * raw codes + severity for power users.
 *
 * Spec: wireframes §6.
 */
export interface WarningBannerProps {
  warnings: CoverLetterWarning[];
}

export default function WarningBanner({ warnings }: WarningBannerProps) {
  const [open, setOpen] = useState(false);
  if (warnings.length === 0) return null;

  return (
    <div
      role="alert"
      aria-labelledby="warning-banner-heading"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="w-5 h-5 text-amber-600 mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h3
            id="warning-banner-heading"
            className="text-sm font-semibold text-amber-900 mb-1"
          >
            Draft ready, review before sending
          </h3>
          <p className="text-sm text-amber-800 mb-2">
            This cover letter is ready, with {warnings.length} quality
            signal{warnings.length === 1 ? "" : "s"} to check before you use it.
          </p>
          <ul className="text-sm text-amber-800 space-y-0.5 list-disc list-inside">
            {warnings.map((w, i) => (
              <li key={`${w.code}-${i}`}>{warningMessage(w.code)}</li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-700 focus:outline-none focus:underline"
          >
            {open ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                Show details
              </>
            )}
          </button>

          {open && (
            <div className="mt-3 rounded border border-amber-200 bg-white p-3 space-y-2">
              {warnings.map((w, i) => (
                <div
                  key={`detail-${w.code}-${i}`}
                  className="text-xs font-mono text-gray-700"
                >
                  <span
                    className={[
                      "inline-block mr-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold",
                      w.severity === "error"
                        ? "bg-red-100 text-red-700"
                        : w.severity === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700",
                    ].join(" ")}
                  >
                    {w.severity}
                  </span>
                  <span className="text-gray-900">{w.code}</span>
                  {w.message && (
                    <span className="text-gray-500"> — {w.message}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
