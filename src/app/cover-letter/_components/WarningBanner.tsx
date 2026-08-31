"use client";

import { AlertTriangle } from "lucide-react";
import type { CoverLetterWarning } from "@/types/coverLetter";
import { warningMessage } from "@/lib/coverLetterMessages";

export interface WarningBannerProps {
  warnings: CoverLetterWarning[];
}

export default function WarningBanner({ warnings }: WarningBannerProps) {
  if (warnings.length === 0) return null;

  // The backend can emit repeated or unrecognized codes that all resolve to
  // the same static copy (e.g. the unknown-code fallback) — collapse those
  // so the list never shows the same line more than once.
  const uniqueMessages = Array.from(
    new Set(warnings.map((warning) => warningMessage(warning.code))),
  );

  return (
    <div
      role="alert"
      aria-labelledby="warning-banner-heading"
      className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3
            id="warning-banner-heading"
            className="text-sm font-black text-amber-950"
          >
            Review before export
          </h3>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            The letter can be exported, but CareerBot found {uniqueMessages.length} item
            {uniqueMessages.length === 1 ? "" : "s"} worth checking first.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900">
            {uniqueMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
