// File: src/app/(employer)/recruiter/posted-jobs/page.tsx

'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Users, Calendar, Search, X, Trash2, Pencil, AlertCircle, MapPin, Zap } from 'lucide-react';
import logger from '@/lib/logger';
import AIChat from './_components/AIChat';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';
import DashboardLayout from '../dashboard/_components/DashboardLayout';

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  applicants: number;
  verifiedApplicants?: number;
  newApplicants: number;
  status: string;
  postedDate: string;
  createdAt?: string;
  deadline?: string;
  // Additional fields from your job post form
  company?: string;
  type?: string;
  experience?: string;
  salary?: string;
  category?: string;
  skills?: string;
  description?: string;
  responsibilities?: string;
  openings?: string;
  mode?: string;
  education?: string;
  notice?: string;
  benefits?: string;
  contactEmail?: string;
  contactPhone?: string;
  hrContactPerson?: string;
  companyWebsite?: string;
  applicationUrl?: string;
  isPromoted?: boolean;
}

const PostedJobsPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'promote'>('overview');
  const [promotionDetails, setPromotionDetails] = useState({
    budget: '',
    duration: '',
    channels: [] as string[],
    targetAudience: '',
    description: ''
  });

  // Calculate job listing completion % based on all fields (required + optional)
  // 100% only when every field is filled
  const getJobCompletion = (job: Job): number => {
    const isEmpty = (val?: string) => !val || val.trim() === '' || val === 'Not specified' || val === 'Untitled Job';

    // Required fields (16)
    const requiredFields = [
      isEmpty(job.title),
      isEmpty(job.company),
      isEmpty(job.location),
      isEmpty(job.type),
      isEmpty(job.experience),
      isEmpty(job.salary),
      isEmpty(job.description),
      isEmpty(job.responsibilities),
      isEmpty(job.deadline),
      isEmpty(job.category),
      isEmpty(job.openings),
      isEmpty(job.mode),
      isEmpty(job.contactEmail),
      isEmpty(job.contactPhone),
      isEmpty(job.hrContactPerson),
      isEmpty(job.skills),
    ];

    // Optional fields (5)
    const optionalFields = [
      isEmpty(job.education),
      isEmpty(job.notice),
      isEmpty(job.benefits),
      isEmpty(job.companyWebsite),
      isEmpty(job.applicationUrl),
    ];

    const allFields = [...requiredFields, ...optionalFields]; // 21 total
    const filledCount = allFields.filter(empty => !empty).length;
    return Math.round((filledCount / allFields.length) * 100);
  };

  // Helper function to check if deadline has expired
  const getJobStatus = (deadline: string, baseStatus: string) => {
    if (!deadline || baseStatus === 'Draft' || baseStatus === 'On Hold') {
      return baseStatus;
    }

    // Get today's date in YYYY-MM-DD format (timezone-agnostic)
    const today = new Date();
    const todayString = today.getFullYear() + '-' +
                        String(today.getMonth() + 1).padStart(2, '0') + '-' +
                        String(today.getDate()).padStart(2, '0');

    // Extract deadline date part (YYYY-MM-DD)
    const deadlineString = deadline.substring(0, 10);

    // Compare as strings (YYYY-MM-DD format is sortable)
    const isExpired = deadlineString < todayString && baseStatus === 'Active';
    const finalStatus = isExpired ? 'Closed' : baseStatus;

    logger.debug(`Job Status Check - Deadline: ${deadlineString}, Today: ${todayString}, Base Status: ${baseStatus}, Expired: ${isExpired}, Final Status: ${finalStatus}`);

    return finalStatus;
  };

  // Handle job published redirect - refresh the page to show newly created job
  useEffect(() => {
    const jobPublished = searchParams.get('jobPublished');
    if (jobPublished === 'true') {
      logger.debug('Job was published, refreshing page to fetch latest jobs');
      // Remove the query parameter and refresh
      window.location.replace('/recruiter/posted-jobs');
    }
  }, [searchParams]);

  // Fetch jobs data from backend API: GET /api/v1/jobs/my-jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        setAuthError(null);

        // Clear localStorage on page load to ensure fresh data per recruiter
        localStorage.removeItem("postedJobs");
        localStorage.removeItem("promotedJobs");
        logger.debug('🧹 Cleared localStorage for fresh recruiter data');

        // Try to fetch recruiter's jobs from backend
        try {
          logger.debug('🔵 Fetching jobs from backend API...');
          const response = await recruiterAuthApi.getMyJobs();
          logger.debug('🟢 Backend API response:', response);
          logger.debug('🟢 Response data:', response.data);
          logger.debug('🟢 Response data length:', response.data?.length);

          // Check if we have jobs from API
          if (response.data && response.data.length > 0) {
            // Map backend job data to match the Job interface
            let allFinalJobs: Job[] = [];
            const formattedJobs = response.data.map((job: any) => {
              // Helper function to get value or fallback for empty strings
              const getValue = (value: any, fallback: string) => {
                return value && typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
              };

              // Get job category - check multiple possible field names
              const jobCategory = getValue(job.category, '') ||
                                 getValue(job.job_category, '') ||
                                 getValue(job.department, '') ||
                                 'Not specified';

              const baseStatus = getValue(job.status, 'Active');
              const deadline = job.deadline || job.applicationDeadline;
              const finalStatus = getJobStatus(deadline, baseStatus);

              return {
                id: job.id,
                title: getValue(job.title, 'Untitled Job'),
                department: jobCategory,
                location: getValue(job.location, 'Not specified'),
                applicants: job.applicants || 0,
                verifiedApplicants: job.verifiedApplicants || Math.floor((job.applicants || 0) * 0.8),
                newApplicants: job.newApplicants || 0,
                status: finalStatus,
                postedDate: formatPostedDate(job.created_at || job.postedDate),
                createdAt: job.created_at || job.postedDate || '',
                deadline: deadline,
                company: getValue(job.company, 'Not specified'),
                type: getValue(job.type, 'Not specified'),
                experience: getValue(job.experience, 'Not specified'),
                salary: getValue(job.salary, 'Not specified'),
                category: jobCategory,
                skills: getValue(job.skills || job.skills_required?.join(', '), ''),
                description: getValue(job.job_description || job.description, ''),
                responsibilities: getValue(job.responsibilities, ''),
                openings: getValue(job.openings, ''),
                mode: getValue(job.mode, ''),
                education: getValue(job.education, ''),
                notice: getValue(job.notice, ''),
                benefits: getValue(job.benefits, ''),
                contactEmail: getValue(job.contact_email || job.contactEmail, ''),
                contactPhone: getValue(job.contact_phone || job.contactPhone, ''),
                hrContactPerson: getValue(job.hr_contact_person || job.hrContactPerson, ''),
                companyWebsite: getValue(job.company_website || job.companyWebsite, ''),
                applicationUrl: getValue(job.application_url || job.applicationUrl, ''),
              };
            });

            // Also check localStorage to merge with API results (in case some jobs are only in localStorage)
            const storedJobs = localStorage.getItem("postedJobs");
            allFinalJobs = formattedJobs;

            if (storedJobs) {
              try {
                const parsedStoredJobs = JSON.parse(storedJobs);
                const getValue = (value: any, fallback: string) => {
                  return value && typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
                };

                const formattedStoredJobs: Job[] = parsedStoredJobs.map((job: any) => {
                  const jobCategory = getValue(job.category, '') ||
                                     getValue(job.job_category, '') ||
                                     getValue(job.department, '') ||
                                     'Not specified';
                  const baseStatus = getValue(job.status, 'Active');
                  const deadline = job.deadline || job.applicationDeadline;
                  const finalStatus = getJobStatus(deadline, baseStatus);

                  return {
                    id: job.id,
                    title: getValue(job.title, 'Untitled Job'),
                    department: jobCategory,
                    location: getValue(job.location, 'Not specified'),
                    applicants: job.applicants || 0,
                    verifiedApplicants: job.verifiedApplicants || Math.floor((job.applicants || 0) * 0.8),
                    newApplicants: job.newApplicants || 0,
                    status: finalStatus,
                    postedDate: formatPostedDate(job.postedDate || job.created_at),
                    createdAt: job.created_at || job.postedDate || '',
                    deadline: deadline,
                    company: getValue(job.company, 'Not specified'),
                    type: getValue(job.type, 'Not specified'),
                    experience: getValue(job.experience, 'Not specified'),
                    salary: getValue(job.salary, 'Not specified'),
                    category: jobCategory,
                    skills: getValue(job.skills, ''),
                    description: getValue(job.description || job.job_description, ''),
                    responsibilities: getValue(job.responsibilities, ''),
                    openings: getValue(job.openings, ''),
                    mode: getValue(job.mode, ''),
                    education: getValue(job.education, ''),
                    notice: getValue(job.notice, ''),
                    benefits: getValue(job.benefits, ''),
                    contactEmail: getValue(job.contactEmail || job.contact_email, ''),
                    contactPhone: getValue(job.contactPhone || job.contact_phone, ''),
                    hrContactPerson: getValue(job.hrContactPerson || job.hr_contact_person, ''),
                    companyWebsite: getValue(job.companyWebsite || job.company_website, ''),
                    applicationUrl: getValue(job.applicationUrl || job.application_url, ''),
                  };
                });

                // Merge API jobs with stored jobs:
                // - API data takes priority for core fields
                // - localStorage fills in optional fields the API doesn't return
                const storedMap = new Map<number, Job>();
                formattedStoredJobs.forEach(job => storedMap.set(job.id, job));

                allFinalJobs = formattedJobs.map(apiJob => {
                  const stored = storedMap.get(apiJob.id);
                  if (!stored) return apiJob;
                  // Fill optional fields from localStorage if API didn't return them
                  return {
                    ...apiJob,
                    education:      apiJob.education      || stored.education      || '',
                    notice:         apiJob.notice         || stored.notice         || '',
                    benefits:       apiJob.benefits       || stored.benefits       || '',
                    companyWebsite: apiJob.companyWebsite || stored.companyWebsite || '',
                    applicationUrl: apiJob.applicationUrl || stored.applicationUrl || '',
                    // Also fill required optional fields if API missed them
                    skills:          apiJob.skills          || stored.skills          || '',
                    description:     apiJob.description     || stored.description     || '',
                    responsibilities: apiJob.responsibilities || stored.responsibilities || '',
                    openings:        apiJob.openings        || stored.openings        || '',
                    mode:            apiJob.mode            || stored.mode            || '',
                    contactEmail:    apiJob.contactEmail    || stored.contactEmail    || '',
                    contactPhone:    apiJob.contactPhone    || stored.contactPhone    || '',
                    hrContactPerson: apiJob.hrContactPerson || stored.hrContactPerson || '',
                  };
                });

                // Add localStorage-only jobs that aren't in the API response
                formattedStoredJobs.forEach(storedJob => {
                  if (!allFinalJobs.find(j => j.id === storedJob.id)) {
                    allFinalJobs.push(storedJob);
                  }
                });

                logger.debug('📦 Merged API jobs with localStorage jobs:', allFinalJobs.length);
              } catch (parseError) {
                logger.warn('Failed to parse stored jobs');
              }
            }

            // Apply promoted status from localStorage
            const promotedJobs: string[] = JSON.parse(localStorage.getItem('promotedJobs') || '[]');
            allFinalJobs = allFinalJobs.map(job => ({
              ...job,
              isPromoted: promotedJobs.includes(String(job.id)),
            }));

            setAllJobs(allFinalJobs);
            logger.info('✅ Successfully loaded jobs from API (merged with localStorage)');

            // Fetch applicant counts in background (non-blocking)
            Promise.all(
              allFinalJobs.map(async (job, index) => {
                try {
                  const appResponse = await recruiterAuthApi.getJobApplications(String(job.id));
                  let applicantCount = 0;

                  if (Array.isArray(appResponse?.data)) {
                    applicantCount = appResponse.data.length;
                  }

                  return { index, applicantCount };
                } catch (err) {
                  logger.warn(`Could not fetch applicants for job ${job.id}`, err);
                  return { index, applicantCount: 0 };
                }
              })
            ).then((results) => {
              // Update jobs with applicant counts
              setAllJobs((prevJobs) => {
                const updated = prevJobs.map((job, index) => {
                  const result = results.find(r => r.index === index);
                  if (result) {
                    return { ...job, applicants: result.applicantCount };
                  }
                  return job;
                });
                logger.debug('Updated jobs with applicant counts:', updated);
                return updated;
              });
            });
            return;
          } else {
            logger.warn('⚠️ API returned empty jobs list, checking localStorage...');
          }
        } catch (apiError: any) {
          // Check if it's an authentication error
          logger.error('🔴 API Error:', apiError);
          logger.error('🔴 API Error message:', apiError.message);
          logger.error('🔴 API Error status:', apiError.response?.status);
          logger.error('🔴 API Error data:', apiError.response?.data);

          if (apiError.message?.includes('Authentication required')) {
            setAuthError('Session expired. Please login again.');
          }
          // Silently fall through to localStorage
          logger.warn('⚠️ API request failed, falling back to localStorage...');
        }

        // Fallback: Read from localStorage
        const storedJobs = localStorage.getItem("postedJobs");
        logger.debug('📦 Stored jobs in localStorage:', storedJobs);

        if (storedJobs) {
          const parsedJobs = JSON.parse(storedJobs);
          logger.debug('📦 Parsed localStorage jobs:', parsedJobs);
          logger.debug('📦 Parsed jobs count:', parsedJobs.length);

          // Add sample jobs with different locations and statuses for filtering
          const sampleJobs = [
            {
              id: 9001,
              title: 'Senior Frontend Developer',
              location: 'Remote',
              applicants: 24,
              status: 'Active',
              postedDate: '2026-02-01',
              deadline: '2026-02-04',
              department: 'Engineering'
            },
            {
              id: 9002,
              title: 'Product Manager',
              location: 'Bangalore',
              applicants: 18,
              status: 'Active',
              postedDate: '2026-01-28',
              deadline: '2026-02-03',
              department: 'Product'
            },
            {
              id: 9003,
              title: 'UX Designer',
              location: 'Remote',
              applicants: 31,
              status: 'Active',
              postedDate: '2026-01-22',
              deadline: '2026-02-02',
              department: 'Design'
            },
            {
              id: 9004,
              title: 'Data Scientist',
              location: 'Mumbai',
              applicants: 15,
              status: 'Active',
              postedDate: '2026-02-02',
              deadline: '2026-03-05',
              department: 'Data'
            },
            {
              id: 9005,
              title: 'DevOps Engineer',
              location: 'Chennai',
              applicants: 12,
              status: 'Closed',
              postedDate: '2026-01-15',
              deadline: '2026-02-15',
              department: 'Infrastructure'
            },
            {
              id: 9006,
              title: 'Business Analyst',
              location: 'Pune',
              applicants: 8,
              status: 'Draft',
              postedDate: '2026-02-03',
              deadline: '2026-03-03',
              department: 'Business'
            },
            {
              id: 9007,
              title: 'QA Automation Engineer',
              location: 'Singapore',
              applicants: 22,
              status: 'Active',
              postedDate: '2026-01-30',
              deadline: '2026-02-01',
              department: 'QA'
            },
            {
              id: 9008,
              title: 'Backend Developer',
              location: 'Toronto',
              applicants: 35,
              status: 'Active',
              postedDate: '2026-01-20',
              deadline: '2026-02-04',
              department: 'Engineering'
            },
            {
              id: 9009,
              title: 'UI Engineer',
              location: 'Delhi',
              applicants: 9,
              status: 'Active',
              postedDate: '2025-12-15',
              deadline: '2026-01-15',
              department: 'Frontend'
            },
            {
              id: 9010,
              title: 'Full Stack Developer',
              location: 'London',
              applicants: 27,
              status: 'Active',
              postedDate: '2026-01-25',
              deadline: '2026-03-10',
              department: 'Engineering'
            },
            {
              id: 9011,
              title: 'Software Architect',
              location: 'San Francisco',
              applicants: 19,
              status: 'Active',
              postedDate: '2026-02-01',
              deadline: '2026-03-10',
              department: 'Engineering'
            },
            {
              id: 9012,
              title: 'DevOps Specialist',
              location: 'Sydney',
              applicants: 13,
              status: 'Active',
              postedDate: '2026-01-28',
              deadline: '2026-02-28',
              department: 'Infrastructure'
            },
            {
              id: 9013,
              title: 'Senior Product Designer',
              location: 'Berlin',
              applicants: 14,
              status: 'Active',
              postedDate: '2026-01-30',
              deadline: '2026-03-15',
              department: 'Design'
            },
            {
              id: 9014,
              title: 'Machine Learning Engineer',
              location: 'Tokyo',
              applicants: 11,
              status: 'Active',
              postedDate: '2026-02-02',
              deadline: '2026-03-02',
              department: 'Data'
            }
          ];

          const allJobsToUse = parsedJobs.length > 0 ? parsedJobs : sampleJobs;
          logger.debug('Parsed jobs:', allJobsToUse);

          // Helper function to get value or fallback for empty strings
          const getValue = (value: any, fallback: string) => {
            return value && typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
          };

          // Map the stored job data to match your Job interface
          const formattedJobs = allJobsToUse.map((job: any) => {
            // Get job category - check multiple possible field names
            const jobCategory = getValue(job.category, '') ||
                               getValue(job.job_category, '') ||
                               getValue(job.department, '') ||
                               'Not specified';

            const baseStatus = getValue(job.status, 'Active');
            const deadline = job.deadline || job.applicationDeadline;
            const finalStatus = getJobStatus(deadline, baseStatus);

            const formattedJob = {
              id: job.id,
              title: getValue(job.title, 'Untitled Job'),
              department: jobCategory,
              location: getValue(job.location, 'Not specified'),
              applicants: job.applicants || 0,
              verifiedApplicants: job.verifiedApplicants || Math.floor((job.applicants || 0) * 0.8),
              newApplicants: job.newApplicants || 0,
              status: finalStatus,
              postedDate: formatPostedDate(job.postedDate || job.created_at),
              createdAt: job.created_at || job.postedDate || '',
              deadline: deadline,
              company: getValue(job.company, 'Not specified'),
              type: getValue(job.type, 'Not specified'),
              experience: getValue(job.experience, 'Not specified'),
              salary: getValue(job.salary, 'Not specified'),
              category: jobCategory,
              skills: getValue(job.skills, ''),
              description: getValue(job.description || job.job_description, ''),
              responsibilities: getValue(job.responsibilities, ''),
              openings: getValue(job.openings, ''),
              mode: getValue(job.mode, ''),
              education: getValue(job.education, ''),
              notice: getValue(job.notice, ''),
              benefits: getValue(job.benefits, ''),
              contactEmail: getValue(job.contactEmail || job.contact_email, ''),
              contactPhone: getValue(job.contactPhone || job.contact_phone, ''),
              hrContactPerson: getValue(job.hrContactPerson || job.hr_contact_person, ''),
              companyWebsite: getValue(job.companyWebsite || job.company_website, ''),
              applicationUrl: getValue(job.applicationUrl || job.application_url, ''),
            };

            logger.debug('Formatted job:', formattedJob);
            return formattedJob;
          });

          logger.info('✅ Final formatted jobs:', formattedJobs);
          logger.info('✅ Final jobs count:', formattedJobs.length);
          setAllJobs(formattedJobs);
        } else {
          logger.warn('❌ No jobs found in localStorage - localStorage is empty');
          setAllJobs([]);
        }
      } catch (error) {
        logger.error('Error fetching jobs:', error);
        setAllJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Delete job handler - calls DELETE /api/v1/jobs/{job_id}
  const handleUnpublishJob = async (jobId: number, jobTitle: string) => {
    if (!confirm(`Are you sure you want to unpublish "${jobTitle}"?`)) {
      return;
    }

    setDeletingJobId(jobId);

    try {
      // Update job status in localStorage
      const storedJobs = localStorage.getItem("postedJobs");
      if (storedJobs) {
        const jobs = JSON.parse(storedJobs);
        const updatedJobs = jobs.map((j: any) =>
          j.id === jobId ? { ...j, status: 'Unpublished' } : j
        );
        localStorage.setItem("postedJobs", JSON.stringify(updatedJobs));
      }

      // Update the local state to reflect the status change
      setAllJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobId ? { ...job, status: 'Unpublished' } : job
        )
      );

      alert('Job unpublished successfully!');
      setShowJobDetails(false);
      setSelectedJob(null);
    } catch (error: any) {
      alert('Failed to unpublish job. Please try again.');
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: number, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"?`)) {
      return;
    }

    setDeletingJobId(jobId);

    try {
      // Try to delete from backend API first
      try {
        await recruiterAuthApi.deleteJob(String(jobId));
      } catch (apiError: any) {
        // Silently handle backend errors - we'll still delete from localStorage
        if (!apiError.message?.includes('Authentication required')) {
          // Only show error if it's not an auth issue
          logger.warn('Backend delete failed, deleting from local storage only');
        }
      }

      // Delete from localStorage
      const storedJobs = localStorage.getItem("postedJobs");
      if (storedJobs) {
        const jobs = JSON.parse(storedJobs);
        const updatedJobs = jobs.filter((j: any) => j.id !== jobId);
        localStorage.setItem("postedJobs", JSON.stringify(updatedJobs));
      }

      // Update the local state to reflect the deletion
      setAllJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));

      alert('Job deleted successfully!');
    } catch (error: any) {
      alert('Failed to delete job. Please try again.');
    } finally {
      setDeletingJobId(null);
    }
  };

  // Helper function to format posted date
  // Today → "Today", Yesterday → "Yesterday", older → actual date
  const formatPostedDate = (dateString: string) => {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = today.getTime() - postDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    // For older posts, show actual date format
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };

    return date.toLocaleDateString('en-US', options);
  };

  // Get unique values for filters
  const locations = useMemo(() => {
    const uniqueLocs = Array.from(new Set(allJobs.map(job => job.location).filter(Boolean)));
    return ['all', ...uniqueLocs];
  }, [allJobs]);

  const statuses = useMemo(() => {
    const uniqueStatuses = Array.from(new Set(allJobs.map(job => job.status).filter(Boolean)));
    return ['all', ...uniqueStatuses];
  }, [allJobs]);

  const types = useMemo(() => {
    const uniqueTypes = Array.from(new Set(allJobs.map(job => job.type).filter(Boolean)));
    return ['all', ...uniqueTypes];
  }, [allJobs]);

  // Filter jobs based on search and filter criteria
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      // Search filter - Convert all values to lowercase for case-insensitive search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        job.title?.toLowerCase().includes(searchLower) ||
        job.company?.toLowerCase().includes(searchLower);

      // Location filter
      const matchesLocation = selectedLocation === 'all' ||
        job.location === selectedLocation;

      // Status filter (case-insensitive)
      const matchesStatus = selectedStatus === 'all' ||
        job.status?.toLowerCase() === selectedStatus.toLowerCase();

      // Type filter
      const matchesType = selectedType === 'all' ||
        job.type === selectedType;

      return matchesSearch && matchesLocation && matchesStatus && matchesType;
    }).sort((a, b) => {
      // Sort by raw createdAt descending - latest jobs appear first
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [allJobs, searchQuery, selectedLocation, selectedStatus, selectedType]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('all');
    setSelectedStatus('all');
    setSelectedType('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== '' ||
                          selectedLocation !== 'all' ||
                          selectedStatus !== 'all' ||
                          selectedType !== 'all';


  return (
    <DashboardLayout>
      {showAIChat ? (
        <div className="relative h-screen">
          <button
            onClick={() => setShowAIChat(false)}
            className="absolute top-4 right-4 z-10 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            Back to Jobs
          </button>
          <AIChat />
        </div>
      ) : (
        <div className="flex gap-6 h-screen overflow-hidden">
          {/* LEFT PANEL - Jobs List */}
          <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="mb-6 px-6 pt-6">
              <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
              <p className="text-sm text-gray-600 mt-1">Manage all job postings</p>
            </div>

            {/* Authentication Warning */}
            {authError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 mx-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-yellow-800 font-medium flex-1">{authError}</p>
                <button
                  onClick={() => setAuthError(null)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Search and Filters */}
            <div className="mb-6 px-6 flex gap-3 items-center w-full">
              {/* Search Input */}
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                  title="Clear filters"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Jobs List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                  <p className="text-gray-600">Loading jobs...</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Briefcase className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-900 font-medium">
                    {allJobs.length === 0 ? 'No jobs posted yet' : 'No jobs found'}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {allJobs.length === 0
                      ? 'Get started by posting your first job'
                      : 'Try adjusting your search'}
                  </p>
                  {allJobs.length === 0 && (
                    <button
                      onClick={() => router.push('/recruiter/job-post')}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Post Your First Job
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        setShowJobDetails(true);
                      }}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        selectedJob?.id === job.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 truncate">{job.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {job.location} • {job.type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📅 Posted: {job.postedDate}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          job.status.toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-700'
                            : job.status.toLowerCase() === 'closed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.status}
                        </span>
                        {job.isPromoted && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <Zap className="w-3 h-3" /> Promoted
                          </span>
                        )}
                        <span className="text-xs text-gray-600">{job.applicants} applicants</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - Job Details */}
          {showJobDetails && selectedJob ? (
            <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
              {/* Header with Actions */}
              <div className="border-b border-gray-200 bg-white p-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedJob.company} • {selectedJob.location}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUnpublishJob(selectedJob.id, selectedJob.title)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                    >
                      Unpublish
                    </button>
                    <button
                      onClick={() => handleDeleteJob(selectedJob.id, selectedJob.title)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 bg-white">
                <div className="px-6 flex gap-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-0 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('promote')}
                    className={`py-4 px-0 border-b-2 font-medium text-sm ${
                      activeTab === 'promote'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Promote Job
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' ? (
                  <>
                    {/* Completion Progress */}
                    <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Complete your job listing</h3>
                        <span className="text-2xl font-bold text-blue-600">{getJobCompletion(selectedJob)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                        <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${getJobCompletion(selectedJob)}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getJobCompletion(selectedJob) === 100
                          ? 'Your job listing is complete!'
                          : 'Fill out missing information to increase your chances of attracting top talent!'}
                      </p>
                      <button
                        onClick={() => router.push(`/recruiter/edit-job/${selectedJob.id}`)}
                        className="mt-4 px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition text-sm"
                      >
                        Edit Job
                      </button>
                    </div>

                    {/* Success Message */}
                    <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">Congrats! Your job is now live.</h3>
                      <p className="text-gray-600 mb-4">Make it stand out even more by promoting it.</p>
                      <p className="text-sm text-gray-600 mb-6">Promoting your job will showcase it to more qualified candidates who match what you're looking for. Salary information is not required for promoted jobs.</p>
                      <button
                        onClick={() => setActiveTab('promote')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        <Zap className="w-4 h-4" />
                        Promote Job
                      </button>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-6">
                      {/* Job Information */}
                      <div className="p-6 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">Job Information</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Job Type</p>
                            <p className="text-sm text-gray-900">{selectedJob.type || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Category</p>
                            <p className="text-sm text-gray-900">{selectedJob.category || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Experience Level</p>
                            <p className="text-sm text-gray-900">{selectedJob.experience || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Salary</p>
                            <p className="text-sm text-gray-900">{selectedJob.salary || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="p-6 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">Timeline</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Posted Date</p>
                            <p className="text-sm text-gray-900">{selectedJob.postedDate || 'Recently'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Application Deadline</p>
                            <p className="text-sm text-gray-900">
                              {selectedJob.deadline
                                ? new Date(selectedJob.deadline).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'No deadline'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Application Statistics */}
                      <div className="p-6 bg-white rounded-lg border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">Application Statistics</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{selectedJob.applicants}</p>
                            <p className="text-xs text-gray-600 mt-1">Total Applicants</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{selectedJob.verifiedApplicants || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Verified</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{selectedJob.newApplicants || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">New</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Promote Job Section */}
                    <div className="max-w-2xl">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Promote Your Job</h3>
                        <p className="text-gray-600">Increase visibility and attract more qualified candidates by promoting this job listing.</p>
                      </div>

                      {/* Already Promoted Banner */}
                      {selectedJob?.isPromoted && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                          <Zap className="w-5 h-5 text-yellow-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-yellow-800">This job is already promoted!</p>
                            <p className="text-sm text-yellow-700">You can update your promotion settings below and re-submit.</p>
                          </div>
                        </div>
                      )}

                      {/* Promotion Form */}
                      <div className="space-y-6">
                        {/* Budget */}
                        <div className="p-6 bg-white rounded-lg border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Promotion Budget
                          </label>
                          <input
                            type="number"
                            placeholder="Enter amount in USD"
                            value={promotionDetails.budget}
                            onChange={(e) =>
                              setPromotionDetails({ ...promotionDetails, budget: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-2">Recommended budget: $50 - $500</p>
                        </div>

                        {/* Duration */}
                        <div className="p-6 bg-white rounded-lg border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Promotion Duration
                          </label>
                          <select
                            value={promotionDetails.duration}
                            onChange={(e) =>
                              setPromotionDetails({ ...promotionDetails, duration: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select duration</option>
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                            <option value="60">60 days</option>
                          </select>
                        </div>

                        {/* Channels */}
                        <div className="p-6 bg-white rounded-lg border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-4">
                            Promotion Channels
                          </label>
                          <div className="space-y-3">
                            {['Email', 'Featured Listing', 'Social Media', 'Premium Search'].map((channel) => (
                              <label key={channel} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={promotionDetails.channels.includes(channel)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPromotionDetails({
                                        ...promotionDetails,
                                        channels: [...promotionDetails.channels, channel]
                                      });
                                    } else {
                                      setPromotionDetails({
                                        ...promotionDetails,
                                        channels: promotionDetails.channels.filter((c) => c !== channel)
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                />
                                <span className="text-sm text-gray-900">{channel}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Target Audience */}
                        <div className="p-6 bg-white rounded-lg border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Target Audience
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Senior developers with 5+ years experience"
                            value={promotionDetails.targetAudience}
                            onChange={(e) =>
                              setPromotionDetails({ ...promotionDetails, targetAudience: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Description */}
                        <div className="p-6 bg-white rounded-lg border border-gray-200">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Promotion Message
                          </label>
                          <textarea
                            placeholder="Add a custom message for your promotion..."
                            value={promotionDetails.description}
                            onChange={(e) =>
                              setPromotionDetails({ ...promotionDetails, description: e.target.value })
                            }
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              if (!selectedJob) return;
                              // Save promoted status to localStorage
                              const promotedJobs: string[] = JSON.parse(localStorage.getItem('promotedJobs') || '[]');
                              const jobIdStr = String(selectedJob.id);
                              if (!promotedJobs.includes(jobIdStr)) {
                                promotedJobs.push(jobIdStr);
                                localStorage.setItem('promotedJobs', JSON.stringify(promotedJobs));
                              }
                              // Update job state immediately
                              setAllJobs(prev => prev.map(j =>
                                j.id === selectedJob.id ? { ...j, isPromoted: true } : j
                              ));
                              setSelectedJob(prev => prev ? { ...prev, isPromoted: true } : prev);
                              setActiveTab('overview');
                            }}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                          >
                            <Zap className="w-4 h-4 inline mr-2" />
                            Promote Job
                          </button>
                          <button
                            onClick={() => setActiveTab('overview')}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a job to view details</p>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default function PostedJobsPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex items-center justify-center h-screen">Loading jobs...</div></DashboardLayout>}>
      <PostedJobsPageContent />
    </Suspense>
  );
}