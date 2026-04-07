'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  MapPin,
  Users,
  Video,
  ChevronLeft,
  Grid,
  List as ListIcon,
  Calendar,
  Search,
  CheckCircle2,
  MessageCircle,
  X,
} from 'lucide-react';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';
import logger from '@/lib/logger';
import DashboardLayout from '../dashboard/_components/DashboardLayout';
import RescheduleInterviewModal from './_components/RescheduleInterviewModal';

// SVG Icons
const ScheduleInterviewIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4.44444 1.8H11.5556V0H13.3333V1.8H14.2222C14.6937 1.8 15.1459 1.98964 15.4793 2.32721C15.8127 2.66477 16 3.12261 16 3.6V16.2C16 16.6774 15.8127 17.1352 15.4793 17.4728C15.1459 17.8104 14.6937 18 14.2222 18H1.77778C1.30628 18 0.854097 17.8104 0.520699 17.4728C0.187301 17.1352 0 16.6774 0 16.2V3.6C0 3.12261 0.187301 2.66477 0.520699 2.32721C0.854097 1.98964 1.30628 1.8 1.77778 1.8H2.66667V0H4.44444V1.8ZM1.77778 5.4V16.2H14.2222V5.4H1.77778ZM3.55556 8.1H5.33333V9.9H3.55556V8.1ZM7.11111 8.1H8.88889V9.9H7.11111V8.1ZM10.6667 8.1H12.4444V9.9H10.6667V8.1ZM10.6667 11.7H12.4444V13.5H10.6667V11.7ZM7.11111 11.7H8.88889V13.5H7.11111V11.7ZM3.55556 11.7H5.33333V13.5H3.55556V11.7Z" fill="currentColor"/>
  </svg>
);

const CancelInterviewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 0C3.58125 0 0 3.58125 0 8C0 12.4187 3.58125 16 8 16C12.4187 16 16 12.4187 16 8C16 3.58125 12.4187 0 8 0ZM2 8C2 4.68438 4.6875 2 8 2C9.31562 2 10.5313 2.42812 11.5188 3.14687L3.14687 11.5188C2.42812 10.5313 2 9.31562 2 8ZM8 14C6.68438 14 5.46875 13.5719 4.48125 12.8531L12.8531 4.48125C13.5719 5.47187 14 6.68438 14 8C14 11.3156 11.3125 14 8 14Z" fill="currentColor"/>
  </svg>
);

const ViewDetailsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_3013_9562)">
      <path d="M1.37856 8.23675C1.32303 8.08716 1.32303 7.92262 1.37856 7.77304C1.91935 6.46176 2.83732 5.34058 4.01609 4.55165C5.19486 3.76272 6.58133 3.34155 7.99975 3.34155C9.41817 3.34155 10.8046 3.76272 11.9834 4.55165C13.1622 5.34058 14.0801 6.46176 14.6209 7.77304C14.6765 7.92262 14.6765 8.08716 14.6209 8.23675C14.0801 9.54802 13.1622 10.6692 11.9834 11.4581C10.8046 12.2471 9.41817 12.6682 7.99975 12.6682C6.58133 12.6682 5.19486 12.2471 4.01609 11.4581C2.83732 10.6692 1.91935 9.54802 1.37856 8.23675Z" stroke="currentColor" strokeWidth="1.3325" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.00018 10.0047C9.1043 10.0047 9.99938 9.10968 9.99938 8.00555C9.99938 6.90142 9.1043 6.00635 8.00018 6.00635C6.89605 6.00635 6.00098 6.90142 6.00098 8.00555C6.00098 9.10968 6.89605 10.0047 8.00018 10.0047Z" stroke="currentColor" strokeWidth="1.3325" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip0_3013_9562">
        <rect width="15.99" height="15.99" fill="white" transform="translate(0.00488281 0.0100098)"/>
      </clipPath>
    </defs>
  </svg>
);

const RejectIcon = () => (
  <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12.5 13.75C10.9812 13.75 9.75 14.9812 9.75 16.5C9.75 17.0004 9.8832 17.4691 10.1167 17.8732L13.8732 14.1167C13.4691 13.8832 13.0004 13.75 12.5 13.75ZM14.9196 15.1916L11.1916 18.9196C11.5806 19.1305 12.0261 19.25 12.5 19.25C14.0188 19.25 15.25 18.0188 15.25 16.5C15.25 16.0261 15.1305 15.5806 14.9196 15.1916ZM8.25 16.5C8.25 14.1528 10.1528 12.25 12.5 12.25C13.689 12.25 14.7652 12.7393 15.5357 13.5256C16.2861 14.2914 16.75 15.3423 16.75 16.5C16.75 18.8472 14.8472 20.75 12.5 20.75C11.3423 20.75 10.2914 20.2861 9.5256 19.5357C8.7393 18.7652 8.25 17.689 8.25 16.5Z" fill="currentColor"/>
    <path d="M12 4C12 6.20914 10.2091 8 8 8C5.79086 8 4 6.20914 4 4C4 1.79086 5.79086 0 8 0C10.2091 0 12 1.79086 12 4Z" fill="currentColor"/>
    <path d="M10.2951 11.1879C8.2137 12.0529 6.75 14.1055 6.75 16.5C6.75 17.8163 7.1943 19.0315 7.9378 20C4.76837e-07 19.9895 0 17.9788 0 15.5C0 13.0147 3.58172 11 8 11C8.7977 11 9.5681 11.0657 10.2951 11.1879Z" fill="currentColor"/>
  </svg>
);

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
  candidateStage?: string;
  evaluation?: { feedback: string; recommendation: 'Hire' | 'Hold' | 'Reject' };
  resumeUrl?: string;
}

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => (
  <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-green-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
    {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : type === 'error' ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
    {message}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3 h-3" /></button>
  </div>
);


export default function InterviewsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterInterviewer, setFilterInterviewer] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelInterview, setCancelInterview] = useState<Interview | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Start with empty array - will be populated by useEffect
  const [interviews, setInterviews] = useState<Interview[]>([]);

  // Sync interviews to localStorage so the details page can read them
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('interviews', JSON.stringify(interviews));
    }
  }, [interviews]);

  // Fetch scheduled interviews from API
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        console.log('📤 Fetching scheduled interviews from API...');
        const response = await recruiterAuthApi.getScheduledInterviews();

        console.log('📥 API Response:', response);
        console.log('📥 Response type:', typeof response);
        console.log('📥 Response keys:', response ? Object.keys(response) : 'null');
        console.log('📥 Is Array:', Array.isArray(response));

        // Handle different response structures
        let data = [];

        // Check if response itself is an array (most common for list endpoints)
        if (Array.isArray(response)) {
          data = response;
          console.log('✅ Found interviews - response is array');
        }
        // Check for interviews array at root level
        else if (response?.interviews && Array.isArray(response.interviews)) {
          data = response.interviews;
          console.log('✅ Found interviews at response.interviews');
        }
        // Check for data array at root level
        else if (response?.data && Array.isArray(response.data)) {
          data = response.data;
          console.log('✅ Found interviews at response.data (array)');
        }
        // Check for data object with nested interviews
        else if (response?.data?.interviews && Array.isArray(response.data.interviews)) {
          data = response.data.interviews;
          console.log('✅ Found interviews at response.data.interviews');
        }
        // Check for data object with nested items
        else if (response?.data?.items && Array.isArray(response.data.items)) {
          data = response.data.items;
          console.log('✅ Found interviews at response.data.items');
        }

        console.log('✅ Extracted interviews count:', data.length);

        if (Array.isArray(data) && data.length > 0) {
          console.log('🔄 Mapping API response to Interview interface');
          console.log('📋 First interview data:', data[0]);
          console.log('📋 Interview data structure:', {
            keys: data[0] ? Object.keys(data[0]) : [],
            sample: data[0]
          });

          // Log all fields in the interview response
          console.log('📋 ALL INTERVIEW FIELDS:');
          if (data[0]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.entries(data[0]).forEach(([key, value]: [string, any]) => {
              if (value === null) {
                console.log(`  - ${key}: null`);
              } else if (typeof value === 'object') {
                try {
                  console.log(`  - ${key}:`, Object.keys(value).join(', '));
                } catch {
                  console.log(`  - ${key}: [object]`);
                }
              } else {
                console.log(`  - ${key}:`, value);
              }
            });
          }

          // Build candidate map from applications (using same approach as candidates page)
          const candidateMap = new Map();

          try {
            console.log('🔄 Fetching jobs for candidate mapping...');
            const jobsResponse = await recruiterAuthApi.getMyJobs();
            const jobs = jobsResponse.data || jobsResponse || [];
            console.log('📋 Extracted jobs count:', jobs.length);

            // Fetch applications for each job to build candidate map
            for (const job of jobs) {
              try {
                if (!job?.id) continue;

                const appResponse = await recruiterAuthApi.getJobApplications(job.id);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let applications: any[] = [];
                const responseData = appResponse.data || appResponse || {};

                if (Array.isArray(responseData)) {
                  applications = responseData;
                } else if (Array.isArray(appResponse)) {
                  applications = appResponse;
                } else if (responseData?.applications && Array.isArray(responseData.applications)) {
                  applications = responseData.applications;
                } else if (responseData?.data && Array.isArray(responseData.data)) {
                  applications = responseData.data;
                }

                console.log(`📋 Applications for job ${job.id}:`, applications.length);

                // Map each application's candidate name by application ID (same as candidates page)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                applications.forEach((app: any) => {
                  // Use same logic as candidates page to get candidate name
                  const candName = app.candidate_name || app.name || 'Candidate';

                  // Map by application ID (what interviews use)
                  if (app?.id) {
                    candidateMap.set(app.id, candName);
                    console.log(`  ✓ Mapped app ID ${app.id} -> "${candName}"`);
                  }
                });
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } catch (err: any) {
                console.warn('Could not fetch applications for job:', job?.id, err?.message);
              }
            }
            console.log('✅ Candidate map size:', candidateMap.size);
            if (candidateMap.size > 0) {
              console.log('✅ Map entries:', Array.from(candidateMap.entries()).map(([k, v]) => `${k}: ${v}`));
            }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            console.warn('Could not fetch jobs for candidate mapping:', err?.message);
          }

          // Map API response to Interview interface
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedInterviews: Interview[] = data.map((interview: any, index: number) => {
            // Get candidate name using same approach as candidates page
            const candidateName =
              interview.candidate_name ||
              interview.name ||
              candidateMap.get(interview.application_id) ||
              'Candidate';
            console.log(`📋 Interview ${interview.id} -> Candidate: "${candidateName}" (from map: ${candidateMap.has(interview.application_id)})`);
            const initials = (candidateName || 'C').split(' ').map((n: string) => n?.[0] || '').join('').toUpperCase() || 'C';

            return {
              id: interview.id || index + 1,
              candidateId: interview.candidate_id || index + 1,
              candidateName: candidateName,
              position: 'Candidate Position',
              date: interview.scheduled_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              time: interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
              location: interview.meeting_link || interview.location || 'TBD',
              locationType: interview.meeting_link === 'string' || !interview.meeting_link ? 'in-person' : 'online',
              interviewType: interview.interview_type || 'Technical',
              interviewer: interview.interviewer_name || interview.recruiter_id?.substring(0, 8) || 'Not assigned',
              status: (interview.status ? interview.status.charAt(0).toUpperCase() + interview.status.slice(1).replace(/_/g, ' ') : 'Scheduled') as 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled',
              candidateInitials: initials,
              candidateColor: ['bg-purple-100 text-purple-600', 'bg-yellow-100 text-yellow-600', 'bg-pink-100 text-pink-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600'][index % 5],
              meetingLink: interview.meeting_link === 'string' ? undefined : interview.meeting_link,
              notes: interview.notes === 'string' ? undefined : interview.notes,
              jobId: interview.job_id,
              resumeUrl: interview.resume_url,
              candidateEmail: interview.candidate_email,
              candidatePhone: interview.candidate_phone,
            };
          });

          console.log('✅ Mapped interviews:', mappedInterviews);
          setInterviews(mappedInterviews);
        } else {
          console.warn('⚠️ No interviews data from API');
          setInterviews([]);
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('❌ Error fetching interviews:', error);
        console.error('Error details:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
        logger.error('Failed to fetch interviews from API:', error?.message);
        setInterviews([]);
      }
    };

    fetchInterviews();
  }, []);


  const interviewers = useMemo(() => {
    const unique = Array.from(new Set(interviews.map(i => i.interviewer)));
    return ['all', ...unique];
  }, [interviews]);

  const roles = useMemo(() => {
    const unique = Array.from(new Set(interviews.map(i => i.position)));
    return ['all', ...unique];
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' ||
        interview.candidateName.toLowerCase().includes(searchLower) ||
        interview.interviewer.toLowerCase().includes(searchLower) ||
        interview.position.toLowerCase().includes(searchLower);
      const matchesInterviewer = filterInterviewer === 'all' || interview.interviewer === filterInterviewer;
      const matchesRole = filterRole === 'all' || interview.position === filterRole;
      const matchesType = filterType === 'all' ||
        (filterType === 'online' && interview.locationType === 'online') ||
        (filterType === 'in-person' && interview.locationType === 'in-person');
      return matchesSearch && matchesInterviewer && matchesRole && matchesType;
    });
  }, [interviews, searchQuery, filterInterviewer, filterRole, filterType]);

  const getGroupedInterviews = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const grouped: { [key: string]: Interview[] } = { 'Today': [], 'Tomorrow': [], 'Upcoming': [] };
    filteredInterviews.forEach(interview => {
      const d = new Date(interview.date);
      if (d.toDateString() === today.toDateString()) grouped['Today'].push(interview);
      else if (d.toDateString() === tomorrow.toDateString()) grouped['Tomorrow'].push(interview);
      else grouped['Upcoming'].push(interview);
    });
    return Object.entries(grouped).filter(([_, items]) => items.length > 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':   return 'bg-yellow-100 text-yellow-700';
      case 'Completed':   return 'bg-green-100 text-green-700';
      case 'Cancelled':   return 'bg-red-100 text-red-700';
      case 'Rescheduled': return 'bg-blue-100 text-blue-700';
      default:            return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDateBadge = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleReschedule = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsModalOpen(true);
  };

  const handleSaveReschedule = async (updatedInterview: Interview) => {
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
        scheduled_at: `${updatedInterview.date}T${convertTo24Hour(updatedInterview.time)}`,
        location: updatedInterview.location,
        interviewer_name: updatedInterview.interviewer,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        notes: (updatedInterview as any).notes,
      };

      logger.debug('📤 Sending reschedule data:', updateData);

      // Call the API to update interview
      await recruiterAuthApi.updateInterviewSchedule(String(updatedInterview.id), updateData);

      // Update local state on success
      setInterviews(prev => prev.map(i => i.id === updatedInterview.id ? updatedInterview : i));
      showToast('Interview rescheduled successfully.', 'success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('Failed to reschedule interview:', error);
      showToast(`Failed to reschedule interview: ${error?.response?.data?.message || error?.message}`, 'error');
    }
  };

  // ── Card View ─────────────────────────────────────────────
  const InterviewCard = ({ interview }: { interview: Interview }) => {
    const isMenuOpen = openMenuId === interview.id;
    return (
      <div
        onClick={() => router.push(`/recruiter/interviews/${interview.id}`)}
        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition relative pt-8 cursor-pointer"
      >
        <div className="absolute -top-4 right-4 z-10">
          <span className="inline-block px-3 py-1.5 bg-blue-200 text-blue-700 text-xs font-semibold rounded-lg shadow-md border border-blue-300 whitespace-nowrap">
            {formatDateBadge(interview.date)}
          </span>
        </div>
        <div className="p-4 flex flex-col h-full">
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : interview.id); }}
                className="p-1 hover:bg-gray-100 rounded transition text-gray-600"
              >
                <span className="text-lg leading-none">⋯</span>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReschedule(interview); setOpenMenuId(null); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 transition"
                  >
                    <span className="w-4 h-4 text-gray-600 flex-shrink-0"><ScheduleInterviewIcon /></span>
                    Reschedule
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCancelInterview(interview); setCancelReason(''); setShowCancelModal(true); setOpenMenuId(null); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                  >
                    <span className="w-4 h-4 text-red-600 flex-shrink-0"><CancelInterviewIcon /></span>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${interview.candidateColor}`}>
              {interview.candidateInitials}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{interview.candidateName}</h4>
              <p className="text-xs text-gray-600 truncate">{interview.position}</p>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0 text-gray-500" />
              <span className="text-xs text-gray-600">{interview.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0 text-gray-500" />
              <span className="text-xs text-gray-600">{interview.interviewer}</span>
            </div>
            <div className="flex items-center gap-2">
              {interview.locationType === 'in-person'
                ? <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                : <Video className="w-4 h-4 flex-shrink-0 text-gray-500" />}
              <span className="text-xs text-gray-600 line-clamp-1">{interview.location}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
              interview.locationType === 'in-person' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
            }`}>
              {interview.locationType === 'in-person'
                ? <><MapPin className="w-3.5 h-3.5" /><span>In-person</span></>
                : <><Video className="w-3.5 h-3.5" /><span>Online</span></>}
            </div>
            <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
              {interview.status}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ── List View Row ─────────────────────────────────────────
  const InterviewRow = ({ interview }: { interview: Interview }) => (
    <tr className={`border-b border-gray-200 transition ${interview.status === 'Cancelled' ? 'bg-red-50 opacity-70' : 'hover:bg-gray-50'}`}>
      <td className="px-6 py-4"><p className="text-sm font-medium text-gray-900">{interview.interviewer}</p></td>
      <td className="px-6 py-4"><p className="text-sm text-gray-600">{interview.position}</p></td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${interview.candidateColor}`}>
            {interview.candidateInitials}
          </div>
          <span className="text-sm text-gray-600">{interview.candidateName}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {interview.locationType === 'in-person'
            ? <><MapPin className="w-4 h-4 text-blue-600" /><span className="text-sm text-blue-600 font-medium">Office</span><span className="text-xs text-gray-600">({interview.location})</span></>
            : <><Video className="w-4 h-4 text-green-600" /><span className="text-sm text-green-600 font-medium">Online</span><span className="text-xs text-gray-600">({interview.location})</span></>}
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-600">{formatDateBadge(interview.date)}</p>
        <p className="text-xs text-gray-500">({interview.time})</p>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(interview.status)}`}>
          {interview.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {/* View → navigate to full details page */}
          <button
            title="View Details"
            onClick={() => router.push(`/recruiter/interviews/${interview.id}`)}
            className="p-1.5 hover:bg-blue-50 rounded transition text-gray-600 hover:text-blue-600"
          >
            <span className="w-4 h-4 inline-flex"><ViewDetailsIcon /></span>
          </button>
          <button
            onClick={() => handleReschedule(interview)}
            title="Reschedule"
            disabled={interview.status === 'Cancelled'}
            className="p-1.5 hover:bg-gray-100 rounded transition text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="w-4 h-4 inline-flex"><ScheduleInterviewIcon /></span>
          </button>
          <button
            title="Cancel Interview"
            disabled={interview.status === 'Cancelled'}
            onClick={() => { setCancelInterview(interview); setCancelReason(''); setShowCancelModal(true); }}
            className="p-1.5 hover:bg-red-50 rounded transition text-gray-600 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="w-4 h-4 inline-flex"><RejectIcon /></span>
          </button>
        </div>
      </td>
    </tr>
  );

  const groupedInterviews = getGroupedInterviews();

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/recruiter/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
              <p className="text-gray-600 text-sm mt-1">Manage and track all candidate interviews.</p>
            </div>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${viewMode === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Grid className="w-4 h-4" /><span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ListIcon className="w-4 h-4" /><span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Filters (list only) */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex-1 min-w-xs relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by interviewer or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <select value={filterInterviewer} onChange={(e) => setFilterInterviewer(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer">
                <option value="all">Interviewer</option>
                {interviewers.filter(i => i !== 'all').map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer">
                <option value="all">Role</option>
                {roles.filter(r => r !== 'all').map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer">
                <option value="all">All Types</option>
                <option value="online">Online</option>
                <option value="in-person">In-person</option>
              </select>
            </div>
          </div>
        )}

        {/* Interviews */}
        {groupedInterviews.length > 0 ? (
          <div className="space-y-8">
            {groupedInterviews.map(([groupLabel, groupInterviews]) => (
              <div key={groupLabel}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{groupLabel}</h2>
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupInterviews.map(interview => <InterviewCard key={interview.id} interview={interview} />)}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200 bg-blue-50">
                          {['Interviewer', 'Role', 'Candidate', 'Type', 'Date & Time', 'Status', 'Actions'].map(h => (
                            <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {groupInterviews.map(interview => <InterviewRow key={interview.id} interview={interview} />)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No interviews scheduled</p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <RescheduleInterviewModal
        interview={selectedInterview}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReschedule}
      />

      {/* Cancel Interview Modal */}
      {showCancelModal && cancelInterview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Cancel Interview</h2>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 mx-6 mt-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${cancelInterview.candidateColor}`}>
                  {cancelInterview.candidateInitials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{cancelInterview.candidateName}</p>
                  <p className="text-xs text-gray-500">{cancelInterview.position} · {cancelInterview.date} at {cancelInterview.time}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">This message will be shared with the candidate.</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="e.g. The interviewer is unavailable on this date. We will reschedule shortly."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Keep Interview
              </button>
              <button
                disabled={cancelReason.trim() === ''}
                onClick={async () => {
                  try {
                    // Call API to cancel interview
                    await recruiterAuthApi.cancelInterviewApi(String(cancelInterview?.id), { reason: cancelReason });

                    // Update local state on success
                    setInterviews(prev => prev.map(i => i.id === cancelInterview?.id ? { ...i, status: 'Cancelled' } : i));
                    setShowCancelModal(false);
                    setCancelReason('');
                    showToast('Interview cancelled successfully.', 'error');
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  } catch (error: any) {
                    logger.error('Failed to cancel interview:', error);
                    showToast(`Failed to cancel interview: ${error?.response?.data?.message || error?.message}`, 'error');
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
