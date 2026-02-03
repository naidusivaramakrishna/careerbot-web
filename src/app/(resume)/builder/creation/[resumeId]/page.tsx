"use client";
import React, { useState, useEffect, use } from "react";
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

const BuilderPage: React.FC<BuilderPageProps> = ({ params }) => {
  const { resumeId } = use(params);

  // ✅ Get loading state from context to prevent rendering before data loads
  const { isLoadingResume, resumeData } = useResume();

  // ✅ Always start with sidebar closed when page loads
  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("Templates");

  // ✅ Clear saved sidebar state on mount to ensure it always starts closed
  useEffect(() => {
    localStorage.removeItem("template_sidebar_open");
  }, []);

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
        />

        <main className="flex-1 bg-gray-50 ">
          <PreviewPanel
            isTemplateSidebarOpen={isTemplateSidebarOpen}
            onTabClick={handleTabClickFromToolbar}
            resumeId={resumeId}
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
};

export default BuilderPage;
