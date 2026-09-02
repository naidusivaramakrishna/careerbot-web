import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}

/**
 * Badge Component
 *
 * Small label component for categorizing or highlighting content
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base styles
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        // Variants
        variant === 'default' &&
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        variant === 'secondary' &&
          'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        variant === 'success' &&
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        variant === 'warning' &&
          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        variant === 'destructive' &&
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        className
      )}
      {...props}
    />
  )
);

Badge.displayName = 'Badge';
