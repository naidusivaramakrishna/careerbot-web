"use client";

import { useEffect, useState, useCallback } from "react";
import { getCleanedJobs, CleanedJob, runJobAggregator } from "@/api/jobsApi";
import { toast } from "sonner";
import {
  getSavedJobIds,
  getSavedJobsCount,
} from "@/utils/jobTracking";

import JobsTabs, { TabType } from "./JobsTabs";
import QuickFilters from "./filters/QuickFilters";
import SearchBar from "./SearchBar";
import JobList from "./sidebar/JobList";
import TopPickCard from "./sidebar/TopPickCard";
import SalaryInsights from "./sidebar/SalaryInsights";
import CareerTip from "./sidebar/CareerTip";
import NancyChat from "./chat/NancyChat";
import JobSkeleton from "./JobSkeleton";
import Pagination from "./Pagination";

export default function JobsContents() {
  // ---------------- STATE ----------------
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedLocation, setSelectedLocation] = useState("All Locations"); // Default to show all

  const [openChat, setOpenChat] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [newJobsCount, setNewJobsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);

  const [newJobIds, setNewJobIds] = useState<string[]>([]); // Track newly added jobs

  // ---------------- API FETCH ----------------
  const fetchJobs = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      let newlyAddedJobIds: string[] = [];

      // 🔥 RUN JOB AGGREGATOR FIRST (only on first page load to fetch fresh jobs)
      if (page === 1) {
        try {
          toast.info("Fetching latest jobs from external sources...");
          const aggregatorResponse = await runJobAggregator();

          // Track the newly added jobs from this run
          if (aggregatorResponse.success && aggregatorResponse.data) {
            const jobsSaved = aggregatorResponse.data.jobs_saved || 0;
            if (jobsSaved > 0) {
              toast.success(`${jobsSaved} fresh jobs added!`);
            } else {
              toast.info("No new jobs found. Showing existing jobs.");
            }
          }

          // Store timestamp of this fetch to identify new jobs
          localStorage.setItem("lastJobFetchTime", new Date().toISOString());
        } catch (aggregatorError) {
          console.error("Aggregator error:", aggregatorError);
          toast.warning("Using cached jobs. Fresh jobs fetch failed.");
        }
      }

      // Call the jobsApi function with proper parameters
      const limit = 20; // Jobs per page
      const response = await getCleanedJobs((page - 1) * limit, limit);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch jobs");
      }

      // 🔥 TRANSFORM BACKEND DATA → UI FORMAT
      const cleanedJobsData = Array.isArray(response.data)
        ? response.data
        : response.data;

      const transformedJobs = (cleanedJobsData as CleanedJob[]).map(
        (job: any) => ({
          id: job.id || job.job_id,
          title: job.title || job.job_title,
          company: job.company || job.company_name,
          location: job.location || job.city,
          logo: job.logo || job.company_logo || "/company.png",
          type: job.type || job.employment_type || "Full-time",
          salary: job.salary || job.salary_range || "Not disclosed",
          time: job.time || job.posted_time || "Recently",
          url: job.url,
          matchScore: job.matchScore || job.match_score || 75,
          matchText: "Good match",
          roleTrending: job.roleTrending || job.trending || false,
          highHiring: job.highHiring || job.high_hiring || false,
          description: job.description || job.job_description,
          created_at: job.created_at || new Date().toISOString(),
        })
      );

      // 🔥 Identify newly added jobs (created in the last 5 minutes)
      if (page === 1) {
        const lastFetchTime = localStorage.getItem("lastJobFetchTime");
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const timeThreshold = lastFetchTime || fiveMinutesAgo;

        newlyAddedJobIds = transformedJobs
          .filter((job) => job.created_at && job.created_at >= timeThreshold)
          .map((job) => job.id);

        setNewJobIds(newlyAddedJobIds);
        setNewJobsCount(newlyAddedJobIds.length);
      }

      // Replace jobs for pagination (not append)
      setJobs(transformedJobs);
      setTotalPages(response.pagination?.total_pages || Math.ceil((response.pagination?.total || transformedJobs.length) / limit));

      // Get saved jobs count
      setSavedJobsCount(getSavedJobsCount());

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
    }
  }, []);

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

    // Filter by search query (job title, company, skills in description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query)
      );
    }

    // Filter by selected quick filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter((job) => {
        return selectedFilters.some((filter) => {
          const jobType = job.type.toLowerCase();
          const filterLower = filter.toLowerCase();

          // Type matching: Remote, Hybrid, On-site, Full-time, Part-time, etc.
          if (
            filterLower === "remote" ||
            filterLower === "hybrid" ||
            filterLower === "on-site" ||
            filterLower === "full-time" ||
            filterLower === "part-time"
          ) {
            return jobType.includes(filterLower);
          }

          // Experience level matching
          if (filterLower === "senior level") {
            return jobType.includes("senior") || job.title.toLowerCase().includes("senior");
          }

          // Company type matching
          if (filterLower === "startup") {
            return job.company.toLowerCase().includes("startup");
          }

          if (filterLower === "mnc") {
            return job.company.toLowerCase().includes("mnc");
          }

          return jobType.includes(filterLower);
        });
      });
    }

    setFilteredJobs(filtered);
  }, [jobs, searchQuery, selectedFilters, activeTab, newJobIds, selectedLocation]);

  // Initial fetch
  useEffect(() => {
    fetchJobs(currentPage);
  }, [fetchJobs, currentPage]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  // --------------- UI ----------------
  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      {/* CENTER PANEL */}
      <main className="flex-1 px-10 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">
            Recommended Jobs for You
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Personalized opportunities matched to your skills and preferences
          </p>
        </div>

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />

        <div className="mt-2">
          <QuickFilters
            selected={selectedFilters}
            onToggle={handleFilterToggle}
          />
        </div>

        <div className="mt-3">
          <JobsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            newCount={newJobsCount}
            savedCount={savedJobsCount}
          />
        </div>

        {/* JOB LIST */}
        <div className="mt-6">
          {loading && currentPage === 1 ? (
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
          ) : filteredJobs.length === 0 ? (
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
          ) : (
            <>
              <JobList
                jobs={filteredJobs}
                onBotClick={(job) => {
                  setSelectedJob(job);
                  setOpenChat(true);
                }}
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}

        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside className="w-[400px] pr-8 py-8 space-y-6 relative">
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
