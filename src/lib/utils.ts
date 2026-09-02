/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 *
 * @example
 * cn('px-2', 'px-4') // => 'px-4'
 * cn('flex', 'flex-col') // => 'flex flex-col'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
