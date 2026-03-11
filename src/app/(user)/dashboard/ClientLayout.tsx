"use client";

import Footer from "@/app/Footer/page";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function ClientLayout({
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
        style={{ backgroundColor: '#e8eff9', marginLeft: "var(--sidebar-width, 56px)" }}
      >
        {children}
        <Footer />
      </div>
    </DashboardProvider>
  );
}
