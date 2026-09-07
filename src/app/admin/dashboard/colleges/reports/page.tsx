'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Download, Loader2, RefreshCw } from 'lucide-react';
import {
  AdminInstitutionError,
  type CollegeOverview,
  type CollegeSummary,
  getCollegeOverview,
  listColleges,
} from '@/api/adminInstitutionsApi';
import { useAdminAccess } from '../../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../../_components/LockedPageOverlay';

/**
 * Operational reporting for whoever runs the colleges.
 *
 * WHAT THIS IS NOT. It is not the readiness reporting the product will
 * eventually sell — rank, percentile, NBA and NAAC exports all wait on a
 * readiness formula that does not exist yet. Rendering placeholders for those
 * would put numbers on a screen an operator would quote.
 *
 * So this reports only what is true today: how many colleges, where each one
 * stopped during onboarding, and which need chasing. That is answerable from
 * data already stored, and it is the report the job actually needs.
 *
 * NO MONEY AND NO STUDENT ROWS. Counts only, same rule as the overview.
 */

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="tabular-nums text-gray-500">{value} <span className="text-gray-400">({pct}%)</span></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function CollegeReportsPage() {
  // SAME KEY AS THE OTHER COLLEGE PAGES. A page added under /colleges without
  // this gate is reachable by any signed-in admin until the first request
  // comes back 403 -- the server refuses, but the operator sees a broken
  // screen instead of an honest "not for you".
  const { hasAccess, requiredRoles, loading: accessLoading } =
    useAdminAccess('colleges');

  const [overview, setOverview] = useState<CollegeOverview | null>(null);
  const [colleges, setColleges] = useState<CollegeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [o, page] = await Promise.all([getCollegeOverview(), listColleges({ limit: 200 })]);
      setOverview(o);
      setColleges(page.items ?? []);
    } catch (err) {
      setError(err instanceof AdminInstitutionError ? err.message : 'Could not load the reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // The funnel, from what is stored. A college that exists but has no officer
  // stopped at step two; one with an officer but no students stopped at step
  // four. Naming where it stopped is more useful than a total.
  const total = colleges.length;
  const withOfficer = colleges.filter((c) => c.has_officer).length;
  const withStudents = colleges.filter((c) => (c.students ?? 0) > 0).length;

  const exportCsv = useCallback(() => {
    const head = ['college_code', 'name', 'status', 'tier', 'officer', 'students', 'created'];
    const rows = colleges.map((c) => [
      c.id, c.name, c.subscription_status, c.tier ?? '',
      c.has_officer ? (c.officer ?? 'appointed') : '', String(c.students ?? 0), (c.created_at ?? '').slice(0, 10),
    ]);
    // Quote every field and double any inner quotes: a college named
    // "St Mary's, Chennai" would otherwise split into two columns.
    const csv = [head, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `colleges-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [colleges]);

  if (accessLoading) return null;
  if (!hasAccess) return <LockedPageOverlay requiredRoles={requiredRoles} />;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">Where every college stands, and where onboarding stopped.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void load()} disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportCsv} disabled={!colleges.length}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}

      {loading && !overview ? (
        <div className="flex items-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : overview ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Onboarding funnel</h2>
            <div className="space-y-4">
              <Bar label="Colleges created" value={total} total={total} tone="bg-blue-500" />
              <Bar label="Officer appointed" value={withOfficer} total={total} tone="bg-emerald-500" />
              <Bar label="Roster imported" value={withStudents} total={total} tone="bg-violet-500" />
            </div>
            <p className="mt-4 text-xs text-gray-500">
              A college drops out of this funnel where its onboarding stopped. {total - withOfficer > 0
                ? `${total - withOfficer} never got an officer.`
                : 'Every college has an officer.'}
            </p>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Subscription</h2>
            <div className="space-y-4">
              <Bar label="Active" value={overview.active} total={overview.colleges} tone="bg-emerald-500" />
              <Bar label="On trial" value={overview.on_trial} total={overview.colleges} tone="bg-amber-500" />
              <Bar label="Paused" value={overview.paused} total={overview.colleges} tone="bg-orange-500" />
              <Bar label="Grace" value={overview.grace} total={overview.colleges} tone="bg-rose-400" />
              <Bar label="Expired" value={overview.expired} total={overview.colleges} tone="bg-rose-600" />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Colleges</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4 font-medium">College code</th>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Officer</th>
                    <th className="py-2 pr-4 text-right font-medium">Students</th>
                    <th className="py-2 font-medium">Since</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs text-gray-600">{c.id}</td>
                      <td className="py-2 pr-4 text-gray-900">{c.name}</td>
                      <td className="py-2 pr-4 text-gray-600">{c.subscription_status}</td>
                      <td className={`py-2 pr-4 ${c.has_officer ? 'text-gray-700' : 'text-amber-700'}`}>
                        {c.has_officer ? (c.officer ?? 'appointed') : 'none yet'}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{c.students ?? 0}</td>
                      <td className="py-2 text-gray-500">{(c.created_at ?? '').slice(0, 10) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-gray-500 lg:col-span-2">
            Readiness, rank and accreditation exports are not here: the readiness formula does not exist yet,
            and a placeholder is a number somebody would quote.
          </p>
        </div>
      ) : null}
    </div>
  );
}
