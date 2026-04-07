'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  Clock,
  MapPin,
  Video,
  Users,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Download,
  Expand,
  CheckCircle2,
  MessageCircle,
  UserCheck,
  Briefcase,
  X,
  CalendarCheck,
  CalendarX,
  MailOpen,
} from 'lucide-react';
import jobsApi from '@/api/jobsApi';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';
import logger from '@/lib/logger';
import DashboardLayout from '../../dashboard/_components/DashboardLayout';
import RescheduleInterviewModal from '../_components/RescheduleInterviewModal';

interface Interview {
  id: string | number;
  candidateName: string;
  position: string;
  date: string;
  time: string;
  location: string;
  locationType: 'in-person' | 'online';
  interviewType?: string;
  interviewer: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  candidateInitials: string;
  candidateColor: string;
  meetingLink?: string;
  notes?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  experience?: string;
  requiredSkills?: string[];
  jobDescriptionSummary?: string;
  jobId?: string;
  candidateId?: string | number;
  applicationId?: string;
  candidateStage?: string;
  evaluation?: { feedback: string; recommendation: 'Hire' | 'Hold' | 'Reject' };
  resumeUrl?: string;
}

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-green-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
    {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : type === 'error' ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3 h-3" /></button>
  </div>
);

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Scheduled':   return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Completed':   return 'bg-green-100 text-green-700 border-green-200';
    case 'Cancelled':   return 'bg-red-100 text-red-700 border-red-200';
    case 'Rescheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
    default:            return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

export default function InterviewDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  const [skillsChecked, setSkillsChecked] = useState<Record<string, boolean>>({});
  const [checklistSaved, setChecklistSaved] = useState(false);
  const [resumeExpanded, setResumeExpanded] = useState(false);

  const [evalFeedback, setEvalFeedback] = useState('');
  const [evalRecommendation, setEvalRecommendation] = useState<'Hire' | 'Hold' | 'Reject' | ''>('');
  const [evalSubmitted, setEvalSubmitted] = useState(false);
  const [evalError, setEvalError] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        setLoading(true);
        logger.debug('📤 Fetching interview details for ID:', id);

        // First, try to fetch from API
        const response = await recruiterAuthApi.getInterviewDetails(id);
        logger.debug('📥 API interview details response:', response);

        let interviewData: Interview | null = null;

        // Check if response contains the data at different levels
        if (response?.data && typeof response.data === 'object') {
          // API wrapped response
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const apiData = response.data as any;

          // Map API response to Interview interface
          interviewData = {
            id: apiData.id || id,
            candidateId: apiData.candidate_id || id,
            candidateName: apiData.candidate_name || 'Candidate',
            position: apiData.position || apiData.job_title || 'Position TBD',
            date: apiData.scheduled_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            time: apiData.scheduled_at ? new Date(apiData.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
            location: apiData.meeting_link || apiData.location || 'TBD',
            locationType: apiData.meeting_link ? 'online' : 'in-person',
            interviewType: apiData.interview_type || 'Technical',
            interviewer: apiData.interviewer_name || 'Not assigned',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (apiData.status ? apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1).replace(/_/g, ' ') : 'Scheduled') as any,
            candidateInitials: apiData.candidate_name ? apiData.candidate_name.split(' ').map((n: string) => n?.[0] || '').join('').toUpperCase().slice(0, 2) : 'C',
            candidateColor: 'bg-purple-100 text-purple-600',
            meetingLink: apiData.meeting_link,
            notes: apiData.notes,
            candidateEmail: apiData.candidate_email,
            candidatePhone: apiData.candidate_phone,
            jobDescriptionSummary: apiData.job_description,
            jobId: apiData.job_id,
            applicationId: apiData.application_id,
            requiredSkills: apiData.required_skills,
            experience: apiData.experience,
            resumeUrl: apiData.resume_url,
          };
        } else if (typeof response === 'object' && response !== null) {
          // Direct response
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const apiData = response as any;

          interviewData = {
            id: apiData.id || id,
            candidateId: apiData.candidate_id || id,
            candidateName: apiData.candidate_name || 'Candidate',
            position: apiData.position || apiData.job_title || 'Position TBD',
            date: apiData.scheduled_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            time: apiData.scheduled_at ? new Date(apiData.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
            location: apiData.meeting_link || apiData.location || 'TBD',
            locationType: apiData.meeting_link ? 'online' : 'in-person',
            interviewType: apiData.interview_type || 'Technical',
            interviewer: apiData.interviewer_name || 'Not assigned',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            status: (apiData.status ? apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1).replace(/_/g, ' ') : 'Scheduled') as any,
            candidateInitials: apiData.candidate_name ? apiData.candidate_name.split(' ').map((n: string) => n?.[0] || '').join('').toUpperCase().slice(0, 2) : 'C',
            candidateColor: 'bg-purple-100 text-purple-600',
            meetingLink: apiData.meeting_link,
            notes: apiData.notes,
            candidateEmail: apiData.candidate_email,
            candidatePhone: apiData.candidate_phone,
            jobDescriptionSummary: apiData.job_description,
            jobId: apiData.job_id,
            applicationId: apiData.application_id,
            requiredSkills: apiData.required_skills,
            experience: apiData.experience,
            resumeUrl: apiData.resume_url,
          };
        }

        if (interviewData) {
          setInterview(interviewData);
          const initChecked: Record<string, boolean> = {};
          interviewData.requiredSkills?.forEach(s => { initChecked[s] = false; });
          setSkillsChecked(initChecked);
          if (interviewData.evaluation) {
            setEvalFeedback(interviewData.evaluation.feedback);
            setEvalRecommendation(interviewData.evaluation.recommendation);
            setEvalSubmitted(true);
          }
        } else {
          throw new Error('No interview data found in API response');
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (apiError: any) {
        console.error('❌ API Error in getInterviewDetails:', apiError);
        logger.warn('❌ Failed to fetch from API, trying localStorage fallback:', apiError?.message);

        // Fallback to localStorage if API fails
        try {
          const stored = localStorage.getItem('interviews');
          console.log('📋 Stored interviews from localStorage:', stored);

          if (stored) {
            const all: Interview[] = JSON.parse(stored);
            console.log('📋 All interviews:', all);
            console.log('🔍 Looking for interview with id:', id, 'type:', typeof id);

            const found = all.find(i => {
              console.log(`Comparing: stored id=${i.id} (${typeof i.id}) with param id=${id} (${typeof id}), equal? ${i.id === id}`);
              return i.id === id;
            });

            console.log('✅ Found interview:', found);

            if (found) {
              setInterview(found);
              const initChecked: Record<string, boolean> = {};
              found.requiredSkills?.forEach(s => { initChecked[s] = false; });
              setSkillsChecked(initChecked);
              if (found.evaluation) {
                setEvalFeedback(found.evaluation.feedback);
                setEvalRecommendation(found.evaluation.recommendation);
                setEvalSubmitted(true);
              }
            } else {
              console.warn('❌ Interview not found in localStorage');
            }
          } else {
            console.warn('❌ No interviews in localStorage');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback error:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewDetails();
  }, [id]);

  const updateInterview = (updates: Partial<Interview>) => {
    setInterview(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      const stored = localStorage.getItem('interviews');
      if (stored) {
        const all: Interview[] = JSON.parse(stored);
        localStorage.setItem('interviews', JSON.stringify(all.map(i => i.id === updated.id ? updated : i)));
      }
      return updated;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSaveReschedule = async (updated: any) => {
    try {
      // Helper function to convert 12-hour to 24-hour format
      const convertTo24Hour = (time12: string): string => {
        if (!time12) return '10:00:00';
        const [timePart, period] = time12.split(' ');
        const [hours, minutes] = timePart.split(':').map(Number);

        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      };

      // Prepare the update data for API
      const updateData = {
        scheduled_at: `${updated.date}T${convertTo24Hour(updated.time)}`,
        location: updated.location,
        interviewer_name: updated.interviewer,
        notes: updated.notes,
      };

      logger.debug('📤 Sending reschedule data:', updateData);

      // Call the API to update interview
      await recruiterAuthApi.updateInterviewSchedule(String(interview?.id), updateData);

      // Update local state on success
      updateInterview({ ...updated, status: 'Rescheduled' });
      showToast('Interview rescheduled successfully.', 'success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Failed to reschedule interview:', error);
      showToast(`Failed to reschedule interview: ${error?.response?.data?.message || error?.message}`, 'error');
    }
  };

  const handleMarkCompleted = () => {
    updateInterview({ status: 'Completed' });
    showToast('Interview marked as completed. Evaluation panel unlocked.', 'success');
  };

  const handleSubmitEvaluation = async () => {
    setEvalError('');
    if (evalFeedback.trim().length < 20) { setEvalError('Feedback must be at least 20 characters.'); return; }
    if (!evalRecommendation) { setEvalError('Please select a recommendation.'); return; }
    if (evalRecommendation === 'Reject') { setShowRejectModal(true); return; }
    await submitEvaluation(evalRecommendation);
  };

  const submitEvaluation = async (recommendation: 'Hire' | 'Hold' | 'Reject') => {
    try {
      setStatusUpdateLoading(true);
      const stageMap = { Hire: 'Final Review', Hold: 'On Hold', Reject: 'Rejected' };

      // Call API for Hire or Reject status
      if ((recommendation === 'Hire' || recommendation === 'Reject') && interview?.jobId && interview?.applicationId) {
        const statusValue = recommendation === 'Hire' ? 'hired' : 'rejected';
        console.log('📤 Updating candidate status via API:', {
          jobId: interview.jobId,
          applicationId: interview.applicationId,
          status: statusValue
        });

        const apiResponse = await recruiterAuthApi.updateCandidateStatus(
          interview.jobId,
          interview.applicationId,
          { status: statusValue, notes: evalFeedback }
        );

        console.log('✅ API Status Update Response:', apiResponse);

        if (apiResponse?.success === false) {
          throw new Error(apiResponse?.error?.message || 'Failed to update candidate status');
        }
      }

      // Update local state
      updateInterview({ candidateStage: stageMap[recommendation], evaluation: { feedback: evalFeedback, recommendation } });
      setEvalSubmitted(true);
      setShowRejectModal(false);
      setRejectReason('');

      const msgs = {
        Hire: '🎉 Candidate marked as HIRED. Status updated successfully.',
        Hold: '📋 Candidate stage set to On Hold.',
        Reject: '❌ Candidate marked as REJECTED. Status updated successfully.'
      };
      showToast(msgs[recommendation], recommendation === 'Hire' ? 'success' : recommendation === 'Hold' ? 'info' : 'error');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error updating candidate status:', error);
      showToast(`Failed to update status: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!interview) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-gray-600 font-medium">Interview not found.</p>
          <button onClick={() => router.push('/recruiter/interviews')} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
            Back to Interviews
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <RescheduleInterviewModal
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interview={interview as any}
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        onSave={handleSaveReschedule}
      />

      <div className="max-w-5xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Details</h1>
            <p className="text-gray-500 text-sm mt-0.5">{interview.position} · {formatDate(interview.date)}</p>
          </div>
        </div>

        <div className="space-y-5">

          {/* ══ ROW 1: Candidate Profile + Quick Actions ══ */}
          <div className="grid grid-cols-3 gap-5">

            {/* Candidate Profile (col-span-2) */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${interview.candidateColor}`}>
                  {interview.candidateInitials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">{interview.candidateName}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(interview.status)}`}>
                      {interview.status}
                    </span>
                    {interview.candidateStage && (
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-medium">
                        {interview.candidateStage}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 mt-1 text-sm">
                    {interview.position}{interview.experience ? ` · ${interview.experience} experience` : ''}
                  </p>
                  <div className="flex gap-5 mt-3 flex-wrap">
                    {interview.candidateEmail && (
                      <a href={`mailto:${interview.candidateEmail}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        <Mail className="w-4 h-4" />{interview.candidateEmail}
                      </a>
                    )}
                    {interview.candidatePhone && (
                      <a href={`tel:${interview.candidatePhone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                        <Phone className="w-4 h-4" />{interview.candidatePhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary / Secondary CTAs */}
              <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                <button
                  disabled={interview.status === 'Cancelled'}
                  onClick={() => setShowRescheduleModal(true)}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reschedule Interview
                </button>
                <button
                  disabled={interview.status === 'Cancelled'}
                  onClick={async () => {
                    if (confirm('Are you sure you want to cancel this interview?')) {
                      try {
                        // Call API to cancel interview with reason
                        await recruiterAuthApi.cancelInterviewApi(String(interview.id), {
                          reason: 'Cancelled by recruiter'
                        });

                        // Update local state on success
                        updateInterview({ status: 'Cancelled' });
                        showToast('Interview cancelled successfully.', 'success');
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      } catch (error: any) {
                        logger.error('Failed to cancel interview:', error);
                        showToast(`Failed to cancel interview: ${error?.response?.data?.message || error?.message}`, 'error');
                      }
                    }
                  }}
                  className="flex-1 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel Interview
                </button>
              </div>
            </div>

            {/* Quick Actions (col-span-1) */}
            <div className="col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/recruiter/candidates/${interview.candidateId ?? interview.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-left"
                >
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium">View Candidate Profile</span>
                </button>

                <button
                  onClick={() => router.push(interview.jobId ? `/recruiter/posted-jobs/${interview.jobId}` : '/recruiter/posted-jobs')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-left"
                >
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium">View Job Details</span>
                </button>

                <button
                  onClick={() => router.push(
                    `/recruiter/messages?candidateId=${interview.candidateId ?? interview.id}&candidateName=${encodeURIComponent(interview.candidateName)}&position=${encodeURIComponent(interview.position)}`
                  )}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-left"
                >
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">Chat with Candidate</span>
                </button>

                {interview.status !== 'Completed' && interview.status !== 'Cancelled' ? (
                  <button
                    onClick={handleMarkCompleted}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-sm text-green-700 hover:bg-green-100 transition text-left"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-semibold">Mark as Completed</span>
                  </button>
                ) : interview.status === 'Completed' ? (
                  <button
                    onClick={() => {
                      updateInterview({ status: 'Scheduled' });
                      showToast('Interview marked as unread.', 'info');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition text-left"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MailOpen className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="font-medium">Mark as Unread</span>
                  </button>
                ) : (
                  <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-600">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarX className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="font-semibold">Interview Cancelled</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══ ROW 2: Interview Schedule (left) + Summary (right) ══ */}
          <div className="grid grid-cols-3 gap-5">

            {/* Interview Schedule — col-span-2 */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-5">Interview Schedule</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Date &amp; Time</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(interview.date)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{interview.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Interviewer</p>
                    <p className="text-sm font-semibold text-gray-800">{interview.interviewer}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Interview Type</p>
                    <p className="text-sm font-semibold text-gray-800">{interview.interviewType || '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${interview.locationType === 'online' ? 'bg-green-50' : 'bg-indigo-50'}`}>
                    {interview.locationType === 'online'
                      ? <Video className="w-4 h-4 text-green-600" />
                      : <MapPin className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{interview.locationType === 'online' ? 'Meeting Link' : 'Location'}</p>
                    {interview.locationType === 'online' && interview.meetingLink ? (
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />Join Meeting
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">{interview.location}</p>
                    )}
                  </div>
                </div>
              </div>

              {interview.notes && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1.5">Notes</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">{interview.notes}</p>
                </div>
              )}
            </div>

            {/* Summary — col-span-1 */}
            <div className="col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Position</p>
                  <p className="text-sm font-semibold text-gray-800">{interview.position}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Candidate</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${interview.candidateColor}`}>
                      {interview.candidateInitials}
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{interview.candidateName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Interviewer</p>
                  <p className="text-sm font-semibold text-gray-800">{interview.interviewer}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Interview Type</p>
                  <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                    {interview.interviewType || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ ROW 3: Job Description (left) + Required Skills (right) ══ */}
          <div className="grid grid-cols-3 gap-5">

            {/* Job Description — col-span-2 */}
            {interview.jobDescriptionSummary && (
              <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />Job Description
                  </h3>
                  <button
                    onClick={() => router.push(interview.jobId ? `/recruiter/posted-jobs/${interview.jobId}` : '/recruiter/posted-jobs')}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />View Job Description
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{interview.jobDescriptionSummary}</p>
              </div>
            )}

            {/* Required Skills Checklist — col-span-1 */}
            {interview.requiredSkills && interview.requiredSkills.length > 0 && (
              <div className="col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Required Skills</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {Object.values(skillsChecked).filter(Boolean).length}/{interview.requiredSkills.length}
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {interview.requiredSkills.map(skill => (
                    <label key={skill} className="flex items-center gap-2.5 cursor-pointer group">
                      <button
                        type="button"
                        onClick={() => setSkillsChecked(prev => ({ ...prev, [skill]: !prev[skill] }))}
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition flex-shrink-0 ${
                          skillsChecked[skill]
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 group-hover:border-green-400 bg-white'
                        }`}
                      >
                        {skillsChecked[skill] && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <span className={`text-sm ${skillsChecked[skill] ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                        {skill}
                      </span>
                    </label>
                  ))}
                </div>
                {checklistSaved ? (
                  <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />Checklist saved
                  </div>
                ) : (
                  <button
                    onClick={() => { setChecklistSaved(true); showToast('Skills checklist saved!'); }}
                    className="w-full py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition"
                  >
                    Save Checklist
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ══ ROW 4: Resume Preview (left) + Evaluation & Feedback (right) ══ */}
          <div className="grid grid-cols-2 gap-5">

            {/* Candidate Resume Preview — col-span-1 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Candidate Resume Preview</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (interview.resumeUrl) {
                        window.open(interview.resumeUrl, '_blank');
                      } else {
                        showToast('Resume not available yet.', 'info');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
                  >
                    <Download className="w-3.5 h-3.5" />Download
                  </button>
                  <button
                    onClick={() => setResumeExpanded(!resumeExpanded)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
                  >
                    <Expand className="w-3.5 h-3.5" />{resumeExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>
              <div className={`rounded-xl overflow-hidden border border-gray-200 transition-all duration-300 ${resumeExpanded ? 'h-[520px]' : 'h-64'}`}>
                {interview.resumeUrl ? (
                  <iframe
                    src={interview.resumeUrl}
                    className="w-full h-full"
                    title={`${interview.candidateName} Resume`}
                    allow="autoplay"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-500">{interview.candidateName}_Resume.pdf</p>
                      <p className="text-xs text-gray-400 mt-1">Resume preview will appear here when connected to backend</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Evaluation & Feedback — col-span-1 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <h3 className="font-semibold text-gray-900">Evaluation &amp; Feedback</h3>
              {interview.status === 'Completed'
                ? <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium border border-green-200">Unlocked</span>
                : <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium border border-gray-200">Locked</span>}
            </div>

            {interview.status !== 'Completed' ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Complete interview to submit evaluation.</p>
                <p className="text-sm text-gray-400 mt-1">Use &quot;Mark as Completed&quot; in Quick Actions to unlock this panel.</p>
              </div>
            ) : evalSubmitted && interview.evaluation ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-700">Evaluation Submitted</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Overall Feedback</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{interview.evaluation.feedback}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Recommendation</p>
                    <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${
                      interview.evaluation.recommendation === 'Hire' ? 'bg-green-100 text-green-700' :
                      interview.evaluation.recommendation === 'Hold' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {interview.evaluation.recommendation === 'Hire' ? '✅ Hire' :
                       interview.evaluation.recommendation === 'Hold' ? '⏸ Hold' : '❌ Reject'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Overall Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Overall Feedback <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-400 font-normal ml-1">(min 20 chars)</span>
                  </label>
                  <textarea
                    value={evalFeedback}
                    onChange={(e) => setEvalFeedback(e.target.value)}
                    rows={5}
                    placeholder="Share detailed feedback about the candidate's performance..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <p className={`text-xs mt-1 ${evalFeedback.length < 20 ? 'text-red-400' : 'text-green-600'}`}>
                    {evalFeedback.length} / 20 minimum chars
                  </p>
                </div>

                {/* Recommendation + Submit */}
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Recommendation Status <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Hire', 'Hold', 'Reject'] as const).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setEvalRecommendation(opt)}
                          className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${
                            evalRecommendation === opt
                              ? opt === 'Hire'  ? 'bg-green-600 border-green-600 text-white shadow-md'
                              : opt === 'Hold' ? 'bg-yellow-500 border-yellow-500 text-white shadow-md'
                              :                  'bg-red-600 border-red-600 text-white shadow-md'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                          }`}
                        >
                          {opt === 'Hire' ? '✅ Hire' : opt === 'Hold' ? '⏸ Hold' : '❌ Reject'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {evalError && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mt-3">{evalError}</p>
                  )}

                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={statusUpdateLoading}
                    className="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {statusUpdateLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating Status...
                      </>
                    ) : (
                      'Submit Evaluation'
                    )}
                  </button>
                </div>
              </div>
            )}
            </div>{/* end evaluation card */}

          </div>{/* end row-3 grid */}

        </div>{/* end space-y-5 */}
      </div>

      {/* ── Rejection Reason Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Rejection Reason</h2>
              <p className="text-sm text-gray-500 mt-1">Please provide a reason before confirming rejection.</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${interview.candidateColor}`}>
                  {interview.candidateInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{interview.candidateName}</p>
                  <p className="text-xs text-gray-500">{interview.position}</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Reason for rejection (e.g. skill mismatch, communication, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={rejectReason.trim().length < 5 || statusUpdateLoading}
                onClick={() => submitEvaluation('Reject')}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {statusUpdateLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
