'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Users } from 'lucide-react';
import {
  formatTokens,
  getInstitutionAiUsage,
  type InstitutionAiUsage,
} from '@/api/adminAiUsageApi';
import { useAdminAccess } from '../../../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../../../_components/LockedPageOverlay';
import { UsageTable, Stat, ConfidenceNote } from '../../../../_components/UsageTable';

/**
 * A college's AI usage, and which of its students is the outlier. The B2B view.
 *
 * THE ROSTER IS THE POINT. A college total tells nobody what to do; the
 * per-student list is what turns "VIT used 4M tokens" into "one account used a
 * third of it", which is the only version of this a placement conversation or
 * a fair-use call can act on. So it is ordered by usage, never by name.
 *
 * ENROLLED AND ACTIVE ARE SHOWN SEPARATELY. A college with 800 students and 12
 * using AI is a very different account from one with 800 and 700, and a single
 * "students" number would hide the difference that matters at renewal.
 */
export default function CollegeAiUsagePage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = String(params?.collegeId ?? '');
  const { hasAccess, loading: accessLoading, requiredRoles } = useAdminAccess('colleges');

  const [data, setData] = useState<InstitutionAiUsage | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (window: number) => {
    if (!collegeId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getInstitutionAiUsage(collegeId, window));
    } catch {
      setError('Could not load AI usage for this college.');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => { void load(days); }, [load, days]);

  if (accessLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!hasAccess) return <LockedPageOverlay requiredRoles={requiredRoles} />;

  // Presence of cost in the payload IS the permission answer -- the server
  // strips it for a caller without billing rights.
  const showCost = data?.totals?.cost_usd !== undefined;
  const t = data?.totals;

  return (
    <div className="p-6">
      <button
        onClick={() => router.push(`/admin/dashboard/colleges/${collegeId}`)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#2557a7]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to college
      </button>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AI usage</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.since} to ${data.until}` : collegeId}
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Time window"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      {data && t && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total tokens" value={formatTokens(t.total_tokens)} />
            <Stat label="AI calls" value={t.calls.toLocaleString()}
                  hint={t.measured_calls < t.calls
                    ? `${t.measured_calls.toLocaleString()} measured`
                    : 'all measured'} />
            <Stat
              label="Students using AI"
              value={(t.active_users ?? 0).toLocaleString()}
              hint={`of ${data.member_count.toLocaleString()} enrolled`}
            />
            {showCost
              ? <Stat label="Cost" value={`$${(t.cost_usd ?? 0).toFixed(2)}`} />
              : <Stat label="Input tokens" value={formatTokens(t.input_tokens)} />}
          </div>

          <div className="mb-6 rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-medium text-gray-900">By feature</h2>
            </div>
            <UsageTable rows={data.features} showCost={showCost} />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
              <Users className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-medium text-gray-900">Students by usage</h2>
              <span className="text-xs text-gray-400">heaviest first</span>
            </div>
            {data.students.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                No student has used AI in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 text-right font-medium">Calls</th>
                      <th className="px-4 py-3 text-right font-medium">Total tokens</th>
                      <th className="px-4 py-3 text-right font-medium">Share</th>
                      {showCost && <th className="px-4 py-3 text-right font-medium">Cost</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((s) => {
                      // Share of the COLLEGE total, not of the visible roster:
                      // the roster is capped, so a within-list percentage would
                      // read as 100% of a college whenever it was truncated.
                      const share = t.total_tokens > 0
                        ? Math.round((s.total_tokens / t.total_tokens) * 100)
                        : 0;
                      return (
                        <tr key={s.user_id} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-3">
                            <div className="text-gray-800">{s.display_name}</div>
                            <ConfidenceNote measured={s.measured_calls} calls={s.calls} />
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                            {s.calls.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                            {formatTokens(s.total_tokens)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                            {share}%
                          </td>
                          {showCost && (
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                              ${(s.cost_usd ?? 0).toFixed(4)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
