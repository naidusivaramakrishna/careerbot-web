'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Users, Calendar, TrendingUp, MapPin, ChevronRight, Clock } from 'lucide-react';
import logger from '@/lib/logger';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';
import DashboardLayout from './_components/DashboardLayout';

interface Job {
  id: number;
  jobId?: number | string;
  title: string;
  location: string;
  postedDate: string;
  applicants: number;
  status?: string;
}


export default function DashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [interviews, setInterviews] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [candidates, setCandidates] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [stats, setStats] = useState({
    activeJobs: 0,
    newJobsThisWeek: 0,
    totalApplicants: 0,
    newApplicantsThisWeek: 0,
    interviewsScheduled: 0,
    interviewsToday: 0,
    offersExtended: 0,
    offersPending: 0,
  });

  // Load real data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        logger.debug('=== DASHBOARD LOADING ===');

        let stats = {
          activeJobs: 0,
          newJobsThisWeek: 0,
          totalApplicants: 0,
          newApplicantsThisWeek: 0,
          interviewsScheduled: 0,
          interviewsToday: 0,
          offersExtended: 0,
          offersPending: 0,
        };

        // Fetch stats from dashboard stats endpoint (for stats cards)
        try {
          const statsResponse = await recruiterAuthApi.getDashboardStats();
          logger.debug('✅ Dashboard stats fetched:', statsResponse);
          const statsData = statsResponse?.data || statsResponse;
          if (statsData) {
            stats = {
              activeJobs: statsData.activeJobs || 0,
              newJobsThisWeek: statsData.newJobsThisWeek || 0,
              totalApplicants: statsData.totalApplicants || 0,
              newApplicantsThisWeek: statsData.newApplicantsThisWeek || 0,
              interviewsScheduled: statsData.interviewsScheduled || 0,
              interviewsToday: statsData.interviewsToday || 0,
              offersExtended: statsData.offersExtended || 0,
              offersPending: statsData.offersPending || 0,
            };
            // Set upcoming interviews
            console.log('🔍 Check upcomingInterviews:', {
              hasUpcomingInterviews: !!statsData.upcomingInterviews,
              isArray: Array.isArray(statsData.upcomingInterviews),
              length: statsData.upcomingInterviews?.length,
              data: statsData.upcomingInterviews,
            });

            if (Array.isArray(statsData.upcomingInterviews) && statsData.upcomingInterviews.length > 0) {
              console.log('✅ Setting interviews from stats:', statsData.upcomingInterviews);
              setInterviews(statsData.upcomingInterviews);
              logger.debug('📅 Upcoming interviews loaded:', statsData.upcomingInterviews);
            } else {
              console.log('⚠️ upcomingInterviews is empty or missing, fetching from interviews endpoint');
              // Fallback: fetch interviews from dedicated endpoint
              try {
                const interviewsResponse = await recruiterAuthApi.getScheduledInterviews();
                const interviewsData = interviewsResponse?.data || interviewsResponse || [];
                console.log('✅ Interviews fetched from endpoint:', interviewsData);
                setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
                logger.debug('📅 Upcoming interviews loaded from endpoint:', interviewsData);
              } catch (interviewsError) {
                console.warn('⚠️ Failed to fetch interviews:', interviewsError);
                setInterviews([]);
              }
            }

            // Set top matched candidates
            if (Array.isArray(statsData.topMatches)) {
              setCandidates(statsData.topMatches);
              logger.debug('👥 Top matches loaded:', statsData.topMatches);
            } else if (Array.isArray(statsData.topCandidates)) {
              setCandidates(statsData.topCandidates);
              logger.debug('👥 Top candidates loaded:', statsData.topCandidates);
            }
          }
        } catch (statsError) {
          logger.warn('⚠️ Dashboard stats endpoint failed, using empty stats');
          setInterviews([]);
          setCandidates([]);
        }

        // Fetch active job postings from my-jobs endpoint (for job list)
        let jobsData: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
          logger.debug('🔵 Fetching jobs from my-jobs endpoint...');
          const jobsResponse = await recruiterAuthApi.getMyJobs();
          logger.debug('✅ Jobs fetched:', jobsResponse);
          jobsData = Array.isArray(jobsResponse?.data) ? jobsResponse.data : Array.isArray(jobsResponse) ? jobsResponse : [];
        } catch (jobsError) {
          logger.error('❌ Failed to fetch jobs:', jobsError);
          jobsData = [];
        }

        const data = {
          ...stats,
          recentJobs: jobsData,
        };

        if (data && Object.keys(data).length > 0) {

          logger.debug('🔍 Raw API data structure:', {
            keys: Object.keys(data),
            data,
          });

          // Set statistics from API
          const newStats = {
            activeJobs: data.activeJobs || 0,
            newJobsThisWeek: data.newJobsThisWeek || 0,
            totalApplicants: data.totalApplicants || 0,
            newApplicantsThisWeek: data.newApplicantsThisWeek || 0,
            interviewsScheduled: data.interviewsScheduled || 0,
            interviewsToday: data.interviewsToday || 0,
            offersExtended: data.offersExtended || 0,
            offersPending: data.offersPending || 0,
          };

          logger.debug('📊 Stats being set:', newStats);
          setStats(newStats);

          // Format and set recent jobs for display
          const jobsToDisplay = data.recentJobs || [];
          console.log('📦 Data received from API:', {
            hasRecentJobs: Array.isArray(jobsToDisplay),
            recentJobsCount: jobsToDisplay?.length || 0,
            dataKeys: Object.keys(data),
            fullData: data,
          });

          if (Array.isArray(jobsToDisplay) && jobsToDisplay.length > 0) {
            // Log first job structure
            console.log('🔍 First job structure:', {
              keys: Object.keys(jobsToDisplay[0]),
              sample: jobsToDisplay[0],
            });

            // Format jobs immediately (without waiting for applicant counts)
            const formattedJobs = jobsToDisplay.map((job: any, index: number) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
              id: job.id || `job-${index}`,
              jobId: job.job_id || job.id,
              title: job.job_title || job.title || 'Untitled Job',
              location: job.location || 'Not specified',
              postedDate: formatPostedDate(job.postedDate || job.posted_date || job.created_at || new Date().toISOString().split('T')[0]),
              applicants: 0, // Will be updated below
              status: job.status || 'Active', // Add status field
            }));

            console.log('📋 Jobs formatted with statuses:', formattedJobs.map((j: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
              title: j.title,
              status: j.status,
              statusLower: j.status?.toLowerCase(),
            })));

            // Filter to show only ACTIVE jobs (but be lenient with status matching)
            const activeJobs = formattedJobs.filter((job: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const jobStatus = (job.status || 'Active').toLowerCase().trim();
              // Accept 'active' or any status that contains 'active'
              const isActive = jobStatus.includes('active') || jobStatus === '';
              console.log(`Checking job "${job.title}": rawStatus="${job.status}" -> normalized="${jobStatus}" -> isActive=${isActive}`);
              return isActive;
            });

            console.log('🟢 Active jobs after filter:', activeJobs);
            console.log('📝 Total jobs:', formattedJobs.length, 'Active:', activeJobs.length);
            setJobs(activeJobs);

            // Fetch applicant counts in background (non-blocking) for ACTIVE jobs only
            Promise.all(
              jobsToDisplay
                .filter((job: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                  const status = (job.status || 'Active').toLowerCase().trim();
                  return status.includes('active') || status === '';
                })
                .map(async (job: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                  try {
                    const jobId = String(job.job_id || job.id);
                    const appResponse = await recruiterAuthApi.getJobApplications(jobId);
                    let applicantCount = 0;

                    if (Array.isArray(appResponse?.data)) {
                      applicantCount = appResponse.data.length;
                    }

                    return { jobId: jobId, applicantCount };
                  } catch (err) {
                    logger.warn(`Could not fetch applicants for job ${job.job_id || job.id}`, err);
                    return { jobId: job.job_id || job.id, applicantCount: 0 };
                  }
                })
            ).then((results) => {
              // Update jobs with applicant counts
              setJobs((prevJobs) => {
                const updated = prevJobs.map((job: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                  const result = results.find((r) => r.jobId === job.jobId);
                  if (result) {
                    return { ...job, applicants: result.applicantCount };
                  }
                  return job;
                });
                console.log('📋 Active jobs with applicant counts:', updated);
                return updated;
              });
            });
          } else {
            console.log('⚠️ No jobs found in response:', {
              hasRecentJobs: Array.isArray(jobsToDisplay),
              length: jobsToDisplay?.length,
              dataStructure: Object.keys(data),
            });
            setJobs([]);
          }

          logger.debug('Dashboard data successfully loaded:', { stats: data });
        }
      } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        logger.error('❌ Error loading dashboard data:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });

        // Set default empty state on error
        setJobs([]);
        setStats({
          activeJobs: 0,
          newJobsThisWeek: 0,
          totalApplicants: 0,
          newApplicantsThisWeek: 0,
          interviewsScheduled: 0,
          interviewsToday: 0,
          offersExtended: 0,
          offersPending: 0,
        });
      }
    };

    loadDashboardData();
    // Also listen for storage changes
    window.addEventListener('storage', loadDashboardData);
    return () => window.removeEventListener('storage', loadDashboardData);
  }, []);

  // Helper function to format posted date
  const formatPostedDate = (dateString: string) => {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - postDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted yesterday';
    if (diffDays < 7) return `Posted ${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle search from header
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter sections based on search query
  const query = searchQuery.toLowerCase().trim();

  // Helper function to check if any keyword matches the query
  const matchesQuery = (keywords: string[]) => {
    if (!query) return true; // Show all if no search query
    return keywords.some(keyword => keyword.includes(query));
  };

  const shouldShowStats = matchesQuery(['active', 'applicants', 'interviews', 'offers', 'stats']);
  const shouldShowActiveJobs = matchesQuery(['active', 'jobs', 'applicants']);
  const shouldShowTopMatches = matchesQuery(['matches', 'candidates']);
  const shouldShowInterviews = matchesQuery(['interview', 'interviews', 'upcoming']);

  const StatCard = ({ icon: Icon, label, value, subtext, trend }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className="bg-blue-100 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      {trend && <p className="text-xs text-green-600 mt-3 font-medium">{trend}</p>}
    </div>
  );

  // Debug: Log stats and rendering info
  console.log('📊 Dashboard Render - Stats:', stats);
  console.log('🔍 shouldShowStats:', shouldShowStats);
  console.log('📝 searchQuery:', searchQuery);

  return (
    <DashboardLayout onSearch={handleSearch}>
      <div className="space-y-6">
        {/* Stats Cards */}
        {shouldShowStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Briefcase}
            label="Active Jobs"
            value={stats.activeJobs}
            subtext={`+${stats.newJobsThisWeek} this week`}
            trend={`+${stats.newJobsThisWeek} this week`}
          />
          <StatCard
            icon={Users}
            label="Total Applicants"
            value={stats.totalApplicants}
            subtext={`+${stats.newApplicantsThisWeek} this week`}
            trend={`+${stats.newApplicantsThisWeek} this week`}
          />
          <StatCard
            icon={Calendar}
            label="Interviews Scheduled"
            value={stats.interviewsScheduled}
            subtext={`${stats.interviewsToday} today`}
          />
          <StatCard
            icon={TrendingUp}
            label="Offers Extended"
            value={stats.offersExtended}
            subtext={`${stats.offersPending} pending`}
          />
        </div>
        )}

        {/* Main Content Grid */}
        {(shouldShowActiveJobs || shouldShowTopMatches) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-jobs={jobs.length}>
          {/* Active Jobs Section - Takes 2 columns */}
          {shouldShowActiveJobs && (
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Active Jobs</h2>
              <button
                onClick={() => router.push('/recruiter/posted-jobs')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/recruiter/posted-jobs/${job.jobId || job.id}`)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <span>{job.postedDate}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="bg-blue-50 px-4 py-2 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{job.applicants}</p>
                          <p className="text-xs text-blue-600 font-medium">applicants</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No jobs posted yet</p>
                <p className="text-sm text-gray-500 mt-1">Post your first job to get started</p>
                <button
                  onClick={() => router.push('/recruiter/job-post')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Post a Job
                </button>
              </div>
            )}
          </div>
          )}

          {/* Top Matches Section - Takes 1 column */}
          {shouldShowTopMatches && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Matches</h2>
              <button
                onClick={() => router.push('/recruiter/candidates')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {candidates && candidates.length > 0 ? (
              <div className="space-y-3">
                {candidates.map((candidate: any, index: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                  const matchPercentage = candidate.match_percentage || candidate.matchPercentage || 0;
                  const matchColor = matchPercentage >= 80 ? 'bg-green-100 text-green-700' :
                                    matchPercentage >= 60 ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700';

                  return (
                    <div
                      key={candidate.id || index}
                      onClick={() => router.push(`/recruiter/candidates/${candidate.id || candidate.candidate_id}`)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {candidate.name || candidate.candidate_name || 'Unknown Candidate'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            for <span className="font-medium">{candidate.job_title || candidate.jobTitle || 'Job Position'}</span>
                          </p>
                        </div>
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${matchColor}`}>
                          {matchPercentage}% Match
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-gray-600">
                        {candidate.experience && (
                          <p>📊 Experience: {candidate.experience || 'Not specified'}</p>
                        )}
                        {candidate.education && (
                          <p>🎓 Education: {candidate.education || 'Not specified'}</p>
                        )}
                        {candidate.skills && (
                          <p>🛠️ Skills Match: {Array.isArray(candidate.skills) ? candidate.skills.join(', ') : candidate.skills}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No candidates yet</p>
                <p className="text-sm text-gray-500 mt-1">Top matched candidates based on skills, education & experience will appear here</p>
              </div>
            )}
          </div>
          )}
        </div>
        )}

        {/* Upcoming Interviews Section */}
        {shouldShowInterviews && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Interviews</h2>
            <button
              onClick={() => router.push('/recruiter/interviews')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {interviews && interviews.length > 0 ? (
            <div className="space-y-3">
              {interviews.map((interview: any, index: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                // Log first interview structure to see available fields
                if (index === 0) {
                  console.log('🔍 Interview data structure:', {
                    keys: Object.keys(interview),
                    sample: interview,
                  });
                }

                return (
                <div
                  key={interview.id || index}
                  onClick={() => router.push(`/recruiter/interviews/${interview.id || interview.interview_id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {interview.candidate_name || interview.candidateName || interview.name || 'Unknown Candidate'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {interview.job_title || interview.jobTitle || interview.position || 'Job Position'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleDateString() : interview.interview_date || interview.interviewDate || 'Date TBD'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : interview.interview_time || interview.interviewTime || 'Time TBD'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {interview.interview_type || interview.interviewType || interview.type || 'Interview'}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No interviews scheduled</p>
              <p className="text-sm text-gray-500 mt-1">Schedule interviews with candidates here</p>
            </div>
          )}
        </div>
        )}

      </div>
    </DashboardLayout>
  );
}
