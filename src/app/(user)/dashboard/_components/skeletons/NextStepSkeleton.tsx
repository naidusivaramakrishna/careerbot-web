/**
 * Recommended Next Step Skeleton
 *
 * Loading state for Row 2 (Progress stepper + recommended action)
 */

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export const NextStepSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <Skeleton variant="line" width="30%" height="20px" className="mb-6" />

      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <Skeleton variant="circle" width="40px" height="40px" />
            {step < 5 && (
              <Skeleton variant="line" width="60px" height="2px" className="mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Card */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Skeleton variant="circle" width="48px" height="48px" />
          <div className="flex-1">
            <Skeleton variant="line" width="50%" height="24px" className="mb-2" />
            <Skeleton variant="line" width="80%" height="16px" className="mb-1" />
            <Skeleton variant="line" width="70%" height="16px" className="mb-4" />
            <div className="flex items-center gap-4">
              <Skeleton variant="line" width="100px" height="14px" />
              <Skeleton variant="line" width="100px" height="14px" />
            </div>
          </div>
          <Skeleton variant="rectangle" width="140px" height="44px" />
        </div>
      </div>
    </div>
  );
};
