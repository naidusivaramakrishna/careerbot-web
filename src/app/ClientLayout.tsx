"use client"

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Listen for token updates (login/logout from other tabs)
    const handleTokenUpdate = () => {
      // // console.log('Token updated - reloading page');
      // Force reload to clear all caches
      window.location.reload();
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate);

    // Also listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === null) {
        // // console.log('Storage changed - reloading page');
        // Token changed or storage cleared
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [pathname]);

  return <>
  <Toaster richColors position="bottom-right"/>
    {children}
  </>;
}
