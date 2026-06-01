'use client';

import React, { useEffect, useState } from 'react';
import { getPlans, Plan, upgradeSubscription } from '@/api/paymentApi';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { usePaymentToast } from '@/hooks/usePaymentToast';
import { AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

// Defines relative tier rank — higher number = higher tier
const PLAN_TIER: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  enterprise: 3,
};

interface PlanUpgradeDowngradeProps {
  currentPlanId: string;
  onUpgradeComplete?: () => void;
}

export function PlanUpgradeDowngrade({
  currentPlanId,
  onUpgradeComplete
}: PlanUpgradeDowngradeProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = usePaymentToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await getPlans();
      setPlans(data.filter(p => p.id !== currentPlanId));
    } catch (err) {
      setError('Failed to load available plans');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: Plan) => {
    try {
      setUpgrading(true);
      setError(null);
      const result = await upgradeSubscription(plan.id);
      toast.success('Plan upgrade initiated! Redirecting to payment...');
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        onUpgradeComplete?.();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upgrade plan';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !plans.length) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={fetchPlans}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Change Your Plan</h3>
        <p className="text-blue-800 text-sm">
          Upgrade to a higher tier or downgrade to save costs. Changes take effect immediately.
          If upgrading, you'll get pro-rata credit for unused time on your current plan.
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">You're already on our highest plan!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isUpgrade = (PLAN_TIER[plan.id] ?? 99) > (PLAN_TIER[currentPlanId] ?? 0);
            return (
              <div
                key={plan.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Plan Badge */}
                <div className="mb-4">
                  {isUpgrade ? (
                    <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      <TrendingUp className="w-3 h-3" />
                      Upgrade
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                      <TrendingDown className="w-3 h-3" />
                      Downgrade
                    </div>
                  )}
                </div>

                {/* Plan Name & Price */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Monthly Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{plan.price_inr_monthly}
                    <span className="text-sm font-normal text-gray-600">/month</span>
                  </p>
                </div>

                {/* Features */}
                <div className="mb-6 space-y-2">
                  <div className="flex gap-2 items-center text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      {plan.credits_per_month !== null ? `${plan.credits_per_month} credits/month` : 'Unlimited credits'}
                    </span>
                  </div>
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex gap-2 items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <p className="text-xs text-gray-500 ml-6">
                      +{plan.features.length - 3} more features
                    </p>
                  )}
                </div>

                {/* Change Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={upgrading}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    isUpgrade
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } disabled:opacity-50`}
                >
                  {upgrading ? 'Processing...' : `Switch to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-3">
        <h4 className="font-semibold text-gray-900">Pro-Rata Credits</h4>
        <p className="text-sm text-gray-700">
          If you upgrade mid-cycle, you'll receive a credit for the unused portion of your current plan,
          which will be applied to your new subscription.
        </p>
        <p className="text-sm text-gray-700">
          For downgrades, the difference will be credited to your account.
        </p>
      </div>
    </div>
  );
}