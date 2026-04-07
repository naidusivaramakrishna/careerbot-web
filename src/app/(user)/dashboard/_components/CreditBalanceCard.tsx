/**
 * Credit Balance Card
 *
 * Displays remaining credits with progress bar and percentage
 */

import React from 'react';
import { Gem } from 'lucide-react';

export interface CreditBalanceCardProps {
  creditsRemaining: number;
  creditsTotal: number;
}

export const CreditBalanceCard: React.FC<CreditBalanceCardProps> = ({
  creditsRemaining,
  creditsTotal,
}) => {
  const percentage = Math.round((creditsRemaining / creditsTotal) * 100);
  const isLow = percentage < 20;
  const isMedium = percentage >= 20 && percentage < 50;

  // Determine color based on remaining percentage
  const getColor = () => {
    if (isLow) return { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-100' };
    if (isMedium) return { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-100' };
    return { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-100' };
  };

  const colors = getColor();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colors.ring} ring-4`}>
          <Gem className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Credit Balance</p>
        </div>
      </div>

      {/* Credits Display */}
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-3xl font-bold text-gray-900">{creditsRemaining}</span>
          <span className="text-lg text-gray-500"> / {creditsTotal}</span>
        </div>
        <span className={`text-sm font-semibold ${colors.text}`}>
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${colors.bg} transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Warning Messages */}
      {isLow && (
        <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          ⚠️ Running low on credits. Consider upgrading your plan.
        </div>
      )}
      {isMedium && (
        <div className="mt-3 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
          💡 You&apos;ve used over half your credits this month.
        </div>
      )}
    </div>
  );
};
