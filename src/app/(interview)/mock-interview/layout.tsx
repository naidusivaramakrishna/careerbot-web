"use client";

import type { CSSProperties } from "react";
import MockSidebar from "./_components/MockSidebar";
import { MockInterviewProvider } from "./_context/MockInterviewContext";
import { usePathname } from "next/navigation";

// Inter Variable is already registered globally via @fontsource-variable in
// src/app/layout.tsx — this just points --font-inter at that family for the
// font-(family-name:--font-inter) utility below.
const INTER_VARIABLE_STYLE = { "--font-inter": "'Inter Variable', sans-serif" } as CSSProperties;

export default function MockInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRoomRoute = /^\/mock-interview\/live\/[^/]+$/.test(pathname) && !pathname.endsWith("/starting");
  const isPrivateMockRoute = pathname !== "/mock-interview";

  return (
    <MockInterviewProvider>
      <div
        data-mock-interview={isPrivateMockRoute ? "private" : undefined}
        style={INTER_VARIABLE_STYLE}
        data-room={isRoomRoute || undefined}
        className="mi-workspace antialiased font-(family-name:--font-inter)"
      >
        <div className="mi-shell">
          <MockSidebar />
          {/* relative: makes this scroller the containing block for absolutely
              positioned descendants (e.g. sr-only text). Without it they are
              placed against the viewport, escape overflow-hidden above, and
              stretch the document into a blank scroll area below the layout. */}
          <div className="mi-content">
            {children}
          </div>
        </div>
      </div>
    </MockInterviewProvider>
  );
}
