import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The shared Header component's profile dropdown (user name/email, menu
 * items, used by every /dashboard, /profile, /institution, /jobs, etc.
 * layout across the app). Covers the "Tickets" item directly above
 * Settings -- label-only, no description line, aligned the same way as
 * the other single-line items (Settings/Logout).
 */

vi.mock('next/image', () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string; [k: string]: unknown }) =>
    React.createElement('img', { src, alt, ...rest }),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/hooks/useCollegeMembership', () => ({
  useStudentCollege: () => null,
  useCollegeMembershipResolved: () => true,
}));

// The college identity bar (centre slot) isn't what this file covers --
// mocked out the same way HeaderProvidedBy.test.tsx does, since the real
// hook calls usePathname(), which this file's next/navigation mock above
// doesn't provide.
vi.mock('@/hooks/useStudentRecord', () => ({ useStudentRecord: () => ({ status: 'none' }) }));

vi.mock('@/hooks/useCreditsBalance', () => ({
  useCreditsBalance: () => ({ data: null, loading: false }),
}));

vi.mock('@/hooks/useNotificationStream', () => ({
  useNotificationStream: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    remove: vi.fn(),
  }),
}));

vi.mock('@/hooks/useUnreadNotificationsCount', () => ({
  useUnreadNotificationsCount: () => ({ unreadCount: 0, refetch: vi.fn() }),
}));

const mockGetProfile = vi.fn();
const mockGetProfilePicture = vi.fn();
vi.mock('@/api/userApi', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  getProfilePicture: (...args: unknown[]) => mockGetProfilePicture(...args),
}));

vi.mock('@/api/dashboardApi', () => ({
  getDashboardSummary: vi.fn().mockResolvedValue({ user: { name: 'Alice Example', email: 'alice@example.com' } }),
}));

const mockSignOut = vi.fn();
vi.mock('@/api/authApi', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

import Header from '@/components/layout/Header';

const openProfileMenu = async () => {
  render(<Header />);
  fireEvent.click(screen.getByLabelText('User menu'));
  // Menu items render immediately on click; the name/email text lags one
  // tick behind since it depends on the async profile-fetch effect --
  // waiting for a menu item that's always present covers both.
  await screen.findByText('Settings');
};

beforeEach(() => {
  mockPush.mockReset();
  // No `username` -- Header.tsx prefers username over full_name for the
  // displayed name, and this test wants to assert on the full_name value.
  mockGetProfile.mockReset().mockResolvedValue({ email: 'alice@example.com', full_name: 'Alice Example' });
  mockGetProfilePicture.mockReset().mockResolvedValue({ picture_url: null });
  mockSignOut.mockReset().mockResolvedValue(undefined);
});

describe('Header profile dropdown -- Tickets item', () => {
  it('shows Tickets directly above Settings, both above Logout', async () => {
    await openProfileMenu();

    const menuLabels = await screen.findAllByText(/^Tickets$|^Settings$|^Logout$/);
    const order = menuLabels.map((el) => el.textContent);
    const supportIndex = order.findIndex((t) => t === 'Tickets');
    const settingsIndex = order.findIndex((t) => t === 'Settings');
    const logoutIndex = order.findIndex((t) => t === 'Logout');

    expect(supportIndex).toBeGreaterThanOrEqual(0);
    expect(supportIndex).toBeLessThan(settingsIndex);
    expect(settingsIndex).toBeLessThan(logoutIndex);
  });

  it('shows only the label -- no description text underneath', async () => {
    await openProfileMenu();

    expect(await screen.findByText('Tickets')).toBeInTheDocument();
    expect(screen.queryByText('View conversations and support tickets')).not.toBeInTheDocument();
  });

  it('is aligned the same single-line way as Settings, with no leftover multi-line wrapper', async () => {
    await openProfileMenu();

    const supportLink = (await screen.findByText('Tickets')).closest('a') as HTMLElement;
    const settingsLink = (await screen.findByText('Settings')).closest('a') as HTMLElement;
    expect(supportLink.className).toContain('items-center');
    expect(supportLink.className).toBe(settingsLink.className);
    // The label is a direct text child of the link (no wrapping <span>
    // left over from the removed two-line description layout).
    expect(supportLink.querySelector('span')).not.toBeInTheDocument();
  });

  it('links to the existing dashboard Support & History route', async () => {
    await openProfileMenu();

    const link = await screen.findByText('Tickets');
    expect(link.closest('a')).toHaveAttribute('href', '/dashboard/support-history');
  });

  it('closes the dropdown when clicked', async () => {
    await openProfileMenu();
    const link = await screen.findByText('Tickets');

    fireEvent.click(link);

    await waitFor(() => {
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  it('does not disturb Settings or Logout -- both still present and functional', async () => {
    await openProfileMenu();

    const settingsLink = (await screen.findByText('Settings')).closest('a');
    expect(settingsLink).toHaveAttribute('href', '/settings');

    const logoutButton = screen.getByText('Logout').closest('button') as HTMLElement;
    fireEvent.click(logoutButton);
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  });

  it('shows the user name and email above the menu items', async () => {
    await openProfileMenu();

    const menu = (await screen.findByText('Tickets')).closest('div.absolute') as HTMLElement;
    expect(within(menu).getByText('Alice Example')).toBeInTheDocument();
    expect(within(menu).getByText('alice@example.com')).toBeInTheDocument();
  });
});
