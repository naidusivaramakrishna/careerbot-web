"use client";

import { useEffect, useState, useCallback } from "react";
import { searchJobs, getSmartMatchedJobs } from "@/api/jobsApi";
import type { MatchedJobItem } from "@/api/jobsApi";
import type { FilterParams } from "./filters/filterConstants";
import { toast } from "sonner";
import { getSavedJobIds, getSavedJobsCount } from "@/utils/jobTracking";
import { getJobId } from "@/utils/jobIdHelper";

import JobsTabs, { TabType } from "./JobsTabs";
import JobList from "./sidebar/JobList";
import Pagination from "./Pagination";
import TopPickCard from "./sidebar/TopPickCard";
import SalaryInsights from "./sidebar/SalaryInsights";
import CareerTip from "./sidebar/CareerTip";
import NancyChat from "./chat/NancyChat";
import JobSkeleton from "./JobSkeleton";
import JobsHeaderSection from "./JobsHeaderSection";
import JobsLandingSection from "./JobsLandingSection";
import JobsFilterSidebar from "./JobsFilterSidebar";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeJob(job: any, matchScore = 0, matchData?: MatchedJobItem["match"]): NormalizedJob {
  const title = job.title || job.job_title || "Job Title";
  const company =
    job.company || job.company_name || job.organization || job.about_company || job.employer || "";
  const location =
    job.location || job.job_location || job.city || job.place || "Location not specified";

  return {
    id: getJobId(job.id, title, company, location),
    title,
    company,
    location,
    logo: job.organization_logo || job.company_logo || "",
    type: (() => {
      const raw = (
        job.job_type ||
        job.type ||
        job.employment_type ||
        job.work_type ||
        job.contract_type ||
        ""
      )
        .toLowerCase()
        .trim();
      if (!raw) return "";
      if (raw.includes("intern")) return "Internship";
      if (raw.includes("contract") || raw.includes("freelance")) return "Contract";
      if (raw.includes("part")) return "Part-time";
      return "Full-time";
    })(),
    mode: job.work_mode || job.mode || "",
    salary:
      typeof job.salary === "string" && job.salary.trim() ? job.salary.trim() : "",
    time: "Recently",
    url: job.recruiter_id ? "" : job.url || job.apply_url || "",
    application_url: job.recruiter_id ? "" : job.application_url || "",
    recruiter_id: job.recruiter_id || "",
    matchScore,
    matchText: matchData ? `${Math.round(matchScore)}% match` : "Match",
    roleTrending: false,
    highHiring: false,
    description: job.description || job.job_description || "",
    created_at: job.created_at || null,
    posted_date: job.posted_date || job.created_at || null,
    company_website: job.company_website || "",
    skills:
      typeof job.skills === "string"
        ? job.skills
        : Array.isArray(job.skills)
        ? job.skills.join(", ")
        : "",
    experience: job.experience_level || job.experience || "",
    experience_level: job.experience_level || "",
    education:
      job.education ||
      job.qualification ||
      job.education_required ||
      job.min_education ||
      "",
    source: job.source || "",
    is_applied: !!job.is_applied,
    matched_skills: matchData?.matched_skills,
    missing_skills: matchData?.missing_skills,
    match_band: matchData?.band,
  };
}

const JOBS_PER_PAGE = 10;

export default function JobsContents() {
  // ── State ──
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<NormalizedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterParams>({});
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");

  const [showLanding, setShowLanding] = useState(true);
  const [openChat, setOpenChat] = useState(false);
  const [selectedJob, setSelectedJob] = useState<NormalizedJob | null>(null);

  const [newJobsCount, setNewJobsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [newJobIds, setNewJobIds] = useState<string[]>([]);

  // SmartMatch state
  const [matchedJobs, setMatchedJobs] = useState<NormalizedJob[]>([]);
  const [matchedLoading, setMatchedLoading] = useState(false);
  const [matchedFetched, setMatchedFetched] = useState(false);
  const [matchedNoResume, setMatchedNoResume] = useState(false);
  const [matchBandFilter, setMatchBandFilter] = useState<"all" | "strong" | "good" | "partial" | "low">("all");

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
        const normalized = jobsData.map((job) => normalizeJob(job));

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

        const total =
          response.pagination?.total ||
          normalized.length;
        const hasNext = response.pagination?.has_next || false;
        const calcPages =
          response.pagination?.total_pages ||
          (total > 0 ? Math.ceil(total / JOBS_PER_PAGE) : hasNext ? page + 1 : page);
        setTotalPages(calcPages);

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
      const data = await getSmartMatchedJobs({ limit: 50 });
      const normalized = (data.jobs || []).map((item) =>
        normalizeJob(item.job, item.match.score, item.match)
      );
      setMatchedJobs(normalized);
      setMatchedFetched(true);
      setMatchedNoResume(false);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (err as any)?.response?.status;
      if (status === 404) {
        setMatchedNoResume(true);
      } else {
        toast.error("Could not load Smart Match jobs. Please try again later.");
      }
      setMatchedFetched(true);
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
    // Matched tab: apply band filter only
    if (activeTab === "matched") {
      setFilteredJobs(
        matchBandFilter === "all"
          ? matchedJobs
          : matchedJobs.filter((j) => j.match_band === matchBandFilter)
      );
      return;
    }

    let filtered = [...jobs];

    if (activeTab === "saved") {
      const savedIds = getSavedJobIds();
      filtered = filtered.filter((j) => savedIds.includes(j.id));
    } else if (activeTab === "new") {
      setFilteredJobs(filtered.filter((j) => newJobIds.includes(j.id)));
      return;
    }

    // selectedLocation and single locationChip are server-side — skip client filter for them
    // searchQuery and roleFilter are server-side (sent as `q`) — skip client filter

    if (selectedFilters.length > 0) {
      const WORK_MODEL_OPTIONS = ["onsite", "hybrid", "remote anywhere in the india"];
      const TYPE_FILTERS = ["full-time", "contract", "part-time", "internship"];

      const selectedWorkModels = selectedFilters.filter((f) =>
        WORK_MODEL_OPTIONS.includes(f.toLowerCase())
      );
      const selectedTypeFilters = selectedFilters.filter((f) =>
        TYPE_FILTERS.includes(f.toLowerCase())
      );
      const yearsFilter = selectedFilters.find((f) => f.startsWith("years:"));
      const yearsValue = yearsFilter ? yearsFilter.replace("years:", "") : null;
      const salaryFilter = selectedFilters.find((f) => f.startsWith("salary:"));
      const salaryLabel = salaryFilter ? salaryFilter.replace("salary:", "") : "Any salary";
      const locationFilters = selectedFilters
        .filter((f) => f.startsWith("location:"))
        .map((f) => f.replace("location:", "").toLowerCase());
      const educationFilters = selectedFilters
        .filter((f) => f.startsWith("education:"))
        .map((f) => f.replace("education:", "").toLowerCase());

      // source: is radio-style chip — backend /jobs/all ignores it, so filter client-side
      const sourceFilterVal = selectedFilters
        .find((f) => f.startsWith("source:"))
        ?.replace("source:", "")
        .toLowerCase();

      const serverHandledLocation =
        locationFilters.length <= 1 || selectedLocation !== "All Locations";

      filtered = filtered.filter((job) => {
        const jobMode = (job.mode || "").toLowerCase();
        const effectiveMode = jobMode || "onsite";
        const matchesWorkModel =
          selectedWorkModels.length === 0 ||
          selectedWorkModels.some((f) => {
            const fl = f.toLowerCase();
            if (fl === "onsite")
              return (
                effectiveMode.includes("on-site") ||
                effectiveMode.includes("onsite") ||
                effectiveMode.includes("office") ||
                effectiveMode === "onsite"
              );
            if (fl === "hybrid") return jobMode.includes("hybrid");
            if (fl === "remote anywhere in the india") return jobMode.includes("remote");
            return false;
          });

        const matchesType =
          selectedTypeFilters.length === 0 ||
          selectedTypeFilters.some((f) => job.type.toLowerCase() === f.toLowerCase());

        const matchesYears = (() => {
          if (!yearsValue) return true;
          const expStr = job.experience || "";
          const nums = String(expStr).match(/\d+/g);
          if (yearsValue === "Fresher") {
            if (!nums) return true;
            return parseInt(nums[0], 10) === 0;
          }
          const selectedYear =
            yearsValue === "11+ yrs" ? 11 : parseInt(yearsValue, 10);
          if (isNaN(selectedYear)) return true;
          if (!nums) return selectedYear === 0;
          const minExp = parseInt(nums[0], 10);
          if (selectedYear === 11) return minExp >= 11;
          return minExp === selectedYear;
        })();

        const matchesSalary = (() => {
          if (salaryLabel === "Any salary") return true;
          const salaryStr = job.salary || "";
          if (!salaryStr) return true;
          const cleaned = salaryStr.replace(/[₹,]/g, "").toLowerCase();
          const rangeMatch = cleaned.match(
            /(\d+\.?\d*)\s*[lk]?\s*-\s*(\d+\.?\d*)\s*[lk]/
          );
          let salaryNum = 0;
          if (rangeMatch) {
            const maxVal = parseFloat(rangeMatch[2]);
            const unit = cleaned.match(/[lk]/);
            if (unit?.[0] === "l") salaryNum = maxVal * 100000;
            else if (unit?.[0] === "k") salaryNum = maxVal * 1000;
            else salaryNum = maxVal;
          } else {
            const lakhMatch = cleaned.match(/(\d+\.?\d*)\s*l/);
            const kMatch = cleaned.match(/(\d+\.?\d*)\s*k/);
            const numMatch = cleaned.match(/(\d+)/);
            if (lakhMatch) salaryNum = parseFloat(lakhMatch[1]) * 100000;
            else if (kMatch) salaryNum = parseFloat(kMatch[1]) * 1000;
            else if (numMatch) salaryNum = parseFloat(numMatch[1]);
          }
          if (salaryNum === 0) return false;
          const lpaMatch = salaryLabel.match(/(\d+)\s*LPA\+/i);
          const minVal = lpaMatch
            ? parseInt(lpaMatch[1]) * 100000
            : parseInt(salaryLabel.replace(/[₹L+]/g, "")) * 100000;
          return salaryNum >= minVal;
        })();

        // Server handled single location — client-filter only for multi-location chips
        const matchesLocation = (() => {
          if (locationFilters.length === 0) return true;
          if (serverHandledLocation) return true;
          const jobCity = (job.location || "").split(",")[0].trim().toLowerCase();
          return locationFilters.some((loc) => jobCity === loc);
        })();

        const matchesEducation = (() => {
          if (educationFilters.length === 0) return true;
          const jobEdu = (job.education || "").toLowerCase();
          if (!jobEdu) return false;
          return educationFilters.some((edu) => jobEdu.includes(edu));
        })();

        const matchesSource = !sourceFilterVal ||
          (job.source || "").toLowerCase().includes(sourceFilterVal);

        return (
          matchesWorkModel &&
          matchesType &&
          matchesYears &&
          matchesSalary &&
          matchesLocation &&
          matchesEducation &&
          matchesSource
        );
      });
    }

    setFilteredJobs(filtered);
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
  ]);

  // ── Filter toggle ──
  const handleFilterToggle = (filter: string) => {
    setSelectedFilters((prev) => {
      if (filter.startsWith("salary:")) {
        const withoutSalary = prev.filter((f) => !f.startsWith("salary:"));
        return filter === "salary:Any salary" ? withoutSalary : [...withoutSalary, filter];
      }
      if (filter.startsWith("years:")) {
        const withoutYears = prev.filter((f) => !f.startsWith("years:"));
        return filter === "years:Any requirements" ? withoutYears : [...withoutYears, filter];
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

  // ── Landing handlers ──
  const handleLandingSearch = (query: string, location: string, experience: string) => {
    if (query.trim()) setSearchQuery(query.trim());
    if (location && location !== "All Locations") setSelectedLocation(location);
    if (experience && experience !== "Select experience") {
      const expMap: Record<string, string> = {
        "0-1 years": "0-1 years",
        "1-3 years": "1-3 years",
        "3-5 years": "3-5 years",
        "5-8 years": "5-8 years",
        "8+ years": "8-11+ years",
      };
      const mapped = expMap[experience];
      if (mapped) {
        setSelectedFilters((prev) => {
          const withoutYears = prev.filter((f) => !f.startsWith("years:"));
          return [...withoutYears, `years:${mapped}`];
        });
      }
    }
    setShowLanding(false);
  };

  const handleCategoryClick = (
    query: string,
    filter?: { type?: string; workModel?: string }
  ) => {
    if (query.trim()) {
      const isRoleClick = !filter?.workModel && !filter?.type;
      if (isRoleClick) {
        setRoleFilter(query.trim());
        setSearchQuery("");
      } else {
        setSearchQuery(query.trim());
        setRoleFilter("");
      }
    }
    if (filter?.workModel) {
      setSelectedFilters((prev) =>
        prev.includes(filter.workModel!) ? prev : [...prev, filter.workModel!]
      );
    }
    if (filter?.type) {
      setSelectedFilters((prev) =>
        prev.includes(filter.type!) ? prev : [...prev, filter.type!]
      );
    }
    setShowLanding(false);
  };

  // ── Derived values ──
  const isMatchedTab = activeTab === "matched";
  const displayLoading = isMatchedTab ? matchedLoading : loading;
  const matchedCount = matchedJobs.length;

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* CENTER PANEL */}
      <main className="flex-1 overflow-y-scroll">
        {/* LANDING VIEW */}
        {showLanding && (
          <JobsLandingSection
            onSearch={handleLandingSearch}
            onCategoryClick={handleCategoryClick}
          />
        )}

        {/* RESULTS VIEW */}
        {!showLanding && (
          <div>
            {/* TOP BAR */}
            <div className="px-8 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowLanding(true);
                    setSearchQuery("");
                    setRoleFilter("");
                    setSelectedLocation("All Locations");
                    setSelectedFilters([]);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shrink-0 group"
                >
                  <svg
                    className="w-4 h-4 text-[#2557a7] group-hover:text-[#1a4a96]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                    Home
                  </span>
                </button>
                <div className="w-px h-5 bg-gray-200 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {isMatchedTab
                      ? "Smart Match Jobs"
                      : searchQuery
                      ? `Results for "${searchQuery}"`
                      : roleFilter
                      ? `${roleFilter} Jobs`
                      : "All Jobs"}
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {filteredJobs.length > 0
                      ? `${filteredJobs.length} opportunities found`
                      : displayLoading
                      ? "Loading…"
                      : "No results"}
                    {selectedLocation !== "All Locations" && ` · ${selectedLocation}`}
                  </p>
                </div>
              </div>

              {/* Active filter chips */}
              {!isMatchedTab &&
                (searchQuery ||
                  roleFilter ||
                  selectedLocation !== "All Locations" ||
                  selectedFilters.length > 0) && (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {roleFilter && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-[#0f172a] text-white rounded-full text-xs font-medium">
                        {roleFilter}
                        <button
                          onClick={() => setRoleFilter("")}
                          className="ml-1 opacity-70 hover:opacity-100 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-[#0f172a] text-white rounded-full text-xs font-medium">
                        {searchQuery}
                        <button
                          onClick={() => setSearchQuery("")}
                          className="ml-1 opacity-70 hover:opacity-100 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedLocation !== "All Locations" && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {selectedLocation}
                        <button
                          onClick={() => setSelectedLocation("All Locations")}
                          className="ml-1 opacity-60 hover:opacity-100 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedFilters.map((filter) => (
                      <span
                        key={filter}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                      >
                        {filter}
                        <button
                          onClick={() => handleFilterToggle(filter)}
                          className="ml-1 opacity-60 hover:opacity-100 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setRoleFilter("");
                        setSelectedLocation("All Locations");
                        setSelectedFilters([]);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
                    >
                      Clear all
                    </button>
                  </div>
                )}
            </div>

            <div className="px-8 py-4">
              {!isMatchedTab && (
                <JobsHeaderSection
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              )}

              {!isMatchedTab && (
                <JobsFilterSidebar
                  selectedFilters={selectedFilters}
                  onFilterToggle={handleFilterToggle}
                  onFilterChange={handleFilterChange}
                  jobs={jobs}
                />
              )}

              <div className="mt-2 flex items-center justify-between gap-4">
                <JobsTabs
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                  }}
                  newCount={newJobsCount}
                  savedCount={savedJobsCount}
                  matchedCount={matchedCount}
                />
                {isMatchedTab && matchedFetched && !matchedLoading && (
                  <button
                    type="button"
                    onClick={() => fetchSmartMatchedJobs(true)}
                    className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-[#2557a7] hover:text-[#1a4a96] transition-colors pb-3"
                    title="Recalculate matches based on your current profile"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh matches
                  </button>
                )}
              </div>

              {/* SmartMatch band filter dropdown */}
              {isMatchedTab && !matchedLoading && matchedJobs.length > 0 && (() => {
                const BANDS: { key: "all" | "strong" | "good" | "partial" | "low"; label: string }[] = [
                  { key: "all",     label: "All Matches"     },
                  { key: "strong",  label: "Best Fit"        },
                  { key: "good",    label: "Recommended"     },
                  { key: "partial", label: "Worth Exploring" },
                  { key: "low",     label: "Low Relevance"   },
                ];
                const counts: Record<string, number> = { all: matchedJobs.length };
                matchedJobs.forEach((j) => {
                  if (j.match_band) counts[j.match_band] = (counts[j.match_band] ?? 0) + 1;
                });
                const visible = BANDS.filter((b) => b.key === "all" || (counts[b.key] ?? 0) > 0);
                const active = BANDS.find((b) => b.key === matchBandFilter)!;
                return (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[12px] text-gray-400 font-medium shrink-0">Filter by match:</span>
                    <div className="relative">
                      <select
                        value={matchBandFilter}
                        onChange={(e) => setMatchBandFilter(e.target.value as typeof matchBandFilter)}
                        className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[12.5px] font-semibold border border-gray-200 bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-[#2557a7] transition-colors"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                      >
                        {visible.map((b) => (
                          <option key={b.key} value={b.key}>
                            {b.label} ({counts[b.key] ?? 0})
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {matchBandFilter !== "all" && (
                      <span className="text-[11px] text-gray-400">
                        Showing <span className="font-semibold text-gray-700">{active.label}</span> — {counts[matchBandFilter] ?? 0} job{(counts[matchBandFilter] ?? 0) !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* JOB LIST */}
              <div className="mt-2">
                {displayLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <JobSkeleton key={i} />
                    ))}
                  </div>
                ) : error && !isMatchedTab ? (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                    <p className="text-red-800 font-semibold text-sm">Failed to Load Jobs</p>
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <img
                      src="/images/no_results.png"
                      alt="No results found"
                      className="object-contain mb-4"
                      style={{ width: 500, mixBlendMode: "multiply" }}
                    />
                    <h3 className="text-lg font-bold text-gray-800">
                      {activeTab === "saved"
                        ? "No saved jobs yet"
                        : activeTab === "new"
                        ? "No new jobs available"
                        : activeTab === "matched"
                        ? matchedNoResume
                          ? "Resume required for Smart Match"
                          : "No matched jobs found"
                        : "Sorry, no results found :("}
                    </h3>
                    <p className="text-gray-400 text-sm mt-2 max-w-md leading-relaxed">
                      {activeTab === "saved"
                        ? "Save jobs you like and find them all here."
                        : activeTab === "new"
                        ? "No new jobs were added in the latest update. Check back soon."
                        : activeTab === "matched"
                        ? matchedNoResume
                          ? "Smart Match analyses your resume to score every job for you. Go to Profile → Resume tab to upload your resume."
                          : "Smart Match ran but no strong matches found yet. Try clicking Retry or update your profile with more skills."
                        : "Try changing your search criteria or filters."}
                    </p>
                    {isMatchedTab && matchedNoResume && (
                      <a
                        href="/profile"
                        className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-[#2557a7] text-white text-sm font-semibold rounded-full hover:bg-[#1e4a96] transition-colors"
                      >
                        Upload Resume in Profile →
                      </a>
                    )}
                    {isMatchedTab && !matchedNoResume && matchedFetched && (
                      <button
                        type="button"
                        onClick={() => fetchSmartMatchedJobs(true)}
                        className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-[#2557a7] text-white text-sm font-semibold rounded-full hover:bg-[#1e4a96] transition-colors"
                      >
                        Retry Smart Match
                      </button>
                    )}
                    {!isMatchedTab &&
                      (searchQuery || roleFilter || selectedFilters.length > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setRoleFilter("");
                            setSelectedFilters([]);
                          }}
                          className="mt-5 px-6 py-2.5 bg-[#0f172a] text-white text-sm font-semibold rounded-full hover:bg-[#1e293b] transition-colors"
                        >
                          Clear Filters &amp; Try Again
                        </button>
                      )}
                  </div>
                ) : (
                  <JobList
                    jobs={filteredJobs}
                    onBotClick={(job) => {
                      setSelectedJob(job);
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
                        onPageChange={handlePageChange}
                      />
                    ) : null;
                  })()}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR */}
      {!showLanding && (
        <aside className="w-115 pr-6 py-6 space-y-4 sticky top-0 h-fit">
          {!openChat && (
            <>
              <TopPickCard jobs={jobs} />
              <SalaryInsights jobs={jobs} />
              <CareerTip />
            </>
          )}
          {openChat && (
            <div className="sticky top-5 bg-transparent z-50 rounded-xl shadow-lg">
              <NancyChat
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                job={selectedJob as any}
                onClose={() => {
                  setOpenChat(false);
                  setSelectedJob(null);
                }}
              />
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
