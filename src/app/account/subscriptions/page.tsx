'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { SubscriptionManagement } from '@/components/payments/SubscriptionManagement';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function SubscriptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPayment = searchParams.get('upgraded') === 'true';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-gray-300">|</span>
            <nav className="flex items-center gap-1.5 text-sm text-gray-500">
              <span
                className="hover:text-blue-600 cursor-pointer transition-colors"
                onClick={() => router.push('/dashboard')}
              >
                Dashboard
              </span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Subscription</span>
            </nav>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-gray-500 mt-1">Manage your plan, track credits, and control billing</p>
        </div>

        <SubscriptionManagement onUpgrade={() => router.push('/payments')} fromPayment={fromPayment} />
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>}>
      <SubscriptionsContent />
    </Suspense>
  );
}