"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function JobMatchAppLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <main
          className="flex-1 mt-14"
          style={{
            marginLeft: "var(--sidebar-width, 64px)",
            transition: "margin 300ms",
            // "clip", not "hidden": with overflowX "hidden" the CSS overflow
            // spec computes overflowY as "auto" even if it is set to "visible",
            // which turns <main> into its own scroll container. That makes it
            // the containing block for any `position: sticky` descendant (e.g.
            // AnalysisContent's right column), so the sticky `top` offset is
            // measured from <main>'s scrollport, which already starts 56px
            // below the viewport via `mt-14`, and the header's height is
            // double-counted as a ~112px gap above the sticky content. "clip"
            // does not create a scroll container, so the viewport stays the
            // scrolling ancestor.
            overflowX: "clip",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
