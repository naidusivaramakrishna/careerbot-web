"use client";

/**
 * BillingHistory
 *
 * Displays paginated payment receipts: date, plan, amount, status, download.
 * Mock-backed — swap to real API endpoint when ready.
 */

import React, { useState } from 'react';
import { Download, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Invoice } from '@/types/subscription.types';

/* ------------------------------------------------------------------ */
/*  Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_1',
    invoice_number: 'CB-2026-0201',
    plan_name: 'Pro Plan',
    amount_inr: 999,
    status: 'paid',
    payment_date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
    payment_method: 'Razorpay UPI',
  },
  {
    id: 'inv_2',
    invoice_number: 'CB-2026-0101',
    plan_name: 'Pro Plan',
    amount_inr: 999,
    status: 'paid',
    payment_date: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
    payment_method: 'Card ending in 4242',
  },
  {
    id: 'inv_3',
    invoice_number: 'CB-2025-1201',
    plan_name: 'Pro Plan',
    amount_inr: 999,
    status: 'paid',
    payment_date: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString(),
    payment_method: 'Card ending in 4242',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_CONFIG = {
  paid:    { icon: CheckCircle, color: '#16a34a', bg: '#f0fdf4', label: 'Paid' },
  pending: { icon: Clock,       color: '#d97706', bg: '#fffbeb', label: 'Pending' },
  failed:  { icon: XCircle,     color: '#dc2626', bg: '#fff5f5', label: 'Failed' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const BillingHistory: React.FC = () => {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(MOCK_INVOICES.length / PAGE_SIZE);
  const invoices = MOCK_INVOICES.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">Billing History</h3>
          <p className="text-xs text-gray-500 mt-0.5">{MOCK_INVOICES.length} invoices</p>
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
            <span className="text-xs font-medium text-gray-500 px-1">
              {page} / {totalPages}
            </span>
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

      {/* Empty state */}
      {invoices.length === 0 ? (
        <div className="py-14 text-center">
          <Clock className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No invoices yet</p>
          <p className="text-xs text-gray-400 mt-1">Your payment history will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {invoices.map((inv) => {
            const sc = STATUS_CONFIG[inv.status];
            const StatusIcon = sc.icon;
            return (
              <div
                key={inv.id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors"
              >
                {/* Invoice number + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {inv.invoice_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.payment_date)}</p>
                </div>

                {/* Plan */}
                <p className="text-xs font-medium text-gray-600 hidden sm:block w-20 shrink-0">
                  {inv.plan_name}
                </p>

                {/* Payment method */}
                {inv.payment_method && (
                  <p className="text-xs text-gray-400 hidden md:block w-36 shrink-0 truncate">
                    {inv.payment_method}
                  </p>
                )}

                {/* Amount */}
                <p className="text-sm font-bold text-gray-900 w-20 text-right shrink-0">
                  {inv.amount_inr > 0 ? `₹${inv.amount_inr.toLocaleString('en-IN')}` : '—'}
                </p>

                {/* Status badge */}
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: sc.bg, color: sc.color }}
                >
                  <StatusIcon className="w-3 h-3" />
                  {sc.label}
                </span>

                {/* Download */}
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#2557a7] hover:bg-blue-50 transition-colors shrink-0"
                  title="Download invoice"
                  onClick={() => {
                    if (inv.invoice_pdf_url) window.open(inv.invoice_pdf_url, '_blank');
                  }}
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
