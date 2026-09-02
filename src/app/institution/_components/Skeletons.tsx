import React from 'react';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

/**
 * Loading placeholders.
 *
 * Each one mirrors the SHAPE of the content that replaces it — same row height,
 * same column count, same card grid — so nothing jumps when the data lands.
 * A centred spinner is not used anywhere in this area: it tells the user
 * nothing about what is coming and guarantees a layout shift when it goes.
 *
 * Built on the repo's existing `SkeletonLoader`.
 */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white"
      aria-hidden
    >
      <div className="flex gap-4 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLoader key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-[#f1f5f9] px-4 py-3 last:border-b-0">
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonLoader key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatGridSkeleton({ tiles = 4 }: { tiles?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: tiles }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
          <SkeletonLoader className="h-3 w-20" />
          <SkeletonLoader className="mt-3 h-7 w-14" />
          <SkeletonLoader className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <SkeletonLoader className="h-4 w-40" />
            <SkeletonLoader className="h-5 w-20 rounded-full" />
          </div>
          <SkeletonLoader className="mt-2 h-3 w-56" />
        </div>
      ))}
    </div>
  );
}

/** Announce loading to assistive tech without rendering a visible spinner. */
export function LoadingAnnouncement({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
