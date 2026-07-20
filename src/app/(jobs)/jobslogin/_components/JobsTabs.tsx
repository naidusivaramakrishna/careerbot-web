"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type TabType = "all" | "matched" | "saved" | "applied";
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
  savedCount?: number;
  appliedCount?: number;
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
  savedCount = 0,
  appliedCount = 0,
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
    { id: "saved",   label: "Saved",       count: savedCount   },
    { id: "applied", label: "Applied",     count: appliedCount },
    { id: "matched", label: "Smart Match", count: matchedCount },
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
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 overflow-visible pt-1">
      {/* Tabs */}
      <div className="flex min-w-0 flex-wrap gap-1 rounded-[14px] bg-slate-50/80 p-1" role="tablist" aria-label="Job result views">
        {TABS.map((tab) => {
          const isActive   = activeTab === tab.id;
          const isAI       = tab.id === "matched";
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange?.(tab.id)}
              className={`relative flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[13px] font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-white text-[#4F46E5] shadow-sm ring-1 ring-slate-200/70"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
              }`}
            >
              {isAI && (
                <svg
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? "text-[#4F46E5]" : "text-amber-400"}`}
                  viewBox="0 0 24 24" fill="currentColor"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {tab.label}
              {isAI && (
                <span className="text-[8.5px] px-1 py-0.5 rounded font-black leading-none bg-amber-100 text-amber-700">
                  BETA
                </span>
              )}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none tabular-nums ${
                    isActive
                      ? "bg-[#4F46E5] text-white shadow-sm"
                      : "bg-gray-200/70 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter sort dropdown — available on every tab; "Recommended"/"Top Matched"
          sort by real match score wherever the job has one (see enrichWithMatch
          in JobsContents.tsx), not just on the Smart Match tab. */}
      <div className="relative flex shrink-0 items-center gap-2">
        {/* Dropdown trigger */}
        <button
          ref={btnRef}
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-10 items-center gap-2 rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-[#4F46E5]/30 hover:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2"
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
            role="menu"
            className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 z-50"
          >
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={filterSort === opt.id}
                onClick={() => { onFilterSortChange?.(opt.id); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  filterSort === opt.id
                    ? "bg-[#f0f4ff] text-[#4F46E5] font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
