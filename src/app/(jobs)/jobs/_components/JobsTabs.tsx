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
    <div className="flex gap-6 text-sm border-b border-gray-200 mt-0 pb-3 mb-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange?.(tab.id)}
          className={`pb-2 whitespace-nowrap ${
            activeTab === tab.id
              ? "text-blue-600 border-b-2 border-blue-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="ml-2 text-xs font-semibold text-gray-600">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
