"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ArrowUpDown, ChevronDown } from "lucide-react";

interface JobsHeaderSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function JobsHeaderSection({
  searchQuery,
  onSearchChange,
}: JobsHeaderSectionProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortFilter, setSortFilter] = useState<"recommended" | "top-matched" | "most-recent">(
    "recommended"
  );
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortLabels: Record<string, string> = {
    recommended: "Best Match",
    "top-matched": "Top Matched",
    "most-recent": "Most Recent",
  };

  return (
    <div className="pb-3">
      {/* SEARCH BAR + SORT on same row */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="flex-1 flex items-stretch bg-white border border-gray-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(37,87,167,0.10)] focus-within:border-[#2557a7]/50 focus-within:shadow-[0_4px_20px_rgba(37,87,167,0.12)] transition-all duration-200 overflow-hidden">
          {/* Job Title / Skill Input */}
          <div className="flex-1 flex items-center px-5 gap-3 min-w-0">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Job title, skill or keyword"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 py-3.5 text-sm text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none"
            />
          </div>

          {/* Search Button */}
          <button
            type="button"
            className="px-8 py-3.5 bg-[#2557a7] hover:bg-[#1e4a96] active:bg-[#1a3f84] text-white text-sm font-bold transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </div>

        {/* Sort By */}
        <div className="relative shrink-0" ref={sortRef}>
          <button
            type="button"
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-[12px] font-semibold text-gray-600 hover:border-[#2557a7]/40 hover:text-[#2557a7] hover:bg-[#fafbff] shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all whitespace-nowrap"
          >
            <ArrowUpDown size={13} className="shrink-0" />
            {sortLabels[sortFilter]}
            <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
          </button>
          {sortOpen && (
            <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5">
              <p className="text-[10px] font-semibold text-gray-400 px-3 pb-1.5 uppercase tracking-wider">Sort by</p>
              {(Object.entries(sortLabels) as [typeof sortFilter, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSortFilter(key); setSortOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                    sortFilter === key
                      ? "text-[#2557a7] font-semibold bg-[#f0f4ff]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {sortFilter === key && <div className="w-1.5 h-1.5 rounded-full bg-[#2557a7] shrink-0" />}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
