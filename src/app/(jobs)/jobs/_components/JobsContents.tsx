"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllJobs, searchJobs, runJobAggregator } from "@/api/jobsApi";
import type { FilterParams } from "./filters/filterConstants";
import { toast } from "sonner";
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
import JobsLandingSection from "./JobsLandingSection";
import JobsFilterSidebar from "./JobsFilterSidebar";

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
  const [roleFilter, setRoleFilter] = useState(""); // client-side only — not sent to API
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterParams>({});
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");

  const [showLanding, setShowLanding] = useState(true);

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
            type: (() => {
              const raw = (job.job_type || job.employment_type || job.work_type || job.contract_type || "").toLowerCase().trim();
              if (raw.includes("intern")) return "Internship";
              if (raw.includes("contract") || raw.includes("freelance")) return "Contract";
              if (raw.includes("part")) return "Part-time";
              // "full", "permanent", "regular", "walkin", "work from home", or empty → Full-time
              return "Full-time";
            })(),
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
            // Education qualification
            education: job.education || job.qualification || job.education_required || job.min_education || "",
          };
          return transformed;
        });

      // 🔥 Identify newly added jobs (posted/created in the last 24 hours — same window as the NEW badge)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      newlyAddedJobIds = transformedJobs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((job: any) => {
          const dateStr = job.posted_date || job.created_at;
          return dateStr && dateStr >= oneDayAgo;
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((job: any) => job.id);

      // 🔄 Accumulate new job IDs across all pages (only reset on first page load)
      setNewJobIds((prev) => {
        if (page === 1) {
          return newlyAddedJobIds;
        } else {
          return [...new Set([...prev, ...newlyAddedJobIds])];
        }
      });

      // Update count based on accumulated new jobs
      setNewJobsCount((prev) => page === 1 ? newlyAddedJobIds.length : prev + newlyAddedJobIds.length);

      // Deduplicate by ID — API sometimes returns the same job multiple times
      const seenIds = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniqueJobs = transformedJobs.filter((job: any) => {
        if (seenIds.has(job.id)) return false;
        seenIds.add(job.id);
        return true;
      });

      // Also deduplicate by title+company+location for jobs with different IDs but same content
      const seenKeys = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deduplicatedJobs = uniqueJobs.filter((job: any) => {
        const key = `${job.title}||${job.company}||${job.location}`.toLowerCase();
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      setJobs(deduplicatedJobs);
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
      // 🔥 Show only newly added jobs — skip all sidebar filters for this tab
      setFilteredJobs(filtered.filter((job) => newJobIds.includes(job.id)));
      return;
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

    // Filter by role (client-side only — broader keyword match across title + skills)
    if (roleFilter.trim()) {
      const role = roleFilter.toLowerCase();
      // Split role into keywords so "Software Engineer" matches "software developer", "engineer", etc.
      const keywords = role.split(/\s+/);
      filtered = filtered.filter((job) => {
        const haystack = `${job.title} ${job.skills} ${job.description}`.toLowerCase();
        // Match if ANY keyword hits (broad) — improves recall
        return keywords.some((kw) => haystack.includes(kw));
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
      const WORK_MODEL_OPTIONS = ["onsite", "hybrid", "remote anywhere in the india"];
      const TYPE_FILTERS = ["full-time", "contract", "part-time", "internship"];

      const selectedWorkModels = selectedFilters.filter(f => WORK_MODEL_OPTIONS.includes(f.toLowerCase()));
      const selectedTypeFilters = selectedFilters.filter(f => TYPE_FILTERS.includes(f.toLowerCase()));
      const yearsFilter = selectedFilters.find(f => f.startsWith("years:"));
      const yearsValue = yearsFilter ? yearsFilter.replace("years:", "") : null;
      const salaryFilter = selectedFilters.find(f => f.startsWith("salary:"));
      const salaryLabel = salaryFilter ? salaryFilter.replace("salary:", "") : "Any salary";
      const locationFilters = selectedFilters
        .filter(f => f.startsWith("location:"))
        .map(f => f.replace("location:", "").toLowerCase());
      const educationFilters = selectedFilters
        .filter(f => f.startsWith("education:"))
        .map(f => f.replace("education:", "").toLowerCase());

      if (salaryFilter) console.log(`🔍 Applying salary filter: ${salaryLabel}`);
      if (locationFilters.length > 0) console.log(`📍 Applying location filters:`, locationFilters);

      filtered = filtered.filter((job) => {
        const jobType = job.type.toLowerCase();

        // Work model filter (OR within group) - check mode field from API
        const jobMode = (job.mode || "").toLowerCase();
        // Jobs with no work_mode set are treated as onsite (most common default)
        const effectiveMode = jobMode || "onsite";
        const matchesWorkModel = selectedWorkModels.length === 0 || selectedWorkModels.some(f => {
          const fl = f.toLowerCase();
          if (fl === "onsite") return effectiveMode.includes("on-site") || effectiveMode.includes("onsite") || effectiveMode.includes("in-office") || effectiveMode.includes("office") || effectiveMode === "onsite";
          if (fl === "hybrid") return jobMode.includes("hybrid");
          if (fl === "remote anywhere in the india") return jobMode.includes("remote");
          return false;
        });

        // Job type filter (OR within group)
        const matchesType = selectedTypeFilters.length === 0 || selectedTypeFilters.some(f => job.type === f);

        // Experience (years) filter — Naukri-style: Fresher, 1 yr, 2 yrs, etc.
        const matchesYears = (() => {
          if (!yearsValue) return true;
          const expStr = job.experience || "";
          const nums = String(expStr).match(/\d+/g);

          if (yearsValue === "Fresher") {
            // Fresher: show jobs with 0 experience or no experience info
            if (!nums) return true;
            return parseInt(nums[0], 10) === 0;
          }

          // Parse the selected year: "2 yrs" → 2, "11+ yrs" → 11
          const selectedYear = yearsValue === "11+ yrs" ? 11 : parseInt(yearsValue, 10);
          if (isNaN(selectedYear)) return true;
          if (!nums) return selectedYear === 0;

          const minExp = parseInt(nums[0], 10);
          if (selectedYear === 11) return minExp >= 11;
          return minExp === selectedYear;
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
            return false; // No salary data — exclude when a salary filter is active
          }

          // Parse "16 LPA+" → 1600000 (new format) or legacy "₹12L+" → 1200000
          const lpaMatch = salaryLabel.match(/(\d+)\s*LPA\+/i);
          const minVal = lpaMatch
            ? parseInt(lpaMatch[1]) * 100000
            : parseInt(salaryLabel.replace(/[₹L+]/g, "")) * 100000;
          const matches = salaryNum >= minVal;
          const status = matches ? "✅ MATCH" : "❌ SKIP";
          console.log(`💼 ${job.title} | "${job.salary}" (${parseMethod}) → ${salaryNum} | Filter: ${salaryLabel} (min: ${minVal}) | ${status}`);
          return matches;
        })();

        // Location filter (OR within group — city match)
        const matchesLocation = (() => {
          if (locationFilters.length === 0) return true;
          const jobCity = (job.location || "").split(",")[0].trim().toLowerCase();
          return locationFilters.some((loc) => jobCity === loc);
        })();

        // Education filter (OR within group — substring match)
        const matchesEducation = (() => {
          if (educationFilters.length === 0) return true;
          const jobEdu = (job.education || "").toLowerCase();
          if (!jobEdu) return false;
          return educationFilters.some((edu) => jobEdu.includes(edu));
        })();

        return matchesWorkModel && matchesType && matchesYears && matchesSalary && matchesLocation && matchesEducation;
      });
    }
    setFilteredJobs(filtered);
    if (selectedFilters.length > 0) console.log(`✅ Active filters:`, selectedFilters);
  }, [jobs, searchQuery, roleFilter, selectedFilters, activeTab, newJobIds, selectedLocation]);

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
      } else if (filter.startsWith("location:")) {
        // Multi-select: toggle individual location values
        updated = prev.includes(filter)
          ? prev.filter((f) => f !== filter)
          : [...prev, filter];
        console.log(`📍 Location filter toggled. Old:`, prev, `New:`, updated);
      } else if (filter.startsWith("education:")) {
        // Multi-select: toggle individual education values
        updated = prev.includes(filter)
          ? prev.filter((f) => f !== filter)
          : [...prev, filter];
        console.log(`🎓 Education filter toggled. Old:`, prev, `New:`, updated);
      } else {
        updated = prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter];
        console.log(`🏢 Other filter toggled. Old:`, prev, `New:`, updated);
      }
      return updated;
    });
  };

  // --------------- LANDING HANDLERS ----------------
  const handleLandingSearch = (query: string, location: string, experience: string) => {
    if (query.trim()) setSearchQuery(query.trim());
    if (location && location !== "All Locations") setSelectedLocation(location);
    if (experience && experience !== "Select experience") {
      // Map experience string to a years filter
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
    // Role clicks (e.g. "Software Engineer") → client-side filter only, don't hit API with role title
    // API search is only for skills/keywords like "Python", "React"
    if (query.trim()) {
      const isRoleClick = !filter?.workModel && !filter?.type;
      if (isRoleClick) {
        setRoleFilter(query.trim()); // client-side broad keyword filter
        setSearchQuery("");          // clear API query so ALL jobs are fetched
      } else {
        setSearchQuery(query.trim()); // chip filters like Remote/MNC use API query
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

  // --------------- UI ----------------
  const activeFilterCount =
    selectedFilters.length +
    (roleFilter ? 1 : 0) +
    (selectedLocation !== "All Locations" ? 1 : 0);

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* CENTER PANEL */}
      <main className="flex-1 overflow-y-scroll">
        {/* ── LANDING VIEW ── */}
        {showLanding && (
          <JobsLandingSection
            onSearch={handleLandingSearch}
            onCategoryClick={handleCategoryClick}
          />
        )}

        {/* ── RESULTS VIEW ── */}
        {!showLanding && (
        <div>
          {/* TOP BANNER */}
          <div className="px-8 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
            {/* Back + Context */}
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
                <svg className="w-4 h-4 text-[#2557a7] group-hover:text-[#1a4a96]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Home</span>
              </button>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {searchQuery ? `Results for "${searchQuery}"` : roleFilter ? `${roleFilter} Jobs` : "All Jobs"}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filteredJobs.length > 0 ? `${filteredJobs.length} opportunities found` : "Searching..."}
                  {selectedLocation !== "All Locations" && ` · ${selectedLocation}`}
                </p>
              </div>
            </div>

            {/* Active filter chips inline */}
            {(searchQuery || roleFilter || selectedLocation !== "All Locations" || selectedFilters.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {roleFilter && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#0f172a] text-white rounded-full text-xs font-medium">
                    {roleFilter}
                    <button onClick={() => setRoleFilter("")} className="ml-1 opacity-70 hover:opacity-100 leading-none">×</button>
                  </span>
                )}
                {searchQuery && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[#0f172a] text-white rounded-full text-xs font-medium">
                    {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="ml-1 opacity-70 hover:opacity-100 leading-none">×</button>
                  </span>
                )}
                {selectedLocation !== "All Locations" && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {selectedLocation}
                    <button onClick={() => setSelectedLocation("All Locations")} className="ml-1 opacity-60 hover:opacity-100 leading-none">×</button>
                  </span>
                )}
                {selectedFilters.map((filter) => (
                  <span key={filter} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {filter}
                    <button onClick={() => handleFilterToggle(filter)} className="ml-1 opacity-60 hover:opacity-100 leading-none">×</button>
                  </span>
                ))}
                <button
                  onClick={() => { setSearchQuery(""); setRoleFilter(""); setSelectedLocation("All Locations"); setSelectedFilters([]); }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="px-8 py-4">
            <JobsHeaderSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* FILTER PANEL — below search bar, above tabs */}
            <JobsFilterSidebar
              selectedFilters={selectedFilters}
              onFilterToggle={handleFilterToggle}
              onFilterChange={handleFilterChange}
              jobs={jobs}
            />

            <div className="mt-2">
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
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <img
                    src="/images/no_results.png"
                    alt="No results found"
                    className="object-contain mb-4" style={{ width: 500, mixBlendMode: "multiply" }}
                  />
                  <h3 className="text-lg font-bold text-gray-800">
                    {activeTab === "saved"
                      ? "No saved jobs yet"
                      : activeTab === "new"
                      ? "No new jobs available"
                      : "Sorry, No result found :("}
                  </h3>
                  <p className="text-gray-400 text-sm mt-2 max-w-md leading-relaxed">
                    {activeTab === "saved"
                      ? "Save jobs you like and find them all here."
                      : activeTab === "new"
                      ? "No new jobs were added in the latest update. Check back soon."
                      : "To get results, Please change your search criteria or filters like posting range from the above."}
                  </p>
                  {(searchQuery || roleFilter || selectedFilters.length > 0) && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); setRoleFilter(""); setSelectedFilters([]); }}
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

              {/* Pagination */}
              {filteredJobs.length > 0 && (() => {
                const hasClientFilter = !!(roleFilter || searchQuery || selectedFilters.length > 0 || selectedLocation !== "All Locations");
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

      {/* RIGHT PANEL - Sticky Sidebar (hidden on landing) */}
      {!showLanding && (
      <aside className="w-90 pr-6 py-6 space-y-4 sticky top-0 h-fit">
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
      )}
    </div>
  );
}
