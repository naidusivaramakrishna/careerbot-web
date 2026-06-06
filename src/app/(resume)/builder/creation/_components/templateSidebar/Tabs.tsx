"use client";
import React from "react";
import {
  LayoutGrid,
  BarChart2,
  Shuffle,
  Palette,
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
  { label: "Style", icon: Palette },
  { label: "Score", icon: BarChart2 },
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
      <button onClick={onToggle} className="py-2 mr-3 text-gray-500 flex-shrink-0">
        <SidebarOpen size={18} />
      </button>

      {/* Tab buttons — evenly spaced */}
      <div className="flex items-center justify-between flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`relative flex items-center gap-1 py-2.5 text-sm font-semibold transition whitespace-nowrap ${
                isActive
                  ? "text-[#2557a7]"
                  : "text-gray-800 hover:text-[#2557a7]"
              }`}
            >
              <Icon size={16} />
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

