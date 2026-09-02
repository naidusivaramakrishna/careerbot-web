'use client';

import React from 'react';
import { PauseCircle } from 'lucide-react';
import { READ_ONLY_BANNER } from '@/lib/institutionMessages';
import type { ReadOnlyReason } from '@/contexts/InstitutionContext';

/**
 * The read-only bar.
 *
 * A paused or expired college can still READ everything — only writes are
 * refused. So this is a persistent, calm, non-blocking strip that names the
 * state and the person who can fix it. It is deliberately NOT a red error, NOT
 * a modal and NOT a lockout screen: nothing has failed, and the user's work for
 * the day (looking things up) still works.
 *
 * Amber rather than red, matching the repo's `Alert variant="warning"` family.
 * It is not dismissible: it explains why every write control on the page is
 * disabled, so hiding it would leave those controls unexplained.
 */
export function PausedBanner({ reason }: { reason: ReadOnlyReason }) {
  const copy = READ_ONLY_BANNER[reason];

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-2.5 lg:px-6"
    >
      <PauseCircle className="mt-px h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-5 text-amber-900">{copy.title}</p>
        <p className="text-[12px] leading-4 text-amber-800">{copy.body}</p>
      </div>
    </div>
  );
}
