'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createPaymentOrder,
  verifyPayment,
  validateCoupon,
  Plan,
  CouponValidationResponse,
  CreatePaymentOrderResponse,
} from '@/api/paymentApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { AlertCircle, CheckCircle, Tag, X } from 'lucide-react';
import { COMPANY_CONFIG, ROUTES, API_CONFIG } from '@/config';

interface PaymentCheckoutProps {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
}

// The Razorpay checkout callback fields this component reads.
interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayFailureResponse {
  error?: { description?: string; reason?: string };
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponValidationResponse | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  // Bumped on every validate request and on plan/cycle change, so a response
  // for a previous plan or cycle can never be displayed.
  const couponRequestRef = useRef(0);
  // An order whose server amount differs from what was displayed; Razorpay is
  // only opened for it after the user explicitly confirms the server amount.
  const [pendingOrder, setPendingOrder] = useState<CreatePaymentOrderResponse | null>(null);
  // Bumped on plan/cycle change and unmount: an order created for a previous
  // plan/cycle is discarded instead of being opened or offered.
  const checkoutGenRef = useRef(0);

  // Before a coupon: the /plans price (backend derives it from the same catalog
  // it charges from). With a coupon: the server-computed original/final amounts.
  const listAmount = billingCycle === 'yearly' ? plan.price_inr_yearly : plan.price_inr_monthly;
  const originalAmount = couponResult?.is_valid ? couponResult.original_amount : listAmount;
  const displayAmount = couponResult?.is_valid ? couponResult.final_amount : listAmount;
  // Server amounts are whole paise / 100, so this recovers the exact integer.
  const displayAmountPaise = Math.round(displayAmount * 100);

  // A coupon quote is for one plan + cycle: drop it when either changes.
  useEffect(() => {
    couponRequestRef.current += 1;
    checkoutGenRef.current += 1;
    isPaymentInProgress.current = false;
    setLoading(false);
    setCouponResult(null);
    setCouponError(null);
    setCouponValidating(false);
    setPendingOrder(null);
  }, [plan.id, billingCycle]);

  useEffect(() => {
    if (window.Razorpay) { setScriptLoaded(true); return; }
    const script = document.createElement('script');
    script.src = API_CONFIG.razorpayScript;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError('Failed to load payment gateway. Please refresh.');
    document.body.appendChild(script);
    return () => {
      checkoutGenRef.current += 1;
      if (razorpayInstanceRef.current) {
        razorpayInstanceRef.current.close();
        razorpayInstanceRef.current = null;
      }
    };
  }, []);

  const handleValidateCoupon = async () => {
    if (!couponInput.trim()) return;
    const requestId = ++couponRequestRef.current;
    try {
      setCouponValidating(true);
      setCouponError(null);
      setCouponResult(null);
      setPendingOrder(null);
      const result = await validateCoupon(couponInput.trim(), listAmount, plan.id, billingCycle);
      if (requestId !== couponRequestRef.current) return; // plan/cycle changed meanwhile
      if (result.is_valid) {
        setCouponResult(result);
      } else {
        setCouponError(result.message || 'Invalid coupon code');
      }
    } catch {
      if (requestId !== couponRequestRef.current) return;
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      if (requestId === couponRequestRef.current) setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    couponRequestRef.current += 1;
    // An order requested with this coupon must not open once it is gone.
    // Fallback only: the X is disabled while an order is in flight, so this
    // matters if that guard is ever lost (same reset as a plan/cycle change).
    checkoutGenRef.current += 1;
    isPaymentInProgress.current = false;
    setLoading(false);
    setCouponResult(null);
    setCouponInput('');
    setCouponError(null);
    setPendingOrder(null);
  };

  const handlePayment = async () => {
    if (!agreedToTerms) { setError('Please agree to the Terms of Service'); return; }
    if (isPaymentInProgress.current || loading || couponValidating) return;
    if (!scriptLoaded || !window.Razorpay) {
      setError('Payment gateway not ready. Please wait and try again.');
      return;
    }
    if (razorpayInstanceRef.current) {
      razorpayInstanceRef.current.close();
      razorpayInstanceRef.current = null;
    }

    const generation = checkoutGenRef.current;
    try {
      isPaymentInProgress.current = true;
      setLoading(true);
      setError(null);
      setPendingOrder(null);

      // Backend computes the authoritative amount server-side for subscriptions.
      // We still send amount_inr so non-subscription purposes work correctly.
      const orderResponse = await createPaymentOrder({
        amount_inr: listAmount,
        purpose: billingCycle === 'yearly' ? 'subscription_yearly' : 'subscription_monthly',
        plan_id: plan.id,
        // The server-normalised code the discount was validated for.
        coupon_code: couponResult?.is_valid ? couponResult.code : undefined,
      });

      // Plan or cycle changed while the order was being created: this order
      // is for something no longer on screen. Drop it (the reset effect has
      // already cleared loading / in-progress state).
      if (generation !== checkoutGenRef.current) return;

      // Mismatch guard: never open Razorpay silently for an amount the user
      // was not shown (stale /plans page, idempotent replay of an older order,
      // coupon changed server-side). Show the server amount and ask.
      if (orderResponse.amount !== displayAmountPaise) {
        isPaymentInProgress.current = false;
        setLoading(false);
        setPendingOrder(orderResponse);
        return;
      }

      openRazorpay(orderResponse);
    } catch (err) {
      if (generation !== checkoutGenRef.current) return;
      isPaymentInProgress.current = false;
      setLoading(false);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('timeout') || msg.includes('Network Error') || msg.includes('network')) {
        setError('Payment gateway is taking too long to respond. Please check your connection and try again.');
      } else if (msg.includes('401') || msg.includes('Unauthorized')) {
        setError('Session expired. Please refresh the page and try again.');
      } else {
        setError('Failed to initiate payment. Please try again.');
      }
    }
  };

  const handleConfirmServerAmount = () => {
    const order = pendingOrder;
    if (!order || isPaymentInProgress.current) return;
    if (!agreedToTerms) { setError('Please agree to the Terms of Service'); return; }
    if (!window.Razorpay) {
      setError('Payment gateway not ready. Please wait and try again.');
      return;
    }
    setPendingOrder(null);
    isPaymentInProgress.current = true;
    setLoading(true);
    setError(null);
    try {
      openRazorpay(order);
    } catch {
      isPaymentInProgress.current = false;
      setLoading(false);
      setError('Failed to initiate payment. Please try again.');
    }
  };

  const handleRefreshPrice = () => {
    window.location.reload();
  };

  // Opens Razorpay for an order whose server amount the user has seen.
  const openRazorpay = (orderResponse: CreatePaymentOrderResponse) => {
    const options = {
      key: orderResponse.key_id,
      amount: orderResponse.amount,   // server-authoritative paise
      currency: 'INR',
      name: COMPANY_CONFIG.name,
      description: `${plan.name} Plan — ${billingCycle} Subscription`,
      order_id: orderResponse.order_id,
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          // Field names must match backend VerifyPaymentRequest exactly
          const verifyResponse = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verifyResponse.success) {
            window.location.href = `/payments/success?order_id=${response.razorpay_order_id}`;
          } else {
            isPaymentInProgress.current = false;
            setLoading(false);
            setError(verifyResponse.message || 'Payment verification failed. Please contact support.');
          }
        } catch (err) {
          isPaymentInProgress.current = false;
          setLoading(false);
          const msg = err instanceof Error ? err.message : '';
          if (msg.includes('timeout') || msg.includes('Network Error') || msg.includes('network')) {
            setError('Payment verification timed out. Your payment may have been processed — please check your email or contact support before retrying.');
          } else {
            setError('Payment verification failed. Please contact support with your payment ID.');
          }
        }
      },
      prefill: { email: '', contact: '' },
      theme: { color: '#2563eb' },
      modal: {
        ondismiss: () => {
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
    razorpayInstanceRef.current.on('payment.failed', (response: RazorpayFailureResponse) => {
      isPaymentInProgress.current = false;
      setLoading(false);
      razorpayInstanceRef.current = null;
      const desc =
        response?.error?.description ||
        response?.error?.reason ||
        'Payment could not be processed';
      setError(`Payment failed: ${desc}. Please try again or use a different payment method.`);
    });
    razorpayInstanceRef.current.open();
  };

  const canPay = !loading && scriptLoaded && agreedToTerms && !pendingOrder && !couponValidating;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-opacity ${loading ? 'opacity-75' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

        {/* Line items */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">{plan.name} Plan</p>
              <p className="text-sm text-gray-500 capitalize">{billingCycle} billing</p>
            </div>
            <p className="font-semibold text-gray-900">₹{originalAmount.toLocaleString()}</p>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Credits</span>
            <span className="font-medium text-gray-900">
              {plan.credits_per_month !== null ? `${plan.credits_per_month}/month` : 'Unlimited'}
            </span>
          </div>

          {couponResult?.is_valid && (
            <div className="flex justify-between text-sm text-green-700">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Coupon ({couponResult.code})
              </span>
              <span className="font-semibold">−₹{couponResult.discount_amount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-lg font-semibold text-gray-900">Total</p>
          <div className="text-right">
            {couponResult?.is_valid && (
              <p className="text-sm text-gray-400 line-through">₹{originalAmount.toLocaleString()}</p>
            )}
            <p className="text-2xl font-bold text-blue-600">₹{displayAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Included Features</p>
          <ul className="space-y-1.5">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Coupon */}
        <div className="mb-6">
          {!couponResult?.is_valid ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                placeholder="Have a coupon code?"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase tracking-widest"
                disabled={loading}
              />
              <button
                onClick={handleValidateCoupon}
                disabled={!couponInput.trim() || couponValidating || loading}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-900 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                {couponValidating ? 'Checking…' : 'Apply'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <span className="flex items-center gap-2 text-green-800 text-sm">
                <Tag className="w-4 h-4" />
                <span className="font-mono font-bold">{couponResult.code}</span>
                <span>— saving ₹{couponResult.discount_amount.toLocaleString()}</span>
              </span>
              <button onClick={handleRemoveCoupon} disabled={loading} aria-label="Remove coupon" className="text-green-600 hover:text-green-900 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {couponError && <p className="mt-1.5 text-red-600 text-xs">{couponError}</p>}
        </div>

        {/* Server amount differs from what was shown: confirm before paying */}
        {pendingOrder && (
          <div role="alert" className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
            <p className="text-amber-900 text-sm font-semibold mb-1">The price has changed</p>
            <p className="text-amber-800 text-sm mb-3">
              The amount to pay is{' '}
              <strong>₹{(pendingOrder.amount / 100).toLocaleString()}</strong>, not the ₹
              {displayAmount.toLocaleString()} shown above.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleConfirmServerAmount}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
              >
                Pay ₹{(pendingOrder.amount / 100).toLocaleString()}
              </button>
              <button
                onClick={handleRefreshPrice}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-semibold rounded-lg"
              >
                Refresh price
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Dev test mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm font-semibold mb-2">🧪 Test Mode</p>
            <div className="space-y-1 text-yellow-700 text-xs">
              <p><strong>Netbanking:</strong> Select any test bank → auto-confirms</p>
              <p><strong>UPI:</strong> <code className="bg-yellow-100 px-1 rounded font-mono">success@razorpay</code></p>
              <p>
                <strong>Card:</strong>{' '}
                <code className="bg-yellow-100 px-1 rounded font-mono">4111 1111 1111 1111</code>
                {' '}Exp: <code className="bg-yellow-100 px-1 rounded font-mono">03/35</code>
                {' '}CVV: <code className="bg-yellow-100 px-1 rounded font-mono">123</code>
              </p>
            </div>
          </div>
        )}

        {/* Security badges */}
        <div className="space-y-2 mb-6">
          {[
            '🔒 Secure payment encrypted by Razorpay',
            '✓ No hidden charges — exact amount shown above',
          ].map((text, i) => (
            <div key={i} className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <p className="text-green-900 text-sm">{text}</p>
            </div>
          ))}
        </div>

        {/* T&C checkboxes */}
        <div className="space-y-3 mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">Before you continue:</p>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 mt-0.5 border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              I agree to {COMPANY_CONFIG.name}'s{' '}
              <a href={ROUTES.termsOfService} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-semibold">
                Terms of Service
              </a>
            </span>
          </label>
        </div>

        {/* Pay button */}
        <button
          onClick={handlePayment}
          disabled={!canPay}
          className={`w-full py-4 px-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
            canPay
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-[0.99]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <><LoadingSpinner size="sm" /><span>Processing…</span></>
          ) : !scriptLoaded ? (
            <><div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin" /><span>Loading gateway…</span></>
          ) : !agreedToTerms ? (
            <><AlertCircle className="w-4 h-4" /><span>Accept terms to continue</span></>
          ) : (
            `Pay ₹${displayAmount.toLocaleString()} / ${billingCycle === 'yearly' ? 'year' : 'month'}`
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          🔒 Secured by Razorpay · Payment info is never stored on our servers
        </p>
      </div>

      <button
        onClick={() => router.back()}
        disabled={loading}
        className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        ← Back
      </button>
    </div>
  );
}