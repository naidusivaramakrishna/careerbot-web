"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, MapPin, ChevronDown, Star } from "lucide-react";
import type { FilterParams } from "./filters/QuickFilters";

interface JobsHeaderSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation?: string;
  onLocationChange?: (location: string) => void;
  selectedFilters?: string[];
  onFilterToggle?: (filter: string) => void;
  onFilterChange?: (filters: FilterParams) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobs?: any[];
}

const filterOptions = [
  { id: "recommended", label: "Recommended" },
  { id: "top-matched", label: "Top Matched" },
  { id: "most-recent", label: "Most Recent" },
];

// Fallback locations (in case no jobs loaded yet)
const defaultLocations = [
  "All Locations",
  "Hyderabad, India",
  "Bangalore, India",
  "Chennai, India",
  "Pune, India",
  "Mumbai, India",
  "Delhi, India",
  "Remote",
];

// Helper function to extract unique locations from jobs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLocationsFromJobs(jobsData: any[] = []): string[] {
  const locationsSet = new Set<string>();
  locationsSet.add("All Locations"); // Always include "All Locations" first

  jobsData.forEach((job) => {
    if (job.location) {
      locationsSet.add(job.location);
    }
  });

  // If no jobs or no locations found, use defaults
  if (locationsSet.size === 1) {
    return defaultLocations;
  }

  return Array.from(locationsSet);
}

const WORK_MODELS = ["Onsite", "Hybrid", "Remote anywhere in the India"];
const JOB_TYPES = ["Full-time", "Contract", "Part-time", "Internship"];
const EXPERIENCE_LEVELS = [
  "Intern/New Grad",
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Lead/Staff",
  "Director/Executive",
];

const DEFAULT_SALARY_PRESETS = [
  { label: "Any salary", value: 0 },
  { label: "₹2L+", value: 200000 },
  { label: "₹5L+", value: 500000 },
  { label: "₹8L+", value: 800000 },
  { label: "₹12L+", value: 1200000 },
  { label: "₹20L+", value: 2000000 },
];

// Extract salary presets from jobs data
function extractSalaryPresets(jobsData: { salary?: string }[]): { label: string; value: number }[] {
  const values = new Set<number>();
  jobsData.forEach((job) => {
    if (!job.salary) return;
    const nums = String(job.salary).match(/\d+(\.\d+)?/g);
    if (!nums) return;
    nums.forEach((n) => {
      let val = parseFloat(n);
      // Convert LPA to absolute (e.g. 12 LPA → 1200000)
      if (val < 1000) val = val * 100000;
      // Round to nearest 2L for cleaner presets
      val = Math.round(val / 200000) * 200000;
      if (val > 0) values.add(val);
    });
  });
  if (values.size === 0) return DEFAULT_SALARY_PRESETS;
  const sorted = Array.from(values).sort((a, b) => a - b);
  return [
    { label: "Any salary", value: 0 },
    ...sorted.map((v) => ({ label: `₹${(v / 100000).toFixed(0)}L+`, value: v })),
  ];
}

// Extract years of experience presets from jobs data
function extractYearsPresets(jobsData: { experience?: string }[]): { label: string; min: number; max: number }[] {
  const ranges = new Set<string>();
  jobsData.forEach((job) => {
    if (!job.experience) return;
    const nums = String(job.experience).match(/\d+/g);
    if (!nums) return;
    if (nums.length >= 2) {
      ranges.add(`${nums[0]}-${nums[1]}`);
    } else if (nums.length === 1) {
      ranges.add(`${nums[0]}-${nums[0]}`);
    }
  });
  if (ranges.size === 0) return [
    { label: "0-1 years", min: 0, max: 1 },
    { label: "1-3 years", min: 1, max: 3 },
    { label: "3-5 years", min: 3, max: 5 },
    { label: "5-8 years", min: 5, max: 8 },
    { label: "8+ years", min: 8, max: 11 },
  ];
  return Array.from(ranges)
    .map((r) => {
      const [mn, mx] = r.split("-").map(Number);
      return { label: `${mn}-${mx} years`, min: mn, max: mx };
    })
    .sort((a, b) => a.min - b.min)
    .filter((v, i, arr) => i === 0 || v.min !== arr[i - 1].min);
}

const Chevron = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function JobsHeaderSection({
  searchQuery,
  onSearchChange,
  selectedLocation = "All Locations",
  onLocationChange,
  selectedFilters = [],
  onFilterToggle,
  onFilterChange,
  jobs = [],
}: JobsHeaderSectionProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [sortFilter, setSortFilter] = useState<"recommended" | "top-matched" | "most-recent">(
    "recommended"
  );

  // Remote work model dropdown
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [tempRemote, setTempRemote] = useState<string[]>([]);
  const remoteRef = useRef<HTMLDivElement>(null);

  // Job type dropdown
  const [jobTypeOpen, setJobTypeOpen] = useState(false);
  const [tempJobType, setTempJobType] = useState<string[]>([]);
  const jobTypeRef = useRef<HTMLDivElement>(null);

  // Experience level dropdown
  const [expOpen, setExpOpen] = useState(false);
  const [tempExp, setTempExp] = useState<string[]>([]);
  const expRef = useRef<HTMLDivElement>(null);

  // Salary dropdown
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [activeSalary, setActiveSalary] = useState<string>("Any salary");
  const [openToAllSalary, setOpenToAllSalary] = useState(true);
  const [minSalary, setMinSalary] = useState(0);
  const salaryRef = useRef<HTMLDivElement>(null);

  // Years of experience dropdown
  const [yearsOpen, setYearsOpen] = useState(false);
  const [activeYears, setActiveYears] = useState<string>("Any requirements");
  const [openToAll, setOpenToAll] = useState(true);
  const [minYears, setMinYears] = useState(0);
  const [maxYears, setMaxYears] = useState(11);
  const yearsRef = useRef<HTMLDivElement>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const salaryPresets = useMemo(() => extractSalaryPresets(jobs), [jobs]);
  const yearsPresets = useMemo(() => extractYearsPresets(jobs), [jobs]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
      if (remoteRef.current && !remoteRef.current.contains(e.target as Node)) {
        setRemoteOpen(false);
      }
      if (jobTypeRef.current && !jobTypeRef.current.contains(e.target as Node)) {
        setJobTypeOpen(false);
      }
      if (expRef.current && !expRef.current.contains(e.target as Node)) {
        setExpOpen(false);
      }
      if (salaryRef.current && !salaryRef.current.contains(e.target as Node)) {
        setSalaryOpen(false);
      }
      if (yearsRef.current && !yearsRef.current.contains(e.target as Node)) {
        setYearsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Remote dropdown handlers
  const activeWorkModels = WORK_MODELS.filter((w) => selectedFilters.includes(w));
  const remoteActive = activeWorkModels.length > 0;

  const handleRemoteOpen = () => {
    setTempRemote(activeWorkModels);
    setRemoteOpen(true);
  };

  const handleRemoteConfirm = () => {
    WORK_MODELS.forEach((w) => {
      if (selectedFilters.includes(w) && !tempRemote.includes(w)) onFilterToggle?.(w);
    });
    tempRemote.forEach((w) => {
      if (!selectedFilters.includes(w)) onFilterToggle?.(w);
    });
    setRemoteOpen(false);
  };

  // Job type dropdown handlers
  const activeJobTypes = JOB_TYPES.filter((t) => selectedFilters.includes(t));
  const jobTypeActive = activeJobTypes.length > 0;

  const handleJobTypeOpen = () => {
    setTempJobType(activeJobTypes);
    setJobTypeOpen(true);
  };

  const handleJobTypeConfirm = () => {
    JOB_TYPES.forEach((t) => {
      if (selectedFilters.includes(t) && !tempJobType.includes(t)) onFilterToggle?.(t);
    });
    tempJobType.forEach((t) => {
      if (!selectedFilters.includes(t)) onFilterToggle?.(t);
    });
    setJobTypeOpen(false);
  };

  // Experience level dropdown handlers
  const activeExpLevels = EXPERIENCE_LEVELS.filter((l) => selectedFilters.includes(l));
  const expActive = activeExpLevels.length > 0;

  const handleExpOpen = () => {
    setTempExp(activeExpLevels);
    setExpOpen(true);
  };

  const handleExpConfirm = () => {
    EXPERIENCE_LEVELS.forEach((l) => {
      if (selectedFilters.includes(l) && !tempExp.includes(l)) onFilterToggle?.(l);
    });
    tempExp.forEach((l) => {
      if (!selectedFilters.includes(l)) onFilterToggle?.(l);
    });
    setExpOpen(false);
  };

  // Salary dropdown handlers
  const salaryActive = activeSalary !== "Any salary";

  const handleSalaryOpen = () => {
    if (activeSalary === "Any salary") {
      setOpenToAllSalary(true);
      setMinSalary(0);
    } else {
      setOpenToAllSalary(false);
      const preset = salaryPresets.find((p) => p.label === activeSalary);
      if (preset) setMinSalary(preset.value);
    }
    setSalaryOpen(true);
  };

  const handleSalaryConfirm = () => {
    if (openToAllSalary) {
      setActiveSalary("Any salary");
      setMinSalary(0);
      onFilterToggle?.(`salary:Any salary`);
      onFilterChange?.({ salary_min: undefined, salary_max: undefined });
    } else {
      const preset = salaryPresets.find((p) => p.value === minSalary);
      const label = preset ? preset.label : `₹${(minSalary / 100000).toFixed(0)}L+`;
      setActiveSalary(label);
      onFilterToggle?.(`salary:${label}`);
      onFilterChange?.({ salary_min: minSalary });
    }
    setSalaryOpen(false);
  };

  // Years of experience handlers
  const yearsActive = activeYears !== "Any requirements";

  const handleYearsOpen = () => {
    setYearsOpen(true);
  };

  const handleYearsConfirm = () => {
    if (openToAll) {
      setActiveYears("Any requirements");
      onFilterToggle?.(`years:Any requirements`);
      onFilterChange?.({ years_min: undefined, years_max: undefined });
    } else {
      const range = `${minYears}-${maxYears === 11 ? "11+" : maxYears} years`;
      setActiveYears(range);
      onFilterToggle?.(`years:${range}`);
      let experienceLevel = "Entry Level";
      if (minYears <= 0 && maxYears <= 1) experienceLevel = "Intern/New Grad";
      else if (minYears <= 1 && maxYears <= 3) experienceLevel = "Entry Level";
      else if (minYears <= 3 && maxYears <= 5) experienceLevel = "Mid Level";
      else if (minYears <= 5 && maxYears <= 8) experienceLevel = "Senior Level";
      else if (minYears >= 8) experienceLevel = "Lead/Staff";

      onFilterChange?.({ years_min: minYears, years_max: maxYears, experience_level: experienceLevel });
    }
    setYearsOpen(false);
  };

  // Dynamically extract locations from jobs data
  const locations = useMemo(() => extractLocationsFromJobs(jobs), [jobs]);

  return (
    <div className="pt-6 pb-4">
      {/* HERO HEADER */}
      <div>
        <h1 className="text-[2rem] font-bold text-gray-900 tracking-tight leading-snug">
          Find Jobs That Match You
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Discover opportunities tailored to your skills and experience.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="mt-5 flex border border-gray-200 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#2557a7]/20 focus-within:border-[#2557a7]/40 transition-all">
        {/* Job Title / Skill Input */}
        <div className="flex-1 flex items-center px-4 gap-2">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Job title / skill"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 py-3 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent focus:outline-none"
          />
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-100 self-stretch" />

        {/* Location Dropdown */}
        <div className="relative" ref={locationRef}>
          <button
            type="button"
            onClick={() => setLocationOpen(!locationOpen)}
            className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-colors"
            title="Filter by location"
          >
            <MapPin size={14} className="text-gray-400" />
            <span className="max-w-[120px] truncate">{selectedLocation || "Location"}</span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${locationOpen ? "rotate-180" : ""}`}
            />
          </button>

          {locationOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => {
                    onLocationChange?.(location);
                    setLocationOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                    selectedLocation === location
                      ? "bg-[#2557a7]/8 text-[#2557a7] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {selectedLocation === location && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2557a7] flex-shrink-0" />
                  )}
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-100 self-stretch" />

        {/* Job Type Dropdown */}
        <div className="relative" ref={jobTypeRef}>
          <button
            type="button"
            onClick={handleJobTypeOpen}
            className="flex items-center gap-1.5 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 whitespace-nowrap transition-colors"
            title="Job type filter"
          >
            <span>
              {jobTypeActive
                ? activeJobTypes[0] + (activeJobTypes.length > 1 ? ` +${activeJobTypes.length - 1}` : "")
                : "Job type"}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${jobTypeOpen ? "rotate-180" : ""}`}
            />
          </button>

          {jobTypeOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
              {JOB_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={tempJobType.includes(type)}
                    onChange={() => {
                      setTempJobType((prev) =>
                        prev.includes(type)
                          ? prev.filter((t) => t !== type)
                          : [...prev, type]
                      );
                    }}
                    className="accent-[#2557a7] w-3.5 h-3.5"
                  />
                  {type}
                </label>
              ))}
              <div className="pt-2 mt-1 px-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleJobTypeConfirm}
                  className="w-full py-1.5 bg-[#2557a7]/8 border border-[#2557a7]/20 rounded-lg text-xs font-medium text-[#2557a7] hover:bg-[#2557a7]/15 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          type="button"
          className="px-7 py-3 bg-[#2557a7] text-white text-sm font-semibold hover:bg-[#1a4a96] transition-colors whitespace-nowrap rounded-r-xl"
          onClick={() => {
            console.log("Search triggered");
          }}
        >
          Search
        </button>
      </div>

      {/* QUICK FILTERS ROW */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
          Filters:
        </span>

        {/* Remote Dropdown */}
        <div className="relative" ref={remoteRef}>
          <button
            type="button"
            onClick={handleRemoteOpen}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1 ${
              remoteActive
                ? "border-[#2557a7] text-white bg-[#2557a7]"
                : "border-gray-200 text-gray-600 bg-white hover:border-[#2557a7]/40 hover:text-[#2557a7]"
            }`}
            title="Work model filter"
          >
            {remoteActive ? activeWorkModels[0] + (activeWorkModels.length > 1 ? ` +${activeWorkModels.length - 1}` : "") : "Remote"}
            <Chevron />
          </button>

          {remoteOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-56 py-2">
              <p className="text-xs font-semibold text-gray-500 px-3 pb-2 pt-1 uppercase tracking-wide">Work Model</p>
              {WORK_MODELS.map((model) => (
                <label
                  key={model}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={tempRemote.includes(model)}
                    onChange={() => setTempRemote((prev) =>
                      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
                    )}
                    className="accent-[#2557a7] w-3.5 h-3.5"
                  />
                  {model}
                </label>
              ))}
              <div className="px-3 pt-2 border-t border-gray-100 mt-1">
                <button
                  type="button"
                  onClick={handleRemoteConfirm}
                  className="w-full py-1.5 bg-[#2557a7]/8 border border-[#2557a7]/20 rounded-lg text-xs font-medium text-[#2557a7] hover:bg-[#2557a7]/15 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Experience Level Dropdown */}
        <div className="relative" ref={expRef}>
          <button
            type="button"
            onClick={handleExpOpen}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1 ${
              expActive
                ? "border-[#2557a7] text-white bg-[#2557a7]"
                : "border-gray-200 text-gray-600 bg-white hover:border-[#2557a7]/40 hover:text-[#2557a7]"
            }`}
            title="Experience level filter"
          >
            {expActive ? activeExpLevels[0] + (activeExpLevels.length > 1 ? ` +${activeExpLevels.length - 1}` : "") : "Experience Level"}
            <Chevron />
          </button>

          {expOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 py-2">
              <p className="text-xs font-semibold text-gray-500 px-3 pb-2 pt-1 uppercase tracking-wide">Experience Level</p>
              {EXPERIENCE_LEVELS.map((level) => (
                <label
                  key={level}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={tempExp.includes(level)}
                    onChange={() => setTempExp((prev) =>
                      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
                    )}
                    className="accent-[#2557a7] w-3.5 h-3.5"
                  />
                  {level}
                </label>
              ))}
              <div className="px-3 pt-2 border-t border-gray-100 mt-1">
                <button
                  type="button"
                  onClick={handleExpConfirm}
                  className="w-full py-1.5 bg-[#2557a7]/8 border border-[#2557a7]/20 rounded-lg text-xs font-medium text-[#2557a7] hover:bg-[#2557a7]/15 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Salary Dropdown */}
        <div className="relative" ref={salaryRef}>
          <button
            type="button"
            onClick={handleSalaryOpen}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1 ${
              salaryActive
                ? "border-[#2557a7] text-white bg-[#2557a7]"
                : "border-gray-200 text-gray-600 bg-white hover:border-[#2557a7]/40 hover:text-[#2557a7]"
            }`}
            title="Salary filter"
          >
            {salaryActive ? activeSalary : "Salary"}
            <Chevron />
          </button>

          {salaryOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 py-3">
              <div className="flex items-center justify-between px-3 pb-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700">Minimum Annual Salary</p>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                  <span>Open to all</span>
                  <div
                    onClick={() => setOpenToAllSalary(!openToAllSalary)}
                    className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                      openToAllSalary ? "bg-[#2557a7]" : "bg-gray-300"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                      openToAllSalary ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </div>
                </label>
              </div>

              {openToAllSalary ? (
                <label className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs text-gray-700 mt-1">
                  <input
                    type="radio"
                    name="salaryRange"
                    checked
                    readOnly
                    className="accent-[#2557a7] w-3.5 h-3.5"
                  />
                  Any salary
                </label>
              ) : (
                <div className="px-3 py-2">
                  <p className="text-xs text-[#2557a7] mb-3 font-semibold">
                    {salaryPresets.find((p) => p.value === minSalary)?.label ?? `₹${(minSalary / 100000).toFixed(0)}L+`}
                  </p>
                  <div className="space-y-0.5">
                    {salaryPresets.filter((p) => p.value > 0).map((preset) => (
                      <label
                        key={preset.label}
                        className="flex items-center gap-2 py-1.5 cursor-pointer text-xs text-gray-700 hover:text-gray-900"
                      >
                        <input
                          type="radio"
                          name="salaryPreset"
                          checked={minSalary === preset.value}
                          onChange={() => setMinSalary(preset.value)}
                          className="accent-[#2557a7] w-3.5 h-3.5"
                        />
                        {preset.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-3 pt-2 border-t border-gray-100 mt-1">
                <button
                  type="button"
                  onClick={handleSalaryConfirm}
                  className="w-full py-1.5 bg-[#2557a7]/8 border border-[#2557a7]/20 rounded-lg text-xs font-medium text-[#2557a7] hover:bg-[#2557a7]/15 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Years of Experience Dropdown */}
        <div className="relative" ref={yearsRef}>
          <button
            type="button"
            onClick={handleYearsOpen}
            className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1 ${
              yearsActive
                ? "border-[#2557a7] text-white bg-[#2557a7]"
                : "border-gray-200 text-gray-600 bg-white hover:border-[#2557a7]/40 hover:text-[#2557a7]"
            }`}
            title="Years of experience filter"
          >
            {yearsActive ? activeYears : "Years of Exp"}
            <Chevron />
          </button>

          {yearsOpen && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-60 py-3">
              <div className="flex items-center justify-between px-3 pb-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-700">Required Experience</p>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                  <span>Open to all</span>
                  <div
                    onClick={() => setOpenToAll(!openToAll)}
                    className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                      openToAll ? "bg-[#2557a7]" : "bg-gray-300"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                      openToAll ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </div>
                </label>
              </div>

              {openToAll ? (
                <label className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs text-gray-700 mt-1">
                  <input
                    type="radio"
                    name="yearsOfExp"
                    checked
                    readOnly
                    className="accent-[#2557a7] w-3.5 h-3.5"
                  />
                  Any requirements
                </label>
              ) : (
                <div className="px-3 py-2">
                  <p className="text-xs text-[#2557a7] mb-2 font-semibold">
                    {minYears}-{maxYears === 11 ? "11+" : maxYears} Years
                  </p>
                  <div className="relative h-5 flex items-center mb-3">
                    <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full" />
                    <div
                      className="absolute h-1 bg-[#2557a7] rounded-full"
                      style={{
                        left: `${(minYears / 11) * 100}%`,
                        right: `${100 - (maxYears / 11) * 100}%`,
                      }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={11}
                      value={minYears}
                      onChange={(e) => { const v = Number(e.target.value); if (v <= maxYears) setMinYears(v); }}
                      aria-label="Minimum years of experience"
                      className="absolute w-full appearance-none bg-transparent cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-[#2557a7]
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110"
                      style={{ zIndex: minYears > maxYears - 1 ? 5 : 3 }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={11}
                      value={maxYears}
                      onChange={(e) => { const v = Number(e.target.value); if (v >= minYears) setMaxYears(v); }}
                      aria-label="Maximum years of experience"
                      className="absolute w-full appearance-none bg-transparent cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-[#2557a7]
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110"
                      style={{ zIndex: 4 }}
                    />
                  </div>

                  <div className="space-y-0.5">
                    {yearsPresets.map((opt) => (
                      <label
                        key={opt.label}
                        className="flex items-center gap-2 py-1.5 cursor-pointer text-xs text-gray-700 hover:text-gray-900"
                      >
                        <input
                          type="radio"
                          name="expRange"
                          checked={minYears === opt.min && maxYears === opt.max}
                          onChange={() => { setMinYears(opt.min); setMaxYears(opt.max); }}
                          className="accent-[#2557a7] w-3.5 h-3.5"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-3 pt-2 border-t border-gray-100 mt-1">
                <button
                  type="button"
                  onClick={handleYearsConfirm}
                  className="w-full py-1.5 bg-[#2557a7]/8 border border-[#2557a7]/20 rounded-lg text-xs font-medium text-[#2557a7] hover:bg-[#2557a7]/15 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}












