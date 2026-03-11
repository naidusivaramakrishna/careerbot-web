// File: src/app/(employer)/recruiter/posted-jobs/[id]/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import logger from '@/lib/logger';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  IndianRupee,
  Clock,
  Users,
  Calendar,
  Mail,
  Phone,
  Globe,
  User,
  Building,
  GraduationCap,
  CheckCircle,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  skills: string;
  description: string;
  responsibilities: string;
  deadline: string;
  remote: boolean;
  category: string;
  openings: string;
  mode: string;
  education: string;
  notice: string;
  benefits: string;
  postedDate: string;
  status: string;
  applicants: number;
  contactEmail: string;
  contactPhone: string;
  companyWebsite: string;
  applicationUrl: string;
  hrContactPerson: string;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setIsLoading(true);
        setAuthError(null);

        // Try to fetch from backend using getMyJobs
        // Endpoint: GET /api/v1/jobs/my-jobs
        try {
          const response = await recruiterAuthApi.getMyJobs();
          if (response.data) {
            const foundJob = response.data.find((j: any) => String(j.id) === String(jobId));

            if (foundJob) {
              // Helper function to get value or fallback for empty strings
              const getValue = (value: any, fallback: string) => {
                return value && typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
              };

              // Normalize job data from backend
              setJob({
                id: typeof foundJob.id === 'number' ? foundJob.id : parseInt(String(foundJob.id), 10) || 0,
                title: getValue(foundJob.title, 'Untitled Job'),
                company: getValue(foundJob.company, 'Not specified'),
                location: getValue(foundJob.location, 'Not specified'),
                type: getValue(foundJob.type, 'Not specified'),
                experience: getValue(foundJob.experience, 'Not specified'),
                salary: getValue(foundJob.salary, 'Not specified'),
                category: getValue(foundJob.category, 'Not specified'),
                description: getValue(foundJob.description || foundJob.job_description, 'No description provided'),
                skills: getValue(foundJob.skills, 'Not specified'),
                responsibilities: getValue(foundJob.responsibilities, 'Not specified'),
                benefits: getValue(foundJob.benefits, 'Not specified'),
                deadline: foundJob.deadline || foundJob.applicationDeadline || '',
                postedDate: foundJob.created_at || foundJob.postedDate || new Date().toISOString(),
                applicants: foundJob.applicants || 0,
                contactEmail: getValue(foundJob.contact_email || foundJob.contactEmail, 'Not provided'),
                contactPhone: getValue(foundJob.contact_phone || foundJob.contactPhone, 'Not provided'),
                companyWebsite: getValue(foundJob.company_website || foundJob.companyWebsite, ''),
                applicationUrl: getValue(foundJob.application_url || foundJob.applicationUrl, ''),
                hrContactPerson: getValue(foundJob.hr_contact_person || foundJob.hrContactPerson, ''),
                status: getValue(foundJob.status, 'Active'),
                openings: getValue(foundJob.openings, '1'),
                mode: getValue(foundJob.mode, 'Hybrid'),
                education: getValue(foundJob.education, ''),
                notice: getValue(foundJob.notice, ''),
                remote: foundJob.remote || false,
              });
              return;
            }
          }
        } catch (apiError: any) {
          // Check if it's an authentication error
          if (apiError.message?.includes('Authentication required')) {
            setAuthError('Session expired. Please login again.');
          }
          // Silently fall through to localStorage
        }

        // Fallback: Use localStorage
        const storedJobs = localStorage.getItem("postedJobs");
        if (storedJobs) {
          const jobs = JSON.parse(storedJobs);
          // Handle both string and number IDs
          const foundJob = jobs.find((j: Job) =>
            String(j.id) === String(jobId) || j.id === Number(jobId)
          );

          if (foundJob) {
            // Helper function to get value or fallback for empty strings
            const getValue = (value: any, fallback: string) => {
              return value && typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
            };

            // Normalize job data - handle both description and job_description fields
            setJob({
              ...foundJob,
              title: getValue(foundJob.title, 'Untitled Job'),
              company: getValue(foundJob.company, 'Not specified'),
              location: getValue(foundJob.location, 'Not specified'),
              type: getValue(foundJob.type, 'Not specified'),
              experience: getValue(foundJob.experience, 'Not specified'),
              salary: getValue(foundJob.salary, 'Not specified'),
              category: getValue(foundJob.category, 'Not specified'),
              description: getValue(foundJob.description || foundJob.job_description, 'No description provided'),
              skills: getValue(foundJob.skills, 'Not specified'),
              responsibilities: getValue(foundJob.responsibilities, 'Not specified'),
              benefits: getValue(foundJob.benefits, 'Not specified'),
              deadline: foundJob.deadline || foundJob.applicationDeadline || '',
            });
          } else {
            setJob(null);
          }
        } else {
          setJob(null);
        }
      } catch (error) {
        setJob(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const handleDelete = async () => {
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
        const updatedJobs = jobs.filter((j: Job) => String(j.id) !== String(jobId));
        localStorage.setItem("postedJobs", JSON.stringify(updatedJobs));
      }

      router.push('/recruiter/posted-jobs');
    } catch (error) {
      alert('Failed to delete job. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getTimeSincePosted = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/recruiter/posted-jobs')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Back to Posted Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/recruiter/posted-jobs')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Posted Jobs</span>
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/recruiter/edit-job/${job.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit className="w-4 h-4" />
                Edit Job
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Authentication Warning */}
        {authError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
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

        {/* Job Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Posted {getTimeSincePosted(job.postedDate)}</span>
                </div>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              job.status?.toLowerCase() === 'active' 
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {job.status || 'Active'}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Applicants</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{job.applicants || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-medium">Openings</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{job.openings || 'Not specified'}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <IndianRupee className="w-5 h-5" />
                <span className="text-sm font-medium">Salary (₹)</span>
              </div>
              <p className="text-lg font-bold text-green-900">{job.salary || 'Not specified'}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Deadline</span>
              </div>
              <p className="text-sm font-bold text-orange-900">{job.deadline ? formatDate(job.deadline) : 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.description || 'No description available'}</p>
            </div>

            {/* Responsibilities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Responsibilities</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.responsibilities || 'No responsibilities listed'}</p>
            </div>

            {/* Skills Required */}
            {job.skills && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.split(',').map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits & Perks</h2>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.split(',').map((benefit, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {benefit.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employment Type</p>
                  <p className="text-gray-900 font-medium">{job.type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Experience Level</p>
                  <p className="text-gray-900 font-medium">{job.experience || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="text-gray-900 font-medium">{job.category || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Work Mode</p>
                  <p className="text-gray-900 font-medium">{job.mode || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Education</p>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    {job.education || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notice Period</p>
                  <p className="text-gray-900 font-medium">{job.notice || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">HR Contact Person</p>
                    <p className="text-gray-900 font-medium">{job.hrContactPerson || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    {job.contactEmail ? (
                      <a
                        href={`mailto:${job.contactEmail}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {job.contactEmail}
                      </a>
                    ) : (
                      <p className="text-gray-900 font-medium">Not specified</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    {job.contactPhone ? (
                      <a
                        href={`tel:${job.contactPhone}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {job.contactPhone}
                      </a>
                    ) : (
                      <p className="text-gray-900 font-medium">Not specified</p>
                    )}
                  </div>
                </div>
                {job.companyWebsite && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Website</p>
                      <a 
                        href={job.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium break-all"
                      >
                        {job.companyWebsite}
                      </a>
                    </div>
                  </div>
                )}
                {job.applicationUrl && (
                  <div className="pt-3 border-t border-gray-200">
                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      Apply Now
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Job Posting</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job posting? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}