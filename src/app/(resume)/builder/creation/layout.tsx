"use client";
import { ResumeProvider } from "./_context/ResumeContext";
import { ScoreProvider } from "./_context/ScoreContext";
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
          {/* The builder is a focused workspace: no app sidebar here (the resume list keeps it). */}
          <div className="flex pt-14 bg-[#f1f6fc]">
            <div className="flex-1 overflow-auto">
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
    <Suspense>
      <BuilderLayoutInner>{children}</BuilderLayoutInner>
    </Suspense>
  );
}