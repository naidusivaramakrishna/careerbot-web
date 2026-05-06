"use client";
import { ResumeProvider } from "./_context/ResumeContext";
import { ScoreProvider } from "./_context/ScoreContext";
import Sidebar from "../../../../components/layout/Sidebar";
import Header from "../../../../components/layout/Header";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { DashboardProvider } from "@/contexts/DashboardContext";

function BuilderLayoutInner({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const source = searchParams.get("source") ?? undefined;

  // Derive resumeId synchronously so ResumeProvider gets it on first render
  const resumeId = (params?.resumeId && typeof params.resumeId === "string")
    ? params.resumeId
    : undefined;

  // Keep localStorage in sync for components that still read it
  useEffect(() => {
    if (resumeId) {
      localStorage.setItem("current_resume_id", resumeId);
    }
  }, [resumeId]);

  return (
    <DashboardProvider>
      <ResumeProvider resumeId={resumeId} source={source}>
        <ScoreProvider>
          <Header />
          <div className="flex pt-14 bg-blue-100">
            <Sidebar />
            <div
              className="flex-1 overflow-auto"
              style={{ marginLeft: "var(--sidebar-width, 64px)", transition: "margin 300ms" }}
            >
              {children}
            </div>
          </div>
        </ScoreProvider>
      </ResumeProvider>
    </DashboardProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Suspense>
          <BuilderLayoutInner>{children}</BuilderLayoutInner>
        </Suspense>
      </body>
    </html>
  );
}