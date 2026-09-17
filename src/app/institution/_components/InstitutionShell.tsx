'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useInstitution } from '@/contexts/InstitutionContext';
import { CollegeSwitcher } from './CollegeSwitcher';
import { PausedBanner } from './PausedBanner';
import { isNavItemActive, navGroupsForRole } from './nav';
import { FOCUS_RING } from './tokens';

/**
 * App shell for the college area.
 *
 * Reuses the product's global `Header` so the account menu, notifications and
 * branding are exactly where the user left them. It does NOT mount the global
 * `Sidebar`: that rail is the jobseeker's tools (resume builder, job match),
 * which are not this job, and two nav columns would be worse than one. Instead
 * the area gets its own rail in the same visual language — same 240px width,
 * same solid `#2557a7` active pill with its glow, same 12px medium labels.
 *
 * A STUDENT gets no rail at all. They have one screen about one person; a
 * navigation column with a single item is furniture, not navigation.
 */
export function InstitutionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, readOnlyReason } = useInstitution();

  const groups = role ? navGroupsForRole(role) : [];
  // One item total = nothing to navigate between (the student case).
  const showRail = groups.reduce((n, g) => n + g.items.length, 0) > 1;

  return (
    <>
      <Header />
      <div className="flex min-h-screen flex-col pt-14" style={{ backgroundColor: '#eef2fb' }}>
        {readOnlyReason ? <PausedBanner reason={readOnlyReason} /> : null}

        <div className="flex flex-1 items-stretch">
          {showRail ? (
            <nav
              aria-label="College navigation"
              className="hidden w-[232px] shrink-0 flex-col border-r border-[#e2e8f0] bg-white px-3 py-3 md:flex"
            >
              <div className="mb-3">
                <CollegeSwitcher />
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-[#94a3b8]">
                      {group.label}
                    </p>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = isNavItemActive(item, pathname);
                        const Icon = item.icon;
                        return (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium',
                                'transition-colors duration-150 motion-reduce:transition-none',
                                active
                                  ? 'text-white'
                                  : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#2557a7]',
                                FOCUS_RING,
                              )}
                              style={
                                active
                                  ? {
                                      background: '#2557a7',
                                      boxShadow:
                                        '0 4px 16px rgba(37,87,167,0.28), inset 0 1px 0 rgba(255,255,255,0.12)',
                                    }
                                  : undefined
                              }
                            >
                              <Icon
                                className={cn(
                                  'h-[15px] w-[15px] shrink-0',
                                  active ? 'text-white' : 'text-[#64748b]',
                                )}
                                aria-hidden
                              />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard"
                className={cn(
                  'mt-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#64748b]',
                  'transition-colors duration-150 hover:bg-[#f8fafc] hover:text-[#2557a7] motion-reduce:transition-none',
                  FOCUS_RING,
                )}
              >
                <ArrowLeft className="h-[15px] w-[15px] shrink-0" aria-hidden />
                Back to CareerBOT
              </Link>
            </nav>
          ) : null}

          <main className="min-w-0 flex-1 px-4 py-5 lg:px-6">
            {/* Below `md` the rail is hidden, so the college identity and the
                same links move inline. The active college must never be
                off-screen, and navigation must never simply disappear on a
                narrower window. */}
            <div className={cn('mb-4 space-y-3', showRail && 'md:hidden')}>
              <CollegeSwitcher />
              {showRail ? (
                <nav aria-label="College navigation" className="-mx-4 overflow-x-auto px-4">
                  <ul className="flex w-max items-center gap-1.5">
                    {groups
                      .flatMap((group) => group.items)
                      .map((item) => {
                        const active = isNavItemActive(item, pathname);
                        const Icon = item.icon;
                        return (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12px] font-medium',
                                'transition-colors duration-150 motion-reduce:transition-none',
                                active
                                  ? 'border-transparent bg-[#2557a7] text-white'
                                  : 'border-[#e2e8f0] bg-white text-[#475569] hover:text-[#2557a7]',
                                FOCUS_RING,
                              )}
                            >
                              <Icon className="h-[14px] w-[14px] shrink-0" aria-hidden />
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </nav>
              ) : null}
            </div>
            <div className="mx-auto w-full max-w-[1280px]">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
