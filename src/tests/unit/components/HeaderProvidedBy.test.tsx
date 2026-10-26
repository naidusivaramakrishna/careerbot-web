/**
 * "Provided by <college>" replaces the plan/credits panel for a STUDENT
 * (spec: student section). Staff and jobseekers keep the plan panel.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img src={props.src as string} alt={props.alt as string} />,
}));
vi.mock('@/hooks/useCreditsBalance', () => ({
  useCreditsBalance: () => ({
    data: { plan_id: 'FREE', plan_name: 'Free', credits_remaining: 200, credits_total: 200 },
    loading: false,
  }),
}));
vi.mock('@/hooks/useUnreadNotificationsCount', () => ({
  useUnreadNotificationsCount: () => ({ unreadCount: 0, refetch: vi.fn() }),
}));
vi.mock('@/hooks/useNotificationStream', () => ({
  useNotificationStream: () => ({
    notifications: [], unreadCount: 0, markAsRead: vi.fn(), markAllAsRead: vi.fn(), remove: vi.fn(),
  }),
}));
vi.mock('@/api/userApi', () => ({ getProfile: vi.fn(() => new Promise(() => {})), getProfilePicture: vi.fn() }));
vi.mock('@/api/dashboardApi', () => ({ getDashboardSummary: vi.fn(() => new Promise(() => {})) }));
vi.mock('@/api/authApi', () => ({ signOut: vi.fn(), refreshAccessToken: vi.fn() }));
vi.mock('@/api/adminAuthApi', () => ({ refreshAdminToken: vi.fn() }));
vi.mock('@/lib/logger', () => {
  const l = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return { default: l, logger: l };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let studentCollege: { id: string; name: string } | null = null;
vi.mock('@/hooks/useCollegeMembership', () => ({
  useStudentCollege: () => studentCollege,
  useHasCollegeMembership: () => studentCollege !== null,
  useCollegeMembershipResolved: () => membershipResolved,
}));
let membershipResolved = true;

import Header from '@/components/layout/Header';

beforeEach(() => { studentCollege = null; membershipResolved = true; });

describe('Header plan panel', () => {
  it('a student sees "Provided by <college>" and no plan/credits link', () => {
    studentCollege = { id: 'vit', name: 'VIT Chennai' };
    const { container } = render(<Header />);
    expect(screen.getByTestId('provided-by-college')).toHaveTextContent('Provided by VIT Chennai');
    expect(screen.getByTestId('provided-by-college')).toHaveAttribute('href', '/institution');
    expect(container.querySelector('a[href="/payments"]')).toBeNull();
    expect(screen.queryByText(/credits/i)).not.toBeInTheDocument();
  });

  it('anyone else (jobseeker or staff) keeps the plan and credits panel', () => {
    studentCollege = null;
    const { container } = render(<Header />);
    expect(screen.queryByTestId('provided-by-college')).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/payments"]')).not.toBeNull();
    expect(screen.getByText(/credits/i)).toBeInTheDocument();
  });

  it('before the membership answer arrives: skeleton, neither panel', () => {
    membershipResolved = false;
    const { container } = render(<Header />);
    expect(screen.queryByTestId('provided-by-college')).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/payments"]')).toBeNull();
  });
});
