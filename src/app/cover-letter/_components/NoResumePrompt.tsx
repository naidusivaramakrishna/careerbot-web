"use client";

import Link from "next/link";
import { FileText, RefreshCw } from "lucide-react";

/**
 * Screen 7C — shown on /cover-letter/new when the user has no
 * parsed resume on file.
 *
 * NAVIGATION TARGET: `/builder/start` — the canonical "I have no
 * resume yet" entry on this codebase, matching the existing
 * Resume Builder smart-nav pattern (Sidebar.tsx — when
 * builder_resumes.length is 0, smartNav routes to /builder/start).
 *
 * The original wireframe said `/resume/parser` but that URL is a
 * stub on this repo (route group `(resume)` doesn't appear in the
 * URL, and `/parser` only renders an h1). Correcting to the
 * actual upload entry.
 *
 * `?return_to=/cover-letter/new` is passed for future-proofing —
 * the builder doesn't honor it today, but the contract is there
 * so a follow-up to /builder/start can return the user here when
 * resume creation finishes.
 *
 * Spec: wireframes §7C; sibling pattern Sidebar.tsx smartNav.
 */
export interface NoResumePromptProps {
  isRefreshing?: boolean;
  onRefresh: () => void;
}

export default function NoResumePrompt({
  isRefreshing = false,
  onRefresh,
}: NoResumePromptProps) {
  // TEMPORARY DIAGNOSTIC (commit f692e4a + this one) — logs on
  // every render so you can verify in the browser console that
  // the NEW chunk with /builder/start is what's actually running.
  // Removed after the user-reported 404 is confirmed fixed.
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.info(
      "[NoResumePrompt v2026-05-25] rendering with href=/builder/start",
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 rounded-full p-5">
            <FileText className="w-10 h-10 text-[#2557a7]" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You need a resume first
        </h1>
        <p className="text-gray-600 mb-2">
          Cover letters are generated from your parsed resume — so
          we need at least one resume on file to get started.
        </p>
        <p className="text-gray-600 mb-6">
          Create your resume in the builder, then come back here
          and we&rsquo;ll generate a tailored cover letter.
        </p>
        <Link
          href="/builder/start?return_to=/cover-letter/new"
          className="inline-flex items-center justify-center gap-2 w-full bg-[#2557a7] hover:bg-[#1e4a94] text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:ring-offset-2"
        >
          Create my resume
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium text-[#2557a7] hover:text-[#1e4a94] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw
            className={["w-3.5 h-3.5", isRefreshing ? "animate-spin" : ""].join(" ")}
            aria-hidden="true"
          />
          {isRefreshing ? "Checking…" : "Already uploaded? Refresh"}
        </button>
      </div>
    </div>
  );
}
