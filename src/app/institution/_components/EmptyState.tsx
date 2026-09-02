import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Empty states.
 *
 * Every empty result in this area is a designed moment with its own copy: it
 * says what this screen is FOR, why it is empty, and who fills it. It is never
 * a spinner that never resolves and never the word "null".
 *
 * Deliberately restrained — a small tinted glyph, a sentence, and at most one
 * action. No illustration: this is a working tool, and a placement officer
 * meets these screens daily.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-white px-6 py-12 text-center',
        className,
      )}
    >
      <span
        className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef4ff]"
        aria-hidden
      >
        <Icon className="h-[18px] w-[18px] text-[#2557a7]" aria-hidden />
      </span>
      <p className="text-[14px] font-semibold leading-5 text-[#0f172a]">{title}</p>
      <p className="mt-1.5 max-w-[46ch] text-[13px] leading-5 text-[#64748b]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
