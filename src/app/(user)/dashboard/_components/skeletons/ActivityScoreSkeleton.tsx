/**
 * Activity and Score Summary Skeleton
 *
 * Loading state for Row 4 (Recent Activity + Score Summary panels)
 */

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export const ActivityScoreSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Recent Activity Panel Skeleton */}
      <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton variant="line" width="180px" height="20px" />
          <Skeleton variant="line" width="100px" height="16px" />
        </div>

        <div className="space-y-4">
          {/* Activity Items */}
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
              <Skeleton variant="circle" width="8px" height="8px" className="mt-2" />
              <div className="flex-1">
                <Skeleton variant="line" width="70%" height="16px" className="mb-1" />
                <Skeleton variant="line" width="40%" height="14px" />
              </div>
              <Skeleton variant="line" width="80px" height="14px" />
            </div>
          ))}
        </div>
      </div>

      {/* Score Summary Panel Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <Skeleton variant="line" width="140px" height="20px" className="mb-6" />

        <div className="space-y-6">
          {/* Score Items */}
          {[1, 2, 3].map((score) => (
            <div key={score}>
              <div className="flex items-center justify-between mb-2">
                <Skeleton variant="line" width="100px" height="16px" />
                <Skeleton variant="line" width="60px" height="20px" />
              </div>
              <Skeleton variant="line" width="100%" height="8px" className="rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
