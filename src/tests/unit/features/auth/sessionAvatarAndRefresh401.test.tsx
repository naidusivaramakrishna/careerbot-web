/**
 * PR #227 ai-review (da27bab1):
 *
 * P1 -- Header: the avatar fetch lost its try/catch. getProfilePicture now
 * returns null only for 404 and still throws on 401/500/network errors, so
 * fetchProfile() rejected before setProfilePicUrl ran and the photo already on
 * screen (e.g. the previous account's) stayed. Every path must set the avatar.
 *
 * P2 -- useTokenRefresh: a 401 from the refresh call ran the USER
 * session-expired redirect, also on admin routes. The http.ts interceptor
 * already owns refresh-401s: it clears the tokens and sends admins to
 * /admin/login and users to the login page, and it deliberately does NOT
 * redirect a non-definitive 401 right after sign-in or while signing out.
 * The hook's redirect overrode both (admins landed on the user login; a
 * transient 401 logged the user out instead of retrying a minute later).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, renderHook } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: Record<string, unknown>) => <img src={props.src as string} alt={props.alt as string} />,
}));
vi.mock('@/hooks/useCreditsBalance', () => ({ useCreditsBalance: () => ({ data: null, loading: false }) }));
vi.mock('@/hooks/useUnreadNotificationsCount', () => ({
  useUnreadNotificationsCount: () => ({ unreadCount: 0, refetch: vi.fn() }),
}));
vi.mock('@/hooks/useNotificationStream', () => ({
  useNotificationStream: () => ({
    notifications: [], unreadCount: 0, markAsRead: vi.fn(), markAllAsRead: vi.fn(), remove: vi.fn(),
  }),
}));
const { mockGetProfile, mockGetProfilePicture, mockGetSummary, mockRefreshUser, mockRefreshAdmin } = vi.hoisted(() => ({
  mockGetProfile: vi.fn(), mockGetProfilePicture: vi.fn(), mockGetSummary: vi.fn(),
  mockRefreshUser: vi.fn(), mockRefreshAdmin: vi.fn(),
}));
vi.mock('@/api/userApi', () => ({
  getProfile: (...a: unknown[]) => mockGetProfile(...a),
  getProfilePicture: (...a: unknown[]) => mockGetProfilePicture(...a),
}));
vi.mock('@/api/dashboardApi', () => ({ getDashboardSummary: (...a: unknown[]) => mockGetSummary(...a) }));
vi.mock('@/api/authApi', () => ({ signOut: vi.fn(), refreshAccessToken: (...a: unknown[]) => mockRefreshUser(...a) }));
vi.mock('@/api/adminAuthApi', () => ({ refreshAdminToken: (...a: unknown[]) => mockRefreshAdmin(...a) }));
vi.mock('@/lib/logger', () => {
  const l = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return { default: l, logger: l };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Header from '@/components/layout/Header';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';

const unauthorized = () => Object.assign(new Error('401'), { response: { status: 401 } });

describe('Header avatar', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('clears an avatar already on screen when the photo fetch fails', async () => {
    let releaseIdentity: () => void = () => {};
    const identity = new Promise<void>((r) => { releaseIdentity = r; });
    mockGetProfile.mockImplementation(() => identity.then(() => ({ id: 'u2', email: 'b@example.com' })));
    mockGetSummary.mockImplementation(() => identity.then(() => ({ user: { id: 'u2', email: 'b@example.com' } })));
    mockGetProfilePicture.mockRejectedValue(Object.assign(new Error('500'), { response: { status: 500 } }));

    render(<Header />);
    act(() => {
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: { profilePicUrl: 'http://x/previous.png' } }));
    });
    expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'http://x/previous.png');

    await act(async () => { releaseIdentity(); });
    await waitFor(() => expect(mockGetProfilePicture).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByAltText('Profile')).toBeNull());
  });

  it('shows the photo when the fetch succeeds (control)', async () => {
    mockGetProfile.mockResolvedValue({ id: 'u2', email: 'b@example.com' });
    mockGetSummary.mockResolvedValue({ user: { id: 'u2', email: 'b@example.com' } });
    mockGetProfilePicture.mockResolvedValue({ picture_url: 'http://x/mine.png' });
    render(<Header />);
    await waitFor(() => expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'http://x/mine.png'));
  });
});

describe('useTokenRefresh on a refresh 401', () => {
  const originalLocation = window.location;
  const location = { href: 'http://localhost/start' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshUser.mockReset();
    mockRefreshAdmin.mockReset();
    vi.useFakeTimers();
    window.localStorage.clear();
    // Due for a refresh on mount: refreshed an hour ago with a 30-minute token.
    window.localStorage.setItem('token_last_refreshed_at', String(Date.now() - 60 * 60 * 1000));
    location.href = 'http://localhost/start';
    Object.defineProperty(window, 'location', { value: location, configurable: true, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'location', { value: originalLocation, configurable: true, writable: true });
  });

  it('does not send an admin to the user login page', async () => {
    mockRefreshAdmin.mockRejectedValue(unauthorized());
    const { unmount } = renderHook(() => useTokenRefresh(true, undefined, '/admin/dashboard'));
    await act(async () => { await Promise.resolve(); });
    expect(mockRefreshAdmin).toHaveBeenCalledTimes(1);
    expect(location.href).not.toContain('showLogin=true');
    unmount();
  });

  it('retries a user refresh after a 401 the interceptor did not act on, instead of logging out', async () => {
    mockRefreshUser.mockRejectedValueOnce(unauthorized()).mockResolvedValueOnce({});
    const { unmount } = renderHook(() => useTokenRefresh(true, undefined, '/dashboard'));
    await act(async () => { await Promise.resolve(); });
    expect(location.href).not.toContain('showLogin=true');
    await act(async () => { await vi.advanceTimersByTimeAsync(60 * 1000); });
    expect(mockRefreshUser).toHaveBeenCalledTimes(2);
    expect(location.href).not.toContain('showLogin=true');
    unmount();
  });

  it('logs the user out after every retry fails (control)', async () => {
    mockRefreshUser.mockRejectedValue(new Error('network'));
    const { unmount } = renderHook(() => useTokenRefresh(true, undefined, '/dashboard'));
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2 * 60 * 1000); });
    expect(mockRefreshUser).toHaveBeenCalledTimes(3);
    expect(location.href).toContain('showLogin=true');
    unmount();
  });
});
