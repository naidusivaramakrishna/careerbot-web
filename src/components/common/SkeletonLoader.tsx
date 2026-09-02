'use client';

import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'text',
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 to-gray-100';

  switch (variant) {
    case 'circle':
      return (
        <div
          className={`${baseClasses} rounded-full ${className}`}
        />
      );
    case 'card':
      return (
        <div className={`${baseClasses} rounded-lg ${className}`} />
      );
    case 'text':
    default:
      return (
        <div
          className={`${baseClasses} rounded ${className}`}
        />
      );
  }
};

export const CheckoutSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Order Summary Skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <SkeletonLoader className="h-8 w-32" />
        <div className="space-y-3 pb-6 border-b border-gray-200">
          <div className="flex justify-between">
            <SkeletonLoader className="h-5 w-32" />
            <SkeletonLoader className="h-5 w-20" />
          </div>
          <div className="flex justify-between">
            <SkeletonLoader className="h-5 w-24" />
            <SkeletonLoader className="h-5 w-32" />
          </div>
        </div>

        <div className="flex justify-between mb-6">
          <SkeletonLoader className="h-6 w-32" />
          <SkeletonLoader className="h-8 w-32" />
        </div>

        <SkeletonLoader className="h-32 w-full rounded-lg" />
        <SkeletonLoader className="h-10 w-full rounded-lg" />
      </div>

      {/* Back Button Skeleton */}
      <SkeletonLoader className="h-10 w-full rounded-lg" />
    </div>
  );
};

export const PricingCardSkeleton: React.FC = () => {
  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <SkeletonLoader className="h-8 w-32" />
      <SkeletonLoader className="h-5 w-full" />
      <SkeletonLoader className="h-5 w-20" />
      <SkeletonLoader className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <SkeletonLoader key={i} className="h-4 w-full" />
          ))}
      </div>
    </div>
  );
};

export const SubscriptionSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Card Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <SkeletonLoader className="h-5 w-24" />
            <SkeletonLoader className="h-7 w-32" />
          </div>
          <SkeletonLoader className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Credits Bar Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <SkeletonLoader className="h-5 w-32" />
        <SkeletonLoader className="h-2 w-full rounded-full" />
        <SkeletonLoader className="h-4 w-16" />
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-3">
        <SkeletonLoader className="h-12 flex-1 rounded-lg" />
        <SkeletonLoader className="h-12 flex-1 rounded-lg" />
      </div>
    </div>
  );
};
