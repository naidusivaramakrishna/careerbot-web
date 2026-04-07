'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronLeft, Mail, Phone, Loader2
} from 'lucide-react';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';
import DashboardLayout from '../dashboard/_components/DashboardLayout';
import ScheduleInterviewModal from './_components/ScheduleInterviewModal';
const ViewIcon = ({ className }: { className?: string }) => <img src="/assets/Candidates_Tab_icons/View_details.svg" className={className} alt="View" />;
const ScheduleIcon = ({ className }: { className?: string }) => <img src="/assets/Candidates_Tab_icons/Schedule_interview.svg" className={className} alt="Schedule" />;
const ShortlistIcon = ({ className }: { className?: string }) => <img src="/assets/Candidates_Tab_icons/Shortlist.svg" className={className} alt="Shortlist" />;
const RejectIcon = ({ className }: { className?: string }) => <img src="/assets/Candidates_Tab_icons/Reject.svg" className={className} alt="Reject" />;

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  experience: string;
  status: 'Shortlist' | 'New' | 'Rejected' | 'Interview' | 'Hired';
  appliedDate?: string;
  jobTitle?: string;
  applicationId?: string;
  jobId?: string;
}

export default function CandidatesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>(''); // Track which candidate action is loading
  const [toastMessage, setToastMessage] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidateForSchedule, setSelectedCandidateForSchedule] = useState<Candidate | null>(null);

  // Fetch candidates from APIs
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        console.log('%c🔵 [CANDIDATES] Fetching candidates from API...', 'color: blue; font-weight: bold');

        // Get all jobs
        const jobsResponse = await recruiterAuthApi.getMyJobs();
        const jobs = jobsResponse.data || jobsResponse || [];
        console.log('%c✅ [CANDIDATES] Jobs fetched:', 'color: green; font-weight: bold', jobs);

        if (jobs.length === 0) {
          console.warn('%c⚠️ [CANDIDATES] No jobs found', 'color: orange; font-weight: bold');
          setCandidates([]);
          setLoading(false);
          return;
        }

        // Fetch applications for each job
        const allCandidates: Candidate[] = [];
        let candidateId = 1;

        for (const job of jobs) {
          try {
            console.log(`%c📊 Fetching applications for job: ${job.id}`, 'color: blue; font-weight: bold');
            const applicationsResponse = await recruiterAuthApi.getJobApplications(job.id);
            const responseData = applicationsResponse.data || applicationsResponse || {};

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let applications: any[] = [];
            if (Array.isArray(responseData)) {
              applications = responseData;
            } else if (Array.isArray(applicationsResponse)) {
              applications = applicationsResponse;
            } else if (responseData?.applications && Array.isArray(responseData.applications)) {
              applications = responseData.applications;
            } else if (responseData?.data && Array.isArray(responseData.data)) {
              applications = responseData.data;
            }

            console.log(`%c✅ Found ${applications.length} applications`, 'color: green; font-weight: bold');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            applications.forEach((app: any) => {
              allCandidates.push({
                id: candidateId++,
                name: app.candidate_name || app.name || `Candidate ${candidateId}`,
                email: app.candidate_email || app.email || '',
                phone: app.phone_number || app.phone || '',
                role: app.position || app.candidate_title || job.title || '',
                experience: app.experience_years || app.candidate_experience || 'Not specified',
                status: (app.status === 'interview_scheduled' ? 'Interview' :
                         app.status === 'new' ? 'New' :
                         app.status === 'shortlist' ? 'Shortlist' :
                         app.status === 'rejected' ? 'Rejected' :
                         'New'),
                appliedDate: app.applied_at || app.applied_date || new Date().toISOString(),
                jobTitle: job.title || '',
                applicationId: app.id,
                jobId: job.id,
              });
            });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            console.error(`❌ Error fetching applications for job ${job.id}:`, err);
          }
        }

        console.log('%c✅ [CANDIDATES] All candidates loaded:', 'color: green; font-weight: bold', allCandidates);
        setCandidates(allCandidates);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('%c❌ [CANDIDATES] Error:', 'color: red; font-weight: bold', error);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Auto-hide toast message
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Shortlist':
        return 'bg-green-100 text-green-700';
      case 'Interview':
        return 'bg-purple-100 text-purple-700';
      case 'New':
        return 'bg-blue-100 text-blue-700';
      case 'Hired':
        return 'bg-amber-100 text-amber-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusCount = (status: string) => {
    return candidates.filter(c => c.status === status).length;
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExperience = !experienceFilter || candidate.experience.includes(experienceFilter);
    const matchesStatus = !statusFilter || candidate.status === statusFilter;

    return matchesSearch && matchesExperience && matchesStatus;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    return new Date(b.appliedDate || '').getTime() - new Date(a.appliedDate || '').getTime();
  });

  // View candidate details - Navigate to candidate detail page
  const handleViewCandidate = async (candidate: Candidate) => {
    try {
      setActionLoading(`view-${candidate.id}`);
      // Navigate to candidate detail page with jobId query parameter
      const url = `/recruiter/candidates/${candidate.applicationId}?jobId=${candidate.jobId}`;
      console.log('🔗 Navigating to candidate details:', url);
      router.push(url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error navigating to candidate details:', error);
      setToastMessage('Failed to navigate to candidate details');
    } finally {
      setActionLoading('');
    }
  };

  // Reject candidate
  const handleRejectCandidate = async (candidate: Candidate) => {
    try {
      setActionLoading(`reject-${candidate.id}`);
      console.log('🔴 Rejecting candidate:', { jobId: candidate.jobId, applicationId: candidate.applicationId, candidateName: candidate.name });

      // Update status to rejected using the centralized status update API
      const response = await recruiterAuthApi.updateCandidateStatus(candidate.jobId || '', candidate.applicationId || '', {
        status: 'rejected',
        reason: 'Not a good fit',
      });

      console.log('✅ Reject API Response:', response);
      console.log('✅ Response Success:', response?.success);
      console.log('✅ Response Error:', response?.error);
      console.log('✅ Error Message:', response?.error?.message);
      console.log('✅ Full Error Object:', JSON.stringify(response?.error, null, 2));

      // Check if response indicates success or failure
      if (response?.success === false) {
        const errorMsg = response?.error?.message || JSON.stringify(response?.error) || 'API returned error';
        console.error('❌ API Error Response Full:', errorMsg);
        throw new Error(errorMsg);
      }

      setToastMessage(`✅ ${candidate.name} rejected successfully`);

      // Update candidate status in state
      setCandidates(candidates.map(c =>
        c.id === candidate.id ? { ...c, status: 'Rejected' } : c
      ));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error rejecting candidate:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      setToastMessage(`❌ Failed to reject: ${error?.message || 'Unknown error'}`);
    } finally {
      setActionLoading('');
    }
  };

  // Schedule interview - Open schedule interview modal
  const handleScheduleInterview = async (candidate: Candidate) => {
    try {
      setActionLoading(`schedule-${candidate.id}`);
      // Set selected candidate and open modal
      setSelectedCandidateForSchedule(candidate);
      setShowScheduleModal(true);
      setToastMessage('Schedule interview modal opened');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error opening schedule interview modal:', error);
      setToastMessage('Failed to open schedule interview modal');
    } finally {
      setActionLoading('');
    }
  };

  // Mark candidate as Hired
  const handleShortlistCandidate = async (candidate: Candidate) => {
    try {
      setActionLoading(`shortlist-${candidate.id}`);
      console.log('🟢 Marking candidate as hired:', { jobId: candidate.jobId, applicationId: candidate.applicationId, candidateName: candidate.name });

      // Update status to hired using the status update API
      const response = await recruiterAuthApi.updateCandidateStatus(candidate.jobId || '', candidate.applicationId || '', {
        status: 'hired',
        notes: 'Candidate marked as hired',
      });

      console.log('✅ Hired API Response:', response);
      console.log('✅ Response Success:', response?.success);
      console.log('✅ Response Error:', response?.error);
      console.log('✅ Error Message:', response?.error?.message);
      console.log('✅ Full Error Object:', JSON.stringify(response?.error, null, 2));

      // Check if response indicates success or failure
      if (response?.success === false) {
        const errorMsg = response?.error?.message || JSON.stringify(response?.error) || 'API returned error';
        console.error('❌ API Error Response Full:', errorMsg);
        throw new Error(errorMsg);
      }

      setToastMessage(`✅ ${candidate.name} marked as hired successfully`);

      // Update candidate status in state
      setCandidates(candidates.map(c =>
        c.id === candidate.id ? { ...c, status: 'Hired' } : c
      ));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error marking candidate as hired:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      setToastMessage(`❌ Failed to mark as hired: ${error?.message || 'Unknown error'}`);
    } finally {
      setActionLoading('');
    }
  };

  // Render actions based on candidate status
  const renderActionsByStatus = (candidate: Candidate) => {
    const isLoading = actionLoading.startsWith(`${candidate.id}`) || actionLoading.includes(`-${candidate.id}`);

    return (
      <>
        {/* View button - available for all statuses */}
        <button
          onClick={() => handleViewCandidate(candidate)}
          disabled={isLoading}
          className="p-2 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
          title="View Profile"
        >
          {isLoading && actionLoading === `view-${candidate.id}` ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <ViewIcon className="w-5 h-5" />
          )}
        </button>

        {/* Status-specific actions */}
        {candidate.status === 'New' && (
          <>
            {/* Schedule Interview button for New candidates */}
            <button
              onClick={() => handleScheduleInterview(candidate)}
              disabled={isLoading}
              className="p-2 hover:bg-purple-100 rounded-lg transition disabled:opacity-50"
              title="Schedule Interview"
            >
              {isLoading && actionLoading === `schedule-${candidate.id}` ? (
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              ) : (
                <div className="text-purple-500">
                  <ScheduleIcon className="w-5 h-5" />
                </div>
              )}
            </button>
            {/* Reject button for New candidates */}
            <button
              onClick={() => handleRejectCandidate(candidate)}
              disabled={isLoading}
              className="p-2 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
              title="Reject"
            >
              {isLoading && actionLoading === `reject-${candidate.id}` ? (
                <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
              ) : (
                <div className="text-red-500">
                  <RejectIcon className="w-5 h-5" />
                </div>
              )}
            </button>
          </>
        )}

        {candidate.status === 'Interview' && (
          <>
            {/* Hire button for Interview candidates */}
            <button
              onClick={() => handleShortlistCandidate(candidate)}
              disabled={isLoading}
              className="p-2 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
              title="Hire"
            >
              {isLoading && actionLoading === `shortlist-${candidate.id}` ? (
                <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              ) : (
                <div className="text-green-500">
                  <ShortlistIcon className="w-5 h-5" />
                </div>
              )}
            </button>
            {/* Reject button for Interview candidates */}
            <button
              onClick={() => handleRejectCandidate(candidate)}
              disabled={isLoading}
              className="p-2 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
              title="Reject"
            >
              {isLoading && actionLoading === `reject-${candidate.id}` ? (
                <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
              ) : (
                <div className="text-red-500">
                  <RejectIcon className="w-5 h-5" />
                </div>
              )}
            </button>
          </>
        )}

        {candidate.status === 'Shortlist' && (
          <>
            {/* Hire button for Shortlist candidates */}
            <button
              onClick={() => handleShortlistCandidate(candidate)}
              disabled={isLoading}
              className="p-2 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
              title="Hire"
            >
              {isLoading && actionLoading === `shortlist-${candidate.id}` ? (
                <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              ) : (
                <div className="text-green-500">
                  <ShortlistIcon className="w-5 h-5" />
                </div>
              )}
            </button>
            {/* Reject button for Shortlist candidates */}
            <button
              onClick={() => handleRejectCandidate(candidate)}
              disabled={isLoading}
              className="p-2 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
              title="Reject"
            >
              {isLoading && actionLoading === `reject-${candidate.id}` ? (
                <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
              ) : (
                <div className="text-red-500">
                  <RejectIcon className="w-5 h-5" />
                </div>
              )}
            </button>
          </>
        )}

        {candidate.status === 'Hired' && (
          <div className="text-green-500" title="Hired">
            <ShortlistIcon className="w-6 h-6" />
          </div>
        )}

        {candidate.status === 'Rejected' && (
          <div className="text-red-500" title="Rejected">
            <RejectIcon className="w-6 h-6" />
          </div>
        )}
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/recruiter/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
              <p className="text-gray-600 text-sm mt-1">Review and manage candidate applications</p>
            </div>
          </div>
        </div>

        {/* Status Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'All', count: candidates.length, color: 'bg-gray-100 text-gray-700' },
            { label: 'New', count: getStatusCount('New'), color: 'bg-blue-100 text-blue-700' },
            { label: 'Interview', count: getStatusCount('Interview'), color: 'bg-purple-100 text-purple-700' },
            { label: 'Shortlist', count: getStatusCount('Shortlist'), color: 'bg-green-100 text-green-700' },
            { label: 'Hired', count: getStatusCount('Hired'), color: 'bg-amber-100 text-amber-700' },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => setStatusFilter(stat.label === 'All' ? '' : stat.label)}
              className={`p-4 rounded-lg border-2 transition ${
                (stat.label === 'All' && !statusFilter) || statusFilter === stat.label
                  ? `border-blue-500 ${stat.color}`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.count}</p>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading candidates...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or job title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Experience</option>
              <option value="0 - 1">0 - 1 years</option>
              <option value="1 - 2">1 - 2 years</option>
              <option value="2 - 4">2 - 4 years</option>
              <option value="3 - 5">3 - 5 years</option>
              <option value="4 - 6">4 - 6 years</option>
              <option value="5 - 7">5 - 7 years</option>
              <option value="6+">6+ years</option>
            </select>
          </div>

          {/* Candidates Table */}
          {sortedCandidates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Candidate</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Position</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Experience</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCandidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Applied {new Date(candidate.appliedDate || '').toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                            <Mail className="w-4 h-4" />
                            {candidate.email}
                          </a>
                          {candidate.phone && (
                            <a href={`tel:${candidate.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700">
                              <Phone className="w-4 h-4" />
                              {candidate.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{candidate.role}</p>
                          <p className="text-xs text-gray-500 mt-1">{candidate.jobTitle}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{candidate.experience}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(candidate.status)}`}>
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {renderActionsByStatus(candidate)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No candidates found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms</p>
            </div>
          )}

          {/* Pagination Info */}
          {sortedCandidates.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-gray-600 border-t border-gray-200 pt-4">
              <p>Showing {sortedCandidates.length} of {candidates.length} candidates</p>
              <div className="flex gap-2">
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  Next
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {selectedCandidateForSchedule && (
        <ScheduleInterviewModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedCandidateForSchedule(null);
          }}
          candidateName={selectedCandidateForSchedule.name}
          applicationId={selectedCandidateForSchedule.applicationId || ''}
          jobId={selectedCandidateForSchedule.jobId || ''}
          onSuccess={() => {
            // Refresh candidates list or update status
            setCandidates(candidates.map(c =>
              c.id === selectedCandidateForSchedule.id ? { ...c, status: 'Interview' } : c
            ));
            setToastMessage(`Interview scheduled for ${selectedCandidateForSchedule.name}`);
          }}
        />
      )}
    </DashboardLayout>
  );
}
