"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { VideoRecordingProvider } from "@/contexts/VideoRecordingContext";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function CommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Only show sidebar and header for starting page and sections page
  const showLayout =
    pathname === "/communication" || pathname === "/communication/sections";

  if (!showLayout) {
    // For other pages (assessment pages), render children without layout but with video context
    return (
      <VideoRecordingProvider>
        <div className="font-montserrat">{children}</div>
      </VideoRecordingProvider>
    );
  }

  // For starting page and sections page, show sidebar and header
  return (
    <DashboardProvider>
      <VideoRecordingProvider>
        <div className="antialiased font-montserrat">
          <Header />
          <div className="flex pt-14 bg-linear-to-br from-indigo-50 to-purple-100">
            <Sidebar />
            <div className="flex-1 overflow-auto min-h-screen" style={{ marginLeft: "var(--sidebar-width, 64px)", transition: "margin 300ms" }}>{children}</div>
          </div>
        </div>
      </VideoRecordingProvider>
    </DashboardProvider>
  );
}
