'use client';

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import "@/app/globals.css";

const CoverLetterDashboardShell = dynamic(
  () => import("./_components/CoverLetterDashboardShell"),
  { ssr: false }
);

/**
 * Cover-letter route group — top-level (no Next route group).
 *
 * Wraps with Header, Sidebar, and DashboardProvider for consistent
 * dashboard experience (same as Resume Builder and ATS Scanner).
 */
export default function CoverLetterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPublicLandingPage = pathname === "/cover-letter";

  if (isPublicLandingPage) {
    return children;
  }

  return (
    <CoverLetterDashboardShell>
      {children}
    </CoverLetterDashboardShell>
  );
}
