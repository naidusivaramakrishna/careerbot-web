'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMyFeatureAccess } from '@/api/institutionApi';
import { onAccountChanged } from '@/lib/accountChange';
import {
  normaliseDisabledFeatures,
  onCollegeFeatureRefused,
} from '@/lib/collegeFeatures';

/**
 * The features this person's college has switched off for them.
 *
 * Asked only when `enabled` (the caller knows the account has a college
 * membership) -- a jobseeker never makes the request. The server answers `[]`
 * for staff, so a staff account costs one request and hides nothing.
 *
 * Resolved once per page load and shared, like the membership list. NOT
 * persisted: a switch can be turned back on, and a stale "off" in storage
 * would keep hiding something the student is allowed to use.
 *
 * A FAILURE HIDES NOTHING and is not cached. The server is the real gate; it
 * refuses a start whatever the menu shows, and the refusal itself is folded
 * in below so the menu catches up the moment the server says no.
 */
let inflight: Promise<string[]> | null = null;
let latest: string[] | null = null;
let generation = 0;
const listeners = new Set<(rows: string[]) => void>();

function publish(rows: string[]) {
  latest = rows;
  listeners.forEach((notify) => notify(rows));
}

function resolveOnce(): Promise<string[]> {
  if (!inflight) {
    const gen = generation;
    inflight = getMyFeatureAccess()
      .then((rows) => {
        if (gen !== generation) return [];
        // A refusal can arrive before this answer; never drop it.
        const merged = Array.from(new Set([...(latest ?? []), ...rows]));
        publish(merged);
        return merged;
      })
      .catch(() => {
        if (gen === generation) inflight = null;
        return latest ?? [];
      });
  }
  return inflight;
}

onAccountChanged(() => {
  generation += 1;
  inflight = null;
  latest = null;
  publish([]);
});

// The server refused a start: whatever the menu thought, this one is off.
onCollegeFeatureRefused((feature) => {
  const current = latest ?? [];
  if (!current.includes(feature)) publish([...current, feature]);
});

/** Test seam: clears the per-load cache. */
export function __resetCollegeFeatureAccessCache() {
  generation += 1;
  inflight = null;
  latest = null;
}

export function useCollegeDisabledFeatures(enabled: boolean): ReadonlySet<string> {
  const [rows, setRows] = useState<string[]>(() => latest ?? []);

  useEffect(() => {
    let alive = true;
    const onRows = (next: string[]) => {
      if (alive) setRows(next);
    };
    listeners.add(onRows);
    if (latest) setRows(latest);
    if (enabled) {
      resolveOnce().then((next) => {
        if (alive) setRows(next);
      });
    }
    return () => {
      alive = false;
      listeners.delete(onRows);
    };
  }, [enabled]);

  return useMemo(() => normaliseDisabledFeatures(rows), [rows]);
}
