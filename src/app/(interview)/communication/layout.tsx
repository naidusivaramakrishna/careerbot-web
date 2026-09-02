"use client";
import { usePathname } from "next/navigation";
import { VideoRecordingProvider } from "@/contexts/VideoRecordingContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import CommunicationHeader from "./components/CommunicationHeader";
import LandingNavbar from "@/app/(landing)/_components/LandingNavbar";

export default function CommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/communication";

  // All communication pages: h-screen flex-col keeps everything within viewport, no browser scroll
  return (
    <DashboardProvider>
      <VideoRecordingProvider>
        <div className={`antialiased font-sans h-screen flex flex-col overflow-hidden`}>
          {isLandingPage ? <LandingNavbar /> : <CommunicationHeader />}
          <div className={`flex-1 min-h-0 ${isLandingPage ? "overflow-auto" : "overflow-hidden"}`}>
            {children}
          </div>
        </div>
      </VideoRecordingProvider>
    </DashboardProvider>
  );

  // Old layout with global Sidebar + Header (kept for reference)
  // const pathname = usePathname();
  // const showLayout = pathname === "/communication" || pathname === "/communication/sections";
  // if (showLayout) return (
  //   <DashboardProvider>
  //     <VideoRecordingProvider>
  //       <div className={`antialiased font-sans`}>
  //         <Header />
  //         <div className="flex pt-14 bg-gray-50">
  //           <Sidebar />
  //           <div className="flex-1 overflow-auto min-h-screen" style={{ marginLeft: "var(--sidebar-width, 64px)", transition: "margin 300ms" }}>{children}</div>
  //         </div>
  //       </div>
  //     </VideoRecordingProvider>
  //   </DashboardProvider>
  // );
}
