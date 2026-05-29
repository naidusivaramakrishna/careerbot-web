'use client';

import React, { useEffect, useState } from 'react';
import {
  getPaymentHistory,
  getPaymentInvoice,
  PaymentHistoryItem,
  PaymentHistoryResponse,
  PaymentStatus,
} from '@/api/paymentApi';
import { usePaymentToast } from '@/hooks/usePaymentToast';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AlertCircle, Download, RefreshCw, Receipt } from 'lucide-react';

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Successful', value: 'captured' },
  { label: 'Pending', value: 'created' },
  { label: 'Failed', value: 'failed' },
];

const PURPOSE_LABELS: Record<string, string> = {
  subscription_monthly: 'Monthly Plan',
  subscription_yearly: 'Yearly Plan',
  resume_export: 'Resume Export',
  premium_features: 'Premium Features',
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  captured: 'bg-green-100 text-green-800',
  created: 'bg-yellow-100 text-yellow-800',
  authorized: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
  partially_refunded: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  captured: 'Paid',
  created: 'Pending',
  authorized: 'Authorized',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Part. Refunded',
};

export function BillingHistory() {
  const [history, setHistory] = useState<PaymentHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const toast = usePaymentToast();

  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [currentPage, statusFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentHistory(
        currentPage,
        PAGE_SIZE,
        statusFilter || undefined
      );
      setHistory(data);
    } catch {
      setError('Failed to load billing history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (payment: PaymentHistoryItem) => {
    if (!payment.payment_id) return;
    try {
      setDownloadingId(payment.payment_id);
      const invoice = await getPaymentInvoice(payment.payment_id);
      // Open invoice in new tab — backend returns JSON; extend here for PDF if needed
      const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const totalPages = history ? Math.ceil(history.total_count / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                statusFilter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={fetchHistory}
              className="mt-3 bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && history?.payments.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No transactions found</p>
          <p className="text-gray-400 text-sm mt-1">
            {statusFilter ? 'Try a different status filter' : 'Your payments will appear here'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && history && history.payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Summary bar */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{history.total_count}</span> total transactions
            </p>
            <p className="text-sm text-gray-500">
              Page {history.page} of {totalPages}
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.payments.map((payment) => (
                  <tr key={payment.order_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {new Date(payment.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {PURPOSE_LABELS[payment.purpose] ?? payment.purpose}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {payment.order_id.slice(0, 18)}…
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ₹{payment.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[payment.status]}`}>
                        {STATUS_LABELS[payment.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {payment.status === 'captured' && payment.payment_id ? (
                        <button
                          onClick={() => handleDownloadInvoice(payment)}
                          disabled={downloadingId === payment.payment_id}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-semibold disabled:opacity-50"
                          title="Download Invoice"
                        >
                          {downloadingId === payment.payment_id
                            ? <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                            : <Download className="w-4 h-4" />
                          }
                          Invoice
                        </button>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {history.payments.map((payment) => (
              <div key={payment.order_id} className="px-4 py-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {PURPOSE_LABELS[payment.purpose] ?? payment.purpose}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(payment.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[payment.status]}`}>
                    {STATUS_LABELS[payment.status]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">
                    ₹{payment.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  {payment.status === 'captured' && payment.payment_id && (
                    <button
                      onClick={() => handleDownloadInvoice(payment)}
                      disabled={downloadingId === payment.payment_id}
                      className="flex items-center gap-1 text-blue-600 text-xs font-semibold disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Invoice
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 px-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || loading}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}