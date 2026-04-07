"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllJobs, searchJobs, runJobAggregator } from "@/api/jobsApi";
import type { FilterParams } from "./filters/QuickFilters";
import { toast } from "sonner";
import { getSeniorityLevel } from "@/utils/jobLevelUtils";
import {
  getSavedJobIds,
  getSavedJobsCount,
} from "@/utils/jobTracking";
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

export default function JobsContents() {
  // ---------------- STATE ----------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [jobs, setJobs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterParams>({});
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");

  const [openChat, setOpenChat] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [newJobsCount, setNewJobsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);

  const [newJobIds, setNewJobIds] = useState<string[]>([]);

  // Handle filter changes from QuickFilters
  const handleFilterChange = useCallback((filters: FilterParams) => {
    console.log("🔍 Filter changed:", filters);
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
    setJobs([]); // Clear existing jobs
  }, []);

  const JOBS_PER_PAGE = 10;

  // ---------------- API FETCH ----------------
  const fetchJobs = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      let newlyAddedJobIds: string[] = [];

      const jobsPerPage = JOBS_PER_PAGE;
      const skip = (page - 1) * jobsPerPage;

      // Run aggregator on first page load
      if (page === 1) {
        console.log("🤖 Running job aggregator on page 1...");
        try {
          await runJobAggregator();
          console.log("✅ Aggregator completed");
        } catch (error) {
          console.warn("⚠️ Aggregator failed (non-blocking):", error);
        }
      }

      // Use searchJobs if search query or filters are active, otherwise use getAllJobs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let response: any;
      if (searchQuery || Object.keys(activeFilters).length > 0) {
        console.log("🔎 Using searchJobs with query and filters:", { searchQuery, activeFilters });
        response = await searchJobs({
          query: searchQuery || undefined,
          location: selectedLocation !== "All Locations" ? selectedLocation : undefined,
          job_type: activeFilters.job_type,
          skip,
          limit: jobsPerPage,
        });
      } else {
        console.log("🔎 Using getAllJobs unified (recruiter + external jobs mixed)");
         
        response = await getAllJobs(skip, jobsPerPage);
      }

      // Jobs already unified by backend
      const jobsData = Array.isArray(response.data) ? response.data : [];

      console.log("🔍 === API RESPONSE DEBUG ===");
      console.log("  response.success:", response.success);
      console.log("  response.data exists:", !!response.data);
      console.log("  response.data is array:", Array.isArray(response.data));
      console.log("  response.data length:", Array.isArray(response.data) ? response.data.length : "N/A");
      console.log("  Full response object keys:", Object.keys(response));
      if (!Array.isArray(response.data) && response.data) {
        console.log("  response.data keys:", Object.keys(response.data));
      }
      console.log("=== END API DEBUG ===");

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch jobs");
      }

      console.log(`📊 Page ${currentPage}: Loaded ${jobsData.length} jobs`);

      // 🔍 DEBUG: Log first job to see what fields API is returning
      if (jobsData.length > 0) {
        console.log("🔎 === LOGO DEBUG: FIRST JOB FROM API ===");
        console.log("  Title:", jobsData[0].title || jobsData[0].job_title);
        console.log("  organization_logo:", jobsData[0].organization_logo);
        console.log("  company_logo:", jobsData[0].company_logo);
        console.log("  logo:", jobsData[0].logo);
        console.log("  All API fields:", Object.keys(jobsData[0]).sort());
        console.log("=== END LOGO DEBUG ===");
      }

      // 🔍 DEBUG: Log work mode information and API source for all jobs
      console.log("🏢 === WORK MODE DEBUG BY API SOURCE ===");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recruiterJobsWithMode = jobsData.filter((job: any) => job.recruiter_id && job.work_mode).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recruiterJobsWithoutMode = jobsData.filter((job: any) => job.recruiter_id && !job.work_mode).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aggregatedJobsWithMode = jobsData.filter((job: any) => !job.recruiter_id && job.work_mode).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const aggregatedJobsWithoutMode = jobsData.filter((job: any) => !job.recruiter_id && !job.work_mode).length;

      console.log(`📊 TOTAL JOBS: ${jobsData.length}`);
      console.log(`\n👷 RECRUITER JOBS (Manual Portal):`);
      console.log(`   WITH work mode ✅: ${recruiterJobsWithMode}`);
      console.log(`   WITHOUT work mode ❌: ${recruiterJobsWithoutMode}`);
      console.log(`\n🌐 AGGREGATED JOBS (External Sources):`);
      console.log(`   WITH work mode ✅: ${aggregatedJobsWithMode}`);
      console.log(`   WITHOUT work mode ❌: ${aggregatedJobsWithoutMode}`);

      console.log(`\n📌 ALL RECRUITER JOBS (${recruiterJobsWithMode + recruiterJobsWithoutMode}):`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobsData.forEach((job: any, idx: number) => {
        if (job.recruiter_id) {
          console.log(`  [${idx + 1}] 👷 RECRUITER | "${job.title || job.job_title}" | Company: ${job.company || job.about_company}`);
        }
      });

      console.log(`\n📌 JOBS WITH WORK MODE (${recruiterJobsWithMode + aggregatedJobsWithMode}):`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jobsData.forEach((job: any, idx: number) => {
        if (job.work_mode) {
          const source = job.recruiter_id ? "👷 RECRUITER" : "🌐 AGGREGATED";
          console.log(`  [${idx + 1}] ${source} | "${job.title || job.job_title}" → Mode: ${job.work_mode}`);
        }
      });
      console.log("=== END WORK MODE DEBUG ===");

      const transformedJobs = jobsData
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((job: any /* Supports both manual and aggregated job formats */) => {
          // 🔄 Normalize both manual and aggregated job formats
          const title = job.title || job.job_title || "Job Title";
          const company = job.company || job.company_name || job.organization || job.about_company || job.employer || "";
          const location = job.location || job.job_location || job.city || job.place || "Location not specified";

          // Debug: Log salary data available in API response
          if (job.salary || job.salary_min || job.min_salary || job.salary_max || job.max_salary) {
            console.log(`✅ Job "${title}": salary=${job.salary}, salary_min=${job.salary_min}, min_salary=${job.min_salary}, salary_max=${job.salary_max}, max_salary=${job.max_salary}`);
          } else {
            console.log(`❌ Job "${title}": NO SALARY DATA in API response`);
          }

          const transformed = {
            id: getJobId(job.id, title, company, location),
            title,
            company,
            location,
            // Use only API-provided logos (organization_logo or company_logo)
            logo: job.organization_logo || job.company_logo || "",
            type: job.job_type || "Full-time",
            // Work mode (Remote, Hybrid, Onsite, etc.)
            mode: job.work_mode || "",
            // Salary: use as-is if string, otherwise empty
            salary: (() => {
              let salaryValue = "";
              if (typeof job.salary === "string" && job.salary.trim()) {
                salaryValue = job.salary.trim();
              }
              return salaryValue;
            })(),
            time: "Recently",
            // Handle both manual (url) and aggregated (apply_url) formats
            // For recruiter jobs: DON'T set URL so it opens modal instead of redirecting
            url: job.recruiter_id ? "" : (job.url || job.apply_url || ""),
            application_url: job.recruiter_id ? "" : (job.application_url || ""),
            recruiter_id: job.recruiter_id || "",
            matchScore: 75,
            matchText: "Match",
            roleTrending: false,
            highHiring: false,
            description: job.description || "",
            // 🔥 IMPORTANT: Use ONLY the actual created_at from API, don't default to current time
            // This allows you to accurately identify truly new jobs
            created_at: job.created_at || null,
            posted_date: job.posted_date || job.created_at || null,
            // Company website (manual jobs only)
            company_website: job.company_website || "",
            // Skills: handle both string (manual) and array (aggregated) formats
            skills: typeof job.skills === "string"
              ? job.skills
              : Array.isArray(job.skills)
              ? job.skills.join(", ")
              : "",
            // Experience: handle both manual and aggregated formats
            experience: job.experience_level || job.experience || "",
            experience_level: job.experience_level || "",
          };
          return transformed;
        });

      // 🔥 Identify newly added jobs (created in the last 5 minutes)
      const lastFetchTime = localStorage.getItem("lastJobFetchTime");
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const timeThreshold = lastFetchTime || fiveMinutesAgo;

      newlyAddedJobIds = transformedJobs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((job: any) => job.created_at && job.created_at >= timeThreshold)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((job: any) => job.id);

      // 🔄 Accumulate new job IDs across all pages (only reset on first page load)
      setNewJobIds((prev) => {
        if (page === 1) {
          // First page: replace with newly identified jobs
          return newlyAddedJobIds;
        } else {
          // Subsequent pages: accumulate with previous new jobs
          return [...new Set([...prev, ...newlyAddedJobIds])]; // Use Set to avoid duplicates
        }
      });

      // Update count based on accumulated new jobs
      setNewJobsCount((prev) => page === 1 ? newlyAddedJobIds.length : prev + newlyAddedJobIds.length);

      // Save fetch time so next load can detect new jobs
      if (page === 1) localStorage.setItem("lastJobFetchTime", new Date().toISOString());

      // Replace jobs for the current page (no accumulation)
      setJobs(transformedJobs);
      setCurrentPage(page);

      // Calculate total pages from API pagination info
      const total = response.pagination?.total || response.pagination?.total_count || transformedJobs.length;
      const hasNext = response.pagination?.has_next || false;
      const calculatedTotalPages = response.pagination?.total_pages
        || (total > 0 ? Math.ceil(total / JOBS_PER_PAGE) : hasNext ? page + 1 : page);
      setTotalPages(calculatedTotalPages);

      // Get saved jobs count
      setSavedJobsCount(getSavedJobsCount());

      console.log(`✅ Page ${page} completed:`);
      console.log(`   - Loaded ${transformedJobs.length} jobs`);
      console.log(`   - Total jobs in state: ${page === 1 ? transformedJobs.length : 'appended'}`);
      console.log(`   - has_next from API: ${response.pagination?.has_next}`);
      console.log(`   - totalPages calculated: ${calculatedTotalPages}`);
      console.log(`   - Response pagination:`, response.pagination);

      if (transformedJobs.length === 0) {
        toast.info("No jobs found matching your criteria");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to fetch jobs. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, selectedLocation, searchQuery]);

  // Initial fetch on mount and when search query or filters change
  useEffect(() => {
    setCurrentPage(1);
    setJobs([]);
    setFilteredJobs([]);

    if (searchQuery) {
      console.log(`🔍 Search query changed to: "${searchQuery}", fetching...`);
    } else if (Object.keys(activeFilters).length === 0) {
      console.log(`🌟 JobsContents mounted, initiating initial fetch`);
    } else {
      console.log(`🌟 Filters changed, fetching filtered jobs:`, activeFilters);
    }

    fetchJobs(1);
  }, [fetchJobs, searchQuery, activeFilters]);

  const handlePageChange = (page: number) => {
    fetchJobs(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🔍 FILTER LOGIC - RUNS WHEN SEARCH, FILTERS, OR TAB CHANGES
  useEffect(() => {
    let filtered = [...jobs];

    // Filter by active tab
    if (activeTab === "saved") {
      const savedIds = getSavedJobIds();
      filtered = filtered.filter((job) => savedIds.includes(job.id));
    } else if (activeTab === "new") {
      // 🔥 Show only newly added jobs from the latest aggregator run
      filtered = filtered.filter((job) => newJobIds.includes(job.id));
    }

    // Filter by location from search bar (only if user selected a specific location)
    if (selectedLocation && selectedLocation !== "All Locations" && selectedLocation !== "Remote") {
      // Extract city name from selected location (e.g., "Mumbai, India" → "mumbai")
      const selectedCity = selectedLocation.toLowerCase().split(",")[0].trim();
      filtered = filtered.filter((job) => {
        const jobCity = job.location.toLowerCase().split(",")[0].trim();
        return jobCity === selectedCity;
      });
    }

    // Filter by search query (job title and company)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query)
      );
    }

    // Filter by selected quick filters
    if (selectedFilters.length > 0) {
      const EXP_LEVELS = ["intern/new grad", "entry level", "mid level", "senior level", "lead/staff", "director/executive"];
      const WORK_MODEL_OPTIONS = ["onsite", "hybrid", "remote anywhere in the india"];
      const TYPE_FILTERS = ["full-time", "contract", "part-time", "internship"];

      const selectedExpFilters = selectedFilters.filter(f => EXP_LEVELS.includes(f.toLowerCase()));
      const selectedWorkModels = selectedFilters.filter(f => WORK_MODEL_OPTIONS.includes(f.toLowerCase()));
      const selectedTypeFilters = selectedFilters.filter(f => TYPE_FILTERS.includes(f.toLowerCase()));
      const yearsFilter = selectedFilters.find(f => f.startsWith("years:"));
      const yearsValue = yearsFilter ? yearsFilter.replace("years:", "") : "Any requirements";
      const salaryFilter = selectedFilters.find(f => f.startsWith("salary:"));
      const salaryLabel = salaryFilter ? salaryFilter.replace("salary:", "") : "Any salary";

      if (salaryFilter) console.log(`🔍 Applying salary filter: ${salaryLabel}`);

      filtered = filtered.filter((job) => {
        const jobType = job.type.toLowerCase();
        const titleLower = job.title.toLowerCase();
        const { level } = getSeniorityLevel(job.experience);

        // Work model filter (OR within group) - check mode field from API
        const jobMode = (job.mode || "").toLowerCase();
        const matchesWorkModel = selectedWorkModels.length === 0 || selectedWorkModels.some(f => {
          const fl = f.toLowerCase();
          if (fl === "onsite") return jobMode.includes("on-site") || jobMode.includes("onsite") || jobMode.includes("in-office");
          if (fl === "hybrid") return jobMode.includes("hybrid");
          if (fl === "remote anywhere in the india") return jobMode.includes("remote");
          return false;
        });

        // Job type filter (OR within group)
        const matchesType = selectedTypeFilters.length === 0 || selectedTypeFilters.some(f => jobType.includes(f.toLowerCase()));

        // Experience level filter — uses same getSeniorityLevel as the badge on the card
        const matchesExp = selectedExpFilters.length === 0 || selectedExpFilters.some((f) => {
          const fl = f.toLowerCase();
          if (fl === "intern/new grad") return level === "entry";
          if (fl === "entry level")     return level === "entry";
          if (fl === "mid level")       return level === "mid";
          if (fl === "senior level")    return level === "senior";
          if (fl === "lead/staff")      return titleLower.includes("lead") || titleLower.includes("staff") || titleLower.includes("principal");
          if (fl === "director/executive") return titleLower.includes("director") || titleLower.includes("vp") || titleLower.includes("head of") || titleLower.includes("executive") || titleLower.includes("cto") || titleLower.includes("ceo");
          return false;
        });

        // Years of experience filter
        const matchesYears = (() => {
          if (yearsValue === "Any requirements") return true;
          const expStr = job.experience || "";
          const num = parseFloat(expStr);
          if (isNaN(num)) return true;
          if (yearsValue === "0-1 years") return num <= 1;
          if (yearsValue === "1-3 years") return num >= 1 && num <= 3;
          if (yearsValue === "3-5 years") return num >= 3 && num <= 5;
          if (yearsValue === "5-8 years") return num >= 5 && num <= 8;
          if (yearsValue === "8+ years")  return num >= 8;
          return true;
        })();

        // Salary filter — parse numeric value from salary string (handles ranges)
        const matchesSalary = (() => {
          if (salaryLabel === "Any salary") return true;
          const salaryStr = job.salary || "";
          if (!salaryStr) return true;
          // Extract salary values from ranges like "50L-70L" or "50000-70000"
          const cleaned = salaryStr.replace(/[₹,]/g, "").toLowerCase();

          // Try to match salary ranges first (e.g., "50L-70L" or "50k-70k")
          const rangeMatch = cleaned.match(/(\d+\.?\d*)\s*[lk]?\s*-\s*(\d+\.?\d*)\s*[lk]/);

          let salaryNum = 0;
          let parseMethod = "none";

          if (rangeMatch) {
            // For ranges, use the MAX value (higher end of salary range)
            const maxVal = parseFloat(rangeMatch[2]);
            const unit = cleaned.match(/[lk]/);
            if (unit?.[0] === 'l') {
              salaryNum = maxVal * 100000;
              parseMethod = `range_lakh(${rangeMatch[1]}-${rangeMatch[2]})`;
            } else if (unit?.[0] === 'k') {
              salaryNum = maxVal * 1000;
              parseMethod = `range_k(${rangeMatch[1]}-${rangeMatch[2]})`;
            } else {
              salaryNum = maxVal;
              parseMethod = `range_plain(${rangeMatch[1]}-${rangeMatch[2]})`;
            }
          } else {
            // Single value (no range)
            const lakhMatch = cleaned.match(/(\d+\.?\d*)\s*l/);
            const kMatch = cleaned.match(/(\d+\.?\d*)\s*k/);
            const numMatch = cleaned.match(/(\d+)/);

            if (lakhMatch) {
              salaryNum = parseFloat(lakhMatch[1]) * 100000;
              parseMethod = `lakh(${lakhMatch[1]})`;
            } else if (kMatch) {
              salaryNum = parseFloat(kMatch[1]) * 1000;
              parseMethod = `k(${kMatch[1]})`;
            } else if (numMatch) {
              salaryNum = parseFloat(numMatch[1]);
              parseMethod = `plain(${numMatch[1]})`;
            }
          }

          if (salaryNum === 0) {
            console.log(`💼 ${job.title} | Salary: "${job.salary}" → ❌ No number found, showing job`);
            return true;
          }

          const minVal = parseInt(salaryLabel.replace(/[₹L+]/g, "")) * 100000;
          const matches = salaryNum >= minVal;
          const status = matches ? "✅ MATCH" : "❌ SKIP";
          console.log(`💼 ${job.title} | "${job.salary}" (${parseMethod}) → ${salaryNum} | Filter: ${salaryLabel} (min: ${minVal}) | ${status}`);
          return matches;
        })();

        return matchesWorkModel && matchesType && matchesExp && matchesYears && matchesSalary;
      });
    }

    setFilteredJobs(filtered);
    console.log(`📊 Filtered results: ${filtered.length} jobs (from ${jobs.length} total)`);
    if (selectedFilters.length > 0) console.log(`✅ Active filters:`, selectedFilters);
  }, [jobs, searchQuery, selectedFilters, activeTab, newJobIds, selectedLocation]);

  const handleFilterToggle = (filter: string) => {
    console.log(`🔘 Filter toggle clicked: "${filter}"`);
    setSelectedFilters((prev) => {
      let updated;
      // Replace prefix-based filters (salary:, years:) instead of toggling
      if (filter.startsWith("salary:")) {
        const withoutSalary = prev.filter((f) => !f.startsWith("salary:"));
        updated = filter === "salary:Any salary" ? withoutSalary : [...withoutSalary, filter];
        console.log(`💼 Salary filter updated. Old:`, prev, `New:`, updated);
      } else if (filter.startsWith("years:")) {
        const withoutYears = prev.filter((f) => !f.startsWith("years:"));
        updated = filter === "years:Any requirements" ? withoutYears : [...withoutYears, filter];
        console.log(`📅 Years filter updated. Old:`, prev, `New:`, updated);
      } else {
        updated = prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter];
        console.log(`🏢 Other filter toggled. Old:`, prev, `New:`, updated);
      }
      return updated;
    });
  };

  // --------------- UI ----------------
  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">
      {/* CENTER PANEL */}
      <main className="flex-1 px-8 py-6 overflow-y-scroll">
        <JobsHeaderSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          selectedFilters={selectedFilters}
          onFilterToggle={handleFilterToggle}
          onFilterChange={handleFilterChange}
          jobs={jobs}
        />

        {/* ACTIVE FILTERS DISPLAY */}
        {(searchQuery || selectedLocation !== "All Locations" || selectedFilters.length > 0) && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Filters</span>
              {(searchQuery || selectedLocation !== "All Locations" || selectedFilters.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLocation("All Locations");
                    setSelectedFilters([]);
                  }}
                  className="text-xs text-[#2557a7] hover:text-[#1a4a96] font-medium"
                  title="Clear all filters"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {searchQuery && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2557a7]/8 border border-[#2557a7]/20 rounded-full text-xs text-[#2557a7]">
                  <span>{searchQuery}</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-[#2557a7]/60 hover:text-[#2557a7] ml-1 font-semibold leading-none"
                    title="Clear search"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedLocation !== "All Locations" && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2557a7]/8 border border-[#2557a7]/20 rounded-full text-xs text-[#2557a7]">
                  <span>{selectedLocation}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLocation("All Locations")}
                    className="text-[#2557a7]/60 hover:text-[#2557a7] ml-1 font-semibold leading-none"
                    title="Clear location"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedFilters.map((filter) => (
                <div
                  key={filter}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#2557a7]/8 border border-[#2557a7]/20 rounded-full text-xs text-[#2557a7]"
                >
                  <span>{filter}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterToggle(filter)}
                    className="text-[#2557a7]/60 hover:text-[#2557a7] ml-1 font-semibold leading-none"
                    title="Remove filter"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-0">
          <JobsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            newCount={newJobsCount}
            savedCount={savedJobsCount}
          />
        </div>

        {/* JOB LIST */}
        <div className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <JobSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <p className="text-red-800 font-semibold text-sm">Failed to Load Jobs</p>
              <p className="text-red-500 text-xs mt-1">{error}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            // Show "no jobs" when filteredJobs is empty
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-semibold text-base">No jobs found</p>
              <p className="text-gray-400 text-sm mt-1">
                {activeTab === "saved"
                  ? "You haven't saved any jobs yet"
                  : activeTab === "new"
                  ? "No new jobs added in the latest update"
                  : searchQuery && `No results for "${searchQuery}"`}
                {selectedFilters.length > 0 && ` matching ${selectedFilters.join(", ")}`}
              </p>
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

          {/* Pagination */}
          {filteredJobs.length > 0 && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </main>

      {/* RIGHT PANEL - Sticky Sidebar */}
      <aside className="w-[360px] pr-6 py-6 space-y-4 sticky top-0 h-fit">
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
              job={selectedJob}
              onClose={() => {
                setOpenChat(false);
                setSelectedJob(null);
              }}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
