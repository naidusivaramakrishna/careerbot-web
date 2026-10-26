/**
 * G6: what a student whose college switched features off actually sees --
 * the menu without them, and a plain message on the page if they get there.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => nav.pathname,
}));
vi.mock('@/api/resumeApi', () => ({ getAllResumesUnified: vi.fn(), getAllResumes: vi.fn() }));
vi.mock('@/api/enhancerApi', () => ({ getEnhancementHistory: vi.fn() }));
vi.mock('@/contexts/DashboardContext', () => ({ useDashboard: () => ({ data: null }) }));

const who = vi.hoisted(() => ({
  hasCollege: true,
  studentCollege: { id: 'vit', name: 'VIT Chennai' } as null | { id: string; name: string },
}));
vi.mock('@/hooks/useCollegeMembership', () => ({
  useHasCollegeMembership: () => who.hasCollege,
  useStudentCollege: () => who.studentCollege,
}));

const api = vi.hoisted(() => ({ getMyFeatureAccess: vi.fn() }));
vi.mock('@/api/institutionApi', () => api);

import Sidebar from '@/components/layout/Sidebar';
import CollegeFeatureGate from '@/components/college/CollegeFeatureGate';
import { __resetCollegeFeatureAccessCache } from '@/hooks/useCollegeFeatureAccess';
import { notifyCollegeFeatureRefused } from '@/lib/collegeFeatures';
import { announceAccountChanged } from '@/lib/accountChange';

const shown = (label: string) => screen.queryAllByText(label, { exact: true }).length > 0;

beforeEach(() => {
  __resetCollegeFeatureAccessCache();
  api.getMyFeatureAccess.mockReset();
  nav.pathname = '/dashboard';
  who.hasCollege = true;
  who.studentCollege = { id: 'vit', name: 'VIT Chennai' };
});

describe('Sidebar', () => {
  it('a student does not see what their college switched off', async () => {
    api.getMyFeatureAccess.mockResolvedValue(['mock_test', 'mock_interview']);
    render(<Sidebar />);
    await waitFor(() => expect(shown('Mock Test')).toBe(false));
    expect(shown('Mock Interview')).toBe(false);
    expect(shown('Interview Notes')).toBe(false);
    expect(shown('Communication')).toBe(true);
    expect(shown('Coding Practice')).toBe(true);
    expect(shown('YOUR COLLEGE SEES THESE')).toBe(true);
  });

  it('every watched tool off: the group goes, the rest stays', async () => {
    api.getMyFeatureAccess.mockResolvedValue([
      'mock_test', 'mock_interview', 'coding_test', 'english_assessment',
    ]);
    render(<Sidebar />);
    await waitFor(() => expect(shown('YOUR COLLEGE SEES THESE')).toBe(false));
    expect(shown('YOUR OWN')).toBe(true);
    expect(shown('VIT Chennai')).toBe(true);
  });

  it('a jobseeker never asks', () => {
    who.hasCollege = false;
    who.studentCollege = null;
    render(<Sidebar />);
    expect(api.getMyFeatureAccess).not.toHaveBeenCalled();
    expect(shown('Mock Test')).toBe(true);
  });

  it('the lookup failing hides nothing', async () => {
    api.getMyFeatureAccess.mockRejectedValue(new Error('down'));
    render(<Sidebar />);
    await waitFor(() => expect(api.getMyFeatureAccess).toHaveBeenCalled());
    expect(shown('Mock Test')).toBe(true);
    expect(shown('Mock Interview')).toBe(true);
  });

  it('an API refusal hides the item straight away', async () => {
    api.getMyFeatureAccess.mockResolvedValue([]);
    render(<Sidebar />);
    await waitFor(() => expect(api.getMyFeatureAccess).toHaveBeenCalled());
    expect(shown('Coding Practice')).toBe(true);
    act(() => notifyCollegeFeatureRefused('coding_test'));
    await waitFor(() => expect(shown('Coding Practice')).toBe(false));
  });
});

describe('account change', () => {
  it('the previous account\'s switches are forgotten on sign-out / switch', async () => {
    api.getMyFeatureAccess.mockResolvedValue(['mock_test']);
    const first = render(<Sidebar />);
    await waitFor(() => expect(shown('Mock Test')).toBe(false));
    first.unmount();
    act(() => announceAccountChanged());
    who.hasCollege = false;
    who.studentCollege = null;
    render(<Sidebar />);
    expect(shown('Mock Test')).toBe(true);
  });
});

describe('CollegeFeatureGate', () => {
  const page = <p>engine page</p>;

  it('a switched-off engine page shows the message instead', async () => {
    nav.pathname = '/mock-test/company/tcs';
    api.getMyFeatureAccess.mockResolvedValue(['mock_test']);
    render(<CollegeFeatureGate feature="mock_test">{page}</CollegeFeatureGate>);
    await waitFor(() => expect(screen.getByText('Mock Test is not available')).toBeTruthy());
    expect(screen.queryByText('engine page')).toBeNull();
    expect(screen.getByRole('link', { name: 'Go to my college' }).getAttribute('href')).toBe('/institution');
  });

  it('a feature that is on renders the page', async () => {
    nav.pathname = '/mock-test/company/tcs';
    api.getMyFeatureAccess.mockResolvedValue(['coding_test']);
    render(<CollegeFeatureGate feature="mock_test">{page}</CollegeFeatureGate>);
    await waitFor(() => expect(api.getMyFeatureAccess).toHaveBeenCalled());
    expect(screen.getByText('engine page')).toBeTruthy();
  });

  it('past results stay readable and do not even ask', () => {
    nav.pathname = '/mock-test/history';
    api.getMyFeatureAccess.mockResolvedValue(['mock_test']);
    render(<CollegeFeatureGate feature="mock_test">{page}</CollegeFeatureGate>);
    expect(screen.getByText('engine page')).toBeTruthy();
    expect(api.getMyFeatureAccess).not.toHaveBeenCalled();
  });
});
