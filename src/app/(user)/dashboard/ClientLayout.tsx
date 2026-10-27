"use client";

import { usePathname } from "next/navigation";
import Footer from "@/app/Footer/page";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { DashboardProvider } from "@/contexts/DashboardContext";

// Routes under /dashboard that render their own full-screen experience --
// no sidebar/header/footer chrome around them, same pattern cover-letter/
// institution/notes/communication/jobs already use in their own layouts.
const FULL_SCREEN_ROUTES = ["/dashboard/support-history"];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_ROUTES.some((route) => pathname?.startsWith(route));

  if (isFullScreen) {
    return <DashboardProvider>{children}</DashboardProvider>;
  }

  return (
    <DashboardProvider>
      <Sidebar />
      <Header />
      <div
        className="pt-14 min-h-screen transition-[margin] duration-300"
        style={{ backgroundColor: '#f4f5f7', marginLeft: "var(--sidebar-width, 56px)" }}
      >
        {children}
        <Footer />
      </div>
    </DashboardProvider>
  );
}
