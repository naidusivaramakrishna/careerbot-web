"use client"

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { TenantProvider } from "@/contexts/TenantContext";
import { VerificationRecovery } from "@/components/VerificationRecovery";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine if user is authenticated based on current route
  // Must match the protectedRoutes array in middleware.ts
  const isPublicBuilderRoute = pathname === '/builder' || pathname?.startsWith('/builder/start');
  const isAuthenticatedRoute = pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/profile') ||
    (pathname?.startsWith('/builder') && !isPublicBuilderRoute) ||
    pathname?.startsWith('/ats/') ||
    pathname?.startsWith('/atslogin') ||
    pathname?.startsWith('/enhancer') ||
    pathname?.startsWith('/jobmatch') ||
    pathname?.startsWith('/jobs') ||
    pathname?.startsWith('/communication') ||
    pathname?.startsWith('/settings') ||
    pathname?.startsWith('/admin');

  // Setup automatic token refresh (30 min expiry)
  useTokenRefresh(isAuthenticatedRoute, 30 * 60 * 1000, pathname);

  // Global guard: keep navigation in the same tab. Any link that would open a
  // new browser tab (target="_blank") is redirected to same-window navigation.
  // Modified clicks (Ctrl/Cmd/Shift/Alt or non-primary button) are left alone,
  // since those are an explicit user gesture to open a new tab.
  // Opt-out: a link can add data-allow-new-tab to be exempt — used by flows
  // (e.g. job applications) that need the current tab to stay put so the app
  // can prompt the user when they come back to it.
  useEffect(() => {
    const forceSameTab = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.('a[target="_blank"]') as HTMLAnchorElement | null;
      if (!anchor || !anchor.getAttribute('href')) return;
      if (anchor.hasAttribute('data-allow-new-tab')) return;
      e.preventDefault();
      window.location.href = anchor.href;
    };
    document.addEventListener('click', forceSameTab, true);
    return () => document.removeEventListener('click', forceSameTab, true);
  }, []);

  // Poll maintenance status every 15 s — redirect to /maintenance if enabled.
  // Skipped on admin/recruiter routes so admins can always reach their
  // dashboard to turn maintenance off.
  useEffect(() => {
    const isAdminOrRecruiter =
      pathname?.startsWith('/admin') || pathname?.startsWith('/recruiter');
    if (isAdminOrRecruiter || pathname?.startsWith('/maintenance')) return;

    const check = async () => {
      try {
        const res = await fetch('/api/maintenance-status', { cache: 'no-store' });
        if (res.ok) {
          const data: { maintenance: boolean } = await res.json();
          if (data.maintenance) router.replace('/maintenance');
        }
      } catch { /* non-critical */ }
    };

    check(); // immediate check on mount / route change
    const id = setInterval(check, 15_000);
    return () => clearInterval(id);
  }, [pathname, router]);

  // Listen for logout events from HTTP interceptor
  // When token refresh fails, http.ts redirects to login
  // This ensures redirect happens even without API calls if using a logout endpoint
  useEffect(() => {
    if (!isAuthenticatedRoute) return;

    const handleTokenExpired = () => {
      const isAdminRoute = pathname?.startsWith('/admin');
      if (isAdminRoute) {
        router.push('/admin/login');
      } else {
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        const params = new URLSearchParams({ showLogin: 'true' });
        if (currentPath && currentPath !== '/') {
          params.set('next', currentPath);
        }
        router.push(`/?${params.toString()}`);
      }
    };

    // Listen for logout event from elsewhere in the app
    window.addEventListener('userLoggedOut', handleTokenExpired);
    return () => window.removeEventListener('userLoggedOut', handleTokenExpired);
  }, [isAuthenticatedRoute, pathname, router]);

  return (
    <TenantProvider>
      <Toaster richColors position="bottom-right" />
      <VerificationRecovery />
      {children}
    </TenantProvider>
  );
}
