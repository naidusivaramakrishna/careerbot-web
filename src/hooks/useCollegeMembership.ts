'use client';

import { useEffect, useState } from 'react';
import { listMemberships } from '@/api/institutionApi';

/**
 * Does this person belong to a college?
 *
 * The institution area had NO link anywhere in the product. It was reachable
 * only by typing /institution into the address bar, which means a placement
 * officer who was onboarded and told "it's live" found nothing at all.
 *
 * The link cannot simply be added to the static nav: most users are ordinary
 * jobseekers, and showing them a college entry that refuses them on arrival is
 * worse than showing nothing. So membership is resolved at runtime, once.
 *
 * `[]` is a NORMAL answer, not an error — it is what a jobseeker gets. A failed
 * request is treated the same way (render nothing) rather than surfaced: a
 * navigation item is not the place to report a backend problem, and every
 * college screen behind it reports its own errors properly.
 *
 * Resolved ONCE per page load and shared, so mounting the sidebar twice (the
 * collapsed and expanded trees) does not issue two requests. It deliberately
 * does not persist across a reload: a membership can be revoked, and a stale
 * "yes" in storage would keep offering a door that no longer opens.
 */
let inflight: Promise<boolean> | null = null;

function resolveOnce(): Promise<boolean> {
  if (!inflight) {
    inflight = listMemberships()
      .then((rows) => rows.length > 0)
      .catch(() => false);
  }
  return inflight;
}

/** Test seam: clears the per-load cache. */
export function __resetCollegeMembershipCache() {
  inflight = null;
}

export function useHasCollegeMembership(): boolean {
  const [has, setHas] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveOnce().then((v) => {
      if (alive) setHas(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  return has;
}
