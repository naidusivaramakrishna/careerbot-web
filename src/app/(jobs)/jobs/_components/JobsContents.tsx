"use client";

import { useEffect, useState, useCallback } from "react";
import { searchJobs, getSmartMatchedJobs } from "@/api/jobsApi";
import type { MatchedJobItem } from "@/api/jobsApi";
import type { FilterParams } from "./filters/filterConstants";
import { toast } from "sonner";
import { getSavedJobIds, getSavedJobsCount } from "@/utils/jobTracking";
import { getJobId } from "@/utils/jobIdHelper";
import { Bookmark, Zap, Search, Briefcase, AlertTriangle, RotateCcw, FileX } from "lucide-react";

import JobsTabs, { TabType, SortType, FilterSort } from "./JobsTabs";
import JobList from "./sidebar/JobList";
import Pagination from "./Pagination";
import JobsRightSidebar from "./sidebar/JobsRightSidebar";
import NancyChat from "./chat/NancyChat";
import JobSkeleton from "./JobSkeleton";
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
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [cityFilter, setCityFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("relevance");
  const [filterSort, setFilterSort] = useState<FilterSort>("most-recent");

  // ── Tab counters ──
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [newJobIds, setNewJobIds] = useState<string[]>([]);

  // ── Nancy chat ──
  const [openChat, setOpenChat] = useState(false);
  const [selectedJob, setSelectedJob] = useState<NormalizedJob | null>(null);

  // ── Smart match ──
  const [matchedJobs, setMatchedJobs] = useState<NormalizedJob[]>([]);
  const [matchedLoading, setMatchedLoading] = useState(false);
  const [matchedFetched, setMatchedFetched] = useState(false);
  const [matchedNoResume, setMatchedNoResume] = useState(false);
  const [matchBandFilter, setMatchBandFilter] = useState<"all" | "strong" | "good" | "partial" | "low">("all");

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

        const total =
          response.pagination?.total ||
          normalized.length;
        const hasNext = response.pagination?.has_next || false;
        const calcPages =
          response.pagination?.total_pages ||
          (total > 0 ? Math.ceil(total / JOBS_PER_PAGE) : hasNext ? page + 1 : page);
        setTotalPages(calcPages);
        setTotalJobs(response.pagination?.total ?? undefined);

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
    // Matched tab: apply band filter + other filters
    if (activeTab === "matched") {
      let filtered = [...matchedJobs];

      // Apply match band filter
      if (matchBandFilter !== "all") {
        filtered = filtered.filter((j) => j.match_band === matchBandFilter);
      }

      // Apply other filters (same logic as All Jobs tab)
      if (selectedFilters.length > 0) {
        const WORK_MODEL_OPTIONS = ["onsite", "hybrid", "remote"];
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
              if (fl === "remote") return jobMode.includes("remote");
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

          const matchesLocation = (() => {
            if (locationFilters.length === 0) return true;
            const jobCity = (job.location || "").split(",")[0].trim().toLowerCase();
            return locationFilters.some((loc) => jobCity === loc);
          })();

          const matchesEducation = (() => {
            if (educationFilters.length === 0) return true;
            const jobEdu = (job.education || "").toLowerCase();
            if (!jobEdu) return false;
            return educationFilters.some((edu) => jobEdu.includes(edu));
          })();

          return (
            matchesWorkModel &&
            matchesType &&
            matchesYears &&
            matchesSalary &&
            matchesLocation &&
            matchesEducation
          );
        });
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
    <div className="flex min-h-[calc(100vh-56px)] bg-[#f0f2f5]">
      {/* CENTER PANEL */}
      <main id="jobs-main-scroll" className="flex-1 min-w-0">
        {/* RESULTS VIEW */}
        <div>
            {/* TOP BAR */}
            <div className="px-6 py-5 bg-white border-b border-gray-100 flex items-center justify-between gap-4" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-[17px] font-bold text-gray-900 truncate leading-tight tracking-tight">
                      {isMatchedTab
                        ? "Smart Match Jobs"
                        : searchQuery
                        ? `Results for "${searchQuery}"`
                        : roleFilter
                        ? `${roleFilter} Jobs`
                        : "All Jobs"}
                    </h1>
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#eef3ff] text-[#2557a7] text-[9px] font-bold rounded-full border border-[#2557a7]/20 tracking-wide uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2557a7] animate-pulse shrink-0" />
                      Live
                    </span>
                  </div>
                  <p className="text-[12.5px] text-gray-400 mt-1 font-medium">
                    {filteredJobs.length > 0
                      ? `${filteredJobs.length.toLocaleString()} opportunities`
                      : displayLoading
                      ? "Loading…"
                      : "No results"}
                    {selectedLocation !== "All Locations" && ` · ${selectedLocation}`}
                  </p>
                </div>
              </div>

              {/* Search input — right side */}
              <div className="relative shrink-0">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or company"
                  className="w-72 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#f8f9fb] text-[13px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#2557a7]/50 focus:ring-2 focus:ring-[#2557a7]/10 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="px-6">
              {/* STICKY FILTER + TABS BAR */}
              <div className="sticky top-0 z-30 -mx-6 px-6 pb-0 bg-[#f0f2f5]" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
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
              <div className="mt-4 pb-10">
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
      <aside className="w-104 shrink-0 sticky self-start bg-white border-l border-gray-200/60 flex flex-col overflow-hidden" style={{ top: "var(--header-h, 56px)", height: "calc(100vh - var(--header-h, 56px))", boxShadow: "-4px 0 20px rgba(0,0,0,0.05)" }}>
        <JobsRightSidebar
          jobs={jobs}
          onChatOpen={() => { setSelectedJob(null); setOpenChat(true); }}
        />
      </aside>

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
            className="fixed bottom-4 right-4 z-50 flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200"
            style={{
              width: 400,
              height: 560,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
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
