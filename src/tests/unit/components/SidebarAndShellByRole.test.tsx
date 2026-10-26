/**
 * The rendered Sidebar and InstitutionShell for each kind of account:
 *  - student:   college group first, YOUR COLLEGE SEES THESE, YOUR OWN; the
 *               college area mounts the main Sidebar, offset banner included.
 *  - staff:     today's groups + appended "My College"; the college rail.
 *  - jobseeker: today's groups only.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => nav.pathname,
}));
vi.mock('@/api/resumeApi', () => ({ getAllResumesUnified: vi.fn(), getAllResumes: vi.fn() }));
vi.mock('@/api/enhancerApi', () => ({ getEnhancementHistory: vi.fn() }));
vi.mock('@/contexts/DashboardContext', () => ({ useDashboard: () => ({ data: null }) }));

const who = vi.hoisted(() => ({
  hasCollege: false,
  studentCollege: null as null | { id: string; name: string },
}));
vi.mock('@/hooks/useCollegeMembership', () => ({
  useHasCollegeMembership: () => who.hasCollege,
  useStudentCollege: () => who.studentCollege,
}));

import Sidebar from '@/components/layout/Sidebar';

const textOf = (label: string) => screen.queryAllByText(label, { exact: true }).length > 0;

beforeEach(() => {
  nav.pathname = '/dashboard';
  who.hasCollege = false;
  who.studentCollege = null;
});

describe('Sidebar by role', () => {
  it('student: college first, then the watched tools, then YOUR OWN; no staff link', () => {
    who.hasCollege = true;
    who.studentCollege = { id: 'vit', name: 'VIT Chennai' };
    render(<Sidebar />);
    expect(textOf('VIT Chennai')).toBe(true);
    expect(textOf('YOUR COLLEGE SEES THESE')).toBe(true);
    expect(textOf('YOUR OWN')).toBe(true);
    expect(textOf('PREPARE')).toBe(false);
    expect(textOf('My College')).toBe(false);
    expect(textOf('Tasks')).toBe(true);
    expect(textOf('My people')).toBe(true);
  });

  it('staff: today\'s groups plus the appended "My College"', () => {
    who.hasCollege = true;
    render(<Sidebar />);
    expect(textOf('PREPARE')).toBe(true);
    expect(textOf('My College')).toBe(true);
    expect(textOf('YOUR COLLEGE SEES THESE')).toBe(false);
    expect(textOf('YOUR OWN')).toBe(false);
  });

  it('jobseeker: today\'s groups only', () => {
    render(<Sidebar />);
    expect(textOf('PREPARE')).toBe(true);
    expect(textOf('My College')).toBe(false);
    expect(textOf('YOUR OWN')).toBe(false);
  });
});

describe('InstitutionShell by role', () => {
  const ctx = vi.hoisted(() => ({ role: 'student' as string, readOnlyReason: null as null | string }));

  beforeEach(() => {
    vi.resetModules();
    ctx.role = 'student';
    ctx.readOnlyReason = null;
  });

  async function renderShell() {
    vi.doMock('@/contexts/InstitutionContext', () => ({ useInstitution: () => ctx }));
    vi.doMock('@/components/layout/Header', () => ({ default: () => <div data-testid="app-header" /> }));
    vi.doMock('@/components/layout/Sidebar', () => ({ default: () => <nav data-testid="app-sidebar" /> }));
    vi.doMock('@/contexts/DashboardContext', () => ({
      useDashboard: () => ({ data: null }),
      DashboardProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dashboard-provider">{children}</div>
      ),
    }));
    vi.doMock('@/app/institution/_components/CollegeSwitcher', () => ({ CollegeSwitcher: () => <div /> }));
    vi.doMock('@/app/institution/_components/PausedBanner', () => ({
      PausedBanner: () => <div data-testid="paused-banner" />,
    }));
    const { InstitutionShell } = await import('@/app/institution/_components/InstitutionShell');
    return render(<InstitutionShell><p>page</p></InstitutionShell>);
  }

  it('student: the main Sidebar, and the whole area (banner too) offset by its width', async () => {
    ctx.readOnlyReason = 'paused';
    await renderShell();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'College navigation' })).toBeNull();
    const banner = screen.getByTestId('paused-banner');
    const area = banner.parentElement as HTMLElement;
    expect(area.style.marginLeft).toBe('var(--sidebar-width, 64px)');
    expect(within(area).getByText('page')).toBeInTheDocument();
  });

  it('student: the Sidebar gets dashboard state (its completeness badge is not a stuck 0%)', async () => {
    await renderShell();
    expect(within(screen.getByTestId('dashboard-provider')).getByTestId('app-sidebar')).toBeInTheDocument();
  });

  it('faculty: the college rail as today, no main Sidebar, no offset', async () => {
    ctx.role = 'faculty';
    await renderShell();
    expect(screen.queryByTestId('app-sidebar')).toBeNull();
    expect(screen.queryByTestId('dashboard-provider')).toBeNull(); // no dashboard fetch for staff
    expect(screen.getAllByRole('navigation', { name: 'College navigation' }).length).toBeGreaterThan(0);
    const area = screen.getByText('page').closest('div[style]') as HTMLElement;
    expect(area.style.marginLeft).toBe('');
  });
});
