"use client"

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { TenantProvider } from "@/contexts/TenantContext";

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
  useEffect(() => {
    const forceSameTab = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest?.('a[target="_blank"]') as HTMLAnchorElement | null;
      if (!anchor || !anchor.getAttribute('href')) return;
      e.preventDefault();
      window.location.href = anchor.href;
    };
    document.addEventListener('click', forceSameTab, true);
    return () => document.removeEventListener('click', forceSameTab, true);
  }, []);

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
      {children}
    </TenantProvider>
  );
}
