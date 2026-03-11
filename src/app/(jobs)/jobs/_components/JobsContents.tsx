"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import TopPickCard from "./sidebar/TopPickCard";
import SalaryInsights from "./sidebar/SalaryInsights";
import CareerTip from "./sidebar/CareerTip";
import NancyChat from "./chat/NancyChat";
import JobSkeleton from "./JobSkeleton";
import JobsHeaderSection from "./JobsHeaderSection";

export default function JobsContents() {
  // ---------------- STATE ----------------
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterParams>({});
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedLocation, setSelectedLocation] = useState("All Locations"); // Default to show all

  const [openChat, setOpenChat] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [newJobsCount, setNewJobsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);

  const [newJobIds, setNewJobIds] = useState<string[]>([]); // Track newly added jobs

  // 🔄 Infinite Scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false); // Prevent duplicate API calls

  // Handle filter changes from QuickFilters
  const handleFilterChange = useCallback((filters: FilterParams) => {
    console.log("🔍 Filter changed:", filters);
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
    setJobs([]); // Clear existing jobs
  }, []);

  // ---------------- API FETCH ----------------
  const fetchJobs = useCallback(async (page: number = 1) => {
    console.log(`🔄 fetchJobs called with page: ${page}, isFetching: ${isFetchingRef.current}`);

    // Prevent duplicate API calls during rapid scrolling
    if (page > 1 && isFetchingRef.current) {
      console.warn(`⚠️ Preventing duplicate fetch for page ${page}, already fetching`);
      return;
    }

    if (page > 1) {
      isFetchingRef.current = true;
      setLoadingMore(true);
      console.log(`📄 Loading more: Page ${page}`);
    } else {
      setLoading(true);
      console.log(`📄 Initial load: Page ${page}`);
    }
    setError(null);

    try {
      let newlyAddedJobIds: string[] = [];

      // Call the jobsApi function with proper parameters
      // Fetch 20 jobs per page consistently (recruiter + external mixed)
      const jobsPerPage = 20;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response = await getAllJobs(skip, jobsPerPage);
      }

      // Jobs already unified by backend
      let jobsData = Array.isArray(response.data) ? response.data : [];

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

      const recruiterJobsWithMode = jobsData.filter((job: any) => job.recruiter_id && job.mode).length;
      const recruiterJobsWithoutMode = jobsData.filter((job: any) => job.recruiter_id && !job.mode).length;
      const aggregatedJobsWithMode = jobsData.filter((job: any) => !job.recruiter_id && job.mode).length;
      const aggregatedJobsWithoutMode = jobsData.filter((job: any) => !job.recruiter_id && !job.mode).length;

      console.log(`📊 TOTAL JOBS: ${jobsData.length}`);
      console.log(`\n👷 RECRUITER JOBS (Manual Portal):`);
      console.log(`   WITH work mode ✅: ${recruiterJobsWithMode}`);
      console.log(`   WITHOUT work mode ❌: ${recruiterJobsWithoutMode}`);
      console.log(`\n🌐 AGGREGATED JOBS (External Sources):`);
      console.log(`   WITH work mode ✅: ${aggregatedJobsWithMode}`);
      console.log(`   WITHOUT work mode ❌: ${aggregatedJobsWithoutMode}`);

      console.log(`\n📌 JOBS WITH WORK MODE (${recruiterJobsWithMode + aggregatedJobsWithMode}):`);
      jobsData.forEach((job: any, idx: number) => {
        if (job.mode) {
          const source = job.recruiter_id ? "👷 RECRUITER" : "🌐 AGGREGATED";
          console.log(`  [${idx + 1}] ${source} | "${job.title || job.job_title}" → Mode: ${job.mode}`);
        }
      });
      console.log("=== END WORK MODE DEBUG ===");

      const transformedJobs = jobsData
        .map((job: any /* Supports both manual and aggregated job formats */, index: number) => {
          // 🔄 Normalize both manual and aggregated job formats
          const title = job.title || job.job_title || "Job Title";
          const company = job.company || job.about_company || "Company";
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
            // Work mode (Remote, Hybrid, Onsite, etc.) - only from recruiter jobs
            mode: job.mode || "",
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
            // For recruiter jobs: only use application_url, NOT company_website
            url: job.url || job.apply_url || "",
            application_url: job.application_url || "",
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
        .filter((job: any) => job.created_at && job.created_at >= timeThreshold)
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

      // 🔄 Load More: Append new jobs instead of replacing
      if (page === 1) {
        // First page: replace all jobs
        setJobs(transformedJobs);
        console.log(`📥 Page 1: Set ${transformedJobs.length} jobs (replaced)`);
      } else {
        // Subsequent pages: append new jobs
        setJobs((prevJobs) => {
          const newTotal = prevJobs.length + transformedJobs.length;
          console.log(`📥 Page ${page}: Appending ${transformedJobs.length} jobs (total now: ${newTotal})`);
          return [...prevJobs, ...transformedJobs];
        });
      }

      // Set pagination info from API response
      const hasNextPageValue = response.pagination?.has_next || false;
      setCurrentPage(page);
      setHasNextPage(hasNextPageValue);

      // Get saved jobs count
      setSavedJobsCount(getSavedJobsCount());

      console.log(`✅ Page ${page} completed:`);
      console.log(`   - Loaded ${transformedJobs.length} jobs`);
      console.log(`   - Total jobs in state: ${page === 1 ? transformedJobs.length : 'appended'}`);
      console.log(`   - has_next from API: ${response.pagination?.has_next}`);
      console.log(`   - hasNextPageValue (state will be): ${hasNextPageValue}`);
      console.log(`   - Response pagination:`, response.pagination);

      if (hasNextPageValue) {
        console.log(`✅ More pages available - infinite scroll will remain active`);
      } else {
        console.log(`⏹️ No more pages - "You're all caught up" message will show`);
      }

      if (transformedJobs.length === 0) {
        toast.info("No jobs found matching your criteria");
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to fetch jobs. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
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

  // 🔄 Infinite Scroll: Setup Intersection Observer (watches window viewport)
  useEffect(() => {
    const sentinel = sentinelRef.current;

    console.log(`🔍 Setting up IntersectionObserver, sentinel exists: ${!!sentinel}, hasNextPage: ${hasNextPage}`);

    // Don't observe if there are no more pages
    if (!hasNextPage) {
      console.log(`⏹️ Not observing - all jobs loaded (has_next: false)`);
      if (sentinel && observerRef.current) {
        observerRef.current.unobserve(sentinel);
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log(`👁️ Intersection Observer callback:`, {
          isIntersecting: entry.isIntersecting,
          hasNextPage,
          loadingMore,
          isFetching: isFetchingRef.current,
          currentPage,
          boundingClientRect: {
            top: entry.boundingClientRect.top,
            bottom: entry.boundingClientRect.bottom,
            height: entry.boundingClientRect.height,
          }
        });

        // When sentinel is visible in window viewport and we have more pages, fetch next page
        if (entry.isIntersecting && hasNextPage && !loadingMore && !isFetchingRef.current) {
          console.log(`🚀 Triggering fetch for page ${currentPage + 1}`);
          fetchJobs(currentPage + 1);
        } else {
          console.log(`⛔ Fetch blocked - isIntersecting: ${entry.isIntersecting}, hasNextPage: ${hasNextPage}, loadingMore: ${loadingMore}, isFetching: ${isFetchingRef.current}`);
        }
      },
      {
        root: null, // Watch the browser window viewport (default)
        rootMargin: "300px", // Start loading 300px before sentinel enters viewport
        threshold: 0.01
      }
    );

    if (sentinel) {
      observer.observe(sentinel);
      console.log(`✅ Observing sentinel element`);
    } else {
      console.error(`❌ Sentinel element not found!`);
    }

    observerRef.current = observer;

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
        console.log(`🛑 Unobserved sentinel element`);
      }
    };
  }, [hasNextPage, loadingMore, currentPage, fetchJobs]);

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
      const locationQuery = selectedLocation.toLowerCase().replace(", india", "");
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(locationQuery)
      );
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
    <div className="flex min-h-screen bg-gray-50">
      {/* CENTER PANEL */}
      <main className="flex-1 px-10 py-8 overflow-y-scroll">
        <div className="mb-8 -mt-6 -ml-8">
          <h1 className="text-3xl font-bold text-[#2557a7]">CareerBot</h1>
        </div>

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
              <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
              {(searchQuery || selectedLocation !== "All Locations" || selectedFilters.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLocation("All Locations");
                    setSelectedFilters([]);
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                  title="Clear all filters"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {searchQuery && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm">
                  <span className="text-gray-700">{searchQuery}</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                    title="Clear search"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedLocation !== "All Locations" && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm">
                  <span className="text-gray-700">{selectedLocation}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLocation("All Locations")}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                    title="Clear location"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedFilters.map((filter) => (
                <div
                  key={filter}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm"
                >
                  <span className="text-gray-700">{filter}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterToggle(filter)}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">Failed to Load Jobs</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          ) : filteredJobs.length === 0 && !hasNextPage ? (
            // Only show "no jobs" when: filteredJobs is empty AND no more pages to load
            <div className="text-center py-12">
              <h1 className="text-xl font-semibold mb-2">
                Recommended Jobs for You
              </h1>
              <p className="text-sm text-gray-500 mb-4">
                Personalized opportunities matched to your skills and preferences
              </p>
              <p className="text-gray-500 text-lg">No jobs found</p>
              <p className="text-gray-400 text-sm mt-2">
                {activeTab === "saved"
                  ? "You haven't saved any jobs yet"
                  : activeTab === "new"
                  ? "No new jobs added in the latest update"
                  : searchQuery && `for "${searchQuery}"`}
                {selectedFilters.length > 0 && ` matching ${selectedFilters.join(", ")}`}
              </p>
            </div>
          ) : filteredJobs.length === 0 && hasNextPage ? (
            // If filtered jobs are empty but hasNextPage is true, show scroll prompt
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {activeTab === "new"
                  ? "No matching jobs in current view"
                  : "Keep scrolling to load more jobs"}
              </p>
            </div>
          ) : (
            <>
              <JobList
                jobs={filteredJobs}
                onBotClick={(job) => {
                  setSelectedJob(job);
                  setOpenChat(true);
                }}
              />
            </>
          )}

          {/* Infinite Scroll Sentinel & Loading Indicator - Always rendered */}
          <div
            ref={sentinelRef}
            className="mt-12 flex justify-center py-8"
            data-testid="infinite-scroll-sentinel"
          >
            {loadingMore && (
              <div className="space-y-4 w-full">
                {/* Show 3 skeleton cards while loading */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <JobSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            )}

            {!loadingMore && !hasNextPage && filteredJobs.length > 0 && currentPage > 1 && (
              <div className="w-full max-w-md mx-auto text-center py-12 px-6">
                <div className="mb-4 text-4xl">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  You&apos;re all caught up
                </h2>
                <p className="text-gray-600 mb-6">
                  You&apos;ve seen all available jobs matching your criteria.
                </p>

                {/* Job Alerts CTA */}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  onClick={() => {
                    toast.info("Job alerts feature coming soon!");
                  }}
                >
                  <span>🔔</span>
                  Turn on job alerts
                </button>

                <p className="text-xs text-gray-500 mt-6">
                  Get notified when new jobs match your profile
                </p>
              </div>
            )}

            {!loadingMore && hasNextPage && filteredJobs.length > 0 && (
              <div className="h-4 text-xs text-gray-400 text-center">
                📍 Scroll sentinel
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT PANEL - Sticky Sidebar */}
      <aside className="w-[400px] pr-8 py-8 space-y-6 sticky top-8 h-fit">
        {!openChat && (
          <>
            <TopPickCard />
            <SalaryInsights />
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
