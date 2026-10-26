'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHasCollegeMembership } from '@/hooks/useCollegeMembership';
import { useCollegeDisabledFeatures } from '@/hooks/useCollegeFeatureAccess';
import {
  ENGINE_FEATURE_LABELS,
  collegeFeatureMessage,
  isGatedPage,
  type EngineFeature,
} from '@/lib/collegeFeatures';

/**
 * Shown INSTEAD of an engine page when the student's college has switched the
 * feature off -- e.g. they followed an old link or a bookmark. The server
 * refuses the start anyway; this saves them filling in a form first.
 *
 * Not an error page: nothing is broken and there is nothing to retry. It says
 * what is going on in plain words and where to go instead.
 */
export function CollegeFeatureUnavailable({ feature }: { feature: EngineFeature }) {
  return (
    <section
      role="status"
      aria-labelledby="college-feature-off-heading"
      className="mx-auto my-16 max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm"
    >
      <h1 id="college-feature-off-heading" className="text-lg font-semibold text-gray-900">
        {ENGINE_FEATURE_LABELS[feature]} is not available
      </h1>
      <p className="mt-2 text-sm text-gray-600">{collegeFeatureMessage(feature)}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          href="/institution"
          className="rounded-md bg-[#1f4fd8] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Go to my college
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}

function GatedPage({ feature, children }: { feature: EngineFeature; children: React.ReactNode }) {
  const hasCollege = useHasCollegeMembership();
  const disabled = useCollegeDisabledFeatures(hasCollege);
  // Until the answer arrives the page renders as normal: the server is the
  // real gate, and blanking every engine page for every student while a
  // request is in flight would be worse than a brief chance to see a form.
  if (disabled.has(feature)) return <CollegeFeatureUnavailable feature={feature} />;
  return <>{children}</>;
}

/**
 * Wraps an engine's layout. Pages that only show past results (history,
 * reports) and the public marketing page stay open -- the API keeps reads
 * open too -- and never ask about the college at all.
 */
export default function CollegeFeatureGate({
  feature,
  children,
}: {
  feature: EngineFeature;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (!isGatedPage(pathname)) return <>{children}</>;
  return <GatedPage feature={feature}>{children}</GatedPage>;
}
