'use client';

import React, { useCallback, useState } from 'react';
import { Loader2, Search, User } from 'lucide-react';
import {
  formatTokens,
  getUserAiUsage,
  type UserAiUsage,
} from '@/api/adminAiUsageApi';
import { useAdminAccess } from '../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../_components/LockedPageOverlay';
import { UsageTable, Stat } from '../../_components/UsageTable';

/**
 * One person's AI usage, feature by feature. The B2C view.
 *
 * LOOKUP RATHER THAN A LIST, because the useful question here is about a
 * named individual -- a support ticket, a bill someone queried, an account
 * that looks unlike the rest. A paginated roster of every B2C user sorted by
 * tokens is the B2B screen's job, and building it here would answer a
 * question nobody asked while burying the one they did.
 *
 * COST APPEARS ONLY IF THE SERVER SENT IT. For a platform admin it is absent
 * from the payload entirely and the column simply does not exist.
 */
export default function AiUsagePage() {
  const { hasAccess, loading: accessLoading, requiredRoles } = useAdminAccess('ai-usage');
  const [userId, setUserId] = useState('');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<UserAiUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string, window: number) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getUserAiUsage(trimmed, window));
    } catch {
      // Deliberately not "user not found": the endpoint returns an empty
      // breakdown for a real user who has used no AI, so a failure here is a
      // request problem, not a statement about whether the person exists.
      setError('Could not load usage for that user.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  if (accessLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!hasAccess) return <LockedPageOverlay requiredRoles={requiredRoles} />;

  // The server omits every cost field for a caller without billing rights, so
  // its presence in the payload IS the permission answer. Asking the role
  // again on the client would be a second source of truth that can disagree.
  const showCost = data?.totals?.cost_usd !== undefined;
  const t = data?.totals;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">AI usage by user</h1>
        <p className="mt-1 text-sm text-gray-500">
          What one person used, broken down by feature.
        </p>
      </div>

      <form
        className="mb-6 flex flex-wrap items-center gap-3"
        onSubmit={(e) => { e.preventDefault(); void load(userId, days); }}
      >
        <div className="relative flex-1 min-w-[260px]">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            aria-label="User ID"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#2557a7] focus:ring-1 focus:ring-[#2557a7]"
          />
        </div>
        <select
          value={days}
          onChange={(e) => {
            const next = Number(e.target.value);
            setDays(next);
            if (data) void load(userId, next);
          }}
          aria-label="Time window"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <button
          type="submit"
          disabled={loading || !userId.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2557a7] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Look up
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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
            <Stat label="Input" value={formatTokens(t.input_tokens)} />
            {showCost
              ? <Stat label="Cost" value={`$${(t.cost_usd ?? 0).toFixed(2)}`} />
              : <Stat label="Output" value={formatTokens(t.output_tokens)} />}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-medium text-gray-900">By feature</h2>
              <p className="text-xs text-gray-500">
                {data.since} to {data.until}
              </p>
            </div>
            <UsageTable rows={data.features} showCost={showCost} />
          </div>
        </>
      )}

      {!data && !error && !loading && (
        <p className="py-12 text-center text-sm text-gray-500">
          Enter a user ID to see their AI usage.
        </p>
      )}
    </div>
  );
}
