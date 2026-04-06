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
    <div className="flex gap-8 text-sm border-b border-gray-200 mt-0 pb-0 mb-5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange?.(tab.id)}
          className={`pb-3 whitespace-nowrap font-medium transition-colors duration-150 ${
            activeTab === tab.id
              ? "text-[#2557a7] border-b-2 border-[#2557a7]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === tab.id ? "bg-[#2557a7]/10 text-[#2557a7]" : "bg-gray-100 text-gray-500"
            }`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
