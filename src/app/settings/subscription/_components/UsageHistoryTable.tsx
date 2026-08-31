"use client";

/**
 * UsageHistoryTable
 *
 * Paginated table of credit usage log items.
 */

import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { CreditsUsageResponse, getCreditsUsage } from "@/api/creditsApi";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  if (status === "success") {
    return <span className="text-xs font-bold text-gray-500">Completed</span>;
  }
  if (status === "failed") {
    return <span className="text-xs font-bold text-red-600">Failed</span>;
  }
  if (status === "pending") {
    return <span className="text-xs font-bold text-gray-500">Pending</span>;
  }
  return null;
};

export const UsageHistoryTable: React.FC = () => {
  const [history, setHistory] = useState<CreditsUsageResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCreditsUsage(p, 10);
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch usage history:", err);
      setError(err instanceof Error ? err.message : "Failed to load usage history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  const handlePage = (dir: "prev" | "next") => {
    if (!history) return;
    if (dir === "prev" && history.pagination.has_prev) setPage((p) => p - 1);
    if (dir === "next" && history.pagination.has_next) setPage((p) => p + 1);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Credit ledger</p>
          <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Usage history</h2>
          <p className="mt-1 text-sm text-gray-500">{history ? `${history.total} total actions` : "Loading actions"}</p>
        </div>
        {history && history.pagination.total_pages > 1 && (
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => handlePage("prev")}
              disabled={!history.pagination.has_prev || loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous usage page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-xs font-black text-gray-500">{page}/{history.pagination.total_pages}</span>
            <button
              onClick={() => handlePage("next")}
              disabled={!history.pagination.has_next || loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next usage page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 sm:px-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {loading && !history ? (
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid animate-pulse grid-cols-[1fr_auto] gap-4 px-5 py-4 sm:px-6">
              <div>
                <div className="h-4 w-32 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-48 rounded bg-gray-100" />
              </div>
              <div className="h-7 w-20 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      ) : !history || history.items.length === 0 ? (
        <div className="px-5 py-12 text-center sm:px-6">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <Clock className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-black text-gray-950">No usage yet</p>
          <p className="mt-1 text-sm text-gray-500">Credit usage appears after resume, ATS, match, and AI workflow actions.</p>
        </div>
      ) : (
        <div>
          <div className="hidden grid-cols-[minmax(0,1fr)_120px_110px] border-b border-gray-100 px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-gray-400 sm:grid sm:px-6">
            <span>Workflow</span>
            <span>Status</span>
            <span className="text-right">Credits</span>
          </div>
          {history.items.map((item) => (
            <div key={item.id} className="grid gap-3 border-b border-gray-100 px-5 py-4 last:border-b-0 transition hover:bg-gray-50/60 sm:grid-cols-[minmax(0,1fr)_120px_110px] sm:items-center sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-gray-950">{item.feature_label}</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">{formatRelativeTime(item.timestamp)}</p>
              </div>
              <div className="flex items-center sm:block">
                <StatusIndicator status={item.status} />
              </div>
              <div className="text-sm font-black text-gray-950 sm:text-right">
                {item.credits_used} credits
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
