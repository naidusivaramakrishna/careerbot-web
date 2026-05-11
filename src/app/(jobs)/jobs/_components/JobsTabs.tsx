"use client";

import { ChevronDown } from "lucide-react";

export type TabType = "all" | "matched" | "new" | "saved";
export type SortType = "relevance" | "date" | "salary";

interface JobsTabsProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  newCount?: number;
  savedCount?: number;
  matchedCount?: number;
  allCount?: number;
  sortBy?: SortType;
  onSortChange?: (sort: SortType) => void;
}

const SORT_LABELS: Record<SortType, string> = {
  relevance: "Relevance",
  date:      "Date",
  salary:    "Salary",
};

export default function JobsTabs({
  activeTab = "all",
  onTabChange,
  newCount = 0,
  savedCount = 0,
  matchedCount = 0,
  allCount = 0,
  sortBy = "relevance",
  onSortChange,
}: JobsTabsProps) {
  const TABS: Array<{ id: TabType; label: string; count?: number; prefix?: string }> = [
    { id: "all",     label: "All Jobs",    count: allCount > 0 ? allCount : undefined },
    { id: "new",     label: "New",         count: newCount     },
    { id: "saved",   label: "Saved",       count: savedCount   },
    { id: "matched", label: "Smart Match", count: matchedCount, prefix: "+ " },
  ];

  return (
    <div className="flex items-center justify-between border-b border-gray-100 mb-4">
      {/* Tabs */}
      <div className="flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 pb-3 pt-1 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 ${
              activeTab === tab.id
                ? "text-[#2557a7]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.prefix && (
              <span className={activeTab === tab.id ? "text-[#2557a7]" : "text-gray-400"}>
                {tab.prefix}
              </span>
            )}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-px rounded-full font-bold leading-none ${
                  activeTab === tab.id
                    ? "bg-[#2557a7] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#2557a7] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      {onSortChange && (
        <div className="flex items-center gap-1.5 pb-3 shrink-0">
          <span className="text-[12px] text-gray-400 font-medium">Sort</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortType)}
              className="appearance-none pl-2.5 pr-7 py-1 rounded-lg text-[12px] font-semibold border border-gray-200 bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-[#2557a7] transition-colors"
            >
              {(Object.keys(SORT_LABELS) as SortType[]).map((key) => (
                <option key={key} value={key}>{SORT_LABELS[key]}</option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
}
