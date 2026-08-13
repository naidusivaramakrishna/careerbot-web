"use client";

import NotesSidebar from "./_components/NotesSidebar";
import { MockInterviewProvider } from "@/app/(interview)/mock-interview/_context/MockInterviewContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function NotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <MockInterviewProvider>
        <div className="antialiased">
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
