"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function NotificationLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <Sidebar />
      <Header />
      <div
        className="pt-14 min-h-screen bg-gray-50 transition-[margin] duration-300"
        style={{ marginLeft: "var(--sidebar-width, 64px)" }}
      >
        {children}
      </div>
    </DashboardProvider>
  );
}
