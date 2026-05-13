"use client";

/**
 * CurrentPlanCard
 *
 * Shows the user's active plan, credit balance, expiry date,
 * and upgrade CTA.
 */

import React from 'react';
import { Zap, Crown, CheckCircle, ArrowRight, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CurrentSubscription } from '@/api/subscriptionApi';
import { SUBSCRIPTION_PLANS, isUpgrade, PlanId } from '@/types/subscription.types';

interface CurrentPlanCardProps {
  subscription: CurrentSubscription;
}

export const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({ subscription }) => {
  const router = useRouter();

  const pct = subscription.credits_total > 0
    ? Math.round((subscription.credits_remaining / subscription.credits_total) * 100)
    : 0;

  const isPro = subscription.plan_id === 'PRO';
  const isMax = subscription.plan_id === 'MAX';
  const isFree = subscription.plan_id === 'FREE';

  const barColor = pct >= 50 ? '#2557a7' : pct >= 20 ? '#d97706' : '#dc2626';

  const nextPlans = SUBSCRIPTION_PLANS.filter((p) =>
    isUpgrade(subscription.plan_id as PlanId, p.plan_id)
  );

  const expiryDate = subscription.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Plan header banner */}
      <div
        className="px-6 py-5"
        style={{
          background: isMax
            ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
            : isPro
            ? 'linear-gradient(135deg, #2557a7 0%, #1f4e98 100%)'
            : '#f8fafc',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: isFree ? '#e2e8f0' : 'rgba(255,255,255,0.2)' }}
            >
              {isMax || isPro ? (
                <Crown className="w-5 h-5 text-yellow-300" />
              ) : (
                <Zap className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: isFree ? '#64748b' : 'rgba(255,255,255,0.7)' }}
              >
                Current Plan
              </p>
              <h3
                className="text-xl font-bold"
                style={{ color: isFree ? '#1e293b' : 'white' }}
              >
                {subscription.plan_name}
              </h3>
            </div>
          </div>

          {(isPro || isMax) && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full border"
              style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.1)' }}
            >
              ACTIVE
            </span>
          )}
        </div>

        {expiryDate && (
          <div
            className="mt-3 flex items-center gap-1.5 text-xs"
            style={{ color: isFree ? '#64748b' : 'rgba(255,255,255,0.65)' }}
          >
            <Calendar className="w-3.5 h-3.5" />
            Renews {expiryDate}
          </div>
        )}
      </div>

      {/* Credit balance */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Credit Balance</p>
          <p className="text-sm font-bold text-gray-900">
            {subscription.credits_remaining}
            <span className="text-gray-400 font-normal"> / {subscription.credits_total}</span>
          </p>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{pct}% remaining</p>

        {/* What's included */}
        <div className="mt-4 space-y-1.5">
          {[
            `${subscription.credits_total} credits / cycle`,
            isPro || isMax ? 'Unlimited resumes & exports' : 'Up to 3 resumes',
            isPro || isMax ? 'Unlimited ATS scans' : '5 ATS scans',
            isMax ? 'Dedicated support + API access' : isPro ? 'Priority support' : 'Community support',
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-green-500" />
              {feat}
            </div>
          ))}
        </div>

        {/* Upgrade CTA */}
        {nextPlans.length > 0 && (
          <button
            onClick={() => router.push('/payments')}
            className="mt-5 w-full py-2.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: '#2557a7', color: 'white', boxShadow: '0 4px 14px rgba(37,87,167,0.3)' }}
          >
            Upgrade to {nextPlans[0].plan_name}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
