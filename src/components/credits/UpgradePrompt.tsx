"use client";

/**
 * UpgradePrompt
 *
 * A dismissible banner shown when credits are running low (< 20% remaining).
 * Usage:
 *   <UpgradePrompt creditsRemaining={8} creditsTotal={50} />
 */

import React, { useState } from 'react';
import { Zap, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  creditsRemaining: number;
  creditsTotal: number;
  /** Override the threshold percentage (default: 20) */
  threshold?: number;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  creditsRemaining,
  creditsTotal,
  threshold = 20,
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  const pct = creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0;

  if (dismissed || pct > threshold) return null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${className}`}
      style={{ background: '#fffbeb', borderColor: '#fde68a' }}
      role="alert"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: '#fef3c7' }}
      >
        <Zap className="w-4 h-4" style={{ color: '#d97706' }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 leading-tight">
          Running low on credits
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          {creditsRemaining} of {creditsTotal} credits remaining. Upgrade to continue using
          premium features.
        </p>
      </div>

      <button
        onClick={() => router.push('/pricing')}
        className="shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:opacity-90"
        style={{ background: '#d97706', color: 'white' }}
      >
        Upgrade
        <ArrowRight className="w-3 h-3" />
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-amber-500 hover:bg-amber-100 transition-colors"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
};
