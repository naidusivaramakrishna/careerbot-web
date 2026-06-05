'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { usePaymentToast } from '@/hooks/usePaymentToast';
import { COMPANY_CONFIG, ROUTES, UI_CONFIG, PAYMENT_MESSAGES } from '@/config';

export function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const toast = usePaymentToast();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    toast.success(PAYMENT_MESSAGES.paymentSuccess);

    const timer = setTimeout(() => {
      setRedirecting(true);
      router.push(`${ROUTES.subscriptions}?upgraded=true`);
    }, UI_CONFIG.paymentSuccessRedirectDelay);

    return () => clearTimeout(timer);
  }, [toast, router]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">

        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-10 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 text-lg">Your subscription has been activated</p>
        </div>

        <div className="p-8 space-y-6">

          {/* Order ID */}
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Order ID</span>
              <span className="font-mono text-sm text-gray-900 bg-white border border-gray-200 px-3 py-1 rounded">
                {orderId}
              </span>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <span className="text-gray-700">Your credits have been added to your account immediately</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <span className="text-gray-700">A payment confirmation has been sent to your email</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </span>
                <span className="text-gray-700">All premium features are now unlocked — start using them now!</span>
              </li>
            </ul>
          </div>

          {/* Auto Redirect Notice */}
          {redirecting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-700 font-medium">Redirecting to your subscription page...</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              disabled={redirecting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors text-center"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/account/subscriptions')}
              disabled={redirecting}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 font-semibold py-3 rounded-lg transition-colors text-center"
            >
              View Subscription
            </button>
          </div>

          {/* Support */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              Need help? Email us at{' '}
              <a href={`mailto:${COMPANY_CONFIG.supportEmail}`} className="text-blue-600 hover:underline font-medium">
                {COMPANY_CONFIG.supportEmail}
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}