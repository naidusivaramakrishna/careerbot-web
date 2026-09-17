'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { getAiSpend, type AiSpendSummary } from '@/api/adminAiSpendApi';
import { useAdminAccess } from '../../_hooks/useAdminAccess';
import { LockedPageOverlay } from '../../_components/LockedPageOverlay';

/**
 * What AI is costing, and who is causing it.
 *
 * THE SCREEN THAT MAKES THE LEDGER USEFUL. Attribution with nowhere to look
 * at it is a table nobody opens; the point is turning "the Azure bill went up"
 * into "VIT's students did 400 mock tests".
 *
 * IT LEADS WITH HOW MUCH OF THE NUMBER IS REAL. Some costs are measured from
 * what the AI layer charged and some are configured estimates, and a total
 * built mostly from estimates is not one to set a price from. A screen that
 * showed a confident figure without saying which it was would be read as
 * though it were all measured -- so the ratio is at the top, not in a
 * footnote.
 *
 * WINDOWED, because "what has this ever cost" is not a question anybody acts
 * on. "What did last month cost" is, and it is what a seat price comes from.
 */
const money = (usd: number): string =>
  usd >= 1 ? `$${usd.toFixed(2)}` : `$${usd.toFixed(4)}`;

const WINDOWS = [7, 30, 90] as const;

export default function AiSpendPage() {
  const { hasAccess, requiredRoles, loading: accessLoading } =
    useAdminAccess('ai-spend');

  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AiSpendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (window: number) => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAiSpend(window));
    } catch {
      setError('Could not load AI spend.');
      // CLEARED, not left showing the previous window. A stale figure under a
      // live error reads as current, and this is a screen somebody prices
      // from.
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (hasAccess) void load(days); }, [hasAccess, days, load]);

  if (accessLoading) {
    return <div className="p-6 text-sm text-gray-500">Checking access…</div>;
  }
  if (!hasAccess) return <LockedPageOverlay requiredRoles={requiredRoles} />;

  const measuredPct = data && data.total_calls > 0
    ? Math.round((data.measured_calls / data.total_calls) * 100)
    : null;

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AI spend</h1>
          <p className="mt-1 text-sm text-gray-500">
            What the AI is costing, and which colleges and students are
            causing it.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                days === w ? 'bg-white text-gray-900 shadow-sm'
                           : 'text-gray-600'}`}
            >
              {w} days
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Total
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                {money(data.total_cost_usd)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                AI calls
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                {data.total_calls}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Measured
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                {measuredPct === null ? '—' : `${measuredPct}%`}
              </p>
              {/* THE CAVEAT, NOT HIDDEN. Below about half measured, the total
                  is mostly a configured guess and should not be priced from. */}
              <p className="mt-1 text-xs text-gray-500">
                {measuredPct === null
                  ? 'No calls in this window.'
                  : measuredPct >= 50
                    ? 'Most of this total is real, not estimated.'
                    : 'Mostly estimates — not yet a figure to price from.'}
              </p>
            </div>
          </section>

          <Table
            title="By feature"
            caption="Where the money goes."
            rows={data.by_feature.map((f) => ({
              key: `${f.service}:${f.operation}`,
              label: `${f.service} · ${f.operation}`,
              cost: f.cost_usd,
              calls: f.calls,
            }))}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Table
              title="Top colleges"
              caption="Platform costs that belong to nobody — the pre-generated pools — are in the total above but not here."
              rows={data.top_colleges.map((c) => ({
                key: c.id, label: c.id, cost: c.cost_usd, calls: c.calls,
              }))}
            />
            <Table
              title="Top students"
              caption="Finding the one account behaving unlike a student is what a per-user ceiling is for."
              rows={data.top_students.map((s) => ({
                key: s.id, label: s.id, cost: s.cost_usd, calls: s.calls,
              }))}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Table({
  title, caption, rows,
}: {
  title: string;
  caption: string;
  rows: Array<{ key: string; label: string; cost: number; calls: number }>;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="mt-0.5 text-xs text-gray-500">{caption}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-500">
          Nothing recorded in this window.
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="px-4 py-2.5 text-gray-800">{r.label}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">
                  {r.calls} calls
                </td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums text-gray-900">
                  {money(r.cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
