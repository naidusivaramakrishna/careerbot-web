"use client";

/**
 * CreditCostLabel
 *
 * Inline badge showing how many credits a feature costs.
 * Usage:
 *   <CreditCostLabel cost={5} />          → "5 credits"
 *   <CreditCostLabel cost={0} />          → "FREE"
 *   <CreditCostLabel cost={10} size="lg" />
 */

import React from 'react';
import { Zap } from 'lucide-react';

interface CreditCostLabelProps {
  cost: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CreditCostLabel: React.FC<CreditCostLabelProps> = ({
  cost,
  size = 'sm',
  className = '',
}) => {
  const isFree = cost === 0;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
    lg: 'text-sm px-2.5 py-1 gap-1',
  }[size];

  const iconSize = { sm: 9, md: 11, lg: 13 }[size];

  if (isFree) {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full border ${sizeClasses} ${className}`}
        style={{ color: '#16a34a', background: '#f0fdf4', borderColor: '#bbf7d0' }}
      >
        FREE
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizeClasses} ${className}`}
      style={{ color: '#2557a7', background: '#eff6ff', borderColor: '#c7ddf8' }}
    >
      <Zap size={iconSize} className="shrink-0" style={{ color: '#2557a7' }} />
      {cost} cr
    </span>
  );
};
