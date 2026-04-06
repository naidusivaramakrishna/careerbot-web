"use client";

import { useState, useRef, useEffect, useMemo } from "react";

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

const Chevron = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

type Props = {
  selected?: string[];
  onToggle?: (f: string) => void;
  onFilterChange?: (filters: FilterParams) => void;
  jobs?: any[];
};

export interface FilterParams {
  salary_min?: number;
  salary_max?: number;
  experience_level?: string;
  years_min?: number;
  years_max?: number;
  job_type?: string;
  work_model?: string;
}

// Helper function to extract unique salary values from jobs
function extractSalaryPresets(jobs: any[] = []): { label: string; value: number }[] {
  const salaryValues = new Set<number>();

  jobs.forEach((job) => {
    const salaryStr = job.salary || "";
    if (!salaryStr) return;

    // Extract numeric value from salary string
    const cleaned = salaryStr.replace(/[₹,]/g, "").toLowerCase();
    const lakhMatch = cleaned.match(/(\d+\.?\d*)\s*l/);
    const kMatch = cleaned.match(/(\d+\.?\d*)\s*k/);
    const numMatch = cleaned.match(/(\d+)/);

    let salaryNum = 0;
    if (lakhMatch) {
      salaryNum = Math.floor(parseFloat(lakhMatch[1]) * 100000);
    } else if (kMatch) {
      salaryNum = Math.floor(parseFloat(kMatch[1]) * 1000);
    } else if (numMatch) {
      salaryNum = Math.floor(parseFloat(numMatch[0]));
    }

    if (salaryNum > 0) {
      // Round to nearest 50k for cleaner UI
      const rounded = Math.round(salaryNum / 50000) * 50000;
      salaryValues.add(rounded);
    }
  });

  if (salaryValues.size === 0) {
    // Return default presets if no salary data found
    return [
      { label: "Any salary", value: 0 },
      { label: "₹2L+", value: 200000 },
      { label: "₹5L+", value: 500000 },
      { label: "₹8L+", value: 800000 },
      { label: "₹12L+", value: 1200000 },
      { label: "₹20L+", value: 2000000 },
    ];
  }

  // Sort and format
  const sorted = Array.from(salaryValues).sort((a, b) => a - b);
  const presets = sorted.map((value) => ({
    label: value >= 100000 ? `₹${(value / 100000).toFixed(0)}L+` : `₹${(value / 1000).toFixed(0)}K+`,
    value,
  }));

  return [{ label: "Any salary", value: 0 }, ...presets];
}

export default function QuickFilters({ selected = [], onToggle, onFilterChange, jobs = [] }: Props) {
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [tempRemote, setTempRemote] = useState<string[]>([]);
  const remoteRef = useRef<HTMLDivElement>(null);

  const [jobTypeOpen, setJobTypeOpen] = useState(false);
  const [tempJobType, setTempJobType] = useState<string[]>([]);
  const jobTypeRef = useRef<HTMLDivElement>(null);

  const [expOpen, setExpOpen] = useState(false);
  const [tempExp, setTempExp] = useState<string[]>([]);
  const expRef = useRef<HTMLDivElement>(null);

  const [yearsOpen, setYearsOpen] = useState(false);
  const [activeYears, setActiveYears] = useState<string>("Any requirements");
  const [openToAll, setOpenToAll] = useState(true);
  const [minYears, setMinYears] = useState(0);
  const [maxYears, setMaxYears] = useState(11);
  const yearsRef = useRef<HTMLDivElement>(null);

  const [salaryOpen, setSalaryOpen] = useState(false);
  const [activeSalary, setActiveSalary] = useState<string>("Any salary");
  const [openToAllSalary, setOpenToAllSalary] = useState(true);
  const [minSalary, setMinSalary] = useState(0);
  const salaryRef = useRef<HTMLDivElement>(null);

  // Compute salary presets from jobs data
  const salaryPresets = useMemo(() => extractSalaryPresets(jobs), [jobs]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (remoteRef.current && !remoteRef.current.contains(e.target as Node)) setRemoteOpen(false);
      if (jobTypeRef.current && !jobTypeRef.current.contains(e.target as Node)) setJobTypeOpen(false);
      if (expRef.current && !expRef.current.contains(e.target as Node)) setExpOpen(false);
      if (yearsRef.current && !yearsRef.current.contains(e.target as Node)) setYearsOpen(false);
      if (salaryRef.current && !salaryRef.current.contains(e.target as Node)) setSalaryOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Remote dropdown
  const activeWorkModels = WORK_MODELS.filter((w) => selected.includes(w));
  const remoteActive = activeWorkModels.length > 0;

  const handleRemoteOpen = () => {
    setTempRemote(activeWorkModels);
    setRemoteOpen(true);
  };

  const handleRemoteConfirm = () => {
    WORK_MODELS.forEach((w) => {
      if (selected.includes(w) && !tempRemote.includes(w)) onToggle?.(w);
    });
    tempRemote.forEach((w) => {
      if (!selected.includes(w)) onToggle?.(w);
    });
    setRemoteOpen(false);
  };

  // Job Type dropdown
  const activeJobTypes = JOB_TYPES.filter((t) => selected.includes(t));
  const jobTypeActive = activeJobTypes.length > 0;

  const handleJobTypeOpen = () => {
    setTempJobType(activeJobTypes);
    setJobTypeOpen(true);
  };

  const handleJobTypeConfirm = () => {
    JOB_TYPES.forEach((t) => {
      if (selected.includes(t) && !tempJobType.includes(t)) onToggle?.(t);
    });
    tempJobType.forEach((t) => {
      if (!selected.includes(t)) onToggle?.(t);
    });
    setJobTypeOpen(false);
  };

  // Experience dropdown
  const activeExpLevels = EXPERIENCE_LEVELS.filter((l) => selected.includes(l));
  const expActive = activeExpLevels.length > 0;

  const handleExpOpen = () => {
    setTempExp(activeExpLevels);
    setExpOpen(true);
  };

  const handleExpConfirm = () => {
    EXPERIENCE_LEVELS.forEach((l) => {
      if (selected.includes(l) && !tempExp.includes(l)) onToggle?.(l);
    });
    tempExp.forEach((l) => {
      if (!selected.includes(l)) onToggle?.(l);
    });
    setExpOpen(false);
  };

  // Salary dropdown
  const salaryActive = activeSalary !== "Any salary";

  const handleSalaryOpen = () => {
    // Sync form state to match currently selected filter
    if (activeSalary === "Any salary") {
      setOpenToAllSalary(true);
      setMinSalary(0);
      console.log("📂 Opening salary dropdown: toggle ON, no salary limit");
    } else {
      setOpenToAllSalary(false);
      const preset = salaryPresets.find((p) => p.label === activeSalary);
      if (preset) setMinSalary(preset.value);
      console.log(`📂 Opening salary dropdown: toggle OFF, ${activeSalary} selected`);
    }
    setSalaryOpen(true);
  };

  const handleSalaryConfirm = () => {
    if (openToAllSalary) {
      setActiveSalary("Any salary");
      setMinSalary(0);
      console.log("💰 Salary filter: Any salary (no limit)");
      onToggle?.(`salary:Any salary`);
      onFilterChange?.({ salary_min: undefined, salary_max: undefined });
    } else {
      const preset = salaryPresets.find((p) => p.value === minSalary);
      const label = preset ? preset.label : `₹${(minSalary / 100000).toFixed(0)}L+`;
      setActiveSalary(label);
      console.log(`💰 Salary filter applied: ${label} (minimum ${minSalary})`);
      onToggle?.(`salary:${label}`);
      onFilterChange?.({ salary_min: minSalary });
    }
    setSalaryOpen(false);
  };

  // Years of Experience dropdown
  const yearsActive = activeYears !== "Any requirements";

  const handleYearsOpen = () => {
    setYearsOpen(true);
  };

  const handleYearsConfirm = () => {
    if (openToAll) {
      setActiveYears("Any requirements");
      onToggle?.(`years:Any requirements`);
      onFilterChange?.({ years_min: undefined, years_max: undefined });
    } else {
      const range = `${minYears}-${maxYears === 11 ? "11+" : maxYears} years`;
      setActiveYears(range);
      onToggle?.(`years:${range}`);
      // Convert to experience_level for API (map years to experience level)
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
    <div className="flex items-start gap-2 text-sm flex-wrap">
      <span className="text-gray-600 font-medium mt-1.5">Quick Filters:</span>
      <div className="flex flex-wrap gap-2">

        {/* Remote Dropdown */}
        <div className="relative" ref={remoteRef}>
          <button
            type="button"
            onClick={handleRemoteOpen}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition flex items-center gap-1 ${
              remoteActive
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            {remoteActive ? activeWorkModels[0] + (activeWorkModels.length > 1 ? ` +${activeWorkModels.length - 1}` : "") : "Remote"}
            <Chevron />
          </button>

          {remoteOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-56 py-2">
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

        {/* Full-time / Job Type Dropdown */}
        <div className="relative" ref={jobTypeRef}>
          <button
            type="button"
            onClick={handleJobTypeOpen}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition flex items-center gap-1 ${
              jobTypeActive
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            {jobTypeActive ? activeJobTypes[0] + (activeJobTypes.length > 1 ? ` +${activeJobTypes.length - 1}` : "") : "Full-time"}
            <Chevron />
          </button>

          {jobTypeOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-48 py-2">
              <p className="text-xs font-semibold text-red-500 px-3 pb-1">*Job Type</p>
              {JOB_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={tempJobType.includes(type)}
                    onChange={() => setTempJobType((prev) =>
                      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                    )}
                    className="accent-blue-600 w-3.5 h-3.5"
                  />
                  {type}
                </label>
              ))}
              <div className="px-3 pt-2">
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

        {/* Experience Level Dropdown */}
        <div className="relative" ref={expRef}>
          <button
            type="button"
            onClick={handleExpOpen}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition flex items-center gap-1 ${
              expActive
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            {expActive ? activeExpLevels[0] + (activeExpLevels.length > 1 ? ` +${activeExpLevels.length - 1}` : "") : "Intern/New Grad"}
            <Chevron />
          </button>

          {expOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 py-2">
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
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition flex items-center gap-1 ${
              salaryActive
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            {salaryActive ? activeSalary : "Salary"}
            <Chevron />
          </button>

          {salaryOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 py-3">
              {/* Header */}
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
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition flex items-center gap-1 ${
              yearsActive
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            {yearsActive ? activeYears : "Years of Experience"}
            <Chevron />
          </button>

          {yearsOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-60 py-3">
              {/* Header with toggle */}
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
                /* Toggle ON → Any requirements radio */
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
                /* Toggle OFF → Range slider + radios */
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
                      type="range" min={0} max={11} value={minYears}
                      onChange={(e) => { const v = Number(e.target.value); if (v <= maxYears) setMinYears(v); }}
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
                      type="range" min={0} max={11} value={maxYears}
                      onChange={(e) => { const v = Number(e.target.value); if (v >= minYears) setMaxYears(v); }}
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

                  {/* Experience range radios */}
                  <div className="border-t border-gray-100 pt-2 mt-1">
                    {[
                      { label: "0-1 years", min: 0, max: 1 },
                      { label: "1-3 years", min: 1, max: 3 },
                      { label: "3-5 years", min: 3, max: 5 },
                      { label: "5-8 years", min: 5, max: 8 },
                      { label: "8+ years",  min: 8, max: 11 },
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
  );
}
