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
        router.push('/?showLogin=true');
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
