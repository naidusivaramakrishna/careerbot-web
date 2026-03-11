/**
 * Plan Status Card
 *
 * Displays user's current subscription plan with total credits and upgrade CTA
 */

import React from 'react';
import { Crown } from 'lucide-react';
import Link from 'next/link';

export interface PlanStatusCardProps {
  planName: string;
  planId: string;
  creditsTotal: number;
  planExpiresAt?: string;
}

export const PlanStatusCard: React.FC<PlanStatusCardProps> = ({
  planName,
  planId,
  creditsTotal,
  planExpiresAt,
}) => {
  const isPaidPlan = planId !== 'FREE';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Plan Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg ${
              isPaidPlan ? 'bg-gradient-to-r from-[#2200FF] to-[#1800B3]' : 'bg-gray-100'
            }`}
          >
            <Crown className={`w-5 h-5 ${isPaidPlan ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Plan</p>
            <h3 className="text-lg font-semibold text-gray-900">{planName}</h3>
          </div>
        </div>
      </div>

      {/* Credits Display */}
      <div className="mb-4">
        <p className="text-2xl font-bold text-gray-900">{creditsTotal} Credits</p>
        <p className="text-sm text-gray-500">Total per month</p>
      </div>

      {/* Expiry Date (for paid plans) */}
      {isPaidPlan && planExpiresAt && (
        <div className="mb-4 text-sm text-gray-600">
          Renews on {new Date(planExpiresAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      )}

      {/* Upgrade Button */}
      <Link href="/pricing">
        <button
          className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 ${
            isPaidPlan
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gradient-to-r from-[#2200FF] to-[#1800B3] text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {isPaidPlan ? 'Manage Plan' : 'Upgrade Plan'}
        </button>
      </Link>

      {/* Free Plan Encouragement */}
      {!isPaidPlan && (
        <p className="text-xs text-center text-gray-500 mt-3">
          Get more credits and unlimited features
        </p>
      )}
    </div>
  );
};
