"use client";
import React from "react";
import {
  LayoutGrid,
  Shuffle,
  SidebarOpen,
} from "lucide-react";

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const tabs = [
  { label: "Templates", icon: LayoutGrid },
  { label: "Job Match", icon: Shuffle },
];

const Tabs: React.FC<TabsProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onToggle,
}) => {
  if (!isOpen) return null; // hide tabs completely when sidebar closed

  return (
    <div className="flex items-center mb-1 border border-gray-200 rounded px-3 pt-0.5 w-full shadow-sm relative z-30 transition-all duration-300 ease-in-out">
      {/* Left toggle button */}
      <button onClick={onToggle} className="py-2 mr-4 text-gray-400 hover:text-gray-600 flex-shrink-0 transition">
        <SidebarOpen size={17} />
      </button>

      {/* Tab buttons — equal-width, centered */}
      <div className="flex flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition whitespace-nowrap ${
                isActive
                  ? "text-[#2557a7]"
                  : "text-gray-600 hover:text-[#2557a7]"
              }`}
            >
              <Icon size={15} />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2557a7] rounded-t"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;

