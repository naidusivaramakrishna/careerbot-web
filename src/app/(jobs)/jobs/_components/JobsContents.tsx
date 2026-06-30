"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { searchJobs, getSmartMatchedJobs } from "@/api/jobsApi";
import type { MatchedJobItem } from "@/api/jobsApi";
import type { FilterParams } from "./filters/filterConstants";
import { toast } from "sonner";
import { getSavedJobIds, getSavedJobsCount } from "@/utils/jobTracking";
import { getJobId } from "@/utils/jobIdHelper";
import { Bookmark, Zap, Search, Briefcase, AlertTriangle, RotateCcw, FileX, MessageCircle } from "lucide-react";

import JobsTabs, { TabType, SortType, FilterSort } from "./JobsTabs";
import JobList from "./sidebar/JobList";
import Pagination from "./Pagination";
import JobsRightSidebar from "./sidebar/JobsRightSidebar";
import NancyChat from "./chat/NancyChat";
import JobSkeleton from "./JobSkeleton";
import JobsFilterSidebar from "./JobsFilterSidebar";
import { matchesJobFilters } from "./utils/jobFilterUtils";

// Common job title suggestions for autocomplete
const JOB_SUGGESTIONS = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "Data Analyst", "Data Engineer", "Machine Learning Engineer",
  "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer",
  "Product Manager", "Project Manager", "Scrum Master",
  "UI/UX Designer", "Graphic Designer",
  "Python Developer", "Java Developer", "React Developer", "Node.js Developer",
  "Android Developer", "iOS Developer", "Mobile Developer",
  "QA Engineer", "Test Engineer", "Automation Engineer",
  "Business Analyst", "Systems Analyst",
  "Sales Manager", "Marketing Manager", "HR Manager",
  "Cybersecurity Engineer", "Network Engineer", "Database Administrator",
  "Technical Lead", "Engineering Manager",
];

// ── Normalized shape used throughout the component ──
interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  logo: string;
  type: string;
  mode: string;
  salary: string;
  time: string;
  url: string;
  application_url: string;
  recruiter_id: string;
  matchScore: number;
  matchText: string;
  roleTrending: boolean;
  highHiring: boolean;
  description: string;
  created_at: string | null;
  posted_date: string | null;
  company_website: string;
  skills: string;
  experience: string;
  experience_level: string;
  education: string;
  source: string;
  is_applied: boolean;
  matched_skills?: string[];
  missing_skills?: string[];
  match_band?: string;
}

function str(job: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = job[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizeJob(job: Record<string, unknown>, matchScore = 0, matchData?: MatchedJobItem["match"]): NormalizedJob {
  const title = str(job, "title", "job_title") || "Job Title";
  const company = str(job, "company", "company_name", "organization", "about_company", "employer");
  const location = str(job, "location", "job_location", "city", "place") || "Location not specified";

  const jobType = str(job, "job_type", "type", "employment_type", "work_type", "contract_type").toLowerCase();
  const typeNorm = !jobType ? ""
    : jobType.includes("intern") ? "Internship"
    : jobType.includes("contract") || jobType.includes("freelance") ? "Contract"
    : jobType.includes("part") ? "Part-time"
    : "Full-time";

  const skills = job["skills"];
  const skillsStr = typeof skills === "string" ? skills
    : Array.isArray(skills) ? (skills as string[]).join(", ")
    : "";

  const recruiterId = str(job, "recruiter_id");

  return {
    id: getJobId(String(job["id"] ?? ""), title, company, location),
    title,
    company,
    location,
    logo: str(job, "organization_logo", "company_logo"),
    type: typeNorm,
    mode: str(job, "work_mode", "mode"),
    salary: str(job, "salary"),
    time: "Recently",
    url: recruiterId ? "" : str(job, "url", "apply_url"),
    application_url: recruiterId ? "" : str(job, "application_url"),
    recruiter_id: recruiterId,
    matchScore,
    matchText: matchData ? `${Math.round(matchScore)}% match` : "Match",
    roleTrending: false,
    highHiring: false,
    description: str(job, "description", "job_description"),
    created_at: (job["created_at"] as string | null) ?? null,
    posted_date: (job["posted_date"] as string | null) ?? (job["created_at"] as string | null) ?? null,
    company_website: str(job, "company_website"),
    skills: skillsStr,
    experience: str(job, "experience_level", "experience"),
    experience_level: str(job, "experience_level"),
    education: str(job, "education", "qualification", "education_required", "min_education"),
    source: str(job, "source"),
    is_applied: !!job["is_applied"],
    matched_skills: matchData?.matched_skills,
    missing_skills: matchData?.missing_skills,
    match_band: matchData?.band,
  };
}

const JOBS_PER_PAGE = 10;

export default function JobsContents() {
  // ── Fetch / pagination ──
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<NormalizedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState<number | undefined>(undefined);

  // ── Search & filter ──
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterParams>({});
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedLocation] = useState("All Locations");
  const [sortBy, setSortBy] = useState<SortType>("relevance");
  const [filterSort, setFilterSort] = useState<FilterSort>("most-recent");

  // ── Tab counters ──
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [newJobIds, setNewJobIds] = useState<string[]>([]);

  // ── Search autocomplete ──
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearchInput = (val: string) => {
    setInputValue(val);
    if (val.trim().length > 0) {
      const filtered = JOB_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const commitSearch = (val: string) => {
    setSearchQuery(val);
    setInputValue(val);
    setShowSuggestions(false);
    setCurrentPage(1);
    setJobs([]);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Nancy chat ──
  const [openChat, setOpenChat] = useState(false);
  const [selectedJob, setSelectedJob] = useState<NormalizedJob | null>(null);

  // ── Smart match ──
  const [matchedJobs, setMatchedJobs] = useState<NormalizedJob[]>([]);
  const [matchedLoading, setMatchedLoading] = useState(false);
  const [matchedFetched, setMatchedFetched] = useState(false);
  const [matchedNoResume, setMatchedNoResume] = useState(false);
  const [matchBandFilter] = useState<"all" | "strong" | "good" | "partial" | "low">("all");

  // ── Sort helper ──
  const sortJobs = useCallback((list: NormalizedJob[], sort: FilterSort): NormalizedJob[] => {
    const copy = [...list];
    if (sort === "recommended" || sort === "top-matched") {
      return copy.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
    // most-recent
    return copy.sort((a, b) => {
      const da = new Date(a.created_at || a.posted_date || 0).getTime();
      const db = new Date(b.created_at || b.posted_date || 0).getTime();
      return db - da;
    });
  }, []);

  // ── Filter change handler ──
  const handleFilterChange = useCallback((filters: FilterParams) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    setJobs([]);
  }, []);

  // ── Fetch all/search jobs ──
  const fetchJobs = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        // Derive server-side params from selectedFilters
        const activeLocationChips = selectedFilters
          .filter((f) => f.startsWith("location:"))
          .map((f) => f.replace("location:", ""));
        const datePreset = selectedFilters.find((f) => f.startsWith("date:"));
        const sourceChip = selectedFilters.find((f) => f.startsWith("source:"));

        const dateFrom = (() => {
          if (!datePreset) return undefined;
          const dayMap: Record<string, number> = {
            "Last 24 hours": 1,
            "Last 7 days": 7,
            "Last 30 days": 30,
            "Last 3 months": 90,
          };
          const days = dayMap[datePreset.replace("date:", "")];
          return days ? new Date(Date.now() - days * 86_400_000).toISOString() : undefined;
        })();

        const serverLocation =
          activeLocationChips.length === 1
            ? activeLocationChips[0]
            : selectedLocation !== "All Locations"
            ? selectedLocation
            : undefined;
        const serverSource = sourceChip ? sourceChip.replace("source:", "") : undefined;

        const response = await searchJobs({
          q: searchQuery || roleFilter || undefined,
          location: serverLocation,
          source: activeFilters.source || serverSource,
          date_from: activeFilters.date_from || dateFrom,
          page,
          limit: JOBS_PER_PAGE,
        });

        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch jobs");
        }

        const jobsData = Array.isArray(response.data) ? response.data : [];
        const pagination = response.pagination;
        const normalized = jobsData.map((job) => normalizeJob(job as unknown as Record<string, unknown>));

        // Identify new jobs (posted in last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const newlyAddedIds = normalized
          .filter((j) => {
            const d = j.posted_date || j.created_at;
            return d && d >= oneDayAgo;
          })
          .map((j) => j.id);

        setNewJobIds((prev) =>
          page === 1 ? newlyAddedIds : [...new Set([...prev, ...newlyAddedIds])]
        );
        setNewJobsCount((prev) =>
          page === 1 ? newlyAddedIds.length : prev + newlyAddedIds.length
        );

        // Deduplicate by ID
        const seenIds = new Set<string>();
        const deduped = normalized.filter((j) => {
          if (seenIds.has(j.id)) return false;
          seenIds.add(j.id);
          return true;
        });

        // Deduplicate by title+company+location
        const seenKeys = new Set<string>();
        const unique = deduped.filter((j) => {
          const key = `${j.title}||${j.company}||${j.location}`.toLowerCase();
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        });

        setJobs(unique);
        setCurrentPage(page);
        setSavedJobsCount(getSavedJobsCount());

        const total = pagination?.total || normalized.length;
        const hasNext = pagination?.has_next || false;
        const calcPages =
          pagination?.total_pages ||
          (total > 0 ? Math.ceil(total / JOBS_PER_PAGE) : hasNext ? page + 1 : page);
        setTotalPages(calcPages);
        setTotalJobs(pagination?.total ?? undefined);

        if (normalized.length === 0) {
          toast.info("No jobs found matching your criteria");
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to fetch jobs. Please try again.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [activeFilters, selectedLocation, searchQuery, roleFilter, selectedFilters]
  );

  // ── Fetch SmartMatch jobs (lazy — only when tab first activated) ──
  const fetchSmartMatchedJobs = useCallback(async (force = false) => {
    if (matchedFetched && !force) return;
    setMatchedLoading(true);
    setMatchedNoResume(false);
    try {
      const data = await getSmartMatchedJobs({ limit: 50, ...(force && { force_refresh: true }) });
      const normalized = (data.jobs || []).map((item) =>
        normalizeJob(item.job, item.match.score, item.match)
      );
      setMatchedJobs(normalized);
      setMatchedFetched(true);
      setMatchedNoResume(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        // No resume on file is a terminal state — cache it so we don't refetch.
        setMatchedNoResume(true);
        setMatchedFetched(true);
      } else {
        // Transient failure — leave matchedFetched false so the next tab
        // activation retries instead of caching the error.
        toast.error("Could not load Smart Match jobs. Please try again later.");
      }
    } finally {
      setMatchedLoading(false);
    }
  }, [matchedFetched]);

  // ── Initial / search / filter fetch ──
  useEffect(() => {
    setCurrentPage(1);
    setJobs([]);
    setFilteredJobs([]);
    fetchJobs(1);
  }, [fetchJobs]);

  // ── Trigger SmartMatch fetch when tab becomes active ──
  useEffect(() => {
    if (activeTab === "matched") {
      fetchSmartMatchedJobs();
    }
  }, [activeTab, fetchSmartMatchedJobs]);

  const handlePageChange = (page: number) => {
    fetchJobs(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Client-side filter / tab logic ──
  useEffect(() => {
    // Matched tab: apply band filter + other filters
    if (activeTab === "matched") {
      let filtered = [...matchedJobs];

      // Apply match band filter
      if (matchBandFilter !== "all") {
        filtered = filtered.filter((j) => j.match_band === matchBandFilter);
      }

      // Apply other filters (same logic as All Jobs tab)
      if (selectedFilters.length > 0) {
        filtered = filtered.filter((job) =>
          matchesJobFilters(job, selectedFilters)
        );
      }

      setFilteredJobs(sortJobs(filtered, filterSort));
      return;
    }

    let filtered = [...jobs];

    if (activeTab === "saved") {
      const savedIds = getSavedJobIds();
      filtered = filtered.filter((j) => savedIds.includes(j.id));
    } else if (activeTab === "new") {
      setFilteredJobs(sortJobs(filtered.filter((j) => newJobIds.includes(j.id)), filterSort));
      return;
    }

    // selectedLocation and single locationChip are server-side — skip client filter for them
    // searchQuery and roleFilter are server-side (sent as `q`) — skip client filter

    if (selectedFilters.length > 0) {
      filtered = filtered.filter((job) =>
        matchesJobFilters(job, selectedFilters, { includeSource: true })
      );
    }

    setFilteredJobs(sortJobs(filtered, filterSort));
  }, [
    jobs,
    matchedJobs,
    matchBandFilter,
    searchQuery,
    roleFilter,
    selectedFilters,
    activeTab,
    newJobIds,
    selectedLocation,
    filterSort,
    sortJobs,
  ]);

  // ── Filter toggle ──
  const handleFilterToggle = (filter: string) => {
    setSelectedFilters((prev) => {
      if (filter.startsWith("salary:")) {
        const withoutSalary = prev.filter((f) => !f.startsWith("salary:"));
        // Remove if already active or is the "Any" sentinel
        if (filter === "salary:Any salary" || prev.includes(filter)) return withoutSalary;
        return [...withoutSalary, filter];
      }
      if (filter.startsWith("years:")) {
        const withoutYears = prev.filter((f) => !f.startsWith("years:"));
        // Remove if already active or is the "Any" sentinel
        if (filter === "years:Any requirements" || prev.includes(filter)) return withoutYears;
        return [...withoutYears, filter];
      }
      if (filter.startsWith("location:") || filter.startsWith("education:")) {
        return prev.includes(filter)
          ? prev.filter((f) => f !== filter)
          : [...prev, filter];
      }
      // date: and source: are radio-style (only one at a time)
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

  // ── Derived values ──
  const isMatchedTab = activeTab === "matched";
  const displayLoading = isMatchedTab ? matchedLoading : loading;
  const matchedCount = matchedJobs.length;

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-start gap-5 bg-[radial-gradient(circle_at_top_left,rgba(37,87,167,0.10),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(20,184,166,0.08),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#edf2f7_100%)] p-4 xl:p-5">
      {/* CENTER PANEL */}
      <main id="jobs-main-scroll" className="min-w-0 flex-1 overflow-hidden rounded-[24px] border border-white/75 bg-white/95 shadow-[0_22px_70px_rgba(15,23,42,0.09),0_1px_0_rgba(255,255,255,0.8)] backdrop-blur">
        {/* RESULTS VIEW */}
        <div>
            {/* TOP BAR */}
            <div className="flex flex-col gap-4 border-b border-slate-200/70 bg-white/90 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h1 className="truncate text-[21px] font-extrabold leading-tight text-slate-950">
                      {isMatchedTab
                        ? "Smart Match Jobs"
                        : searchQuery
                        ? `Results for "${searchQuery}"`
                        : roleFilter
                        ? `${roleFilter} Jobs`
                        : "All Jobs"}
                    </h1>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#2557a7]/15 bg-[#eef3ff] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#2557a7] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2557a7] animate-pulse shrink-0" />
                      Live
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] font-semibold text-slate-500">
                    {filteredJobs.length > 0
                      ? `${filteredJobs.length.toLocaleString()} opportunities`
                      : displayLoading
                      ? "Loading…"
                      : "No results"}
                    {selectedLocation !== "All Locations" && ` · ${selectedLocation}`}
                  </p>
                </div>
              </div>

              {/* Search input with autocomplete + button */}
              <div ref={searchRef} className="relative flex w-full shrink-0 items-center gap-2 lg:w-auto">
                <div className="relative min-w-0 flex-1 lg:flex-none">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => inputValue.trim() && setShowSuggestions(suggestions.length > 0)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitSearch(inputValue); }}
                    placeholder="Search by title or company"
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-4 text-[13px] text-slate-700 shadow-inner shadow-slate-100/70 placeholder:text-slate-400 transition-all focus:border-[#2557a7]/45 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2557a7]/10 lg:w-96"
                  />
                  {/* Autocomplete dropdown */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      {suggestions.map((s, i) => {
                        const idx = s.toLowerCase().indexOf(inputValue.toLowerCase());
                        return (
                          <button
                            key={i}
                            type="button"
                            onMouseDown={() => commitSearch(s)}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-slate-700 transition-colors hover:bg-[#f0f4ff]"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                            </svg>
                            <span>
                              {idx >= 0 ? (
                                <>
                                  {s.slice(0, idx)}
                                  <span className="font-bold text-[#2557a7]">{s.slice(idx, idx + inputValue.length)}</span>
                                  {s.slice(idx + inputValue.length)}
                                </>
                              ) : s}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => commitSearch(inputValue)}
                  className="flex shrink-0 items-center gap-1.5 rounded-[18px] bg-[#2557a7] px-5 py-3 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(37,87,167,0.24)] transition-all hover:bg-[#1f4e98] hover:shadow-[0_16px_36px_rgba(37,87,167,0.34)] active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>

              <div className="px-5 sm:px-6">
              {/* STICKY FILTER + TABS BAR */}
              <div className="sticky top-0 z-30 -mx-5 bg-white/95 px-5 pb-0 backdrop-blur-xl sm:-mx-6 sm:px-6" style={{ boxShadow: "0 1px 0 rgba(15,23,42,0.08), 0 16px 28px rgba(15,23,42,0.035)" }}>
                <JobsFilterSidebar
                  selectedFilters={selectedFilters}
                  onFilterToggle={handleFilterToggle}
                  onFilterChange={handleFilterChange}
                  jobs={isMatchedTab ? matchedJobs : jobs}
                />

                <JobsTabs
                  activeTab={activeTab}
                  onTabChange={(tab) => { setActiveTab(tab); }}
                  newCount={newJobsCount}
                  savedCount={savedJobsCount}
                  matchedCount={matchedCount}
                  allCount={filteredJobs.length}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  filterSort={filterSort}
                  onFilterSortChange={setFilterSort}
                />
              </div>

              {/* JOB LIST */}
              <div className="mt-5 pb-10">
                {displayLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <JobSkeleton key={i} />
                    ))}
                  </div>
                ) : error && !isMatchedTab ? (
                  <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4 shadow-sm">
                      <AlertTriangle size={24} className="text-red-400" />
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-800">Failed to Load Jobs</h3>
                    <p className="text-gray-500 text-[12.5px] mt-1.5 max-w-xs leading-relaxed">{error}</p>
                    <button
                      type="button"
                      onClick={() => fetchJobs(currentPage)}
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2 bg-[#2557a7] text-white text-[13px] font-semibold rounded-full hover:bg-[#1f4e98] transition-colors"
                    >
                      <RotateCcw size={13} />
                      Try Again
                    </button>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    {/* Tab-specific icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${
                      activeTab === "saved"   ? "bg-amber-50 border border-amber-100" :
                      activeTab === "matched" ? "bg-blue-50 border border-blue-100" :
                      activeTab === "new"     ? "bg-emerald-50 border border-emerald-100" :
                                               "bg-gray-100 border border-gray-200"
                    }`}>
                      {activeTab === "saved"   ? <Bookmark size={26} className="text-amber-400" /> :
                       activeTab === "matched" ? <Zap size={26} className="text-[#2557a7]" /> :
                       activeTab === "new"     ? <Briefcase size={26} className="text-emerald-500" /> :
                                                <Search size={26} className="text-gray-400" />}
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-800">
                      {activeTab === "saved"
                        ? "No saved jobs yet"
                        : activeTab === "new"
                        ? "No new jobs available"
                        : activeTab === "matched"
                        ? matchedNoResume
                          ? "Resume required for Smart Match"
                          : "No matched jobs found"
                        : "No results found"}
                    </h3>
                    <p className="text-gray-500 text-[13px] mt-2 max-w-sm leading-relaxed">
                      {activeTab === "saved"
                        ? "Save jobs you like and find them all here."
                        : activeTab === "new"
                        ? "No new jobs were added in the latest update. Check back soon."
                        : activeTab === "matched"
                        ? matchedNoResume
                          ? "Smart Match analyses your resume to score every job for you. Go to Profile → Resume tab to upload your resume."
                          : "Smart Match ran but no strong matches found yet. Try clicking Retry or update your profile with more skills."
                        : "Try adjusting your search or filters to find more jobs."}
                    </p>
                    {isMatchedTab && matchedNoResume && (
                      <a
                        href="/profile"
                        className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-[#2557a7] text-white text-sm font-semibold rounded-full hover:bg-[#1f4e98] transition-colors"
                      >
                        Upload Resume in Profile →
                      </a>
                    )}
                    {isMatchedTab && !matchedNoResume && matchedFetched && (
                      <button
                        type="button"
                        onClick={() => fetchSmartMatchedJobs(true)}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#2557a7] text-white text-sm font-semibold rounded-full hover:bg-[#1f4e98] transition-colors"
                      >
                        <RotateCcw size={13} />
                        Retry Smart Match
                      </button>
                    )}
                    {!isMatchedTab &&
                      (searchQuery || roleFilter || selectedFilters.length > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setInputValue("");
                            setRoleFilter("");
                            setSelectedFilters([]);
                          }}
                          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] text-white text-sm font-semibold rounded-full hover:bg-[#1e293b] transition-colors"
                        >
                          <FileX size={13} />
                          Clear Filters &amp; Try Again
                        </button>
                      )}
                  </div>
                ) : (
                  <JobList
                    jobs={filteredJobs}
                    onBotClick={(job) => {
                      setSelectedJob(job as unknown as NormalizedJob);
                      setOpenChat(true);
                    }}
                  />
                )}

                {/* Pagination — hidden for matched tab (server already limits) */}
                {filteredJobs.length > 0 && !isMatchedTab &&
                  (() => {
                    const hasClientFilter = !!(
                      roleFilter ||
                      searchQuery ||
                      selectedFilters.length > 0 ||
                      selectedLocation !== "All Locations"
                    );
                    const effectiveTotalPages = hasClientFilter
                      ? Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE))
                      : totalPages;
                    return effectiveTotalPages > 1 ? (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={effectiveTotalPages}
                        totalItems={totalJobs}
                        itemsPerPage={JOBS_PER_PAGE}
                        onPageChange={handlePageChange}
                      />
                    ) : null;
                  })()}
              </div>
            </div>
          </div>
      </main>

      {/* RIGHT SIDEBAR — always visible */}
      <aside className="sticky hidden w-[420px] shrink-0 self-start overflow-hidden rounded-[24px] border border-white/75 bg-white/90 shadow-[0_22px_62px_rgba(15,23,42,0.10)] backdrop-blur-xl xl:flex xl:flex-col 2xl:w-[460px]" style={{ top: "calc(var(--header-h, 56px) + 16px)", height: "calc(100vh - var(--header-h, 56px) - 16px)" }}>
        <JobsRightSidebar
          jobs={jobs}
          onChatOpen={() => { setSelectedJob(null); setOpenChat(true); }}
        />
      </aside>

      {!openChat && (
        <button
          type="button"
          onClick={() => { setSelectedJob(null); setOpenChat(true); }}
          className="fixed bottom-5 right-5 z-30 flex h-[60px] w-[60px] items-center justify-center rounded-2xl border border-white bg-white p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.22)] transition-all hover:-translate-y-0.5 active:translate-y-0 xl:hidden"
          aria-label="Open Nancy assistant"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ac4923bc-9ee8-4734-ad60-fc93e8935797.png"
            alt="Nancy AI"
            className="h-full w-full rounded-xl object-cover"
          />
          <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#2557a7] text-white shadow-md">
            <MessageCircle size={14} />
          </span>
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        </button>
      )}

      {/* NANCY CHAT — floating popup slides over the sidebar from the right */}
      {openChat && (
        <>
          {/* Click-outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => { setOpenChat(false); setSelectedJob(null); }}
          />
          {/* Chat panel — same position/width as sidebar, slides in from right */}
          <div
            className="fixed inset-x-3 bottom-3 z-50 flex flex-col overflow-hidden rounded-[24px] border border-white bg-white shadow-[0_26px_80px_rgba(15,23,42,0.24),0_8px_24px_rgba(15,23,42,0.12)] sm:inset-x-auto sm:bottom-5 sm:right-5"
            style={{
              width: "min(420px, calc(100vw - 24px))",
              height: "min(640px, calc(100vh - 92px))",
              animation: "slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <NancyChat
              job={selectedJob as unknown as Parameters<typeof NancyChat>[0]["job"]}
              onClose={() => {
                setOpenChat(false);
                setSelectedJob(null);
              }}
            />
          </div>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to   { transform: translateX(0);    opacity: 1; }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
