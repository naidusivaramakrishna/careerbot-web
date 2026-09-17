'use client';

import React from 'react';
import { formatTokens, type UsageRow, featureLabel } from '@/api/adminAiUsageApi';

/**
 * The token breakdown, shared by the per-user and per-college screens.
 *
 * COST IS RENDERED ONLY WHEN THE SERVER SENT IT. A platform admin gets a
 * payload with no cost fields at all, and the column disappears rather than
 * showing a zero -- a "$0.00" beside 40,000 tokens is a false statement about
 * a real spend, and worse than an absent column because it looks answered.
 *
 * MEASURED IS SHOWN AS A RATIO, not a badge. "30 of 40 measured" tells the
 * reader how far to trust the row; a green tick would imply the whole number
 * is real when most of it might be an estimate.
 */

export function ConfidenceNote({ measured, calls }: { measured: number; calls: number }) {
  if (calls === 0) return null;
  if (measured >= calls) {
    return <span className="text-xs text-gray-400">all measured</span>;
  }
  return (
    <span className="text-xs text-amber-600">
      {measured.toLocaleString()} of {calls.toLocaleString()} measured
    </span>
  );
}

export function UsageTable({ rows, showCost }: { rows: UsageRow[]; showCost: boolean }) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-gray-500">
        No AI usage in this period.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Feature</th>
            <th className="px-4 py-3 text-right font-medium">Calls</th>
            <th className="px-4 py-3 text-right font-medium">In</th>
            <th className="px-4 py-3 text-right font-medium">Out</th>
            <th className="px-4 py-3 text-right font-medium">Total tokens</th>
            {showCost && <th className="px-4 py-3 text-right font-medium">Cost</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.service}:${r.operation}`} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-3">
                <div className="text-gray-800">{featureLabel(r.service, r.operation)}</div>
                <ConfidenceNote measured={r.measured_calls} calls={r.calls} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                {r.calls.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                {formatTokens(r.input_tokens)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                {formatTokens(r.output_tokens)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                {formatTokens(r.total_tokens)}
              </td>
              {showCost && (
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                  ${(r.cost_usd ?? 0).toFixed(4)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}
