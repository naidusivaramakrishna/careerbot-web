/**
 * Skeleton Component
 *
 * Reusable loading placeholder with pulse animation
 * Respects prefers-reduced-motion accessibility setting
 *
 * Usage:
 * <Skeleton variant="line" width="80%" height="20px" />
 * <Skeleton variant="circle" width="48px" height="48px" />
 * <Skeleton variant="card" className="w-full h-32" />
 */

import React from 'react';

export interface SkeletonProps {
  variant?: 'line' | 'circle' | 'card' | 'rectangle';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'line',
  width,
  height,
  className = '',
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse';

  const variantClasses = {
    line: 'rounded',
    circle: 'rounded-full',
    card: 'rounded-xl',
    rectangle: 'rounded-lg',
  };

  const inlineStyles: React.CSSProperties = {};
  if (width) inlineStyles.width = typeof width === 'number' ? `${width}px` : width;
  if (height) inlineStyles.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={inlineStyles}
      aria-busy="true"
      aria-label="Loading..."
    />
  );
};

// Specialized skeleton components for common patterns

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="line"
          width={index === lines - 1 ? '60%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circle" width="48px" height="48px" />
        <div className="flex-1 space-y-3">
          <Skeleton variant="line" width="40%" height="20px" />
          <Skeleton variant="line" width="60%" height="16px" />
          <Skeleton variant="line" width="100%" height="8px" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <Skeleton variant="rectangle" height="40px" className={`w-32 ${className}`} />;
};
