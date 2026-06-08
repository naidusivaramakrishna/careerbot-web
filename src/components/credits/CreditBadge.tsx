/**
 * Credit Badge Component
 *
 * Displays user's current credit balance with color-coded status
 * Used in header (compact) and sidebar (detailed) variants
 *
 * Color coding:
 * - Red: < 20% remaining (critical)
 * - Orange: 20-50% remaining (low)
 * - Green: > 50% remaining (good)
 */

import React from 'react';
import Link from 'next/link';
import { Zap, Sparkles, TrendingUp } from 'lucide-react';

export interface CreditBadgeProps {
  creditsRemaining: number;
  creditsTotal: number;
  variant?: 'header' | 'sidebar';
  showUpgrade?: boolean;
  className?: string;
}

export const CreditBadge: React.FC<CreditBadgeProps> = ({
  creditsRemaining,
  creditsTotal,
  variant = 'header',
  showUpgrade = true,
  className = '',
}) => {
  // Calculate percentage and determine color
  const percentage = creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0;
  const isLow = percentage < 20;
  const isMedium = percentage >= 20 && percentage < 50;

  const getColorClasses = () => {
    if (isLow) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'text-red-500',
        progress: 'bg-red-500',
      };
    }
    if (isMedium) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: 'text-orange-500',
        progress: 'bg-orange-500',
      };
    }
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-[#2557a7]',
      icon: 'text-[#5896d7]',
      progress: 'bg-[#2557a7]',
    };
  };

  const colors = getColorClasses();

  // Header variant: Compact badge
  if (variant === 'header') {
    return (
      <Link
        href="/settings/subscription"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colors.bg} ${colors.border} hover:shadow-sm transition-all ${className}`}
        title={`${creditsRemaining} of ${creditsTotal} credits remaining`}
      >
        <span className="w-5 h-5 rounded-full bg-[#2557a7] flex items-center justify-center shrink-0">
          <Zap className="w-2.5 h-2.5 text-white fill-white" />
        </span>
        <span className={`text-xs font-semibold ${colors.text}`}>
          {creditsRemaining}
          <span className="font-normal text-gray-400 mx-0.5">/</span>
          {creditsTotal}
        </span>
      </Link>
    );
  }

  // Sidebar variant: Detailed card
  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-5 h-5 ${colors.icon}`} />
          <span className="text-sm font-medium text-gray-700">Credits</span>
        </div>
        {isLow && (
          <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            Low
          </span>
        )}
      </div>

      {/* Credit Balance */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${colors.text}`}>
            {creditsRemaining}
          </span>
          <span className="text-sm text-gray-500">/ {creditsTotal}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.progress} transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Warning or Info */}
      {isLow ? (
        <p className="text-xs text-red-600 mb-3">
          Running low! Upgrade to get more credits.
        </p>
      ) : isMedium ? (
        <p className="text-xs text-orange-600 mb-3">
          Consider upgrading for more credits.
        </p>
      ) : (
        <p className="text-xs text-gray-600 mb-3">
          You&apos;re doing great! Keep going.
        </p>
      )}

      {/* Upgrade Button */}
      {showUpgrade && (
        <Link
          href="/pricing"
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
            isLow || isMedium
              ? 'bg-gradient-to-r from-[#2200FF] to-[#1800B3] text-white hover:shadow-md'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          {isLow || isMedium ? 'Get More Credits' : 'Upgrade Plan'}
        </Link>
      )}
    </div>
  );
};

/**
 * Skeleton loader for CreditBadge
 */
export const CreditBadgeSkeleton: React.FC<{ variant?: 'header' | 'sidebar' }> = ({
  variant = 'header',
}) => {
  if (variant === 'header') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded" />
        <div className="w-8 h-4 bg-gray-300 rounded" />
        <div className="w-12 h-3 bg-gray-300 rounded" />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border bg-gray-50 border-gray-200 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-300 rounded" />
          <div className="w-16 h-4 bg-gray-300 rounded" />
        </div>
      </div>
      <div className="w-20 h-8 bg-gray-300 rounded mb-3" />
      <div className="h-2 bg-gray-300 rounded-full mb-3" />
      <div className="w-full h-3 bg-gray-300 rounded mb-3" />
      <div className="w-full h-8 bg-gray-300 rounded" />
    </div>
  );
};
