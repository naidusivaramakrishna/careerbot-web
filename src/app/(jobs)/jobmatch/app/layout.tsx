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
            overflowX: "hidden",
            // Setting only overflowX forces overflowY to compute as "auto"
            // per the CSS overflow spec, turning <main> into its own
            // scroll container. That made it the containing block for any
            // `position: sticky` descendant (e.g. AnalysisContent's right
            // column), so a sticky element's `top` offset was measured from
            // <main>'s scrollport — which itself already starts 56px below
            // the viewport via `mt-14` — instead of from the real viewport,
            // double-counting the header's height as a ~112px gap above the
            // sticky content. Pinning overflowY back to "visible" restores
            // the viewport as the scrolling ancestor.
            overflowY: "visible",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
