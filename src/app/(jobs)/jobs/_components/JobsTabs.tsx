"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type TabType = "all" | "matched" | "new" | "saved";
export type SortType = "relevance" | "date" | "salary";
export type FilterSort = "recommended" | "top-matched" | "most-recent";

const FILTER_OPTIONS: { id: FilterSort; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "top-matched", label: "Top Matched" },
  { id: "most-recent", label: "Most Recent" },
];


interface JobsTabsProps {
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  newCount?: number;
  savedCount?: number;
  matchedCount?: number;
  allCount?: number;
  sortBy?: SortType;
  onSortChange?: (sort: SortType) => void;
  filterSort?: FilterSort;
  onFilterSortChange?: (sort: FilterSort) => void;
}

export default function JobsTabs({
  activeTab = "all",
  onTabChange,
  newCount = 0,
  savedCount = 0,
  matchedCount = 0,
  allCount = 0,
  filterSort = "most-recent",
  onFilterSortChange,
}: JobsTabsProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const TABS: Array<{ id: TabType; label: string; count?: number; prefix?: string }> = [
    { id: "all",     label: "All Jobs",    count: allCount > 0 ? allCount : undefined },
    { id: "new",     label: "New",         count: newCount     },
    { id: "saved",   label: "Saved",       count: savedCount   },
    { id: "matched", label: "Smart Match", count: matchedCount, prefix: "✦ " },
  ];

  const selectedLabel = FILTER_OPTIONS.find((o) => o.id === filterSort)?.label ?? "Most Recent";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !dropRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="flex items-center justify-between">
      {/* Tabs */}
      <div className="flex gap-0">
        {TABS.map((tab) => {
          const isActive   = activeTab === tab.id;
          const isAI       = tab.id === "matched";
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 pb-3.5 pt-2 text-[13.5px] font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? isAI ? "text-[#2557a7]" : "text-[#2557a7]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {isAI && (
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? "text-[#2557a7]" : "text-amber-400"}`}
                  viewBox="0 0 24 24" fill="currentColor"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none tabular-nums ${
                    isActive
                      ? "bg-[#2557a7] text-white shadow-sm"
                      : "bg-gray-200/70 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {isActive && !isAI && (
                <span className="absolute bottom-0 left-2 right-2 h-0.75 bg-[#2557a7] rounded-full shadow-[0_0_10px_rgba(37,87,167,0.5)]" />
              )}
              {isActive && isAI && (
                <span className="absolute bottom-0 left-0 right-0 h-0.75 rounded-full shadow-[0_0_12px_rgba(37,87,167,0.6)]"
                  style={{ background: "linear-gradient(90deg, #2557a7, #3b82f6)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter sort dropdown — only on Smart Match tab */}
      {activeTab === "matched" && <div className="flex items-center gap-2 pb-3.5 shrink-0 relative">
        {/* Dropdown trigger */}
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 border border-gray-200 bg-white hover:border-[#2557a7]/30 hover:shadow-sm transition-all"
        >
          <span className="text-[13px] font-semibold leading-none text-gray-700">
            {selectedLabel}
          </span>
          <ChevronDown
            size={13}
            className={`text-gray-400 transition-transform duration-150 shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            ref={dropRef}
            className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-50"
          >
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onFilterSortChange?.(opt.id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  filterSort === opt.id
                    ? "bg-[#f0f4ff] text-[#2557a7] font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>}
    </div>
  );
}
