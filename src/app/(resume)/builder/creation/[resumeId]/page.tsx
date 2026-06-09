"use client";
import React, { useState, useEffect, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../_components/Header";
import ResumeSide from "../_components/resumeSidebar/ResumeSide";
import TemplatesSidebar from "../_components/templateSidebar/TemplatesSidebar";
import PreviewPanel from "../_components/PreviewPanel";
import { useResume } from "../_context/ResumeContext";

interface BuilderPageProps {
  params: Promise<{
    resumeId: string;
  }>;
}

function BuilderPageInner({ resumeId }: { resumeId: string }) {
  const searchParams = useSearchParams();
  const fromAts = searchParams.get("from_ats") === "true";
  const initialTab = fromAts ? "Editor" : undefined;
  const isEnhancedResume = searchParams.get("source") === "enhanced";

  // ✅ Get loading state from context to prevent rendering before data loads
  const { isLoadingResume } = useResume();

  // When source=enhanced, open the template sidebar and collapse the editor sidebar by default
  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(isEnhancedResume);

  const [activeTab, setActiveTab] = useState(isEnhancedResume ? "Score" : "Templates");

  // Save sidebar state to localStorage whenever it changes (during session)
  useEffect(() => {
    localStorage.setItem("template_sidebar_open", String(isTemplateSidebarOpen));
  }, [isTemplateSidebarOpen]);

  const handleToggleTemplateSidebar = (isOpen: boolean) => {
    setIsTemplateSidebarOpen(isOpen);
  };

  const handleTabClickFromToolbar = (tab: string) => {
    setActiveTab(tab);
    setIsTemplateSidebarOpen(true);
  };

  // ✅ Show loading state while resume data is being fetched from backend
  // This prevents form components from initializing with empty data
  if (isLoadingResume) {
    return (
      <>
        <Header />
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#2200ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Loading resume data...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your resume</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex h-screen">
        <ResumeSide
          isTemplateSidebarOpen={isTemplateSidebarOpen}
          onToggleTemplateSidebar={handleToggleTemplateSidebar}
          resumeId={resumeId}
          initialTab={initialTab}
          defaultOpen={!isEnhancedResume}
        />

        <main className="flex-1 bg-gray-50 ">
          <PreviewPanel
            isTemplateSidebarOpen={isTemplateSidebarOpen}
            onTabClick={handleTabClickFromToolbar}
            resumeId={resumeId}
            isEnhancedResume={isEnhancedResume}
          />
        </main>

        <TemplatesSidebar
          isOpen={isTemplateSidebarOpen}
          onToggle={handleToggleTemplateSidebar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          resumeId={resumeId}
        />
      </div>
    </>
  );
}

const BuilderPage: React.FC<BuilderPageProps> = ({ params }) => {
  const { resumeId } = use(params);
  return (
    <Suspense>
      <BuilderPageInner resumeId={resumeId} />
    </Suspense>
  );
};

export default BuilderPage;
