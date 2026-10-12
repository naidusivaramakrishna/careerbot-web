"use client";

/**
 * CreditHistory
 *
 * The signed-in user's own credit ledger: grants, purchases, plan resets,
 * usage and refunds, with the balance after each entry.
 *
 * Renders ONLY the end-user fields of UserCreditHistoryItem. Admin-only
 * fields (admin id/email, internal reason, idempotency key) are stripped in
 * getMyCreditHistory and are not part of the row type.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, History } from "lucide-react";
import { getMyCreditHistory, type UserCreditHistoryResponse } from "@/api/creditsApi";
import {
  formatCreditDate,
  formatSignedCredits,
  totalPagesOf,
  userCreditTypeLabel,
} from "@/lib/creditHistory";

const PAGE_SIZE = 20;

export const CreditHistory: React.FC = () => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserCreditHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request sequence: only the newest request may commit data / clear loading,
  // so a slow earlier page can never overwrite a newer one.
  const seqRef = useRef(0);
  useEffect(() => () => { seqRef.current++; }, []);

  const load = useCallback(async (p: number) => {
    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyCreditHistory(p, PAGE_SIZE);
      if (seq !== seqRef.current) return;
      setData(res);
    } catch {
      if (seq !== seqRef.current) return;
      setError("We couldn't load your credit history. Please try again.");
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const totalPages = data ? totalPagesOf(data.total, data.page_size) : 1;

  return (
    <section
      id="credit-history"
      aria-labelledby="credit-history-heading"
      className="scroll-mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Credit ledger</p>
          <h2 id="credit-history-heading" className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">
            Credit history
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${data.total} entr${data.total === 1 ? "y" : "ies"}` : "Loading entries"}
          </p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous credit history page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-xs font-black text-gray-500">{page}/{totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next credit history page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-3 sm:px-6">
          <p role="alert" className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
          <button type="button" onClick={() => load(page)} className="text-sm font-black text-[#2557a7] hover:underline">
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="divide-y divide-gray-100" role="status" aria-label="Loading credit history">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid animate-pulse grid-cols-[1fr_auto] gap-4 px-5 py-4 sm:px-6">
              <div>
                <div className="h-4 w-40 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-28 rounded bg-gray-100" />
              </div>
              <div className="h-5 w-14 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : !error && (!data || data.items.length === 0) ? (
        <div className="px-5 py-12 text-center sm:px-6">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <History className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-black text-gray-950">No credit history yet</p>
          <p className="mt-1 text-sm text-gray-500">Credits you receive and spend will appear here.</p>
        </div>
      ) : data && data.items.length > 0 ? (
        <ul>
          {data.items.map((item) => (
            <li
              key={item.id}
              data-testid="credit-history-row"
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 sm:px-6"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-gray-950">
                  {userCreditTypeLabel(item.type)}
                  {item.feature && (
                    <span className="font-semibold text-gray-500"> · {item.feature.replace(/_/g, " ")}</span>
                  )}
                </p>
                <p className="mt-1 text-xs font-semibold text-gray-500">{formatCreditDate(item.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${item.amount > 0 ? "text-green-600" : "text-gray-950"}`}>
                  {formatSignedCredits(item.amount)}
                </p>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Balance {item.balance_after ?? "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};
