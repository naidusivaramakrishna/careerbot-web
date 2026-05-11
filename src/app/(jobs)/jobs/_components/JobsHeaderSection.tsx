"use client";

import { Search, MapPin, Briefcase, ChevronDown } from "lucide-react";
import { useState } from "react";

interface JobsHeaderSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCityChange?: (city: string) => void;
  onExperienceChange?: (exp: string) => void;
  cityValue?: string;
  experienceValue?: string;
}

const EXPERIENCE_OPTIONS = [
  "Any experience",
  "0–1 years",
  "1–3 years",
  "3–5 years",
  "5–8 years",
  "8+ years",
];

export default function JobsHeaderSection({
  searchQuery,
  onSearchChange,
  onCityChange,
  onExperienceChange,
  cityValue = "",
  experienceValue = "",
}: JobsHeaderSectionProps) {
  const [expOpen, setExpOpen] = useState(false);
  const selectedExp = experienceValue || "Experience";

  return (
    <div className="pb-4">
      <div className="flex items-stretch bg-white border border-gray-200 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(37,87,167,0.08)] focus-within:border-[#2557a7]/40 focus-within:shadow-[0_4px_20px_rgba(37,87,167,0.10)] transition-all duration-200">

        {/* Column 1: Job title / skill / company */}
        <div className="flex-[2] flex items-center px-4 gap-2.5 min-w-0 border-r border-gray-100 rounded-l-2xl overflow-hidden">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Job title, skill or company"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchChange(searchQuery)}
            className="flex-1 py-3.5 text-[13px] text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none min-w-0"
          />
        </div>

        {/* Column 2: City or remote */}
        <div className="flex-1 flex items-center px-4 gap-2.5 min-w-0 border-r border-gray-100">
          <MapPin size={15} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="City or remote"
            value={cityValue}
            onChange={(e) => onCityChange?.(e.target.value)}
            className="flex-1 py-3.5 text-[13px] text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none min-w-0"
          />
        </div>

        {/* Column 3: Experience dropdown */}
        <div className="relative flex-[0.8]">
          <button
            type="button"
            onClick={() => setExpOpen((v) => !v)}
            className="w-full h-full flex items-center gap-2 px-4 border-r border-gray-100 hover:bg-gray-50/60 transition-colors"
          >
            <Briefcase size={15} className="text-gray-400 shrink-0" />
            <span className={`flex-1 text-left text-[13px] truncate ${experienceValue ? "text-gray-800" : "text-gray-400"}`}>
              {selectedExp}
            </span>
            <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${expOpen ? "rotate-180" : ""}`} />
          </button>

          {expOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onExperienceChange?.(opt === "Any experience" ? "" : opt);
                    setExpOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[12.5px] hover:bg-[#f0f4ff] transition-colors ${
                    (opt === "Any experience" ? "" : opt) === experienceValue
                      ? "text-[#2557a7] font-semibold bg-[#f0f4ff]"
                      : "text-gray-700"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={() => onSearchChange(searchQuery)}
          className="flex items-center gap-2 px-7 bg-[#2557a7] hover:bg-[#1e4a96] active:bg-[#1a3f84] text-white text-[13px] font-bold transition-colors whitespace-nowrap rounded-r-2xl"
        >
          <Search size={14} />
          Search
        </button>
      </div>
    </div>
  );
}
