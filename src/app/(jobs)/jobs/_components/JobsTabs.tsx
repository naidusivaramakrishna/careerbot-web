"use client";

import { useState } from "react";

export type TabType = "all" | "new" | "saved";

interface JobsTabsProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  newCount?: number;
  savedCount?: number;
}

export default function JobsTabs({ activeTab = "all", onTabChange, newCount = 0, savedCount = 0 }: JobsTabsProps) {
  const TABS: Array<{ id: TabType; label: string; count?: number }> = [
    { id: "all", label: "All Matches" },
    { id: "new", label: "New", count: newCount },
    { id: "saved", label: "Saved", count: savedCount },
  ];

  return (
    <div className="flex gap-0 border-b border-gray-100 mb-5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange?.(tab.id)}
          className={`relative flex items-center gap-2 px-5 pb-3 pt-1 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 ${
            activeTab === tab.id
              ? "text-[#2557a7]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
              activeTab === tab.id
                ? "bg-[#2557a7] text-white"
                : "bg-gray-100 text-gray-500"
            }`}>{tab.count}</span>
          )}
          {/* Active underline indicator */}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#2557a7] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
