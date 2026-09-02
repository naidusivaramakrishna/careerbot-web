'use client';

import React, { Suspense } from 'react';
import { PaymentSuccess } from '@/components/payments/PaymentSuccess';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Suspense fallback={<LoadingSpinner />}>
          <PaymentSuccess />
        </Suspense>
      </div>
    </div>
  );
}
