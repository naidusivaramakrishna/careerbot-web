'use client';

import type { ReactNode } from "react";
import FeatureUnavailableScreen from "./_components/FeatureUnavailableScreen";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";
import "@/app/globals.css";

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

  if (!enabled) {
    return <FeatureUnavailableScreen />;
  }

  return (
    <DashboardProvider>
      <Header />
      <div className="flex pt-14 bg-white min-h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto" style={{ marginLeft: "var(--sidebar-width, 64px)", transition: "margin 300ms" }}>
          {children}
        </div>
      </div>
    </DashboardProvider>
  );
}
