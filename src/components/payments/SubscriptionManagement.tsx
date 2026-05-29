'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentSubscription, cancelSubscription, CurrentSubscription } from '@/api/paymentApi';
import { usePaymentToast } from '@/hooks/usePaymentToast';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PAYMENT_MESSAGES } from '@/config';
import {
  CheckCircle2, AlertCircle, Zap, Crown,
  Calendar, RefreshCw, TrendingUp, ShieldX, Clock
} from 'lucide-react';

interface SubscriptionManagementProps {
  onUpgrade?: () => void;
  fromPayment?: boolean;
}

export function SubscriptionManagement({ onUpgrade, fromPayment }: SubscriptionManagementProps) {
  const router = useRouter();
  const toast = usePaymentToast();
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (fromPayment) {
      activateWithRetry();
    } else {
      fetchSubscription();
    }
  }, []);

  const activateWithRetry = async () => {
    setActivating(true);
    setLoading(true);
    const MAX_ATTEMPTS = 8;
    const INTERVAL_MS = 2500;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const data = await getCurrentSubscription();
        const isFreePlan = !data || data.plan_name?.toLowerCase().includes('free');
        if (!isFreePlan || attempt === MAX_ATTEMPTS - 1) {
          setSubscription(data);
          setActivating(false);
          setLoading(false);
          return;
        }
      } catch {
        if (attempt === MAX_ATTEMPTS - 1) {
          setError(PAYMENT_MESSAGES.subscriptionLoadError);
          setActivating(false);
          setLoading(false);
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
    }
    setActivating(false);
    setLoading(false);
  };

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCurrentSubscription();
      setSubscription(data);
    } catch (err) {
      setError(PAYMENT_MESSAGES.subscriptionLoadError);
      console.error('Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true);
      setError(null);
      await cancelSubscription();
      setShowCancelConfirm(false);
      setCancelSuccess(true);
      toast.success(PAYMENT_MESSAGES.cancellationSuccess);
      await fetchSubscription();
    } catch (err) {
      const errorMsg = PAYMENT_MESSAGES.cancellationError;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {activating && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
            <div>
              <p className="text-blue-900 text-sm font-semibold">Activating your subscription…</p>
              <p className="text-blue-700 text-xs mt-0.5">This usually takes a few seconds after payment</p>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 h-32 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse" />
          <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Failed to load subscription</h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button
              onClick={fetchSubscription}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>

        {/* Always show dashboard button even on error */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg mb-2">No Active Subscription</h3>
          <p className="text-gray-600 text-sm mb-6">
            You are on the Free plan. Upgrade to unlock more credits and premium features.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onUpgrade}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              View Plans & Upgrade
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const creditsPercentage = subscription.credits_total > 0
    ? Math.round((subscription.credits_remaining / subscription.credits_total) * 100)
    : 0;

  const isFreePlan = subscription.plan_name?.toLowerCase().includes('free');
  const isCancelled = subscription.status === 'cancelled';
  const barColor = creditsPercentage > 50 ? '#2563eb' : creditsPercentage > 20 ? '#d97706' : '#dc2626';

  const accessUntilText = subscription.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Cancel success banner */}
      {cancelSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 text-sm font-medium">
              Subscription cancelled successfully
            </p>
            <p className="text-green-700 text-xs mt-1">
              • You'll retain access until the end of your billing period
            </p>
            <p className="text-green-700 text-xs">
              • A confirmation email has been sent to your registered email
            </p>
          </div>
        </div>
      )}

      {/* Cancelled plan — access-until warning */}
      {isCancelled && !cancelSuccess && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-900 text-sm font-semibold">
              Your {subscription.plan_name} plan is cancelled
            </p>
            {accessUntilText ? (
              <p className="text-amber-700 text-xs mt-1">
                You have full access until <strong>{accessUntilText}</strong>. After that, your account moves to the Free plan.
              </p>
            ) : (
              <p className="text-amber-700 text-xs mt-1">
                You have access until the end of your current billing period, then downgrade to Free.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Refresh button for updated data */}
      <button
        onClick={fetchSubscription}
        className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-2 rounded-lg transition-colors border border-blue-200"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh Subscription Data
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Plan Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Plan header */}
        <div
          className="px-6 py-5"
          style={{
            background: isFreePlan
              ? '#f8fafc'
              : 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: isFreePlan ? '#e2e8f0' : 'rgba(255,255,255,0.2)' }}
              >
                {isFreePlan
                  ? <Zap className="w-5 h-5 text-gray-500" />
                  : <Crown className="w-5 h-5 text-yellow-300" />
                }
              </div>
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: isFreePlan ? '#64748b' : 'rgba(255,255,255,0.7)' }}
                >
                  Current Plan
                </p>
                <h2
                  className="text-xl font-bold"
                  style={{ color: isFreePlan ? '#0f172a' : 'white' }}
                >
                  {subscription.plan_name}
                </h2>
              </div>
            </div>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full capitalize"
              style={
                subscription.status === 'active'
                  ? { background: isFreePlan ? '#dcfce7' : 'rgba(255,255,255,0.2)', color: isFreePlan ? '#16a34a' : 'white' }
                  : { background: '#fef2f2', color: '#dc2626' }
              }
            >
              {subscription.status}
            </span>
          </div>
        </div>

        {/* Credits & Details */}
        <div className="px-6 py-5 space-y-5">
          {/* Credits bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-semibold text-gray-700">Credits Remaining</span>
              <span className="text-sm font-bold text-gray-900">
                {subscription.credits_remaining}
                <span className="text-gray-400 font-normal"> / {subscription.credits_total}</span>
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${creditsPercentage}%`, background: barColor }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{creditsPercentage}% remaining</p>
          </div>

          {/* Billing info */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Billing Cycle</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">
                {subscription.billing_cycle || 'Monthly'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Started On</p>
              <p className="text-sm font-semibold text-gray-900">
                {subscription.started_at
                  ? new Date(subscription.started_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })
                  : '—'}
              </p>
            </div>
            {subscription.next_billing_date && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Next Billing Date
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(subscription.next_billing_date).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Features */}
          {subscription.features && Object.keys(subscription.features).length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Features Included
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(subscription.features).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}: <strong>{value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons — subscription-specific actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Primary: Upgrade (only for free plan or to upgrade tier) */}
        <button
          onClick={onUpgrade}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Upgrade Plan
        </button>

        {/* Cancel Plan — disabled until cancellation flow is implemented
        {!isFreePlan && !isCancelled && !cancelSuccess && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 font-semibold py-3 rounded-xl border border-red-200 transition-colors"
          >
            <ShieldX className="w-4 h-4" />
            Cancel Plan
          </button>
        )}
        */}
      </div>

      {/* Cancel Confirmation Modal — disabled until cancellation flow is implemented
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldX className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cancel Subscription?</h3>
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                You'll keep access to premium features until the end of your current billing cycle.
                After that, you'll be moved to the Free plan.
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">✓ Access Retained:</span> All features available until billing cycle ends
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-900">
                  <span className="font-semibold">📧 Email Confirmation:</span> We'll send a confirmation to your email
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {canceling ? (
                  <><LoadingSpinner size="sm" /> Cancelling...</>
                ) : (
                  'Yes, Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      */}
    </div>
  );
}