"use client";
import { ResumeProvider } from "./_context/ResumeContext";
import { ScoreProvider } from "./_context/ScoreContext";
import Sidebar from "../../../../components/layout/Sidebar";
import Header from "../../../../components/layout/Header";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardProvider } from "@/contexts/DashboardContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const [resumeId, setResumeId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Get resumeId from URL params if available (dynamic route)
    if (params?.resumeId && typeof params.resumeId === 'string') {
      setResumeId(params.resumeId);
      // Store in localStorage for consistency
      localStorage.setItem("current_resume_id", params.resumeId);
    }
    // Fallback to localStorage for static route
    else if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem("current_resume_id");
      if (storedId && storedId !== 'null' && storedId !== 'undefined') {
        setResumeId(storedId);
      }
    }
  }, [params, pathname]);

  return (
    <DashboardProvider>
      <ResumeProvider resumeId={resumeId}>
        <ScoreProvider>
          <Header />
          <div className="flex pt-14 bg-blue-100 ">
            <Sidebar />
            <div className="flex-1 overflow-auto" style={{ marginLeft: "var(--sidebar-width, 64px)", transition: "margin 300ms" }}>{children}</div>
          </div>
        </ScoreProvider>
      </ResumeProvider>
    </DashboardProvider>
  );
}