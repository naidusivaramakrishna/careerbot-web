/**
 * Insufficient Credits Modal
 *
 * Shown when user attempts action without enough credits (402 error)
 *
 * Features:
 * - Shows current balance vs required amount
 * - Displays credit deficit
 * - Links to pricing page for upgrades
 * - Suggests appropriate plan based on deficit
 */

import React from 'react';
import { X, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/types/subscription.types';

export interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string;
  requiredCredits: number;
  currentBalance: number;
}

export const InsufficientCreditsModal: React.FC<InsufficientCreditsModalProps> = ({
  isOpen,
  onClose,
  actionName,
  requiredCredits,
  currentBalance,
}) => {
  if (!isOpen) return null;

  const deficit = requiredCredits - currentBalance;

  // Suggest a plan based on deficit
  const getSuggestedPlan = () => {
    if (deficit <= 50) return SUBSCRIPTION_PLANS[1]; // STARTER (100 credits)
    if (deficit <= 150) return SUBSCRIPTION_PLANS[2]; // BASIC (200 credits)
    return SUBSCRIPTION_PLANS[3]; // PRO (500 credits)
  };

  const suggestedPlan = getSuggestedPlan();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Insufficient Credits
              </h2>
              <p className="text-sm text-gray-600">
                You don&apos;t have enough credits
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Problem Statement */}
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-900 mb-3">
              You tried to use <strong>{actionName}</strong>, but you don&apos;t have enough credits.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-800">Required:</span>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-900">
                    {requiredCredits} credits
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-800">Your Balance:</span>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-900">
                    {currentBalance} credits
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-red-300">
                <span className="text-sm font-medium text-red-900">Deficit:</span>
                <span className="font-bold text-red-900">
                  {deficit} credits short
                </span>
              </div>
            </div>
          </div>

          {/* Suggested Plan */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Recommended: {suggestedPlan.plan_name}
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Get <strong>{suggestedPlan.credits} credits</strong> for just{' '}
                  <strong>₹{suggestedPlan.price_inr}/month</strong>
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ {suggestedPlan.resume_builder_limit === -1 ? 'Unlimited' : suggestedPlan.resume_builder_limit} resume{suggestedPlan.resume_builder_limit !== 1 ? 's' : ''}</li>
                  <li>✓ {suggestedPlan.job_matches_limit === -1 ? 'Unlimited' : suggestedPlan.job_matches_limit} job match{suggestedPlan.job_matches_limit !== 1 ? 'es' : ''}</li>
                  <li>✓ {suggestedPlan.english_assessments_limit === -1 ? 'Unlimited' : suggestedPlan.english_assessments_limit} assessment{suggestedPlan.english_assessments_limit !== 1 ? 's' : ''}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="w-full py-3 px-4 bg-gradient-to-r from-[#2200FF] to-[#1800B3] text-white font-semibold rounded-lg hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
            onClick={onClose}
          >
            <TrendingUp className="w-5 h-5" />
            View All Plans & Upgrade
          </Link>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-gray-500 mt-4">
          💡 Tip: Higher plans offer better value and more features!
        </p>
      </div>
    </div>
  );
};
