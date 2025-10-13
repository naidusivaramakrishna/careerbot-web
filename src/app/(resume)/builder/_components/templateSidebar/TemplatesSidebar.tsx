"use client";
import React, { useState } from "react";
import Tabs from "./Tabs";
import TemplatesTab from "../templates/TemplatesTab";
import ScoreTab from "../score/ScoreTab";
import JobMatchTab from "../job/JobMatchTab";
import { SidebarClose } from "lucide-react";

const TemplatesSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Templates");
  const [isOpen, setIsOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case "Templates":
        return <TemplatesTab />;
      case "Score":
        return <ScoreTab />;
      case "Job Match":
        return <JobMatchTab />;
      default:
        return null;
    }
  };

  return (
    <aside
      className={`transition-all duration-300 bg-white border-l border-gray-200 relative flex flex-col min-h-[calc(100vh-60px)]
        ${isOpen ? "w-[25%] px-3" : "w-12 p-0"}`}
    >
      {/* Tabs (hidden automatically when isOpen=false) */}
      <Tabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />

      {/* Main content when open */}
      {isOpen && (
        <div className="flex flex-col flex-1 px-1 py-4 overflow-y-scroll scrollbar-hide bg-white">
          {renderContent()}
        </div>
      )}

      {/* Floating SidebarOpen icon when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-orange-200 rounded-lg p-1 shadow hover:shadow-md hover:border-orange-400 transition"
        >
          <SidebarClose className="text-orange-500" size={20} />
        </button>
      )}
    </aside>
  );
};

export default TemplatesSidebar;


