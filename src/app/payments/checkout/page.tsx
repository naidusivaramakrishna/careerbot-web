'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getPlans, Plan } from '@/api/paymentApi';
import { isAuthenticated } from '@/api/authApi';
import { PaymentCheckout } from '@/components/payments/PaymentCheckout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    checkAuthAndFetchPlan();
  }, [planId]);

  const checkAuthAndFetchPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      const authenticated = await isAuthenticated();
      if (!authenticated) {
        setError('Please sign in to continue with payment');
        setIsAuth(false);
        return;
      }

      setIsAuth(true);
      await fetchPlan();
    } catch (err) {
      setError('Failed to verify authentication');
      console.error('Auth check error:', err);
      setLoading(false);
    }
  };

  const fetchPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!planId) {
        setError('No plan selected');
        setLoading(false);
        return;
      }

      const plans = await getPlans();
      const selectedPlan = plans.find((p) => p.id === planId);

      if (!selectedPlan) {
        setError('Plan not found');
      } else {
        setPlan(selectedPlan);
      }
    } catch (err) {
      setError('Failed to load plan details');
      console.error('Error loading plan:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !plan) {
    const isAuthError = error?.toLowerCase().includes('sign in');

    return (
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">{isAuthError ? 'Sign In Required' : 'Error'}</h2>
          <p className="text-red-700 mb-6">{error || 'Failed to load plan'}</p>
          <div className="flex flex-col gap-3">
            {isAuthError ? (
              <>
                <button
                  onClick={() => router.push('/signin')}
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Sign In
                </button>
                <a
                  href="/payments"
                  className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Back to Plans
                </a>
              </>
            ) : (
              <a
                href="/payments"
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
              >
                Back to Plans
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setBillingCycle('monthly');
            }}
            className={`px-6 py-2 rounded-md font-semibold transition-all duration-200 ${
              billingCycle === 'monthly'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => {
              setBillingCycle('yearly');
            }}
            className={`px-6 py-2 rounded-md font-semibold transition-all duration-200 relative ${
              billingCycle === 'yearly'
                ? 'bg-white text-blue-600 shadow-md'
                : 'bg-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Payment Checkout */}
      <PaymentCheckout plan={plan} billingCycle={billingCycle} />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-12 text-center">Complete Your Purchase</h1>
        <Suspense fallback={<LoadingSpinner />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
