"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

/**
 * Rendered when the cover-letter feature flag is OFF, OR when the
 * backend returns 503 (flag-off upstream).
 *
 * Mirrors backend `COVER_LETTER_API_ENABLED=false` UX — the user
 * sees an identical screen whether the request was even attempted
 * or whether the backend gated it. This avoids existence-disclosure
 * (BACKEND blueprint §3) on the FE.
 *
 * Spec: cover-letter-docs/COVER_LETTER_FRONTEND_WIREFRAMES_2026_05_25.txt §1.
 */
export default function FeatureUnavailableScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-amber-100 rounded-full p-4">
            <Lock className="w-10 h-10 text-amber-600" aria-hidden="true" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Coming soon
        </h1>
        <p className="text-gray-600 mb-6">
          Cover-letter generation is being rolled out to all users.
          Check back in a few days.
        </p>
        <Link
          href="/dashboard"
          className="inline-block w-full bg-[#2557a7] hover:bg-[#1e4a94] text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
