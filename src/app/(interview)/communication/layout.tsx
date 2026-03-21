"use client";
// import { usePathname } from "next/navigation";
// import Sidebar from "@/components/layout/Sidebar";
// import Header from "@/components/layout/Header";
import { Montserrat } from "next/font/google";
import { VideoRecordingProvider } from "@/contexts/VideoRecordingContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import CommunicationHeader from "./components/CommunicationHeader";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export default function CommunicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // All communication pages: h-screen flex-col keeps everything within viewport, no browser scroll
  return (
    <DashboardProvider>
      <VideoRecordingProvider>
        <div className={`${montserrat.variable} antialiased font-montserrat h-screen flex flex-col overflow-hidden`}>
          <CommunicationHeader />
          <div className="flex-1 min-h-0 overflow-auto">
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
  //       <div className={`${montserrat.variable} antialiased font-montserrat`}>
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
