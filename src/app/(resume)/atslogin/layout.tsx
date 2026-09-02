"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function ATSLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <div className="flex min-h-screen">
        <Header />
        <Sidebar />
        <main
          className="flex-1 mt-14"
          style={{ marginLeft: "var(--sidebar-width, 64px)", transition: "margin 300ms" }}
        >
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}