import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_RING } from './tokens';

/**
 * A single figure on a control panel.
 *
 * The number is the largest thing in the tile and is tabular, so a row of tiles
 * reads as a row of comparable figures rather than as four unrelated cards.
 * The label sits ABOVE the number (micro-label): the eye lands on the figure
 * first and picks up its name on the way out.
 *
 * `href` turns the whole tile into one link — the fast path from "1,284
 * students" to the roster, which is the CPO's most common move.
 */
export function StatCard({
  label,
  value,
  caption,
  href,
  emphasis = false,
}: {
  label: string;
  value: number | string;
  caption?: string;
  href?: string;
  /** Marks an outlier / attention figure. Uses weight + a rule, not hue alone. */
  emphasis?: boolean;
}) {
  const body = (
    <>
      <span className="text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[#64748b]">
        {label}
      </span>
      <span
        className={cn(
          'mt-2 block text-[26px] font-semibold leading-8 tabular-nums',
          emphasis ? 'text-[#b45309]' : 'text-[#0f172a]',
        )}
      >
        {value}
      </span>
      {caption ? (
        <span className="mt-1 block text-[12px] leading-4 text-[#94a3b8]">{caption}</span>
      ) : null}
    </>
  );

  const base = cn(
    'relative block rounded-xl border bg-white p-4 text-left',
    emphasis ? 'border-amber-200' : 'border-[#e2e8f0]',
    // The emphasis state is also carried by a left rule, so it survives
    // greyscale and colour-blind viewing.
    emphasis && 'before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full before:bg-amber-400',
  );

  if (!href) {
    return <div className={base}>{body}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        'group transition-colors duration-150 hover:border-[#c7d9f5] hover:bg-[#f8fafc] motion-reduce:transition-none',
        FOCUS_RING,
      )}
    >
      {body}
      <ChevronRight
        className="absolute right-3 top-4 h-4 w-4 text-[#cbd5e1] transition-colors duration-150 group-hover:text-[#2557a7] motion-reduce:transition-none"
        aria-hidden
      />
    </Link>
  );
}
