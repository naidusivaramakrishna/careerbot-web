'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Wrapper for a control that is disabled because the college is read-only.
 *
 * A control that VANISHES reads as a bug — the user hunts for the button they
 * used yesterday. A control that is visibly disabled and says why reads as a
 * state. So write affordances stay on screen, dimmed, and explain themselves on
 * hover and on keyboard focus.
 *
 * The caller still passes `disabled` to the control itself; this only supplies
 * the explanation. The hint is also rendered for screen readers, since a
 * visually-hidden reason is no reason at all.
 */
export function WriteGuard({
  hint,
  active,
  children,
  className,
}: {
  /** Why the control is disabled. Omitted when `active` is false. */
  hint: string;
  /** True when the guard applies. False renders children untouched. */
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (!active) return <>{children}</>;

  return (
    <span className={cn('group/guard relative inline-flex', className)}>
      <span className="pointer-events-none opacity-60">{children}</span>
      <span className="sr-only">{hint}</span>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max max-w-[260px] -translate-x-1/2',
          'rounded-md bg-[#0f172a] px-2.5 py-1.5 text-[12px] leading-4 text-white shadow-lg',
          'opacity-0 transition-opacity duration-150 motion-reduce:transition-none',
          'group-hover/guard:opacity-100 group-focus-within/guard:opacity-100',
        )}
      >
        {hint}
      </span>
    </span>
  );
}
