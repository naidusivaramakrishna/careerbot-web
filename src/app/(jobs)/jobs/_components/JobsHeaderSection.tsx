"use client";

import { Search } from "lucide-react";

interface JobsHeaderSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function JobsHeaderSection({
  searchQuery,
  onSearchChange,
}: JobsHeaderSectionProps) {
  return (
    <div className="pb-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-stretch bg-white border border-gray-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(37,87,167,0.10)] focus-within:border-[#2557a7]/50 focus-within:shadow-[0_4px_20px_rgba(37,87,167,0.12)] transition-all duration-200 overflow-hidden">
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

          <button
            type="button"
            className="px-8 py-3.5 bg-[#2557a7] hover:bg-[#1e4a96] active:bg-[#1a3f84] text-white text-sm font-bold transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}