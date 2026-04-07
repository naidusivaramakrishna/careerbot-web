'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, Mail, Phone, Download, FileText, MapPin, Calendar } from 'lucide-react';
import jobsApi from '@/api/jobsApi';
import { recruiterAuthApi } from '@/api/recruiterAuthApiMain';
import logger from '@/lib/logger';
import DashboardLayout from '../../dashboard/_components/DashboardLayout';

// SVG Icons
const ShortlistIcon = () => (
  <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
    <path d="M12 4C12 6.20914 10.2091 8 8 8C5.79086 8 4 6.20914 4 4C4 1.79086 5.79086 0 8 0C10.2091 0 12 1.79086 12 4Z" fill="currentColor"/>
    <path d="M10.2951 11.1879C8.2137 12.0529 6.75 14.1055 6.75 16.5C6.75 17.8163 7.1943 19.0315 7.9378 20C4.76837e-07 19.9895 0 17.9788 0 15.5C0 13.0147 3.58172 11 8 11C8.7977 11 9.5681 11.0657 10.2951 11.1879Z" fill="currentColor"/>
    <path d="M12.25 20.5C13.0906 20.5 13.9123 20.2507 14.6112 19.7837C15.3101 19.3167 15.8548 18.653 16.1765 17.8764C16.4982 17.0998 16.5823 16.2453 16.4183 15.4209C16.2543 14.5964 15.8496 13.8392 15.2552 13.2448C14.6608 12.6504 13.9036 12.2457 13.0791 12.0817C12.2547 11.9177 11.4002 12.0018 10.6236 12.3235C9.84701 12.6452 9.18325 13.1899 8.71625 13.8888C8.24926 14.5877 8 15.4094 8 16.25C8.00173 17.3766 8.45005 18.4566 9.24671 19.2533C10.0434 20.0499 11.1234 20.4983 12.25 20.5ZM14.5385 14.4715C14.6072 14.5231 14.665 14.5876 14.7088 14.6615C14.7525 14.7354 14.7813 14.8171 14.7934 14.9021C14.8056 14.9871 14.8009 15.0737 14.7795 15.1569C14.7582 15.2401 14.7207 15.3182 14.6692 15.3869L12.6096 18.1331C12.5063 18.2687 12.3753 18.3808 12.2254 18.4619C12.0755 18.5431 11.91 18.5915 11.74 18.6038H11.6615C11.3479 18.6025 11.0474 18.478 10.8246 18.2573L9.76538 17.1915C9.69694 17.1329 9.64135 17.0608 9.6021 16.9797C9.56286 16.8986 9.5408 16.8102 9.53732 16.7202C9.53385 16.6301 9.54902 16.5403 9.58189 16.4564C9.61476 16.3725 9.66462 16.2963 9.72834 16.2326C9.79206 16.1689 9.86827 16.119 9.95217 16.0861C10.0361 16.0533 10.1259 16.0381 10.2159 16.0416C10.306 16.045 10.3943 16.0671 10.4754 16.1063C10.5566 16.1456 10.6287 16.2012 10.6873 16.2696L11.5177 17.1C11.5348 17.1167 11.5554 17.1295 11.578 17.1374C11.6006 17.1453 11.6246 17.1482 11.6485 17.1458C11.6719 17.1453 11.6949 17.1391 11.7154 17.1277C11.7359 17.1163 11.7534 17.1001 11.7662 17.0804L13.6296 14.6023C13.7335 14.4655 13.8871 14.375 14.0572 14.3506C14.2273 14.3261 14.4002 14.3695 14.5385 14.4715Z" fill="currentColor"/>
  </svg>
);

const RejectIcon = () => (
  <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
    <path fillRule="evenodd" clipRule="evenodd" d="M12.5 13.75C10.9812 13.75 9.75 14.9812 9.75 16.5C9.75 17.0004 9.8832 17.4691 10.1167 17.8732L13.8732 14.1167C13.4691 13.8832 13.0004 13.75 12.5 13.75ZM14.9196 15.1916L11.1916 18.9196C11.5806 19.1305 12.0261 19.25 12.5 19.25C14.0188 19.25 15.25 18.0188 15.25 16.5C15.25 16.0261 15.1305 15.5806 14.9196 15.1916ZM8.25 16.5C8.25 14.1528 10.1528 12.25 12.5 12.25C13.689 12.25 14.7652 12.7393 15.5357 13.5256C16.2861 14.2914 16.75 15.3423 16.75 16.5C16.75 18.8472 14.8472 20.75 12.5 20.75C11.3423 20.75 10.2914 20.2861 9.5256 19.5357C8.7393 18.7652 8.25 17.689 8.25 16.5Z" fill="currentColor"/>
    <path d="M12 4C12 6.20914 10.2091 8 8 8C5.79086 8 4 6.20914 4 4C4 1.79086 5.79086 0 8 0C10.2091 0 12 1.79086 12 4Z" fill="currentColor"/>
    <path d="M10.2951 11.1879C8.2137 12.0529 6.75 14.1055 6.75 16.5C6.75 17.8163 7.1943 19.0315 7.9378 20C4.76837e-07 19.9895 0 17.9788 0 15.5C0 13.0147 3.58172 11 8 11C8.7977 11 9.5681 11.0657 10.2951 11.1879Z" fill="currentColor"/>
  </svg>
);

function CandidateDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const applicationId = params.id as string;
  const jobIdFromUrl = searchParams.get('jobId');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSkillTab, setActiveSkillTab] = useState<'trending' | 'strengths' | 'integral' | 'soft' | 'notes'>('trending');

  // Fetch candidate details
  useEffect(() => {
    const fetchCandidateDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`📄 Fetching candidate details for application ID: ${applicationId}`);
        console.log(`📋 Job ID from URL: ${jobIdFromUrl}`);
        logger.debug('Fetching candidate details:', { applicationId, jobId: jobIdFromUrl });

        // Use jobId from URL or throw error if not provided
        if (!jobIdFromUrl) {
          throw new Error('Job ID not provided in URL. Please go back and try again.');
        }

        // Fetch candidate details using jobId and applicationId
        console.log(`🔗 Calling getCandidateDetails with jobId: ${jobIdFromUrl}, applicationId: ${applicationId}`);
        const candidateData = await recruiterAuthApi.getCandidateDetails(jobIdFromUrl, applicationId);

        console.log('📥 Candidate details API response:', candidateData);
        console.log('📋 Full candidate data fields:', candidateData ? Object.keys(candidateData) : []);

        if (candidateData) {
          setCandidate(candidateData);
          logger.info('✅ Candidate details loaded:', {
            candidateName: candidateData?.candidate_name,
            candidateEmail: candidateData?.candidate_email,
            status: candidateData?.status,
          });
        } else {
          setError('No candidate data found');
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('🔴 Error fetching candidate details:', err);
        logger.error('Failed to fetch candidate details:', {
          applicationId,
          error: err?.message,
          status: err?.response?.status,
        });
        setError(err?.response?.data?.message || 'Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchCandidateDetails();
    }
  }, [applicationId]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-700';
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !candidate) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Candidate Details</h1>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error || 'Candidate not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to candidates list
        </button>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Candidate Header Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
              <div className="flex gap-6 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {(candidate.candidate_name || 'C').charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {candidate.candidate_name || 'Candidate'}
                  </h1>
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600 flex items-center gap-2">
                      <span className="font-semibold">{candidate.experience_years || '0'} years of Experience</span>
                    </p>
                    <p className="text-gray-700 font-medium text-lg">{candidate.candidate_title || 'N/A'}</p>
                    {candidate.location && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {candidate.location}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-wrap">
                    <button className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition">
                      Reject Candidate
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">
                      Schedule Interview
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Section with Tabs */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>

                {/* Skill Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                  {(['trending', 'strengths', 'integral', 'soft', 'notes'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveSkillTab(tab)}
                      className={`pb-3 px-1 font-medium text-sm transition ${
                        activeSkillTab === tab
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Skills Display */}
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notable Projects Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notable Projects</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>AI Gateway</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Microservice Architecture</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Real-time Analytics Platform</span>
                </li>
              </ul>
            </div>

            {/* Resume Section */}
            {candidate.resume_url && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Resume</h2>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {candidate.candidate_name ? candidate.candidate_name.replace(/\s+/g, '_') + '_resume.pdf' : 'resume.pdf'}
                      </p>
                      <p className="text-xs text-gray-500">PDF Document</p>
                    </div>
                  </div>
                  <a
                    href={candidate.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Application Status */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <p className="text-xs text-gray-600 font-medium mb-3">APPLICATION STATUS</p>
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusBadgeColor(candidate.status)}`}>
                {candidate.status === 'interview_scheduled' ? 'Interview Scheduled' :
                 candidate.status === 'new' ? 'New' :
                 candidate.status === 'rejected' ? 'Rejected' :
                 candidate.status || 'Unknown'}
              </span>
            </div>

            {/* Scheduled Interview */}
            {candidate.status === 'interview_scheduled' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Scheduled Interview</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Location</p>
                    <p className="text-sm font-semibold text-gray-900">Video Call</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-1">Date & Time</p>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {candidate.applied_at
                        ? new Date(candidate.applied_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          }) + ' at 10:00 am'
                        : 'TBD'}
                    </p>
                  </div>
                  <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition">
                    View Details
                  </button>
                </div>
              </div>
            )}

            {/* Job Details */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Job Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Position</p>
                  <p className="text-sm font-semibold text-gray-900">{candidate.candidate_title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Experience Required</p>
                  <p className="text-sm font-semibold text-gray-900">{candidate.experience_years || 'Not specified'}</p>
                </div>
                <button className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-sm font-medium transition">
                  View Job Details
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-3">
              {candidate.candidate_email && (
                <a
                  href={`mailto:${candidate.candidate_email}`}
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <Mail className="w-4 h-4" />
                  {candidate.candidate_email}
                </a>
              )}
              {candidate.phone_number && (
                <a
                  href={`tel:${candidate.phone_number}`}
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <Phone className="w-4 h-4" />
                  {candidate.phone_number}
                </a>
              )}
            </div>

            {/* Actions Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Actions</h3>
              <div className="flex items-center justify-center gap-4">
                {/* Show Select button for all statuses except rejected */}
                {candidate.status !== 'rejected' && (
                  <button
                    onClick={() => alert('Candidate selected')}
                    className="inline-flex items-center justify-center p-3 hover:bg-green-50 rounded-lg transition text-green-600 border border-green-200 hover:border-green-300 hover:shadow-sm"
                    title="Select Candidate"
                  >
                    <ShortlistIcon />
                  </button>
                )}

                {/* Show Reject button for all statuses except rejected */}
                {candidate.status !== 'rejected' && (
                  <button
                    onClick={() => alert('Candidate rejected')}
                    className="inline-flex items-center justify-center p-3 hover:bg-red-50 rounded-lg transition text-red-600 border border-red-200 hover:border-red-300 hover:shadow-sm"
                    title="Reject Candidate"
                  >
                    <RejectIcon />
                  </button>
                )}

                {/* Show message for rejected candidates */}
                {candidate.status === 'rejected' && (
                  <div className="px-4 py-3 w-full text-center bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-600">Candidate Rejected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CandidateDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CandidateDetailsContent />
    </Suspense>
  );
}
