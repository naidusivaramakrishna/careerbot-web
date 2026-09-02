'use client';

import React from 'react';
import type { CollegeTier } from '@/api/adminInstitutionsApi';

/**
 * What the college is BUYING. Rendered beside the subscription status, never
 * merged with it: a trial college can also be paused, and a paid college can
 * be expired. One badge for both loses the difference between "they have not
 * bought this yet" and "their card failed".
 */

const STYLE: Record<CollegeTier, string> = {
  trial: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  free: 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

const LABEL: Record<CollegeTier, string> = {
  trial: 'Trial',
  paid: 'Paid',
  // NOT "Expired". The college did not lose anything -- it dropped to a tier
  // it can stay on indefinitely. "Expired" sends an operator to chase a
  // payment problem that does not exist.
  free: 'Free tier',
};

export function TierBadge({
  tier,
  daysRemaining,
}: {
  tier: CollegeTier | undefined;
  daysRemaining?: number | null;
}) {
  // A row from before tiers existed sends nothing. Guessing "paid" here would
  // put a badge on screen the server never asserted; its silence is not an
  // answer to invent.
  if (!tier || !(tier in STYLE)) return <span className="text-gray-400">—</span>;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs
                    font-medium ring-1 ring-inset ${STYLE[tier]}`}
      >
        {LABEL[tier]}
      </span>
      {/* Only for a RUNNING trial. The API sends null rather than 0 for
          everyone else, so a paying customer is never shown "0 days left",
          which reads as a cancellation notice. */}
      {tier === 'trial' && typeof daysRemaining === 'number' && (
        <span className="text-xs tabular-nums text-gray-500">
          {daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`}
        </span>
      )}
    </span>
  );
}
