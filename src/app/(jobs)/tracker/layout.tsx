"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <Sidebar />
      <Header />
      <div
        className="pt-14 min-h-screen transition-[margin] duration-300"
        style={{ backgroundColor: "#eef2fb", marginLeft: "var(--sidebar-width, 64px)" }}
      >
        {children}
        <Toaster richColors position="bottom-right" />
      </div>
    </DashboardProvider>
  );
}
