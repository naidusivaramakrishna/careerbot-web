"use client";

import NotesSidebar from "./_components/NotesSidebar";
import { MockInterviewProvider } from "@/app/(interview)/mock-interview/_context/MockInterviewContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <MockInterviewProvider>
        <div className={`${montserrat.variable} antialiased font-(family-name:--font-montserrat)`}>
          <Sidebar />
          <Header />
          <div
            className="pt-14 min-h-screen transition-[margin] duration-300 bg-gray-50"
            style={{ marginLeft: "var(--sidebar-width, 56px)" }}
          >
            <NotesSidebar />
            <div className="overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </MockInterviewProvider>
    </DashboardProvider>
  );
}
