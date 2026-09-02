'use client';

import { CSSProperties, ReactNode } from 'react';

/**
 * The navy/violet highlight strip that sits at the bottom of every main
 * section-intro card on the mock-test surface. Wraps anything — we use it
 * for "1 Score = 1 Point", quick-stats rows, summary lines, etc.
 *
 * Default recipe: #EFF6FF bg, #BFDBFE border, rounded-xl, padding 5/4.
 * Pass `tone` to switch to success / warning palettes while keeping the
 * same shape, so every page reads as one design language.
 */
export type HighlightTone = 'neutral' | 'success' | 'warning';

const PALETTE: Record<HighlightTone, { bg: string; border: string }> = {
  neutral: { bg: '#EFF6FF', border: '#BFDBFE' },
  success: { bg: '#ECFDF5', border: '#A7F3D0' },
  warning: { bg: '#FFFBEB', border: '#FDE68A' },
};

export default function HighlightBox({
  children,
  tone = 'neutral',
  className = '',
  style,
}: {
  children: ReactNode;
  tone?: HighlightTone;
  className?: string;
  style?: CSSProperties;
}) {
  const { bg, border } = PALETTE[tone];
  return (
    <div
      className={`rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap ${className}`}
      style={{ background: bg, border: `1px solid ${border}`, ...style }}
    >
      {children}
    </div>
  );
}
