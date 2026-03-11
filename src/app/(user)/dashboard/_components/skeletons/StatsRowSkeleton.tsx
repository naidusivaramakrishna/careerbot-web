/**
 * Stats Row Skeleton
 *
 * Loading state for Row 1 (Plan Status, Credit Balance, Profile Completeness cards)
 */

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export const StatsRowSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {/* Plan Status Card Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Skeleton variant="line" width="40%" height="16px" className="mb-2" />
            <Skeleton variant="line" width="60%" height="24px" className="mb-1" />
            <Skeleton variant="line" width="50%" height="14px" />
          </div>
        </div>
        <Skeleton variant="rectangle" width="100%" height="40px" className="mt-4" />
      </div>

      {/* Credit Balance Card Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Skeleton variant="line" width="40%" height="16px" className="mb-3" />
        <div className="flex items-center justify-between mb-2">
          <Skeleton variant="line" width="30%" height="28px" />
          <Skeleton variant="line" width="25%" height="16px" />
        </div>
        <Skeleton variant="line" width="100%" height="8px" className="rounded-full" />
      </div>

      {/* Profile Completeness Card Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Skeleton variant="line" width="50%" height="16px" className="mb-4" />
        <div className="flex items-center gap-6">
          <Skeleton variant="circle" width="80px" height="80px" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="line" width="70%" height="14px" />
            <Skeleton variant="line" width="60%" height="14px" />
            <Skeleton variant="line" width="50%" height="14px" />
          </div>
        </div>
      </div>
    </div>
  );
};
