"use client";

import Link from "next/link";
import { FileSignature } from "lucide-react";

/**
 * Empty state for the cover-letter list (Screen A.1).
 *
 * Rendered when the list endpoint returns zero items.
 *
 * Spec: wireframes §A.1.
 */
export default function EmptyCoverLetterList() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="bg-blue-50 rounded-full p-5 mb-6">
        <FileSignature className="w-10 h-10 text-[#2257a7]" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        No cover letters yet
      </h2>
      <p className="text-gray-600 max-w-md mb-6">
        Generate a grounded, job-targeted cover-letter draft from
        your resume + a job description.
      </p>
      <Link
        href="/cover-letter/new"
        className="inline-flex items-center gap-2 bg-[#2257a7] hover:bg-[#184284] text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2257a7] focus:ring-offset-2"
      >
        Generate your first letter
      </Link>
    </div>
  );
}
