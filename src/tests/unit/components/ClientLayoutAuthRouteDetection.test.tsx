import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mocks ──────────────────────────────────────────────────────────────────
// Bug: jobmatch/jobs/communication are public ONLY at their exact root path
// (see middleware.ts's publicLandingPages -- "exact path public, sub-paths
// protected"). ClientLayout's isAuthenticatedRoute used a bare
// startsWith('/jobs') (no trailing slash), which ALSO matched the public
// /jobs root itself. That flagged a guest landing on /jobs as
// isAuthenticatedRoute=true, which made useTokenRefresh stamp a
// token-refresh timestamp for someone with no real session -- and
// chatbotAuth.isUserAuthenticated() (which only checks that timestamp, not
// an actual session) then reported the guest as logged in, for up to the
// token's freshness window.
//
// This test spies on the ACTUAL isAuthenticatedRoute value passed into
// useTokenRefresh per route, rather than mocking it away like
// ClientLayoutChatbotGate.test.tsx does -- that computation is exactly
// what's under test here.

let mockPathname = '/dashboard';
const useTokenRefreshSpy = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/hooks/useTokenRefresh', () => ({
  useTokenRefresh: (...args: unknown[]) => useTokenRefreshSpy(...args),
}));

vi.mock('@/contexts/TenantContext', () => ({
  TenantProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
  Toaster: () => null,
}));

vi.mock('@/components/VerificationRecovery', () => ({
  VerificationRecovery: () => null,
}));

vi.mock('@/components/chatbot', () => ({
  ChatbotWidget: () => null,
}));

beforeEach(() => {
  mockPathname = '/dashboard';
  useTokenRefreshSpy.mockReset();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
});

// Imported after the mocks above so ClientLayout picks them up.
import ClientLayout from '@/app/ClientLayout';

const isAuthedRouteFor = (pathname: string): boolean => {
  mockPathname = pathname;
  render(<ClientLayout>{null}</ClientLayout>);
  return Boolean(useTokenRefreshSpy.mock.calls[0][0]);
};

describe('ClientLayout -- isAuthenticatedRoute exact-vs-subpath detection', () => {
  it.each(['/jobs', '/jobmatch', '/communication'])(
    'the exact public landing page %s is NOT an authenticated route',
    (pathname) => {
      expect(isAuthedRouteFor(pathname)).toBe(false);
    },
  );

  it.each([
    '/jobs/tracking',
    '/jobs/applications/abc123',
    '/jobmatch/app',
    '/communication/start',
    '/communication/describe-situation',
  ])('the protected sub-path %s IS an authenticated route', (pathname) => {
    expect(isAuthedRouteFor(pathname)).toBe(true);
  });

  // /jobslogin is a protected page (not in middleware's publicRoutes or
  // publicLandingPages; it is the Sidebar's "Jobs" link). The trailing-slash
  // '/jobs/' prefix no longer covers it, so it is listed on its own, the same
  // way /atslogin is next to /ats/.
  it.each(['/jobslogin', '/atslogin'])('the protected page %s IS an authenticated route', (pathname) => {
    expect(isAuthedRouteFor(pathname)).toBe(true);
  });

  it('does not regress the already-correct /ats/ handling', () => {
    expect(isAuthedRouteFor('/ats/some-tool')).toBe(true);
  });

  it('does not regress dashboard/profile/settings/admin', () => {
    expect(isAuthedRouteFor('/dashboard')).toBe(true);
    expect(isAuthedRouteFor('/profile')).toBe(true);
    expect(isAuthedRouteFor('/settings')).toBe(true);
    expect(isAuthedRouteFor('/admin')).toBe(true);
  });

  it('does not regress the public home page', () => {
    expect(isAuthedRouteFor('/')).toBe(false);
  });
});
