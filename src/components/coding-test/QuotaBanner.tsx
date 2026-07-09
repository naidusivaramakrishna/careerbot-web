'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';
import { fetchQuota, GradingApiError } from '@/app/coding-test/_lib/gradingApi';
import type { QuotaResponse } from '@/app/coding-test/_lib/types';

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHLY_CAP = 50;

// ── Types ────────────────────────────────────────────────────────────────────

type Variant = 'card' | 'strip';

export interface QuotaBannerProps {
  /**
   * Pre-fetched quota from the parent.
   * - undefined  → component self-fetches (use when no parent quota state exists)
   * - null       → parent is still loading (show skeleton / nothing)
   * - QuotaResponse → use this value; no extra fetch
   */
  quota?: QuotaResponse | null;
  variant?: Variant;
  className?: string;
}

// ── Tier helpers ─────────────────────────────────────────────────────────────

type Tier = 'plenty' | 'close' | 'almost' | 'blocked';

function getTier(remaining: number): Tier {
  if (remaining === 0) return 'blocked';
  if (remaining <= 5) return 'almost';   // 45-49 used
  if (remaining <= 19) return 'close';   // 31-44 used
  return 'plenty';                        // 0-30 used
}

const TIER_META: Record<Tier, { bar: string; text: string; label: string }> = {
  plenty:  { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Plenty left'    },
  close:   { bar: 'bg-amber-400',   text: 'text-amber-600',   label: 'Getting close'  },
  almost:  { bar: 'bg-rose-500',    text: 'text-rose-600',    label: 'Almost out'     },
  blocked: { bar: 'bg-rose-500',    text: 'text-rose-600',    label: 'Limit hit'      },
};

function nextResetDate(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuotaBanner({
  quota: quotaProp,
  variant = 'card',
  className = '',
}: QuotaBannerProps) {
  const selfFetch = quotaProp === undefined;

  const [fetched, setFetched] = useState<QuotaResponse | null>(null);
  const [unauthed, setUnauthed] = useState(false);
  const [loading, setLoading] = useState(selfFetch);

  useEffect(() => {
    if (!selfFetch) return;
    fetchQuota()
      .then((q) => { setFetched(q); setLoading(false); })
      .catch((err) => {
        setLoading(false);
        if (err instanceof GradingApiError && err.status === 401) setUnauthed(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quota   = selfFetch ? fetched : quotaProp ?? null;
  const isLoading = selfFetch ? loading : quotaProp === null;

  // Derived display values (safe when quota is null)
  const remaining = quota?.submissions_remaining ?? 0;
  const used      = MONTHLY_CAP - remaining;
  const pct       = Math.min(100, Math.round((used / MONTHLY_CAP) * 100));
  const tier      = quota ? getTier(remaining) : 'plenty';
  const meta      = TIER_META[tier];
  const resetDate = nextResetDate();

  // ── Card variant (hub sidebar, full-height card) ─────────────────────────

  if (variant === 'card') {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${className}`}>
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
            Grading Credits
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {unauthed ? (
            <Link
              href="/?showLogin=true"
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Sign In to View Credits
            </Link>
          ) : isLoading || quota === null ? (
            <div className="space-y-2">
              <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            <>
              {/* Count + tier label */}
              <div className="flex items-end justify-between mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums leading-none">
                    {remaining}
                  </span>
                  <span className="text-sm text-slate-400">/ {MONTHLY_CAP}</span>
                </div>
                <span className={`text-xs font-semibold mb-0.5 ${meta.text}`}>
                  {meta.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">submissions remaining this month</p>

              {/* Progress bar */}
              <div
                className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
                role="progressbar"
                aria-valuenow={used}
                aria-valuemin={0}
                aria-valuemax={MONTHLY_CAP}
                aria-label={`${used} of ${MONTHLY_CAP} grading submissions used`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Footer */}
              {tier === 'blocked' ? (
                <>
                  <p className="mt-2 text-[10px] text-rose-500 font-medium">
                    Monthly limit reached · resets {resetDate}
                  </p>
                  <Link
                    href="/payments"
                    className="mt-3 block text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Upgrade for more →
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-[10px] text-slate-400">
                  {quota.cost_per_submission} credit per grading · {quota.plan} plan
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Strip variant (problem detail / R2 inline) ───────────────────────────

  // Don't take up space while loading or when unauthenticated
  if (isLoading || quota === null || unauthed) return null;

  const stripBg =
    tier === 'blocked' ? 'border-rose-200 bg-rose-50' :
    tier === 'almost'  ? 'border-rose-100 bg-rose-50/60' :
    tier === 'close'   ? 'border-amber-100 bg-amber-50/60' :
    'border-slate-200 bg-slate-50';

  const zapColor =
    tier === 'plenty' ? 'text-emerald-500' :
    tier === 'close'  ? 'text-amber-500' :
    'text-rose-500';

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs ${stripBg} ${className}`}
      role="status"
      aria-label={`${remaining} of ${MONTHLY_CAP} grading submissions remaining`}
    >
      <Zap className={`h-3 w-3 shrink-0 ${zapColor}`} aria-hidden />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`font-semibold tabular-nums ${meta.text}`}>
            {remaining} / {MONTHLY_CAP} left
          </span>
          <span className="text-slate-400 shrink-0 text-[10px]">
            {tier === 'blocked' ? `resets ${resetDate}` : meta.label}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${meta.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {tier === 'blocked' && (
        <Link
          href="/payments"
          className="shrink-0 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}
