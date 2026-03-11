/**
 * Quick Action Card
 *
 * Individual feature card in Quick Actions grid
 * Shows icon, label, cost, and usage count
 */

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Sparkles,
  Target,
  Briefcase,
  Mic,
  ClipboardList,
  Crown,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  Search,
  Sparkles,
  Target,
  Briefcase,
  Mic,
  ClipboardList,
  Crown,
};

export interface QuickActionCardProps {
  id: string;
  label: string;
  description: string;
  icon: string;
  cost: number;
  costType: 'credits' | 'free';
  usageCount?: number;
  path: string;
  badge?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  label,
  description,
  icon,
  cost,
  costType,
  usageCount,
  path,
  badge,
}) => {
  const Icon = ICON_MAP[icon] || FileText;
  const displayCount = usageCount !== undefined ? usageCount.toString() : '--';

  return (
    <Link href={path}>
      <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer relative overflow-hidden">
        {/* Badge */}
        {badge && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-[#2200FF] to-[#1800B3] text-white text-xs font-semibold px-2 py-1 rounded-full">
            {badge}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col items-center text-center gap-3">
          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <Icon className="w-7 h-7 text-blue-600" />
          </div>

          {/* Label */}
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {label}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-500 line-clamp-2">{description}</p>

          {/* Cost */}
          <div className="flex items-center gap-2 text-sm">
            {costType === 'free' ? (
              <span className="text-green-600 font-medium">FREE</span>
            ) : (
              <span className="text-blue-600 font-medium">💎 {cost} credits</span>
            )}
          </div>

          {/* Usage Count */}
          {usageCount !== undefined && (
            <div className="text-xs text-gray-500">
              Used: <span className="font-semibold text-gray-700">{displayCount}</span>
            </div>
          )}
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </Link>
  );
};
