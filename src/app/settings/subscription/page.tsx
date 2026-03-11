"use client";

/**
 * Settings › Subscription Page
 *
 * Shows:
 *  - Current plan card (credits, expiry, features, upgrade CTA)
 *  - Usage history table (paginated credit log)
 *  - Billing history (payment receipts)
 *
 * Integrates with real subscription API endpoints.
 */

import React from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription';
import { CurrentPlanCard } from './_components/CurrentPlanCard';
import { UsageHistoryTable } from './_components/UsageHistoryTable';
import { BillingHistory } from './_components/BillingHistory';

const SubscriptionPage: React.FC = () => {
  const { subscription, loading, error } = useCurrentSubscription();

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[300px]">
        <Loader className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load subscription details'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-7 max-w-4xl">
      {/* Back link */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plan & Credits</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription and view credit usage history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sidebar: plan card */}
        <div className="lg:col-span-1">
          <CurrentPlanCard subscription={subscription} />
        </div>

        {/* Main: usage history */}
        <div className="lg:col-span-2">
          <UsageHistoryTable />
        </div>
      </div>

      {/* Billing history */}
      <div className="mt-5">
        <BillingHistory />
      </div>

      <div className="h-8" />
    </div>
  );
};

export default SubscriptionPage;
