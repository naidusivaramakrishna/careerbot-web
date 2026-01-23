"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Montserrat } from "next/font/google";
import { VideoRecordingProvider } from "@/contexts/VideoRecordingContext";

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
  const pathname = usePathname();

  // Only show sidebar and header for starting page and sections page
  const showLayout =
    pathname === "/communication" || pathname === "/communication/sections";

  if (!showLayout) {
    // For other pages (assessment pages), render children without layout but with video context
    return (
      <VideoRecordingProvider>
        <div className={montserrat.variable}>{children}</div>
      </VideoRecordingProvider>
    );
  }

  // For starting page and sections page, show sidebar and header
  return (
    <VideoRecordingProvider>
      <div className={`${montserrat.variable} antialiased font-montserrat`}>
        <Header />
        <div className="flex pt-13 bg-gradient-to-br from-indigo-50 to-purple-100">
          <Sidebar />
          <div className="flex-1 ml-20 overflow-auto min-h-screen">{children}</div>
        </div>
      </div>
    </VideoRecordingProvider>
  );
}
