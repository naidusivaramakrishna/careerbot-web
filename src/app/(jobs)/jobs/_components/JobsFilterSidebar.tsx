"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Building2,
  Briefcase,
  GraduationCap,
  IndianRupee,
  Check,
  RotateCcw,
  X,
  MapPin,
  BookOpen,
} from "lucide-react";
import {
  WORK_MODELS,
  JOB_TYPES,
  type FilterParams,
} from "./filters/filterConstants";

interface JobsFilterPanelProps {
  selectedFilters: string[];
  onFilterToggle: (filter: string) => void;
  onFilterChange: (filters: FilterParams) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobs: any[];
}

type DropdownKey = "workModel" | "jobType" | "experience" | "salary" | "location" | "education" | null;

export default function JobsFilterSidebar({
  selectedFilters,
  onFilterToggle,
  onFilterChange,
  jobs,
}: JobsFilterPanelProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Salary slider state — index into salarySteps
  const [salarySliderIndex, setSalarySliderIndex] = useState(0);

  // Experience "View more" state
  const [showAllExp, setShowAllExp] = useState(false);
  // Pending (staged) experience selection — applied only on Apply click
  const [pendingExpLabel, setPendingExpLabel] = useState<string | null>(null);

  // Location filter state
  const [showAllLoc, setShowAllLoc] = useState(false);
  const [pendingLocations, setPendingLocations] = useState<string[]>([]);
  const [locSearch, setLocSearch] = useState("");
  const [locTab, setLocTab] = useState<"cities" | "states">("cities");

  // Education filter state
  const [showAllEdu, setShowAllEdu] = useState(false);
  const [pendingEducation, setPendingEducation] = useState<string[]>([]);
  const [eduSearch, setEduSearch] = useState("");

  // Fixed salary steps: 2 LPA → 20 LPA in steps of 2, then "Any" at right end
  const salarySteps = useMemo(() => {
    const parseSalary = (salaryStr: string): number => {
      const cleaned = (salaryStr || "").replace(/[\u20b9,]/g, "").toLowerCase();
      const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*[lk]?\s*-\s*(\d+\.?\d*)\s*[lk]/);
      if (rangeMatch) {
        const maxVal = parseFloat(rangeMatch[2]);
        const unit = cleaned.match(/[lk]/)?.[0];
        if (unit === "l") return maxVal * 100000;
        if (unit === "k") return maxVal * 1000;
        return maxVal;
      }
      const lakhMatch = cleaned.match(/(\d+\.?\d*)\s*l/);
      if (lakhMatch) return parseFloat(lakhMatch[1]) * 100000;
      const kMatch = cleaned.match(/(\d+\.?\d*)\s*k/);
      if (kMatch) return parseFloat(kMatch[1]) * 1000;
      const numMatch = cleaned.match(/(\d+)/);
      if (numMatch) return parseFloat(numMatch[1]);
      return 0;
    };
    const fixedLPA = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    const steps = fixedLPA.map((lpa) => ({
      label: `${lpa} LPA+`,
      value: lpa * 100000,
      count: jobs.filter((job) => {
        const n = parseSalary(job.salary || "");
        return n > 0 && n >= lpa * 100000;
      }).length,
    }));
    return [...steps, { label: "Any", value: 0, count: jobs.length }];
  }, [jobs]);

  // Build city options with counts
  const cityOptions = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((job) => {
      const raw = (job.location || "").split(",")[0].trim();
      if (!raw || raw === "Location not specified") return;
      map.set(raw, (map.get(raw) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [jobs]);

  // Build state options with counts
  const stateOptions = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((job) => {
      const parts = (job.location || "").split(",");
      const raw = parts[1]?.trim() || "";
      if (!raw) return;
      map.set(raw, (map.get(raw) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [jobs]);

  // Build education options with counts from job education field
  const educationOptions = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((job) => {
      const edu = job.education || "";
      if (!edu) return;
      // May be comma-separated list, split and count each
      edu.split(/[,;/]/).forEach((e: string) => {
        const trimmed = e.trim();
        if (trimmed) map.set(trimmed, (map.get(trimmed) ?? 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [jobs]);

  // Build experience options with job counts
  const experienceOptions = useMemo(() => {
    const EXP_OPTIONS = [
      { label: "Fresher", value: 0 },
      { label: "1 yr", value: 1 },
      { label: "2 yrs", value: 2 },
      { label: "3 yrs", value: 3 },
      { label: "4 yrs", value: 4 },
      { label: "5 yrs", value: 5 },
      { label: "6 yrs", value: 6 },
      { label: "7 yrs", value: 7 },
      { label: "8 yrs", value: 8 },
      { label: "9 yrs", value: 9 },
      { label: "10 yrs", value: 10 },
      { label: "11+ yrs", value: 11 },
    ];

    return EXP_OPTIONS.map((opt) => {
      const count = jobs.filter((job) => {
        const expStr = job.experience || "";
        const nums = String(expStr).match(/\d+/g);
        if (!nums) return opt.value === 0;
        const minExp = parseInt(nums[0], 10);
        if (opt.value === 0) return minExp === 0;
        if (opt.value === 11) return minExp >= 11;
        return minExp === opt.value;
      }).length;

      return { ...opt, count };
    });
  }, [jobs]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Count active filters per category
  const activeWorkModels = WORK_MODELS.filter((w) => selectedFilters.includes(w));
  const activeJobTypes = JOB_TYPES.filter((t) => selectedFilters.includes(t));
  const hasExpFilter = selectedFilters.some((f) => f.startsWith("years:"));
  const hasSalaryFilter = selectedFilters.some((f) => f.startsWith("salary:"));
  const activeLocFilters = selectedFilters.filter((f) => f.startsWith("location:")).map((f) => f.replace("location:", ""));
  const hasLocFilter = activeLocFilters.length > 0;
  const activeEduFilters = selectedFilters.filter((f) => f.startsWith("education:")).map((f) => f.replace("education:", ""));
  const hasEduFilter = activeEduFilters.length > 0;

  const selectedExpFilter = selectedFilters.find((f) => f.startsWith("years:"));
  const selectedExpValue = selectedExpFilter ? selectedExpFilter.replace("years:", "") : null;
  const selectedSalaryFilter = selectedFilters.find((f) => f.startsWith("salary:"));
  const selectedSalaryLabel = selectedSalaryFilter ? selectedSalaryFilter.replace("salary:", "") : null;

  const visibleExpOptions = showAllExp ? experienceOptions : experienceOptions.slice(0, 5);

  // Location options filtered by search
  const activeLocOptions = locTab === "cities" ? cityOptions : stateOptions;
  const filteredLocOptions = locSearch.trim()
    ? activeLocOptions.filter((o) => o.label.toLowerCase().includes(locSearch.toLowerCase()))
    : activeLocOptions;
  const visibleLocOptions = showAllLoc ? filteredLocOptions : filteredLocOptions.slice(0, 5);

  // Education options filtered by search
  const filteredEduOptions = eduSearch.trim()
    ? educationOptions.filter((o) => o.label.toLowerCase().includes(eduSearch.toLowerCase()))
    : educationOptions;
  const visibleEduOptions = showAllEdu ? filteredEduOptions : filteredEduOptions.slice(0, 5);

  const fmtCount = (count: number) =>
    count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 1 : 2)}k` : String(count);

  const totalActiveCount =
    activeWorkModels.length +
    activeJobTypes.length +
    (hasExpFilter ? 1 : 0) +
    (hasSalaryFilter ? 1 : 0);

  const handleClearAll = () => {
    selectedFilters.forEach((filter) => onFilterToggle(filter));
    setSalarySliderIndex(salarySteps.length - 1);
    setPendingExpLabel(null);
    setPendingLocations([]);
    setPendingEducation([]);
  };

  const handleEduApply = () => {
    activeEduFilters.forEach((e) => onFilterToggle(`education:${e}`));
    pendingEducation.forEach((e) => onFilterToggle(`education:${e}`));
    setOpenDropdown(null);
  };

  const handleLocApply = () => {
    // Remove all existing location filters
    activeLocFilters.forEach((loc) => onFilterToggle(`location:${loc}`));
    // Add each pending location
    pendingLocations.forEach((loc) => onFilterToggle(`location:${loc}`));
    setOpenDropdown(null);
  };

  const handleSalaryApply = () => {
    const step = salarySteps[salarySliderIndex] ?? salarySteps[salarySteps.length - 1];
    if (selectedSalaryFilter) onFilterToggle(selectedSalaryFilter);
    if (step.value > 0) {
      onFilterToggle(`salary:${step.label}`);
      onFilterChange({ salary_min: step.value });
    } else {
      onFilterChange({ salary_min: undefined, salary_max: undefined });
    }
    setOpenDropdown(null);
  };

  const handleExpSelect = (label: string) => {
    setPendingExpLabel((prev) => (prev === label ? null : label));
  };

  const handleExpApply = () => {
    // Clear any existing years filter first
    if (selectedExpFilter) onFilterToggle(selectedExpFilter);
    if (pendingExpLabel) {
      onFilterToggle(`years:${pendingExpLabel}`);
    }
    setOpenDropdown(null);
  };

  const toggleDropdown = (key: DropdownKey) => {
    // Compute next value directly — never call setState inside another setState updater
    const next: DropdownKey = openDropdown === key ? null : key;
    if (next === "experience") {
      setPendingExpLabel(selectedExpValue);
    }
    if (next === "salary") {
      const committedLabel = selectedSalaryFilter?.replace("salary:", "") ?? null;
      const i = committedLabel ? salarySteps.findIndex((s) => s.label === committedLabel) : -1;
      setSalarySliderIndex(i >= 0 ? i : Math.max(0, salarySteps.length - 1));
    }
    if (next === "location") {
      setPendingLocations(activeLocFilters);
      setLocSearch("");
      setShowAllLoc(false);
      setLocTab("cities");
    }
    if (next === "education") {
      setPendingEducation(activeEduFilters);
      setEduSearch("");
      setShowAllEdu(false);
    }
    setOpenDropdown(next);
  };

  // Get summary text for active filters in each category
  const getWorkModelSummary = () => {
    if (activeWorkModels.length === 0) return null;
    if (activeWorkModels.length === 1) return activeWorkModels[0].replace(" anywhere in the India", "");
    return `${activeWorkModels.length} selected`;
  };

  const getJobTypeSummary = () => {
    if (activeJobTypes.length === 0) return null;
    if (activeJobTypes.length === 1) return activeJobTypes[0];
    return `${activeJobTypes.length} selected`;
  };

  return (
    <div className="mt-4 pt-3.5 border-t border-gray-100" ref={containerRef}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* ── WORK MODEL PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("workModel")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              activeWorkModels.length > 0
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1e4a96]"
                : openDropdown === "workModel"
                ? "bg-[#f0f4ff] text-[#2557a7] border border-[#2557a7]/30 shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
            }`}
          >
            <Building2 size={14} className={activeWorkModels.length > 0 ? "text-white/80" : "text-gray-400 group-hover:text-[#2557a7]"} />
            <span>Work Model</span>
            {activeWorkModels.length > 1 && (
              <span className="bg-white/20 text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                {activeWorkModels.length}
              </span>
            )}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${openDropdown === "workModel" ? "rotate-180" : ""} ${
                activeWorkModels.length > 0 ? "text-white/60" : "text-gray-400"
              }`}
            />
          </button>

          {openDropdown === "workModel" && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/8 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Work Model</p>
                {activeWorkModels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => activeWorkModels.forEach((m) => onFilterToggle(m))}
                    className="text-[11px] text-[#2557a7] hover:text-[#1a4a96] font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-3" />
              <div className="p-1.5">
                {WORK_MODELS.map((model) => {
                  const isChecked = selectedFilters.includes(model);
                  return (
                    <label
                      key={model}
                      onClick={() => onFilterToggle(model)}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all ${
                        isChecked ? "bg-[#f0f4ff]" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? "bg-[#2557a7] border-[#2557a7]"
                          : "border-gray-300 group-hover:border-gray-400"
                      }`}>
                        {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-[13px] ${isChecked ? "text-[#2557a7] font-semibold" : "text-gray-700"}`}>
                        {model}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── JOB TYPE PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("jobType")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              activeJobTypes.length > 0
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1e4a96]"
                : openDropdown === "jobType"
                ? "bg-[#f0f4ff] text-[#2557a7] border border-[#2557a7]/30 shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
            }`}
          >
            <Briefcase size={14} className={activeJobTypes.length > 0 ? "text-white/80" : "text-gray-400 group-hover:text-[#2557a7]"} />
            <span>Job Type</span>
            {activeJobTypes.length > 1 && (
              <span className="bg-white/20 text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                {activeJobTypes.length}
              </span>
            )}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${openDropdown === "jobType" ? "rotate-180" : ""} ${
                activeJobTypes.length > 0 ? "text-white/60" : "text-gray-400"
              }`}
            />
          </button>

          {openDropdown === "jobType" && (
            <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/8 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Job Type</p>
                {activeJobTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => activeJobTypes.forEach((t) => onFilterToggle(t))}
                    className="text-[11px] text-[#2557a7] hover:text-[#1a4a96] font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-3" />
              <div className="p-1.5">
                {JOB_TYPES.map((type) => {
                  const isChecked = selectedFilters.includes(type);
                  return (
                    <label
                      key={type}
                      onClick={() => onFilterToggle(type)}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all ${
                        isChecked ? "bg-[#f0f4ff]" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? "bg-[#2557a7] border-[#2557a7]"
                          : "border-gray-300"
                      }`}>
                        {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-[13px] ${isChecked ? "text-[#2557a7] font-semibold" : "text-gray-700"}`}>
                        {type}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── EXPERIENCE PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("experience")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              hasExpFilter
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1e4a96]"
                : openDropdown === "experience"
                ? "bg-[#f0f4ff] text-[#2557a7] border border-[#2557a7]/30 shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
            }`}
          >
            <GraduationCap size={14} className={hasExpFilter ? "text-white/80" : "text-gray-400 group-hover:text-[#2557a7]"} />
            <span>Experience</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${openDropdown === "experience" ? "rotate-180" : ""} ${
                hasExpFilter ? "text-white/60" : "text-gray-400"
              }`}
            />
          </button>

          {openDropdown === "experience" && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/8 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Experience <span className="text-gray-400 font-normal">(yrs)</span></p>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Options */}
              <div className="px-3 pt-2 pb-1 max-h-64 overflow-y-auto">
                {visibleExpOptions.map((opt) => {
                  const isSelected = pendingExpLabel === opt.label;
                  return (
                    <label
                      key={opt.label}
                      className="flex items-center gap-2.5 py-2 px-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        isSelected ? "border-[#2557a7]" : "border-gray-300"
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#2557a7]" />}
                      </div>
                      <input
                        type="radio"
                        name="expPill"
                        checked={isSelected}
                        onChange={() => handleExpSelect(opt.label)}
                        className="sr-only"
                      />
                      <span className={`text-[13px] ${isSelected ? "text-[#2557a7] font-semibold" : "text-gray-700"}`}>
                        {opt.label}{" "}
                        <span className={`font-normal ${isSelected ? "text-[#2557a7]/70" : "text-gray-400"}`}>
                          ({fmtCount(opt.count)})
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* View more / View less */}
              {experienceOptions.length > 5 && (
                <div className="px-5 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowAllExp(!showAllExp)}
                    className="text-[13px] text-[#2557a7] underline hover:text-[#1a4a96] transition-colors"
                  >
                    {showAllExp ? "View less" : "View more"}
                  </button>
                </div>
              )}

              {/* Apply button */}
              <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleExpApply}
                  className="px-5 py-2 bg-[#2557a7] text-white rounded-xl text-xs font-bold hover:bg-[#1e4a96] active:scale-[0.98] transition-all shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── SALARY PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("salary")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              hasSalaryFilter
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1e4a96]"
                : openDropdown === "salary"
                ? "bg-[#f0f4ff] text-[#2557a7] border border-[#2557a7]/30 shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
            }`}
          >
            <IndianRupee size={14} className={hasSalaryFilter ? "text-white/80" : "text-gray-400 group-hover:text-[#2557a7]"} />
            <span>Salary</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${openDropdown === "salary" ? "rotate-180" : ""} ${
                hasSalaryFilter ? "text-white/60" : "text-gray-400"
              }`}
            />
          </button>

          {openDropdown === "salary" && (() => {
            const lastIdx = Math.max(1, salarySteps.length - 1);
            const clampedIdx = Math.min(Math.max(salarySliderIndex, 0), lastIdx);
            const step = salarySteps[clampedIdx] ?? salarySteps[lastIdx];
            // pct: fraction along the track (0 = left/high-salary, 100 = right/Any)
            const pct = (clampedIdx / lastIdx) * 100;
            // Thumb-accurate offset: browser thumb stays within track
            // center = left + (1 - 2*pct/100) * thumbRadius
            const thumbR = 9; // 18px / 2
            const tooltipLeft = `calc(${pct}% + ${(1 - 2 * pct / 100) * thumbR}px)`;
            return (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/8 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    Salary <span className="text-gray-400 font-normal">(Annually)</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Slider area */}
                <div className="px-4 pt-8 pb-5">
                  {/* Tooltip bubble — positioned above thumb */}
                  <div className="relative h-7 mb-1">
                    <div
                      className="absolute -translate-x-1/2 bottom-0 bg-gray-700 text-white text-[11px] font-semibold rounded-md px-2 py-0.5 whitespace-nowrap pointer-events-none"
                      style={{ left: tooltipLeft }}
                    >
                      {step.label} ({step.count} Jobs)
                      <span className="absolute left-1/2 -translate-x-1/2 top-full border-[5px] border-transparent border-t-gray-700" />
                    </div>
                  </div>

                  {/* Range input */}
                  <style>{`
                    .salary-slider { -webkit-appearance: none; appearance: none; outline: none; }
                    .salary-slider::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      width: 18px; height: 18px;
                      border-radius: 50%;
                      background: #1a1a2e;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                      margin-top: -7px;
                    }
                    .salary-slider::-moz-range-thumb {
                      width: 18px; height: 18px;
                      border-radius: 50%;
                      background: #1a1a2e;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                    }
                    .salary-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 9999px; }
                    .salary-slider::-moz-range-track { height: 4px; border-radius: 9999px; background: #e5e7eb; }
                  `}</style>
                  <input
                    type="range"
                    min={0}
                    max={lastIdx}
                    step={1}
                    value={clampedIdx}
                    onChange={(e) => setSalarySliderIndex(Number(e.target.value))}
                    className="salary-slider w-full cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #1a1a2e 0%, #1a1a2e ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
                    }}
                  />

                  {/* Thumb label below */}
                  <div className="relative h-4 mt-0.5">
                    <span
                      className="absolute -translate-x-1/2 text-[11px] text-gray-500 whitespace-nowrap"
                      style={{ left: tooltipLeft }}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>

                {/* Apply button */}
                <div className="px-4 pb-3 border-t border-gray-100 flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSalaryApply}
                    className="px-5 py-2 bg-[#2557a7] text-white rounded-xl text-xs font-bold hover:bg-[#1e4a96] active:scale-[0.98] transition-all shadow-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── LOCATION PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("location")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              hasLocFilter
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1e4a96]"
                : openDropdown === "location"
                ? "bg-[#f0f4ff] text-[#2557a7] border border-[#2557a7]/30 shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
            }`}
          >
            <MapPin size={14} className={hasLocFilter ? "text-white/80" : "text-gray-400 group-hover:text-[#2557a7]"} />
            <span>Location</span>
            {activeLocFilters.length > 1 && (
              <span className="bg-white/20 text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                {activeLocFilters.length}
              </span>
            )}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${openDropdown === "location" ? "rotate-180" : ""} ${
                hasLocFilter ? "text-white/60" : "text-gray-400"
              }`}
            />
          </button>

          {openDropdown === "location" && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/8 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Location</p>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 pt-3 pb-2">
                <input
                  type="text"
                  placeholder="Search Location"
                  value={locSearch}
                  onChange={(e) => { setLocSearch(e.target.value); setShowAllLoc(false); }}
                  className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#2557a7] transition-colors"
                />
              </div>

              {/* Cities / States tabs */}
              <div className="px-4 pb-2">
                <div className="flex bg-gray-100 rounded-full p-0.5 gap-0.5">
                  {(["cities", "states"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setLocTab(tab); setShowAllLoc(false); }}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${
                        locTab === tab
                          ? "bg-white text-gray-800 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="px-3 pb-1 max-h-56 overflow-y-auto">
                {visibleLocOptions.length === 0 ? (
                  <p className="text-[12px] text-gray-400 text-center py-4">No results found</p>
                ) : (
                  visibleLocOptions.map((opt) => {
                    const isChecked = pendingLocations.includes(opt.label);
                    return (
                      <label
                        key={opt.label}
                        className="flex items-center gap-2.5 py-2 px-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-4 h-4 rounded-sm border-2 shrink-0 flex items-center justify-center transition-all ${
                            isChecked ? "bg-[#2557a7] border-[#2557a7]" : "border-gray-300"
                          }`}
                        >
                          {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setPendingLocations((prev) =>
                              prev.includes(opt.label)
                                ? prev.filter((l) => l !== opt.label)
                                : [...prev, opt.label]
                            )
                          }
                          className="sr-only"
                        />
                        <span className={`text-[13px] ${isChecked ? "text-[#2557a7] font-semibold" : "text-gray-700"}`}>
                          {opt.label}{" "}
                          <span className={`font-normal ${isChecked ? "text-[#2557a7]/70" : "text-gray-400"}`}>
                            ({fmtCount(opt.count)})
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* View more / View less */}
              {filteredLocOptions.length > 5 && (
                <div className="px-5 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowAllLoc(!showAllLoc)}
                    className="text-[13px] text-[#2557a7] underline hover:text-[#1a4a96] transition-colors"
                  >
                    {showAllLoc ? "View less" : "View more"}
                  </button>
                </div>
              )}

              {/* Apply button */}
              <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleLocApply}
                  className="px-5 py-2 bg-[#2557a7] text-white rounded-xl text-xs font-bold hover:bg-[#1e4a96] active:scale-[0.98] transition-all shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── EDUCATION PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("education")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              hasEduFilter
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1e4a96]"
                : openDropdown === "education"
                ? "bg-[#f0f4ff] text-[#2557a7] border border-[#2557a7]/30 shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
            }`}
          >
            <BookOpen size={14} className={hasEduFilter ? "text-white/80" : "text-gray-400 group-hover:text-[#2557a7]"} />
            <span>Education</span>
            {activeEduFilters.length > 1 && (
              <span className="bg-white/20 text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                {activeEduFilters.length}
              </span>
            )}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${openDropdown === "education" ? "rotate-180" : ""} ${
                hasEduFilter ? "text-white/60" : "text-gray-400"
              }`}
            />
          </button>

          {openDropdown === "education" && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/8 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Education</p>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Search */}
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Education"
                    value={eduSearch}
                    onChange={(e) => { setEduSearch(e.target.value); setShowAllEdu(false); }}
                    className="w-full px-3 py-2 pr-8 text-[13px] border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#2557a7] transition-colors"
                  />
                  {eduSearch && (
                    <button
                      type="button"
                      onClick={() => setEduSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="px-3 pb-1 max-h-56 overflow-y-auto">
                {visibleEduOptions.length === 0 ? (
                  <p className="text-[12px] text-gray-400 text-center py-4">No results found</p>
                ) : (
                  visibleEduOptions.map((opt) => {
                    const isChecked = pendingEducation.includes(opt.label);
                    return (
                      <label
                        key={opt.label}
                        className="flex items-center gap-2.5 py-2 px-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-4 h-4 rounded-sm border-2 shrink-0 flex items-center justify-center transition-all ${
                            isChecked ? "bg-[#2557a7] border-[#2557a7]" : "border-gray-300"
                          }`}
                        >
                          {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setPendingEducation((prev) =>
                              prev.includes(opt.label)
                                ? prev.filter((e) => e !== opt.label)
                                : [...prev, opt.label]
                            )
                          }
                          className="sr-only"
                        />
                        <span className={`text-[13px] ${isChecked ? "text-[#2557a7] font-semibold" : "text-gray-700"}`}>
                          {opt.label}{" "}
                          <span className={`font-normal ${isChecked ? "text-[#2557a7]/70" : "text-gray-400"}`}>
                            ({fmtCount(opt.count)})
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* View more / View less */}
              {filteredEduOptions.length > 5 && (
                <div className="px-5 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowAllEdu(!showAllEdu)}
                    className="text-[13px] text-[#2557a7] underline hover:text-[#1a4a96] transition-colors"
                  >
                    {showAllEdu ? "View less" : "View more"}
                  </button>
                </div>
              )}

              {/* Apply button */}
              <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleEduApply}
                  className="px-5 py-2 bg-[#2557a7] text-white rounded-xl text-xs font-bold hover:bg-[#1e4a96] active:scale-[0.98] transition-all shadow-sm"
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
