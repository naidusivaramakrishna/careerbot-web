import React from 'react';
import { cn } from '@/lib/utils';

/**
 * The institution area's type scale, as components rather than loose classes,
 * so the five levels stay consistent across a dozen screens. See tokens.ts for
 * the scale and the reasoning.
 */

export function PageTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        'text-[20px] font-semibold leading-7 tracking-[-0.01em] text-[#0f172a]',
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({
  children,
  className,
  as: Tag = 'h2',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
  /** So a <section> can point at its own heading with aria-labelledby.
   *  Without it a card has to repeat its title in an aria-label, and the two
   *  copies drift -- a screen reader then announces a name the sighted user
   *  cannot see. */
  id?: string;
}) {
  return (
    <Tag id={id}
         className={cn('text-[14px] font-semibold leading-5 text-[#0f172a]', className)}>
      {children}
    </Tag>
  );
}

/**
 * Uppercase micro-label. Caps need letter-spacing to stay legible, so the
 * tracking is part of the component and not left to the call site.
 */
export function MicroLabel({
  children,
  className,
  as: Tag = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'legend';
}) {
  return (
    <Tag
      className={cn(
        'text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[#64748b]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[13px] leading-5 text-[#334155]', className)}>{children}</p>;
}

export function Caption({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn('text-[12px] leading-4 text-[#64748b]', className)}>{children}</span>;
}

/**
 * Page header: title, optional one-line description, optional trailing actions.
 * Reserves its own row so the layout does not shift when actions appear after
 * a role/permission check resolves.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <PageTitle>{title}</PageTitle>
        {description ? (
          <p className="mt-1 text-[13px] leading-5 text-[#64748b]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
