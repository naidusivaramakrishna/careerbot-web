'use client';

import { useRouter } from 'next/navigation';

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Optional route to push when the crumb is clicked. The last item should
   *  usually omit this (current page). */
  href?: string;
}

/**
 * Shared breadcrumb for the mock-test surface.
 * Matches the section-intro DNA:
 *  - Non-current crumbs: #64748B, hover:underline
 *  - Separator '›' in #CBD5E1
 *  - Current crumb: font-semibold #0F172A
 */
export default function PageBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const router = useRouter();
  return (
    <div className="mb-6 text-sm flex items-center gap-2 flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <button
                onClick={() => router.push(item.href!)}
                style={{ color: '#64748B' }}
                className="hover:underline"
              >
                {item.label}
              </button>
            ) : (
              <span
                className={isLast ? 'font-semibold' : ''}
                style={{ color: isLast ? '#0F172A' : '#64748B' }}
              >
                {item.label}
              </span>
            )}
            {!isLast && <span style={{ color: '#CBD5E1' }}>›</span>}
          </span>
        );
      })}
    </div>
  );
}
