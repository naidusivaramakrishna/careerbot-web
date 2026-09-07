'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Building2, Loader2, RefreshCw, UserX } from 'lucide-react';
import {
  AdminInstitutionError,
  type CollegeOverview,
  getCollegeOverview,
} from '@/api/adminInstitutionsApi';
import { useAdminAccess } from '../../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../../_components/LockedPageOverlay';

/**
 * Where a platform admin starts: how many colleges, and which need them today.
 *
 * WHY THIS IS NOT THE EXISTING DASHBOARD. /admin/dashboard counts revenue and
 * consumer subscriptions. This role exists so the college estate can be
 * delegated while revenue stays with the founder, so it needed a landing page
 * of its own rather than a filtered version of that one.
 *
 * NO MONEY ON THIS SCREEN, and no student rows. Every figure is a count the
 * server derived; nothing here can render a person or an amount.
 *
 * The "needs attention" block is the reason the page exists. A count of
 * colleges tells somebody responsible for all of them nothing to do. A count
 * of colleges with no officer is a worklist.
 */

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${tone === 'warn' && value > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
        {value.toLocaleString('en-IN')}
      </div>
    </div>
  );
}

function AttentionRow({
  icon: Icon, label, count, hint,
}: { icon: React.ElementType; label: string; count: number; hint: string }) {
  // A zero is worth rendering, not hiding. "No colleges are missing an officer"
  // is information; a row that vanishes reads as a page that failed to load.
  const quiet = count === 0;
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${quiet ? 'border-gray-200 bg-gray-50' : 'border-amber-200 bg-amber-50'}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${quiet ? 'text-gray-400' : 'text-amber-700'}`} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-semibold tabular-nums ${quiet ? 'text-gray-500' : 'text-amber-900'}`}>{count}</span>
          <span className={`text-sm ${quiet ? 'text-gray-500' : 'text-amber-900'}`}>{label}</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
      </div>
    </div>
  );
}

export default function CollegeOverviewPage() {
  // SAME KEY AS THE OTHER COLLEGE PAGES. A page added under /colleges without
  // this gate is reachable by any signed-in admin until the first request
  // comes back 403 -- the server refuses, but the operator sees a broken
  // screen instead of an honest "not for you".
  const { hasAccess, requiredRoles, loading: accessLoading } =
    useAdminAccess('colleges');

  const [data, setData] = useState<CollegeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getCollegeOverview());
    } catch (err) {
      // Surface what the server said. A generic "failed to load" hides the one
      // case worth acting on -- a 403, meaning this account lacks the college
      // permissions and somebody needs to grant them.
      setError(err instanceof AdminInstitutionError ? err.message : 'Could not load the college overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (accessLoading) return null;
  if (!hasAccess) return <LockedPageOverlay requiredRoles={requiredRoles} />;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Building2 className="h-5 w-5 text-gray-500" />
            College overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">Every college on the platform, and what needs you today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/dashboard/colleges"
            className="rounded-lg bg-[#004FFF] px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            All colleges
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>
      )}

      {loading && !data ? (
        <div className="flex items-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the estate…
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Colleges" value={data.colleges} />
            <Stat label="Active" value={data.active} />
            <Stat label="On trial" value={data.on_trial} />
            <Stat label="Paused" value={data.paused} />
            <Stat label="Students" value={data.students} />
          </div>

          <h2 className="mt-8 mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <AlertTriangle className="h-4 w-4 text-gray-500" />
            Needs attention
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <AttentionRow
              icon={UserX}
              count={data.needs_attention.without_officer}
              label="colleges have no placement officer"
              hint="Nobody can run these. Onboarding stopped after the college was created."
            />
            <AttentionRow
              icon={AlertTriangle}
              count={data.needs_attention.trial_ending_soon}
              label={`trials end within ${data.trial_warning_days} days`}
              hint="Worth a conversation before the trial runs out."
            />
            <AttentionRow
              icon={AlertTriangle}
              count={data.needs_attention.paused}
              label="colleges are paused"
              hint="Students at a paused college are told on arrival."
            />
            <AttentionRow
              icon={AlertTriangle}
              count={data.needs_attention.grace}
              label="colleges are in grace"
              hint="Access still works, but the subscription needs resolving."
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
