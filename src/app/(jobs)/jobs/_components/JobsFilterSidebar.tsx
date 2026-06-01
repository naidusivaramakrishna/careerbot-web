"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Building2,
  Briefcase,
  GraduationCap,
  IndianRupee,
  Check,
  X,
  MapPin,
  BookOpen,
  Calendar,
  Globe2,
  SlidersHorizontal,
} from "lucide-react";
import {
  WORK_MODELS,
  JOB_TYPES,
  DATE_PRESETS,
  JOB_SOURCES,
  type FilterParams,
} from "./filters/filterConstants";

interface JobsFilterPanelProps {
  selectedFilters: string[];
  onFilterToggle: (filter: string) => void;
  onFilterChange: (filters: FilterParams) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jobs: any[];
}

type DropdownKey = "workModel" | "jobType" | "experience" | "salary" | "location" | "education" | "datePosted" | "source" | null;

export default function JobsFilterSidebar({
  selectedFilters,
  onFilterToggle,
  onFilterChange,
  jobs,
}: JobsFilterPanelProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [showMoreFiltersModal, setShowMoreFiltersModal] = useState(false);
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
  const activeDateFilter = selectedFilters.find((f) => f.startsWith("date:")) ?? null;
  const hasDateFilter = activeDateFilter !== null;
  const activeSourceFilter = selectedFilters.find((f) => f.startsWith("source:")) ?? null;
  const hasSourceFilter = activeSourceFilter !== null;

  const selectedExpFilter = selectedFilters.find((f) => f.startsWith("years:"));
  const selectedExpValue = selectedExpFilter ? selectedExpFilter.replace("years:", "") : null;
  const selectedSalaryFilter = selectedFilters.find((f) => f.startsWith("salary:"));

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

  const handleEduApply = () => {
    activeEduFilters.forEach((e) => onFilterToggle(`education:${e}`));
    pendingEducation.forEach((e) => onFilterToggle(`education:${e}`));
    setOpenDropdown(null);
  };

  const handleLocApply = () => {
    activeLocFilters.forEach((loc) => onFilterToggle(`location:${loc}`));
    if (pendingLocations.length > 0) {
      pendingLocations.forEach((loc) => onFilterToggle(`location:${loc}`));
    } else if (locSearch.trim()) {
      // User typed a location but no matching chip exists — send typed text to API
      onFilterToggle(`location:${locSearch.trim()}`);
    }
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



  return (
    <div className="pt-3 pb-1" ref={containerRef}>
      {/* Filter pills — all in one wrapping row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* ── WORK MODEL PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("workModel")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              activeWorkModels.length > 0
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
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
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Work Model</p>
                {activeWorkModels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => activeWorkModels.forEach((m) => onFilterToggle(m))}
                    className="text-[11px] text-[#2557a7] hover:text-[#1f4e98] font-semibold"
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
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
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
            <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-gray-100 rounded-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Job Type</p>
                {activeJobTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => activeJobTypes.forEach((t) => onFilterToggle(t))}
                    className="text-[11px] text-[#2557a7] hover:text-[#1f4e98] font-semibold"
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
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
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
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
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
                    className="text-[12px] text-[#2557a7] font-semibold hover:text-[#1f4e98] transition-colors flex items-center gap-1"
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
                  className="px-5 py-2 bg-[#2557a7] text-white rounded-full text-xs font-bold hover:bg-[#1f4e98] active:scale-[0.98] transition-all shadow-sm"
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
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
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
              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
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
                      className="absolute -translate-x-1/2 bottom-0 bg-[#1f4e98] text-white text-[11px] font-semibold rounded-md px-2 py-0.5 whitespace-nowrap pointer-events-none"
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
                      background: #2557a7;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                      margin-top: -7px;
                    }
                    .salary-slider::-moz-range-thumb {
                      width: 18px; height: 18px;
                      border-radius: 50%;
                      background: #2557a7;
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
                      background: `linear-gradient(to right, #2557a7 0%, #2557a7 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
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
                    className="px-5 py-2 bg-[#2557a7] text-white rounded-full text-xs font-bold hover:bg-[#1f4e98] active:scale-[0.98] transition-all shadow-sm"
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
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
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
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
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
                    className="text-[12px] text-[#2557a7] font-semibold hover:text-[#1f4e98] transition-colors flex items-center gap-1"
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
                  className="px-5 py-2 bg-[#2557a7] text-white rounded-full text-xs font-bold hover:bg-[#1f4e98] active:scale-[0.98] transition-all shadow-sm"
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
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
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
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
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
                    className="text-[12px] text-[#2557a7] font-semibold hover:text-[#1f4e98] transition-colors flex items-center gap-1"
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
                  className="px-5 py-2 bg-[#2557a7] text-white rounded-full text-xs font-bold hover:bg-[#1f4e98] active:scale-[0.98] transition-all shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── DATE POSTED PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("datePosted")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              hasDateFilter
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
                : openDropdown === "datePosted"
                ? "bg-[#f0f4ff] text-[#2557a7] border border-[#2557a7]/30 shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
            }`}
          >
            <Calendar size={14} className={hasDateFilter ? "text-white/80" : "text-gray-400 group-hover:text-[#2557a7]"} />
            <span>{activeDateFilter ? activeDateFilter.replace("date:", "") : "Date Posted"}</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${openDropdown === "datePosted" ? "rotate-180" : ""} ${
                hasDateFilter ? "text-white/60" : "text-gray-400"
              }`}
            />
          </button>

          {openDropdown === "datePosted" && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Date Posted</p>
                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={() => { if (activeDateFilter) onFilterToggle(activeDateFilter); setOpenDropdown(null); }}
                    className="text-[11px] text-[#2557a7] hover:text-[#1f4e98] font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-3" />
              <div className="p-1.5">
                {DATE_PRESETS.slice(1).map((preset) => {
                  const filterVal = `date:${preset.label}`;
                  const isChecked = activeDateFilter === filterVal;
                  return (
                    <label
                      key={preset.label}
                      onClick={() => { onFilterToggle(filterVal); setOpenDropdown(null); }}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all ${
                        isChecked ? "bg-[#f0f4ff]" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        isChecked ? "border-[#2557a7]" : "border-gray-300"
                      }`}>
                        {isChecked && <div className="w-2 h-2 rounded-full bg-[#2557a7]" />}
                      </div>
                      <span className={`text-[13px] ${isChecked ? "text-[#2557a7] font-semibold" : "text-gray-700"}`}>
                        {preset.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Source + More filters — continues the same row visually on next wrap */}
      <div className="flex items-center gap-2">
        {/* ── SOURCE PILL ── */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("source")}
            className={`group flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
              hasSourceFilter
                ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
                : openDropdown === "source"
                ? "bg-[#f0f4ff] text-[#2557a7] border border-[#2557a7]/30 shadow-sm"
                : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
            }`}
          >
            <Globe2 size={14} className={hasSourceFilter ? "text-white/80" : "text-gray-400 group-hover:text-[#2557a7]"} />
            <span>{activeSourceFilter ? activeSourceFilter.replace("source:", "") : "Source"}</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${openDropdown === "source" ? "rotate-180" : ""} ${
                hasSourceFilter ? "text-white/60" : "text-gray-400"
              }`}
            />
          </button>

          {openDropdown === "source" && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">Source</p>
                {hasSourceFilter && (
                  <button
                    type="button"
                    onClick={() => { if (activeSourceFilter) onFilterToggle(activeSourceFilter); setOpenDropdown(null); }}
                    className="text-[11px] text-[#2557a7] hover:text-[#1f4e98] font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-3" />
              <div className="p-1.5">
                {JOB_SOURCES.map((source) => {
                  const filterVal = `source:${source}`;
                  const isChecked = activeSourceFilter === filterVal;
                  return (
                    <label
                      key={source}
                      onClick={() => { onFilterToggle(filterVal); setOpenDropdown(null); }}
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-all ${
                        isChecked ? "bg-[#f0f4ff]" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                        isChecked ? "border-[#2557a7]" : "border-gray-300"
                      }`}>
                        {isChecked && <div className="w-2 h-2 rounded-full bg-[#2557a7]" />}
                      </div>
                      <span className={`text-[13px] ${isChecked ? "text-[#2557a7] font-semibold" : "text-gray-700"}`}>
                        {source}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── MORE FILTERS BUTTON ── */}
        <button
          type="button"
          onClick={() => setShowMoreFiltersModal(true)}
          className={`flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
            selectedFilters.length > 0
              ? "bg-[#2557a7] text-white shadow-md shadow-[#2557a7]/20 hover:bg-[#1f4e98]"
              : "bg-white text-gray-700 border border-gray-200 hover:border-[#2557a7]/40 hover:bg-[#fafbff] hover:shadow-sm"
          }`}
        >
          <SlidersHorizontal size={14} className={selectedFilters.length > 0 ? "text-white/80" : "text-gray-400"} />
          <span>All Filters</span>
          {selectedFilters.length > 0 && (
            <span className="bg-white text-[#2557a7] text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              +{selectedFilters.length}
            </span>
          )}
        </button>

      </div>

      {/* ── ACTIVE FILTER CHIPS STRIP ── */}
      {selectedFilters.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2.5 border-t border-gray-200/70">
          <span className="text-[10.5px] text-gray-400 font-bold uppercase tracking-widest shrink-0">Active:</span>
          {selectedFilters.map((f) => {
            const label = f.replace(/^(date:|source:|salary:|years:|location:|education:)/, "");
            return (
              <span
                key={f}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#eef3ff] text-[#1f4e98] text-[11.5px] font-semibold rounded-full border border-[#2557a7]/20 shrink-0"
              >
                {label}
                <button
                  type="button"
                  onClick={() => onFilterToggle(f)}
                  className="text-[#2557a7]/50 hover:text-[#1f4e98] ml-0.5 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => [...selectedFilters].forEach((f) => onFilterToggle(f))}
            className="text-[11px] text-gray-400 hover:text-gray-700 ml-1 font-semibold transition-colors shrink-0"
          >
            Clear all
          </button>
        </div>
      )}

      {/* More Filters — right-side drawer */}
      {showMoreFiltersModal && (() => {
        const DRAWER_SECTIONS = [
          { key: "basic",        label: "Basic Job Criteria",        sub: "Job Type / Work Model / Experience" },
          { key: "compensation", label: "Compensation",              sub: "Annual Salary" },
          { key: "date",         label: "Date & Source",             sub: "Date Posted / Source" },
          { key: "education",    label: "Education",                 sub: "Qualification / Degree" },
          { key: "location",     label: "Location",                  sub: "City / State" },
        ] as const;
        type DrawerSection = typeof DRAWER_SECTIONS[number]["key"];
        return (
          <DrawerContent
            sections={DRAWER_SECTIONS as unknown as { key: string; label: string; sub: string }[]}
            selectedFilters={selectedFilters}
            onFilterToggle={onFilterToggle}
            onClose={() => setShowMoreFiltersModal(false)}
            workModels={WORK_MODELS}
            jobTypes={JOB_TYPES}
            datePresets={DATE_PRESETS}
            jobSources={JOB_SOURCES}
            salarySteps={salarySteps}
            experienceOptions={experienceOptions}
            visibleLocOptions={visibleLocOptions}
            filteredLocOptions={filteredLocOptions}
            visibleEduOptions={visibleEduOptions}
            filteredEduOptions={filteredEduOptions}
            fmtCount={fmtCount}
            activeLocFilters={activeLocFilters}
            activeEduFilters={activeEduFilters}
            pendingLocations={pendingLocations}
            setPendingLocations={setPendingLocations}
            pendingEducation={pendingEducation}
            setPendingEducation={setPendingEducation}
            locSearch={locSearch}
            setLocSearch={setLocSearch}
            locTab={locTab}
            setLocTab={setLocTab}
            showAllLoc={showAllLoc}
            setShowAllLoc={setShowAllLoc}
            eduSearch={eduSearch}
            setEduSearch={setEduSearch}
            showAllEdu={showAllEdu}
            setShowAllEdu={setShowAllEdu}
            salarySliderIndex={salarySliderIndex}
            setSalarySliderIndex={setSalarySliderIndex}
            handleLocApply={handleLocApply}
            handleEduApply={handleEduApply}
            handleSalaryApply={handleSalaryApply}
            pendingExpLabel={pendingExpLabel}
            setPendingExpLabel={setPendingExpLabel}
            showAllExp={showAllExp}
            setShowAllExp={setShowAllExp}
            visibleExpOptions={visibleExpOptions}
            experienceOptionsAll={experienceOptions}
            handleExpApply={handleExpApply}
            handleExpSelect={handleExpSelect}
            selectedSalaryFilter={selectedSalaryFilter ?? null}
            activeDateFilter={activeDateFilter}
            activeSourceFilter={activeSourceFilter}
          />
        );
      })()}
    </div>
  );
}

// ── Checkbox item ─────────────────────────────────────────────────────────
function CheckItem({ label, checked, onChange, helpText }: { label: string; checked: boolean; onChange: () => void; helpText?: string }) {
  return (
    <label onClick={onChange}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border cursor-pointer transition-all select-none group ${
        checked
          ? "bg-[#eef3ff] border-[#2557a7]/40 shadow-[0_1px_4px_rgba(37,87,167,0.08)]"
          : "bg-white border-gray-200/80 hover:border-[#2557a7]/30 hover:bg-[#f8faff]"
      }`}>
      <div className={`w-4.5 h-4.5 rounded-[5px] border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
        checked
          ? "bg-[#2557a7] border-[#2557a7] shadow-[0_1px_4px_rgba(37,87,167,0.3)]"
          : "border-gray-300 group-hover:border-[#2557a7]/50"
      }`}>
        {checked && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
      <span className={`text-[13px] font-medium flex-1 leading-tight ${checked ? "text-[#1f4e98]" : "text-gray-700"}`}>{label}</span>
      {helpText && (
        <span title={helpText} className="w-4.5 h-4.5 rounded-full border border-gray-200 flex items-center justify-center text-[9px] text-gray-400 shrink-0 cursor-help hover:border-gray-300">?</span>
      )}
    </label>
  );
}

// ── Right-side drawer ──────────────────────────────────────────────────────
// DrawerContent receives 40+ parent-scope props (filters, state, setters).
// Typing each individually would create a fragile 100-line interface;
// using a broad record is the honest trade-off for this internal-only component.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DrawerContent(props: any) {
  const [activeSection, setActiveSection] = useState<string>("basic");
  const [jobFunctionInput, setJobFunctionInput] = useState("");
  const [jobFunctions, setJobFunctions] = useState<string[]>([]);
  const [excludedTitles, setExcludedTitles] = useState<string[]>([]);
  const [excludedInput, setExcludedInput] = useState("");
  const [excludedOpen, setExcludedOpen] = useState(false);

  // ── Staged filters — only pushed to parent on Confirm ──
  const [localFilters, setLocalFilters] = useState<string[]>([...props.selectedFilters]);
  const [pendingSalaryMin, setPendingSalaryMin] = useState<number | undefined>(undefined);

  const localToggle = (filter: string) => {
    setLocalFilters((prev) => {
      if (filter.startsWith("salary:")) {
        const without = prev.filter((f) => !f.startsWith("salary:"));
        if (filter === "salary:Any salary" || prev.includes(filter)) return without;
        return [...without, filter];
      }
      if (filter.startsWith("years:")) {
        const without = prev.filter((f) => !f.startsWith("years:"));
        if (filter === "years:Any requirements" || prev.includes(filter)) return without;
        return [...without, filter];
      }
      if (filter.startsWith("location:") || filter.startsWith("education:")) {
        return prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter];
      }
      if (filter.startsWith("date:")) {
        const without = prev.filter((f) => !f.startsWith("date:"));
        return prev.includes(filter) ? without : [...without, filter];
      }
      if (filter.startsWith("source:")) {
        const without = prev.filter((f) => !f.startsWith("source:"));
        return prev.includes(filter) ? without : [...without, filter];
      }
      return prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter];
    });
  };

  const handleConfirm = () => {
    const toAdd = localFilters.filter((f) => !props.selectedFilters.includes(f));
    const toRemove = props.selectedFilters.filter((f: string) => !localFilters.includes(f));
    [...toRemove, ...toAdd].forEach((f: string) => props.onFilterToggle(f));
    if (pendingSalaryMin !== undefined) {
      props.onFilterChange({ salary_min: pendingSalaryMin || undefined, salary_max: undefined });
    }
    props.onClose();
  };

  const handleResetAll = () => {
    setLocalFilters([]);
    setPendingSalaryMin(undefined);
    props.setPendingExpLabel(null);
    props.setPendingLocations([]);
    props.setPendingEducation([]);
  };

  const handleLocalSalaryApply = () => {
    const lastIdx = Math.max(1, props.salarySteps.length - 1);
    const clampedIdx = Math.min(Math.max(props.salarySliderIndex, 0), lastIdx);
    const step = props.salarySteps[clampedIdx] ?? props.salarySteps[lastIdx];
    setLocalFilters((prev) => {
      const without = prev.filter((f) => !f.startsWith("salary:"));
      return step.value > 0 ? [...without, `salary:${step.label}`] : without;
    });
    setPendingSalaryMin(step.value > 0 ? step.value : 0);
  };

  const handleLocalExpApply = () => {
    setLocalFilters((prev) => {
      const without = prev.filter((f) => !f.startsWith("years:"));
      return props.pendingExpLabel ? [...without, `years:${props.pendingExpLabel}`] : without;
    });
  };

  const handleLocalLocApply = () => {
    setLocalFilters((prev) => {
      const without = prev.filter((f) => !f.startsWith("location:"));
      const newLoc = props.pendingLocations.map((l: string) => `location:${l}`);
      if (!newLoc.length && props.locSearch?.trim()) newLoc.push(`location:${props.locSearch.trim()}`);
      return [...without, ...newLoc];
    });
  };

  const handleLocalEduApply = () => {
    setLocalFilters((prev) => {
      const without = prev.filter((f) => !f.startsWith("education:"));
      return [...without, ...props.pendingEducation.map((e: string) => `education:${e}`)];
    });
  };

  const localActiveDateFilter = localFilters.find((f) => f.startsWith("date:")) ?? null;
  const localActiveSourceFilter = localFilters.find((f) => f.startsWith("source:")) ?? null;
  const totalActive = localFilters.length;

  const addJobFunction = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !jobFunctions.includes(trimmed)) {
      setJobFunctions((prev) => [...prev, trimmed]);
    }
    setJobFunctionInput("");
  };

  const addExcludedTitle = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !excludedTitles.includes(trimmed)) {
      setExcludedTitles((prev) => [...prev, trimmed]);
    }
    setExcludedInput("");
  };

  const EXP_HELP: Record<string, string> = {
    "Fresher":  "0 years of experience — entry-level / campus hire",
    "1 yr":     "1 year of relevant work experience",
    "2 yrs":    "2 years of relevant work experience",
    "3 yrs":    "Mid-level — typically 3 years",
    "4 yrs":    "4 years of professional experience",
    "5 yrs":    "Senior candidate — 5 years",
    "6 yrs":    "6 years of professional experience",
    "7 yrs":    "7 years of professional experience",
    "8 yrs":    "Senior / lead level — 8 years",
    "9 yrs":    "9 years of professional experience",
    "10 yrs":   "10 years of professional experience",
    "11+ yrs":  "Principal / executive — 11+ years",
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop — covers the FULL screen so rounded corners show against dark overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={props.onClose} />

      {/* Animation wrapper — transform here, no clip */}
      <div className="absolute right-0 top-14 bottom-2 w-[820px] animate-in slide-in-from-right duration-300">
      {/* Drawer panel — rounded + clip here, no transform */}
      <div className="h-full bg-white flex flex-col shadow-2xl rounded-l-3xl overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button type="button" onClick={props.onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100">
              <ChevronDown size={18} className="-rotate-90" />
            </button>
            <h2 className="text-[15px] font-bold text-gray-900">All Filters</h2>
            {totalActive > 0 && (
              <span className="px-2 py-0.5 bg-[#2557a7] text-white text-[11px] font-bold rounded-full">
                {totalActive} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {totalActive > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="px-4 py-1.5 text-[12.5px] font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
              >
                Reset all
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-1.5 bg-[#2557a7] hover:bg-[#1f4e98] text-white text-[13px] font-bold rounded-full transition-colors shadow-md shadow-[#2557a7]/20"
            >
              Confirm
            </button>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {totalActive > 0 && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-100 overflow-x-auto">
            <span className="text-[11px] text-gray-400 font-medium shrink-0">Active:</span>
            {localFilters.map((f: string) => {
              const label = f.replace(/^(date:|source:|salary:|years:|location:|education:)/, "");
              return (
                <span key={f} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f0f4ff] text-[#1f4e98] text-[11px] font-semibold rounded-full shrink-0 border border-[#2557a7]/30">
                  {label}
                  <button type="button" onClick={() => localToggle(f)} className="text-[#2557a7]/70 hover:text-[#1f4e98] transition-colors">
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* ── Two-panel layout ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left nav */}
          <div className="w-52 shrink-0 bg-gray-50 border-r border-gray-100 py-2 overflow-y-auto">
            {props.sections.map((sec: { key: string; label: string; sub: string }) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveSection(sec.key)}
                className={`w-full text-left px-4 py-3.5 transition-all border-l-[3px] ${
                  activeSection === sec.key
                    ? "bg-white border-[#2557a7] shadow-sm"
                    : "border-transparent hover:bg-white/60 hover:border-gray-200"
                }`}
              >
                <p className={`text-[13px] font-semibold leading-tight ${activeSection === sec.key ? "text-[#2557a7]" : "text-gray-700"}`}>
                  {sec.label}
                </p>
                <p className="text-[10.5px] text-gray-400 mt-0.5 leading-tight">{sec.sub}</p>
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">

            {/* BASIC — Job Function + Excluded Title + Job Type + Work Model + Experience */}
            {activeSection === "basic" && (
              <div className="space-y-7">

                {/* Job Function */}
                <div>
                  <p className="text-[13px] font-bold text-gray-900 mb-2">Job Function</p>
                  <p className="text-[11.5px] text-gray-400 mb-3">Add job functions to refine your matches</p>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                    {jobFunctions.map((fn) => (
                      <span key={fn} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f4ff] border border-[#2557a7]/40 text-[#1f4e98] text-[12px] font-semibold rounded-lg">
                        {fn}
                        <button type="button" onClick={() => setJobFunctions((prev) => prev.filter((f) => f !== fn))}
                          className="text-[#2557a7]/70 hover:text-[#1f4e98] transition-colors ml-0.5">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer, Product Manager…"
                      value={jobFunctionInput}
                      onChange={(e) => setJobFunctionInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addJobFunction(jobFunctionInput); } }}
                      className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#2557a7] focus:ring-1 focus:ring-[#2557a7]/20 transition-colors"
                    />
                    <button type="button" onClick={() => addJobFunction(jobFunctionInput)}
                      className="px-4 py-2 bg-[#2557a7] hover:bg-[#1f4e98] text-white text-[12px] font-bold rounded-lg transition-colors">
                      + Add
                    </button>
                  </div>
                </div>

                {/* Excluded Title */}
                <div>
                  <button type="button" onClick={() => setExcludedOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between py-1 group">
                    <div>
                      <p className="text-[13px] font-bold text-gray-900 text-left">Excluded Title</p>
                      <p className="text-[11.5px] text-gray-400 text-left">Jobs with these titles will be hidden</p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${excludedOpen ? "rotate-180" : ""}`} />
                  </button>
                  {excludedOpen && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                        {excludedTitles.map((t) => (
                          <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-[12px] font-semibold rounded-lg">
                            {t}
                            <button type="button" onClick={() => setExcludedTitles((prev) => prev.filter((x) => x !== t))}
                              className="text-red-400 hover:text-red-600 transition-colors ml-0.5">
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Intern, Manager…"
                          value={excludedInput}
                          onChange={(e) => setExcludedInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExcludedTitle(excludedInput); } }}
                          className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-red-300 focus:ring-1 focus:ring-red-100 transition-colors"
                        />
                        <button type="button" onClick={() => addExcludedTitle(excludedInput)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-bold rounded-lg transition-colors border border-gray-200">
                          + Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100" />

                {/* Job Type */}
                <div>
                  <p className="text-[13px] font-bold text-gray-900 mb-3">Job Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {props.jobTypes.map((type: string) => (
                      <CheckItem
                        key={type}
                        label={type}
                        checked={localFilters.includes(type)}
                        onChange={() => localToggle(type)}
                      />
                    ))}
                  </div>
                </div>

                {/* Work Model */}
                <div>
                  <p className="text-[13px] font-bold text-gray-900 mb-3">Work Model</p>
                  <div className="grid grid-cols-2 gap-2">
                    {props.workModels.map((model: string) => (
                      <CheckItem
                        key={model}
                        label={model}
                        checked={localFilters.includes(model)}
                        onChange={() => localToggle(model)}
                      />
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <p className="text-[13px] font-bold text-gray-900 mb-3">Experience Level</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(props.showAllExp ? props.experienceOptionsAll : props.experienceOptionsAll.slice(0, 8)).map((opt: { label: string; count: number }) => (
                      <CheckItem
                        key={opt.label}
                        label={`${opt.label}  (${props.fmtCount(opt.count)})`}
                        checked={props.pendingExpLabel === opt.label}
                        onChange={() => props.handleExpSelect(opt.label)}
                        helpText={EXP_HELP[opt.label]}
                      />
                    ))}
                  </div>
                  {props.experienceOptionsAll.length > 8 && (
                    <button type="button" onClick={() => props.setShowAllExp(!props.showAllExp)}
                      className="mt-3 text-[12px] text-[#2557a7] font-semibold hover:underline">
                      {props.showAllExp ? "Show less" : `Show all ${props.experienceOptionsAll.length}`}
                    </button>
                  )}
                  {props.pendingExpLabel && (
                    <div className="mt-4 flex justify-end">
                      <button type="button" onClick={handleLocalExpApply}
                        className="px-5 py-2 bg-[#2557a7] hover:bg-[#1f4e98] text-white rounded-xl text-[12px] font-bold transition-all shadow-sm">
                        Apply Experience
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COMPENSATION — Salary */}
            {activeSection === "compensation" && (
              <div>
                <p className="text-[13px] font-bold text-gray-900 mb-1">Annual Salary</p>
                <p className="text-[11.5px] text-gray-400 mb-6">Minimum salary in LPA (Lakhs Per Annum)</p>
                {(() => {
                  const lastIdx = Math.max(1, props.salarySteps.length - 1);
                  const clampedIdx = Math.min(Math.max(props.salarySliderIndex, 0), lastIdx);
                  const step = props.salarySteps[clampedIdx] ?? props.salarySteps[lastIdx];
                  const pct = (clampedIdx / lastIdx) * 100;
                  const thumbR = 9;
                  const tooltipLeft = `calc(${pct}% + ${(1 - 2 * pct / 100) * thumbR}px)`;
                  return (
                    <div className="px-2">
                      <div className="relative h-8 mb-1">
                        <div className="absolute -translate-x-1/2 bottom-0 bg-[#0f172a] text-white text-[11px] font-semibold rounded-lg px-2.5 py-1 whitespace-nowrap pointer-events-none"
                          style={{ left: tooltipLeft }}>
                          {step.label} · {step.count} Jobs
                          <span className="absolute left-1/2 -translate-x-1/2 top-full border-[5px] border-transparent border-t-[#0f172a]" />
                        </div>
                      </div>
                      <input type="range" min={0} max={lastIdx} step={1} value={clampedIdx}
                        onChange={(e) => props.setSalarySliderIndex(Number(e.target.value))}
                        className="salary-slider w-full cursor-pointer"
                        style={{ background: `linear-gradient(to right, #2557a7 0%, #2557a7 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)` }} />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[11px] text-gray-400">2 LPA</span>
                        <span className="text-[11px] text-gray-400">Any</span>
                      </div>
                      <div className="mt-6 p-4 bg-[#f0f4ff] rounded-xl border border-[#2557a7]/30 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-gray-500">Selected minimum</p>
                          <p className="text-[18px] font-bold text-[#1f4e98]">{step.label}</p>
                        </div>
                        <button type="button" onClick={handleLocalSalaryApply}
                          className="px-5 py-2 bg-[#2557a7] hover:bg-[#1f4e98] text-white rounded-xl text-[12px] font-bold transition-all shadow-sm">
                          Apply
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* DATE & SOURCE */}
            {activeSection === "date" && (
              <div className="space-y-7">
                <div>
                  <p className="text-[13px] font-bold text-gray-900 mb-3">Date Posted</p>
                  <div className="grid grid-cols-2 gap-2">
                    {props.datePresets.slice(1).map((preset: { label: string }) => {
                      const filterVal = `date:${preset.label}`;
                      return (
                        <CheckItem
                          key={preset.label}
                          label={preset.label}
                          checked={localActiveDateFilter === filterVal}
                          onChange={() => localToggle(filterVal)}
                        />
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-900 mb-3">Job Source</p>
                  <div className="grid grid-cols-2 gap-2">
                    {props.jobSources.map((source: string) => {
                      const filterVal = `source:${source}`;
                      return (
                        <CheckItem
                          key={source}
                          label={source}
                          checked={localActiveSourceFilter === filterVal}
                          onChange={() => localToggle(filterVal)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* EDUCATION */}
            {activeSection === "education" && (
              <div>
                <p className="text-[13px] font-bold text-gray-900 mb-1">Education Level</p>
                <p className="text-[11.5px] text-gray-400 mb-3">Filter by minimum qualification</p>
                <div className="relative mb-4">
                  <input type="text" placeholder="Search qualification…" value={props.eduSearch}
                    onChange={(e) => { props.setEduSearch(e.target.value); props.setShowAllEdu(false); }}
                    className="w-full px-3 py-2 pr-8 text-[13px] border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#2557a7] focus:ring-1 focus:ring-[#2557a7]/20 transition-colors" />
                  {props.eduSearch && (
                    <button type="button" onClick={() => props.setEduSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {props.visibleEduOptions.length === 0 ? (
                    <p className="text-[12px] text-gray-400 text-center py-4">No results found</p>
                  ) : props.visibleEduOptions.map((opt: { label: string; count: number }) => (
                    <CheckItem
                      key={opt.label}
                      label={`${opt.label}  (${props.fmtCount(opt.count)})`}
                      checked={props.pendingEducation.includes(opt.label)}
                      onChange={() => props.setPendingEducation((prev: string[]) =>
                        prev.includes(opt.label) ? prev.filter((e: string) => e !== opt.label) : [...prev, opt.label]
                      )}
                    />
                  ))}
                </div>
                {props.filteredEduOptions.length > 5 && (
                  <button type="button" onClick={() => props.setShowAllEdu(!props.showAllEdu)}
                    className="mt-3 text-[12px] text-[#2557a7] font-semibold hover:underline">
                    {props.showAllEdu ? "Show less" : `Show all ${props.filteredEduOptions.length}`}
                  </button>
                )}
                {props.pendingEducation.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={handleLocalEduApply}
                      className="px-5 py-2 bg-[#2557a7] hover:bg-[#1f4e98] text-white rounded-xl text-[12px] font-bold transition-all shadow-sm">
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LOCATION */}
            {activeSection === "location" && (
              <div>
                <p className="text-[13px] font-bold text-gray-900 mb-1">Location</p>
                <p className="text-[11.5px] text-gray-400 mb-3">Filter by city or state</p>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none select-none">🇮🇳</span>
                  <input type="text" placeholder="Search city or state…" value={props.locSearch}
                    onChange={(e) => { props.setLocSearch(e.target.value); props.setShowAllLoc(false); }}
                    className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-[#2557a7] focus:ring-1 focus:ring-[#2557a7]/20 transition-colors" />
                </div>
                <div className="flex bg-gray-100 rounded-full p-0.5 mb-4 gap-0.5">
                  {(["cities", "states"] as const).map((tab) => (
                    <button key={tab} type="button"
                      onClick={() => { props.setLocTab(tab); props.setShowAllLoc(false); }}
                      className={`flex-1 py-1.5 text-[12px] font-semibold rounded-full transition-all capitalize ${
                        props.locTab === tab ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {props.visibleLocOptions.length === 0 ? (
                    <p className="text-[12px] text-gray-400 text-center py-4">No results found</p>
                  ) : props.visibleLocOptions.map((opt: { label: string; count: number }) => (
                    <CheckItem
                      key={opt.label}
                      label={`${opt.label}  (${props.fmtCount(opt.count)})`}
                      checked={props.pendingLocations.includes(opt.label)}
                      onChange={() => props.setPendingLocations((prev: string[]) =>
                        prev.includes(opt.label) ? prev.filter((l: string) => l !== opt.label) : [...prev, opt.label]
                      )}
                    />
                  ))}
                </div>
                {props.filteredLocOptions.length > 5 && (
                  <button type="button" onClick={() => props.setShowAllLoc(!props.showAllLoc)}
                    className="mt-3 text-[12px] text-[#2557a7] font-semibold hover:underline">
                    {props.showAllLoc ? "Show less" : `Show all ${props.filteredLocOptions.length}`}
                  </button>
                )}
                {props.pendingLocations.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={handleLocalLocApply}
                      className="px-5 py-2 bg-[#2557a7] hover:bg-[#1f4e98] text-white rounded-xl text-[12px] font-bold transition-all shadow-sm">
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
