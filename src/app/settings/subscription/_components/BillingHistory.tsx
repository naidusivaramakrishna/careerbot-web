"use client";

import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getPaymentHistory, getPaymentInvoice, PaymentHistoryItem } from '@/api/paymentApi';

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatPurpose(purpose: string): string {
  return purpose
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMethod(method: string): string {
  return method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  captured:             { icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', label: 'Paid' },
  authorized:           { icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', label: 'Authorized' },
  created:              { icon: Clock,       color: '#d97706', bg: '#fffbeb', label: 'Pending' },
  failed:               { icon: XCircle,     color: '#dc2626', bg: '#fff5f5', label: 'Failed' },
  refunded:             { icon: XCircle,     color: '#7c3aed', bg: '#f5f3ff', label: 'Refunded' },
  partially_refunded:   { icon: XCircle,     color: '#7c3aed', bg: '#f5f3ff', label: 'Partial Refund' },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? { icon: Clock, color: '#64748b', bg: '#f8fafc', label: status };

export const BillingHistory: React.FC = () => {
  const [page, setPage]             = useState(1);
  const [items, setItems]           = useState<PaymentHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPaymentHistory(page, PAGE_SIZE)
      .then((res) => {
        setItems(res.payments);
        setTotalCount(res.total_count);
      })
      .catch(() => setError('Failed to load billing history'))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleDownload = async (item: PaymentHistoryItem) => {
    if (!item.payment_id) return;
    try {
      const inv = await getPaymentInvoice(item.payment_id);
      if (inv) {
        const blob = new Blob([JSON.stringify(inv, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${item.payment_id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { /* invoice not available */ }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">Billing History</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${totalCount} payment${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-xs font-medium text-gray-500 px-1">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-14 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#2557a7] animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="py-14 text-center">
          <XCircle className="w-8 h-8 text-red-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="py-14 text-center">
          <Clock className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No payments yet</p>
          <p className="text-xs text-gray-400 mt-1">Your payment history will appear here</p>
        </div>
      )}

      {/* Rows */}
      {!loading && !error && items.length > 0 && (
        <div className="divide-y divide-gray-50">
          {items.map((item) => {
            const sc = getStatusConfig(item.status);
            const StatusIcon = sc.icon;
            const dateStr = item.captured_at || item.created_at;
            return (
              <div
                key={item.order_id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
              >
                {/* Order ID + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {item.payment_id ?? item.order_id}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(dateStr)}</p>
                </div>

                {/* Purpose */}
                <p className="text-xs font-medium text-gray-600 hidden sm:block w-32 shrink-0 truncate">
                  {formatPurpose(item.purpose)}
                </p>

                {/* Payment method */}
                <p className="text-xs text-gray-400 hidden md:block w-28 shrink-0 truncate">
                  {formatMethod(item.payment_method)}
                </p>

                {/* Amount */}
                <p className="text-sm font-bold text-gray-900 w-20 text-right shrink-0">
                  {item.amount_inr > 0 ? `₹${item.amount_inr.toLocaleString('en-IN')}` : '—'}
                </p>

                {/* Status badge */}
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: sc.bg, color: sc.color }}
                >
                  <StatusIcon className="w-3 h-3" />
                  {sc.label}
                </span>

                {/* Download invoice */}
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#2557a7] hover:bg-blue-50 transition-colors shrink-0 disabled:opacity-30"
                  title="Download invoice"
                  disabled={!item.payment_id}
                  onClick={() => handleDownload(item)}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
