"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Clock, Download, Loader2, XCircle } from "lucide-react";
import { getPaymentHistory, getPaymentInvoice, PaymentHistoryItem } from "@/api/paymentApi";

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPurpose(purpose: string): string {
  return purpose.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMethod(method: string): string {
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  captured: { icon: CheckCircle, color: "#2557a7", bg: "#eef4ff", label: "Paid" },
  authorized: { icon: CheckCircle, color: "#2557a7", bg: "#eef4ff", label: "Authorized" },
  created: { icon: Clock, color: "#64748b", bg: "#f1f5f9", label: "Pending" },
  failed: { icon: XCircle, color: "#dc2626", bg: "#fef2f2", label: "Failed" },
  refunded: { icon: XCircle, color: "#64748b", bg: "#f1f5f9", label: "Refunded" },
  partially_refunded: { icon: XCircle, color: "#64748b", bg: "#f1f5f9", label: "Partial refund" },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status] ?? { icon: Clock, color: "#64748b", bg: "#f8fafc", label: status };

export const BillingHistory: React.FC = () => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PaymentHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPaymentHistory(page, PAGE_SIZE)
      .then((res) => {
        setItems(res.payments);
        setTotalCount(res.total_count);
      })
      .catch(() => setError("Failed to load billing history"))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleDownload = async (item: PaymentHistoryItem) => {
    if (!item.payment_id) return;
    try {
      const inv = await getPaymentInvoice(item.payment_id);
      if (inv) {
        const blob = new Blob([JSON.stringify(inv, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${item.payment_id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* invoice not available */
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Billing records</p>
          <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Payment history</h2>
          <p className="mt-1 text-sm text-gray-500">{loading ? "Loading payments" : `${totalCount} payment${totalCount !== 1 ? "s" : ""}`}</p>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous billing page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-xs font-black text-gray-500">{page}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next billing page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-[#2557a7]" />
        </div>
      )}

      {!loading && error && (
        <div className="py-14 text-center">
          <XCircle className="mx-auto mb-3 h-8 w-8 text-red-300" />
          <p className="text-sm font-black text-gray-500">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="px-5 py-12 text-center sm:px-6">
          <Clock className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm font-black text-gray-950">No payments yet</p>
          <p className="mt-1 text-sm text-gray-500">Your invoices and payment records will appear here.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const sc = getStatusConfig(item.status);
            const StatusIcon = sc.icon;
            const dateStr = item.captured_at || item.created_at;
            return (
              <div key={item.order_id} className="grid gap-3 px-5 py-4 transition hover:bg-gray-50 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-gray-950">{item.payment_id ?? item.order_id}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">{formatDate(dateStr)}</p>
                </div>

                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-xs font-black text-gray-700">{formatPurpose(item.purpose)}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{formatMethod(item.payment_method)}</p>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  <p className="text-sm font-black text-gray-950">
                    {item.amount_inr > 0 ? `Rs ${item.amount_inr.toLocaleString("en-IN")}` : "No charge"}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black" style={{ background: sc.bg, color: sc.color }}>
                    <StatusIcon className="h-3 w-3" />
                    {sc.label}
                  </span>
                </div>

                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#eef4ff] hover:text-[#2557a7] disabled:cursor-not-allowed disabled:opacity-30"
                  title="Download invoice"
                  disabled={!item.payment_id}
                  onClick={() => handleDownload(item)}
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
