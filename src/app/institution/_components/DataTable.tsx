'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FOCUS_RING } from './tokens';

/**
 * The table used by every list in this area. This product is mostly tables, so
 * the decisions are deliberate:
 *
 *   - STICKY HEADER. Long rosters run to thousands of rows; a placement officer
 *     scrolling past row 40 must still know which column is which.
 *   - HAIRLINE separation (1px #f1f5f9) rather than boxed borders, plus a hover
 *     tint. Grid lines on every cell fight the data for attention.
 *   - NUMERIC COLUMNS right-aligned + tabular-nums (set by the cell components),
 *     so digits stack and an outlier is visible without reading.
 *   - OWN SCROLL CONTAINER. The table scrolls inside `overflow-x-auto`; the page
 *     body never scrolls sideways, on any viewport.
 *   - A CLICKABLE ROW IS A REAL LINK. When `rowHref` is given the primary cell
 *     renders a Next `<Link>` — one keyboard tab stop with a real href, plus a
 *     chevron and a hover state so the mouse affordance is obvious. The row's
 *     own onClick is a convenience on top of the link, never the only way in.
 */
export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  /** `right` for anything numeric. Default `left`. */
  align?: 'left' | 'right';
  /** e.g. `w-[180px]`. Omit to let the column size to content. */
  width?: string;
  /** Secondary detail — hidden below `lg` so a tablet keeps the key columns. */
  secondary?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Makes rows navigable. The primary (first) cell becomes the link. */
  rowHref?: (row: T) => string;
  /** Accessible name for the table, e.g. "Students". */
  caption: string;
  /** Cap the scroll height so the header can stick. Default `max-h-[65vh]`. */
  maxHeightClass?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  caption,
  maxHeightClass = 'max-h-[65vh]',
  className,
}: DataTableProps<T>) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'overflow-x-auto overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white',
        maxHeightClass,
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5',
                  'text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[#64748b]',
                  col.align === 'right' ? 'text-right' : 'text-left',
                  col.width,
                  col.secondary && 'hidden lg:table-cell',
                )}
              >
                {col.header}
              </th>
            ))}
            {rowHref ? (
              <th scope="col" className="w-10 border-b border-[#e2e8f0] bg-[#f8fafc] px-2">
                <span className="sr-only">Open</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr
                key={rowKey(row)}
                onClick={href ? () => router.push(href) : undefined}
                className={cn(
                  'border-b border-[#f1f5f9] last:border-b-0',
                  'transition-colors duration-150 motion-reduce:transition-none',
                  href && 'cursor-pointer hover:bg-[#f8fafc]',
                )}
              >
                {columns.map((col, colIndex) => {
                  const content = col.render(row);
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-2.5 align-middle text-[13px] text-[#334155]',
                        col.align === 'right' ? 'text-right' : 'text-left',
                        col.secondary && 'hidden lg:table-cell',
                      )}
                    >
                      {href && colIndex === 0 ? (
                        <Link
                          href={href}
                          // The row's onClick already navigates; stop the bubble
                          // so a link click does not fire it twice.
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'rounded-sm font-medium text-[#0f172a] hover:text-[#2557a7] hover:underline',
                            FOCUS_RING,
                          )}
                        >
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
                {href ? (
                  <td className="px-2 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-[#94a3b8]" aria-hidden />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Two-line cell: a primary value with a quieter qualifier beneath it. */
export function StackedCell({
  primary,
  secondary,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-[13px] leading-5">{primary}</span>
      {secondary ? (
        <span className="text-[12px] leading-4 text-[#94a3b8]">{secondary}</span>
      ) : null}
    </span>
  );
}

/** A count or other integer. Tabular so a column of them aligns. */
export function NumberCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return <span className="tabular-nums text-[#94a3b8]">—</span>;
  }
  return <span className="tabular-nums font-medium text-[#0f172a]">{value}</span>;
}

/** A value that may be absent. Renders an em dash, never "null" or blank. */
export function OptionalCell({ value }: { value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-[#94a3b8]">—</span>;
  }
  return <>{value}</>;
}
