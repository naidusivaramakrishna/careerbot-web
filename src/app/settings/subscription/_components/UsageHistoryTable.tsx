"use client";

/**
 * UsageHistoryTable
 *
 * Paginated table of credit usage log items.
 * Shows feature, credits used, timestamp, and cache status.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { UsageItem, CreditsUsageResponse } from '@/api/creditsApi';
import { getCreditsUsage } from '@/api/creditsApi';

const FEATURE_COLORS: Record<string, { bg: string; color: string }> = {
  resume_parse:       { bg: '#eff6ff', color: '#2557a7' },
  ats_scan:           { bg: '#f0f9ff', color: '#0284c7' },
  enhancement:        { bg: '#faf5ff', color: '#7c3aed' },
  job_match:          { bg: '#fffbeb', color: '#d97706' },
  jd_parse:           { bg: '#f0fdf4', color: '#16a34a' },
  ai_review:          { bg: '#fff1f2', color: '#e11d48' },
  english_assessment: { bg: '#fdf4ff', color: '#a21caf' },
  communication:      { bg: '#fdf4ff', color: '#a21caf' },
  interview:          { bg: '#fdf4ff', color: '#a21caf' },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const FeatureBadge: React.FC<{ item: UsageItem }> = ({ item }) => {
  const c = FEATURE_COLORS[item.feature] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span
      className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.color }}
    >
      {item.feature_label}
    </span>
  );
};

const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'success':
      return (
        <div className="flex items-center gap-1 text-green-600" title="Successful">
          <CheckCircle className="w-3.5 h-3.5" />
        </div>
      );
    case 'failed':
      return (
        <div className="flex items-center gap-1 text-red-600" title="Failed">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      );
    case 'pending':
      return (
        <div className="flex items-center gap-1 text-yellow-600" title="Pending">
          <Clock className="w-3.5 h-3.5 animate-spin" />
        </div>
      );
    default:
      return null;
  }
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
      const data = await getCreditsUsage(p, 20);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch usage history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  const handlePage = (dir: 'prev' | 'next') => {
    if (!history) return;
    if (dir === 'prev' && history.pagination.has_prev) setPage((p) => p - 1);
    if (dir === 'next' && history.pagination.has_next) setPage((p) => p + 1);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">Usage History</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {history ? `${history.total} total actions` : '—'}
          </p>
        </div>
        {history && history.pagination.total_pages > 1 && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <button
              onClick={() => handlePage('prev')}
              disabled={!history.pagination.has_prev || loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium px-1">
              {page} / {history.pagination.total_pages}
            </span>
            <button
              onClick={() => handlePage('next')}
              disabled={!history.pagination.has_next || loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      {/* Table */}
      {loading && !history ? (
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5 animate-pulse">
              <div className="w-28 h-5 bg-gray-100 rounded-full" />
              <div className="flex-1 h-4 bg-gray-100 rounded" />
              <div className="w-16 h-4 bg-gray-100 rounded" />
              <div className="w-20 h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : !history || history.items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No activity yet</p>
          <p className="text-xs text-gray-400 mt-1">Your credit usage will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {history.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
            >
              {/* Feature badge */}
              <FeatureBadge item={item} />

              {/* Spacer */}
              <div className="flex-1" />

              {/* Status indicator */}
              <StatusIndicator status={item.status} />

              {/* Credits */}
              <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#2557a7' }}>
                <Zap className="w-3.5 h-3.5" />
                {item.credits_used}
              </div>

              {/* Time */}
              <span className="text-xs text-gray-400 w-16 text-right shrink-0">
                {formatRelativeTime(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
