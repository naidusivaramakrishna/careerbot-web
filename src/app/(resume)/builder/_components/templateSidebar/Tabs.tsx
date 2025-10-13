"use client";
import React from "react";
import {
  LayoutGrid,
  BarChart2,
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
    <div className="flex items-center gap-4 mb-1 border-b border-gray-200 px-3 pt-1 w-full">
      {/* Left toggle button */}
      <button
        onClick={onToggle}
        className="py-2  text-gray-500"
      >
        <SidebarOpen size={18} />
      </button>

      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.label;
        return (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex items-center gap-1 py-2.5 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === tab.label
                ? "text-orange-500 border-b-2 border-orange-600"
                : "text-gray-600 hover:text-orange-500"
            }`}
          >
            <Icon size={16} />
            {tab.label}

            {/* Active underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0 bg-orange-500 rounded-t"></span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;

