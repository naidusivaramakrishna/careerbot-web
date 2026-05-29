'use client';

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import FeatureUnavailableScreen from "./_components/FeatureUnavailableScreen";
import "@/app/globals.css";

const CoverLetterDashboardShell = dynamic(
  () => import("./_components/CoverLetterDashboardShell"),
  { ssr: false }
);

/**
 * Cover-letter route group — top-level (no Next route group).
 *
 * This layout is the FLAG GATE for the entire feature. When
 * `NEXT_PUBLIC_COVER_LETTER_ENABLED` is anything other than the
 * literal string "true", every cover-letter route renders the
 * `<FeatureUnavailableScreen />` instead of its real content.
 *
 * Wraps with Header, Sidebar, and DashboardProvider for consistent
 * dashboard experience (same as Resume Builder and ATS Scanner).
 */
export default function CoverLetterLayout({ children }: { children: ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_COVER_LETTER_ENABLED === "true";
  const pathname = usePathname();

  if (!enabled) {
    return <FeatureUnavailableScreen />;
  }

  if (pathname === "/cover-letter") {
    return <>{children}</>;
  }

  return (
    <CoverLetterDashboardShell>
      {children}
    </CoverLetterDashboardShell>
  );
}
