import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button Component
 *
 * Versatile button with support for multiple variants and sizes
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', style, ...props }, ref) => {
    let buttonStyle = { ...style };

    if (variant === 'default') {
      buttonStyle = {
        ...buttonStyle,
        backgroundColor: '#2557a7',
      };
    } else if (variant === 'link') {
      buttonStyle = {
        ...buttonStyle,
        color: '#2557a7',
      };
    }

    return (
      <button
        ref={ref}
        style={buttonStyle}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-colors rounded-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'default' &&
            'text-white hover:opacity-90 focus-visible:ring-offset-2',
          variant === 'secondary' &&
            'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
          variant === 'destructive' &&
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
          variant === 'outline' &&
            'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
          variant === 'ghost' &&
            'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800',
          variant === 'link' &&
            'underline-offset-4 hover:underline dark:text-blue-400',
          // Sizes
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
