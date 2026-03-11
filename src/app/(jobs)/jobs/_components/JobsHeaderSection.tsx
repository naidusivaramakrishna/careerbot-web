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
  jobs?: any[];
}

const filterOptions = [
  { id: "recommended", label: "Recommended" },
  { id: "top-matched", label: "Top Matched" },
  { id: "most-recent", label: "Most Recent" },
];

const locations = [
  "All Locations",
  "Hyderabad, India",
  "Bangalore, India",
  "Chennai, India",
  "Pune, India",
  "Mumbai, India",
  "Delhi, India",
  "Kolkata, India",
  "Ahmedabad, India",
  "Jaipur, India",
  "Surat, India",
  "Lucknow, India",
  "Kanpur, India",
  "Nagpur, India",
  "Indore, India",
  "Thane, India",
  "Bhopal, India",
  "Visakhapatnam, India",
  "Pimpri-Chinchwad, India",
  "Patna, India",
  "Vadodara, India",
  "Ghaziabad, India",
  "Ludhiana, India",
  "Agra, India",
  "Nashik, India",
  "Faridabad, India",
  "Meerut, India",
  "Rajkot, India",
  "Kalyan-Dombivli, India",
  "Vasai-Virar, India",
  "Varanasi, India",
  "Srinagar, India",
  "Aurangabad, India",
  "Dhanbad, India",
  "Amritsar, India",
  "Navi Mumbai, India",
  "Allahabad, India",
  "Ranchi, India",
  "Howrah, India",
  "Coimbatore, India",
  "Jabalpur, India",
  "Gwalior, India",
  "Vijayawada, India",
  "Jodhpur, India",
  "Madurai, India",
  "Raipur, India",
  "Kota, India",
  "Guwahati, India",
  "Chandigarh, India",
  "Solapur, India",
  "Hubli-Dharwad, India",
  "Bareilly, India",
  "Moradabad, India",
  "Mysore, India",
  "Gurgaon, India",
  "Aligarh, India",
  "Jalandhar, India",
  "Tiruchirappalli, India",
  "Bhubaneswar, India",
  "Salem, India",
  "Mira-Bhayandar, India",
  "Warangal, India",
  "Thiruvananthapuram, India",
  "Bhiwandi, India",
  "Saharanpur, India",
  "Guntur, India",
  "Amravati, India",
  "Bikaner, India",
  "Noida, India",
  "Jamshedpur, India",
  "Bhilai, India",
  "Cuttack, India",
  "Firozabad, India",
  "Kochi, India",
  "Nellore, India",
  "Bhavnagar, India",
  "Dehradun, India",
  "Durgapur, India",
  "Asansol, India",
  "Rourkela, India",
  "Nanded, India",
  "Kolhapur, India",
  "Ajmer, India",
  "Akola, India",
  "Gulbarga, India",
  "Jamnagar, India",
  "Ujjain, India",
  "Loni, India",
  "Siliguri, India",
  "Jhansi, India",
  "Ulhasnagar, India",
  "Jammu, India",
  "Sangli-Miraj & Kupwad, India",
  "Mangalore, India",
  "Erode, India",
  "Belgaum, India",
  "Ambattur, India",
  "Tirunelveli, India",
  "Malegaon, India",
  "Gaya, India",
  "Tiruppur, India",
  "Davanagere, India",
  "Kozhikode, India",
  "Akbarpur, India",
  "Remote",
];

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

// Hardcoded salary presets
const SALARY_PRESETS = [
  { label: "Any salary", value: 0 },
  { label: "₹2L+", value: 200000 },
  { label: "₹5L+", value: 500000 },
  { label: "₹8L+", value: 800000 },
  { label: "₹12L+", value: 1200000 },
  { label: "₹20L+", value: 2000000 },
];

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

  const salaryPresets = SALARY_PRESETS;

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

  return (
    <div className="pt-8 pb-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* HERO HEADER SECTION */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Find Jobs That Match You
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Discover opportunities tailored to your skills and experience.
          </p>
        </div>

        {/* Search Row: Job Title + Location + Experience + Search Button - SINGLE LINE */}
        <div className="border border-gray-200 rounded-xl shadow-sm bg-white p-1 flex gap-1 items-stretch">
          {/* Job Title / Skill Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Job title / skill"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-3 text-sm focus:outline-none bg-transparent"
            />
          </div>

          {/* Location Dropdown */}
          <div className="relative w-48 border-l border-gray-200" ref={locationRef}>
            <button
              type="button"
              onClick={() => setLocationOpen(!locationOpen)}
              className="w-full px-4 py-3 text-sm font-medium text-gray-700 transition-colors flex items-center justify-between bg-transparent"
              title="Filter by location"
            >
              <span className="truncate">{selectedLocation || "Location"}</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 flex-shrink-0 ${
                  locationOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {locationOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {locations.map((location) => (
                  <button
                    key={location}
                    onClick={() => {
                      onLocationChange?.(location);
                      setLocationOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      selectedLocation === location
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {selectedLocation === location && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                    {location}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Job Type Dropdown */}
          <div className="relative w-48 border-l border-gray-200" ref={jobTypeRef}>
            <button
              type="button"
              onClick={handleJobTypeOpen}
              className="w-full px-4 py-3 text-sm font-medium text-gray-700 transition-colors flex items-center justify-between bg-transparent"
              title="Job type filter"
            >
              <span className="truncate">
                {jobTypeActive
                  ? activeJobTypes[0] + (activeJobTypes.length > 1 ? ` +${activeJobTypes.length - 1}` : "")
                  : "Job type"}
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 flex-shrink-0 ${
                  jobTypeOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {jobTypeOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 py-2">
                {JOB_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
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
                      className="accent-blue-600 w-4 h-4"
                    />
                    {type}
                  </label>
                ))}
                <div className="pt-2 mt-2 px-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleJobTypeConfirm}
                    className="w-full py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Jobs Button */}
          <button
            type="button"
            className="px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors whitespace-nowrap rounded-r-lg border-l border-gray-200"
            onClick={() => {
              // Trigger search on button click (already handled by input onChange)
              console.log("Search triggered");
            }}
          >
            Search
          </button>
        </div>
      </div>

      {/* QUICK FILTERS ROW */}
      <div className="flex items-center gap-2 flex-nowrap overflow-x-auto py-1 mt-3">
        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Quick Filters:
        </span>
        <div className="flex flex-nowrap gap-2 overflow-x-auto">
          {/* Remote Dropdown */}
          <div className="relative" ref={remoteRef}>
            <button
              type="button"
              onClick={handleRemoteOpen}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                remoteActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
              title="Work model filter"
            >
              {remoteActive ? activeWorkModels[0] + (activeWorkModels.length > 1 ? ` +${activeWorkModels.length - 1}` : "") : "Remote"}
              <Chevron />
            </button>

            {remoteOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-56 py-2">
                <p className="text-xs font-semibold text-red-500 px-3 pb-1">*Work Model</p>
                {WORK_MODELS.map((model) => (
                  <label
                    key={model}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={tempRemote.includes(model)}
                      onChange={() => setTempRemote((prev) =>
                        prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
                      )}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    {model}
                  </label>
                ))}
                <div className="px-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRemoteConfirm}
                    className="w-full py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Confirm
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
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                expActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
              title="Experience level filter"
            >
              {expActive ? activeExpLevels[0] + (activeExpLevels.length > 1 ? ` +${activeExpLevels.length - 1}` : "") : "Intern/New Grad"}
              <Chevron />
            </button>

            {expOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 py-2">
                <p className="text-xs font-semibold text-red-500 px-3 pb-1">*Experience Level</p>
                {EXPERIENCE_LEVELS.map((level) => (
                  <label
                    key={level}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={tempExp.includes(level)}
                      onChange={() => setTempExp((prev) =>
                        prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
                      )}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    {level}
                  </label>
                ))}
                <div className="px-3 pt-2">
                  <button
                    type="button"
                    onClick={handleExpConfirm}
                    className="w-full py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Confirm
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
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                salaryActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
              title="Salary filter"
            >
              {salaryActive ? activeSalary : "Salary"}
              <Chevron />
            </button>

            {salaryOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 py-3">
                <div className="flex items-center justify-between px-3 pb-3">
                  <p className="text-xs font-semibold text-gray-800">Minimum Annual Salary</p>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <span>Open to all</span>
                    <div
                      onClick={() => setOpenToAllSalary(!openToAllSalary)}
                      className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                        openToAllSalary ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                        openToAllSalary ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </div>
                  </label>
                </div>

                {openToAllSalary ? (
                  <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs text-gray-700">
                    <input
                      type="radio"
                      name="salaryRange"
                      checked
                      readOnly
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    Any salary
                  </label>
                ) : (
                  <div className="px-3 py-1">
                    <p className="text-xs text-gray-700 mb-3 font-medium">
                      {salaryPresets.find((p) => p.value === minSalary)?.label ?? `₹${(minSalary / 100000).toFixed(0)}L+`}
                    </p>
                    <div className="border-t border-gray-100 pt-2">
                      {salaryPresets.filter((p) => p.value > 0).map((preset) => (
                        <label
                          key={preset.label}
                          className="flex items-center gap-2 py-1 cursor-pointer text-xs text-gray-700 hover:text-gray-900"
                        >
                          <input
                            type="radio"
                            name="salaryPreset"
                            checked={minSalary === preset.value}
                            onChange={() => setMinSalary(preset.value)}
                            className="accent-green-500 w-3.5 h-3.5"
                          />
                          {preset.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-3 pt-3">
                  <button
                    type="button"
                    onClick={handleSalaryConfirm}
                    className="w-full py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Confirm
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
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                yearsActive
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
              title="Years of experience filter"
            >
              {yearsActive ? activeYears : "Years of Experience"}
              <Chevron />
            </button>

            {yearsOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-60 py-3">
                <div className="flex items-center justify-between px-3 pb-3">
                  <p className="text-xs font-semibold text-gray-800">Required Experience</p>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <span>Open to all</span>
                    <div
                      onClick={() => setOpenToAll(!openToAll)}
                      className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                        openToAll ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                        openToAll ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </div>
                  </label>
                </div>

                {openToAll ? (
                  <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs text-gray-700">
                    <input
                      type="radio"
                      name="yearsOfExp"
                      checked
                      readOnly
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    Any requirements
                  </label>
                ) : (
                  <div className="px-3 py-1">
                    <p className="text-xs text-gray-700 mb-2 font-medium">
                      {minYears}-{maxYears === 11 ? "11+" : maxYears} Years
                    </p>
                    <div className="relative h-5 flex items-center mb-3">
                      <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full" />
                      <div
                        className="absolute h-1 bg-green-500 rounded-full"
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
                          [&::-webkit-slider-thumb]:border-black
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
                          [&::-webkit-slider-thumb]:border-black
                          [&::-webkit-slider-thumb]:shadow-md
                          [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:transition-transform
                          [&::-webkit-slider-thumb]:hover:scale-110"
                        style={{ zIndex: 4 }}
                      />
                    </div>

                    <div className="border-t border-gray-100 pt-2 mt-1">
                      {[
                        { label: "0-1 years", min: 0, max: 1 },
                        { label: "1-3 years", min: 1, max: 3 },
                        { label: "3-5 years", min: 3, max: 5 },
                        { label: "5-8 years", min: 5, max: 8 },
                        { label: "8+ years", min: 8, max: 11 },
                      ].map((opt) => (
                        <label
                          key={opt.label}
                          className="flex items-center gap-2 py-1 cursor-pointer text-xs text-gray-700 hover:text-gray-900"
                        >
                          <input
                            type="radio"
                            name="expRange"
                            checked={minYears === opt.min && maxYears === opt.max}
                            onChange={() => { setMinYears(opt.min); setMaxYears(opt.max); }}
                            className="accent-green-500 w-3.5 h-3.5"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-3 pt-3">
                  <button
                    type="button"
                    onClick={handleYearsConfirm}
                    className="w-full py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
