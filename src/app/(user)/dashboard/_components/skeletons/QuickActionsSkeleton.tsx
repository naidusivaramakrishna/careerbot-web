/**
 * Quick Actions Grid Skeleton
 *
 * Loading state for Row 3 (8 feature cards)
 */

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export const QuickActionsSkeleton: React.FC = () => {
  return (
    <div>
      <Skeleton variant="line" width="200px" height="24px" className="mb-6" />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <Skeleton variant="circle" width="48px" height="48px" />
              <Skeleton variant="line" width="80%" height="18px" />
              <Skeleton variant="line" width="60%" height="16px" />
              <Skeleton variant="line" width="50%" height="14px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
