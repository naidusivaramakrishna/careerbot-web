"use client";
import React, { useEffect } from "react";
import Tabs from "./Tabs";
import TemplatesTab from "../templates/TemplatesTab";
import ScoreTab from "../score/ScoreTab";
import JobMatchTab from "../job/JobMatchTab";
import { SidebarClose } from "lucide-react";

interface TemplatesSidebarProps {
  onToggle?: (isOpen: boolean) => void;
  isOpen?: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resumeId?: string;
}

const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({
  onToggle,
  isOpen: externalIsOpen,
  activeTab,
  setActiveTab,
  resumeId
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  // Sync internal state with external prop
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const handleTemplateSelect = () => {
    setIsOpen(false);
    if (onToggle) onToggle(false);
  };

  const handleToggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) onToggle(newState);
  };

  return (
    <div
      // className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
      className={`relative bg-gradient-to-br from-gray-50 to-white h-screen shadow-sm transition-all duration-300 flex flex-col
        ${isOpen ? "w-[28%]" : "w-12 p-0"}`}
    >
      {isOpen && (
        <Tabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isOpen}
          onToggle={handleToggleSidebar}
      />
      )}

      {isOpen && (
        <div className="flex flex-col flex-1 px-2 py-4 overflow-y-scroll scrollbar-hide bg-white">
          {activeTab === "Templates" && (
            <TemplatesTab onTemplateSelect={handleTemplateSelect} resumeId={resumeId} />
          )}
{activeTab === "Score" && <ScoreTab />}
          {activeTab === "Job Match" && <JobMatchTab />}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={handleToggleSidebar}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-white rounded p-1.5 shadow hover:shadow-md hover:border-blue-400 transition"
        >
          <SidebarClose className="text-blue-500" size={20} />
        </button>
      )}
    </div>
  );
};

export default TemplatesSidebar;



