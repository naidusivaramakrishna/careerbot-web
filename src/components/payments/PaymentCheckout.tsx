'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPaymentOrder, verifyPayment, Plan } from '@/api/paymentApi';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PaymentCheckoutProps {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentCheckout({ plan, billingCycle }: PaymentCheckoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const razorpayInstanceRef = useRef<any>(null);
  const isPaymentInProgress = useRef(false);

  useEffect(() => {
    // Check if script already loaded
    if (window.Razorpay) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError('Failed to load payment gateway. Please refresh.');
    document.body.appendChild(script);

    return () => {
      // Close any open Razorpay instance on unmount
      if (razorpayInstanceRef.current) {
        razorpayInstanceRef.current.close();
        razorpayInstanceRef.current = null;
      }
    };
  }, []);

  const handlePayment = async () => {
    // Prevent double clicks
    if (isPaymentInProgress.current || loading) return;

    if (!scriptLoaded || !window.Razorpay) {
      setError('Payment gateway not ready. Please wait and try again.');
      return;
    }

    // Close any existing Razorpay instance before opening a new one
    if (razorpayInstanceRef.current) {
      razorpayInstanceRef.current.close();
      razorpayInstanceRef.current = null;
    }

    try {
      isPaymentInProgress.current = true;
      setLoading(true);
      setError(null);

      // The server prices the order from plan_id + billing_cycle — never send
      // a client-computed amount (it would be tamperable).
      const orderResponse = await createPaymentOrder({
        plan_id: plan.id,
        billing_cycle: billingCycle,
        purpose: `subscription_${billingCycle}`,
      });

      const options = {
        key: orderResponse.key_id,
        amount: orderResponse.amount,
        currency: 'INR',
        name: 'CareerBot',
        description: `${plan.name} Plan - ${billingCycle} Subscription`,
        order_id: orderResponse.order_id,
        handler: async (response: any) => {
          try {
            const verifyResponse = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              // Use window.location for reliable redirect from inside Razorpay callback
              window.location.href = `/payments/success?order_id=${response.razorpay_order_id}`;
            } else {
              isPaymentInProgress.current = false;
              setLoading(false);
              const errorMsg = verifyResponse.message || 'Payment verification failed';
              setError(`Verification failed: ${errorMsg}`);
              console.error('[Checkout] Verification failed:', verifyResponse);
            }
          } catch (err) {
            isPaymentInProgress.current = false;
            setLoading(false);
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to verify payment: ${errorMsg}`);
            console.error('[Checkout] Verification exception:', err);
          }
        },
        prefill: {
          email: '',
          contact: '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            console.log('[Checkout] User closed Razorpay modal without completing payment');
            isPaymentInProgress.current = false;
            setLoading(false);
            razorpayInstanceRef.current = null;
            setError(null);
          },
          escape: true,
          backdropclose: false,
        },
      };

      razorpayInstanceRef.current = new window.Razorpay(options);
      razorpayInstanceRef.current.open();

    } catch (err) {
      isPaymentInProgress.current = false;
      setLoading(false);
      setError('Failed to initiate payment. Please try again.');
      console.error('Payment error:', err);
    }
  };

  const amount = billingCycle === 'yearly' ? plan.price_inr_yearly : plan.price_inr_monthly;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Order Summary */}
      <div className={`bg-white border border-gray-200 rounded-lg p-6 transition-opacity ${loading ? 'opacity-75' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

        <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">{plan.name} Plan</p>
              <p className="text-sm text-gray-600 capitalize">{billingCycle} Billing</p>
            </div>
            <p className="font-semibold text-gray-900 text-lg">₹{amount.toLocaleString()}</p>
          </div>

          <div className="flex justify-between items-start">
            <p className="text-gray-600">Credits</p>
            <p className="font-semibold text-gray-900">{plan.credits_per_month} credits/month</p>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-lg font-semibold text-gray-900">Total Amount</p>
          <p className="text-2xl font-bold text-blue-600">₹{amount.toLocaleString()}</p>
        </div>

        {/* Features Included */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-3">Included Features:</p>
          <ul className="space-y-2">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="text-sm text-gray-700">✓ {feature}</li>
            ))}
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Test Mode Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm font-semibold mb-3">🧪 Test Mode Active — How to Test</p>
          <div className="space-y-2 text-yellow-700 text-xs">
            <div>
              <p className="font-semibold">✓ Netbanking (Test Mode Auto-Completes):</p>
              <p className="ml-3">Select Netbanking → Choose any test bank → Auto-confirms (no details needed)</p>
            </div>
            <div>
              <p className="font-semibold">✓ UPI:</p>
              <p className="ml-3">Use ID: <code className="bg-yellow-100 px-1 rounded font-mono">success@razorpay</code></p>
            </div>
            <div>
              <p className="font-semibold">✓ Debit/Credit Card:</p>
              <p className="ml-3">Card: <code className="bg-yellow-100 px-1 rounded font-mono">4111111111111111</code> | Expiry: <code className="bg-yellow-100 px-1 rounded font-mono">03/35</code> | CVV: <code className="bg-yellow-100 px-1 rounded font-mono">123</code></p>
              <p className="ml-3 text-yellow-600 text-xs">⚠️ Only Visa/Mastercard work in test. NOT American Express.</p>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={loading || !scriptLoaded}
          className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            loading ? 'scale-95 opacity-90' : 'hover:shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Processing payment...</span>
            </>
          ) : !scriptLoaded ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
              <span>Loading payment gateway...</span>
            </>
          ) : (
            `Pay ₹${amount.toLocaleString()}`
          )}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>🔒 Secure payment powered by Razorpay</p>
          <p className="text-xs mt-1">Your payment information is encrypted and secure</p>
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        disabled={loading}
        className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 font-semibold py-2 rounded-lg transition-colors"
      >
        Back
      </button>
    </div>
  );
}