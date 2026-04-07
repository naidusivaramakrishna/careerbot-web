// src/api/recruiterAuthApiMain.ts

import axios from 'axios';
import { httpClient } from '@/lib/http';
import { RecruiterSignupData, RecruiterLoginData, RecruiterAuthResponse } from '../types/recruiterAuthTypes';

// ── Payload types ──────────────────────────────────────────────────────────────

type JsonPayload = Record<string, unknown>;

interface ValidationError { field: string; message: string; }
interface FastApiError   { loc?: string[]; msg: string; }
interface ApiErrorBody {
  error?: { message?: string; details?: { validation_errors?: ValidationError[] } };
  detail?: string | FastApiError[];
  message?: string;
}

// ── Error extraction ───────────────────────────────────────────────────────────

function extractApiError(data: ApiErrorBody, fallback: string): string {
  if (data.error?.details?.validation_errors?.length) {
    return data.error.details.validation_errors
      .map((e) => `${e.field}: ${e.message}`)
      .join(', ');
  }
  if (data.error?.message) return data.error.message;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((e) => `${(e.loc ?? ['unknown']).join('.')}: ${e.msg}`)
      .join(', ');
  }
  if (typeof data.detail === 'string') return data.detail;
  if (data.message) return data.message;
  return fallback;
}

function throwApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error) && error.response) {
    throw new Error(extractApiError(error.response.data as ApiErrorBody, fallback));
  }
  throw error;
}

// ── Auth API ───────────────────────────────────────────────────────────────────

export const recruiterAuthApi = {
  /** Register a new recruiter — POST /auth/signup/recruiter */
  signup: async (data: RecruiterSignupData): Promise<RecruiterAuthResponse> => {
    const cleanUsername = (data.username?.trim() || data.email.split('@')[0])
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      const response = await httpClient.post<RecruiterAuthResponse>(
        '/auth/signup/recruiter',
        { email: data.email, username: cleanUsername, password: data.password },
      );
      const result = response.data;
      const recruiterData = result.data?.recruiter ?? (result as RecruiterAuthResponse & { user?: unknown }).user;
      if (recruiterData) {
        localStorage.setItem('recruiterData', JSON.stringify(recruiterData));
      }
      return result;
    } catch (error) {
      throwApiError(error, 'Signup failed');
    }
  },

  /** Login recruiter — POST /auth/signin (OAuth2 form body) */
  login: async (data: RecruiterLoginData): Promise<RecruiterAuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    try {
      const response = await httpClient.post<RecruiterAuthResponse>(
        '/auth/signin',
        formData as unknown as Record<string, unknown>,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      const result = response.data;
      const recruiterData = result.data?.recruiter ?? (result as RecruiterAuthResponse & { user?: unknown }).user;
      if (recruiterData) {
        localStorage.setItem('recruiterData', JSON.stringify(recruiterData));
      }
      if (data.rememberMe) {
        localStorage.setItem('recruiterRememberMe', 'true');
      }
      return result;
    } catch (error) {
      throwApiError(error, 'Login failed');
    }
  },

  /** Logout recruiter — POST /auth/signout */
  logout: async (): Promise<void> => {
    try {
      await httpClient.post('/auth/signout');
    } finally {
      localStorage.removeItem('recruiterData');
      localStorage.removeItem('recruiterRememberMe');
    }
  },

  /** Get cached recruiter metadata from localStorage */
  getCurrentRecruiter: (): unknown => {
    const data = localStorage.getItem('recruiterData');
    return data ? (JSON.parse(data) as unknown) : null;
  },

  /** Verify session via profile endpoint — GET /auth/profile */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      await httpClient.get('/auth/profile');
      return true;
    } catch {
      return false;
    }
  },

  /** Redirect to Google OAuth */
  googleAuth: (): void => {
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1'}/recruiter/auth/google`;
  },

  /** Redirect to LinkedIn OAuth */
  linkedinAuth: (): void => {
    window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1'}/recruiter/auth/linkedin`;
  },

  // ── Job Management ────────────────────────────────────────────────────────────

  /** Create a new job posting — POST /jobs/ */
  createJob: async (jobData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post('/jobs/', jobData);
    return response.data;
  },

  /** Get recruiter's posted jobs — GET /jobs/my-jobs */
  getMyJobs: async (): Promise<unknown> => {
    const response = await httpClient.get('/jobs/my-jobs');
    return response.data;
  },

  /** Get job by ID — GET /jobs/{job_id} */
  getJobById: async (jobId: string): Promise<unknown> => {
    const response = await httpClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  /** Update job posting — PUT /jobs/{job_id} */
  updateJob: async (jobId: string, jobData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  /** Delete job posting — DELETE /jobs/{job_id} */
  deleteJob: async (jobId: string): Promise<unknown> => {
    const response = await httpClient.delete(`/jobs/${jobId}`);
    return response.data;
  },

  /** Get job applications — GET /jobs/{job_id}/applications */
  getJobApplications: async (jobId: string): Promise<unknown> => {
    const response = await httpClient.get(`/jobs/${jobId}/applications`);
    return response.data;
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  /** Get dashboard statistics — GET /recruiter/dashboard/stats */
  getDashboardStats: async (): Promise<unknown> => {
    const response = await httpClient.get('/recruiter/dashboard/stats');
    return response.data;
  },

  // ── Interviews ────────────────────────────────────────────────────────────────

  /** Get scheduled interviews — GET /recruiter/interviews */
  getScheduledInterviews: async (): Promise<unknown[]> => {
    try {
      const response = await httpClient.get<unknown[]>('/recruiter/interviews');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      return [];
    }
  },

  /** Get interview details — GET /recruiter/interviews/{interview_id} */
  getInterviewDetails: async (interviewId: string): Promise<unknown> => {
    const response = await httpClient.get(`/recruiter/interviews/${interviewId}`);
    return response.data;
  },

  /** Schedule interview — POST /recruiter/interviews */
  scheduleInterview: async (interviewData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post('/recruiter/interviews', interviewData);
    return response.data;
  },

  /** Update interview schedule — PUT /recruiter/interviews/{interview_id} */
  updateInterviewSchedule: async (interviewId: string, interviewData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.put(`/recruiter/interviews/${interviewId}`, interviewData);
    return response.data;
  },

  /** Cancel interview — POST /recruiter/interviews/{interview_id}/cancel */
  cancelInterviewApi: async (interviewId: string, cancelData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post(`/recruiter/interviews/${interviewId}/cancel`, cancelData);
    return response.data;
  },

  // ── Candidate Actions ─────────────────────────────────────────────────────────

  /** Get candidate details — GET /jobs/{job_id}/applications/{application_id} */
  getCandidateDetails: async (jobId: string, applicationId: string): Promise<unknown> => {
    const response = await httpClient.get(`/jobs/${jobId}/applications/${applicationId}`);
    return response.data;
  },

  /** Update application status — POST /jobs/{job_id}/applications/{application_id}/status */
  updateApplicationStatus: async (jobId: string, applicationId: string, statusData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post(`/jobs/${jobId}/applications/${applicationId}/status`, statusData);
    return response.data;
  },

  /** Schedule interview for candidate — POST /jobs/{job_id}/applications/{application_id}/schedule-interview */
  scheduleInterviewForCandidate: async (jobId: string, applicationId: string, interviewData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post(`/jobs/${jobId}/applications/${applicationId}/schedule-interview`, interviewData);
    return response.data;
  },

  /** Reject candidate — POST /jobs/{job_id}/applications/{application_id}/reject */
  rejectCandidate: async (jobId: string, applicationId: string, rejectData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post(`/jobs/${jobId}/applications/${applicationId}/reject`, rejectData);
    return response.data;
  },

  /** Shortlist candidate — POST /jobs/{job_id}/applications/{application_id}/shortlist */
  shortlistCandidate: async (jobId: string, applicationId: string, shortlistData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post(`/jobs/${jobId}/applications/${applicationId}/shortlist`, shortlistData);
    return response.data;
  },

  /** Get candidate by application ID — GET /recruiter/candidates/{application_id} */
  getCandidateById: async (applicationId: string): Promise<unknown> => {
    const response = await httpClient.get(`/recruiter/candidates/${applicationId}`);
    return response.data;
  },

  // ── Messaging ─────────────────────────────────────────────────────────────────

  /** Get all conversations — GET /recruiter/messages/conversations */
  getConversations: async (): Promise<unknown> => {
    const response = await httpClient.get('/recruiter/messages/conversations');
    return response.data;
  },

  /** Create a new conversation — POST /recruiter/messages/conversations */
  createConversation: async (conversationData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post('/recruiter/messages/conversations', conversationData);
    return response.data;
  },

  /** Get conversation details — GET /recruiter/messages/conversations/{conversation_id} */
  getConversationDetails: async (conversationId: string): Promise<unknown> => {
    const response = await httpClient.get(`/recruiter/messages/conversations/${conversationId}`);
    return response.data;
  },

  /** Get messages for a conversation — GET /recruiter/messages/conversations/{conversation_id}/messages */
  getMessages: async (conversationId: string): Promise<unknown> => {
    const response = await httpClient.get(`/recruiter/messages/conversations/${conversationId}/messages`);
    return response.data;
  },

  /** Send a message — POST /recruiter/messages/conversations/{conversation_id}/messages */
  sendMessage: async (conversationId: string, messageData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post(`/recruiter/messages/conversations/${conversationId}/messages`, messageData);
    return response.data;
  },

  /** Mark conversation as read — POST /recruiter/messages/conversations/{conversation_id}/mark-read */
  markConversationAsRead: async (conversationId: string): Promise<unknown> => {
    const response = await httpClient.post(`/recruiter/messages/conversations/${conversationId}/mark-read`);
    return response.data;
  },

  // ── Security & Email ──────────────────────────────────────────────────────────

  /** Verify email with OTP — POST /auth/email/verify */
  verifyEmail: async (emailData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post('/auth/email/verify', emailData);
    return response.data;
  },

  /** Resend verification email — POST /auth/email/resend */
  resendVerificationEmail: async (emailData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post('/auth/email/resend', emailData);
    return response.data;
  },

  /** Request password reset — POST /auth/password/reset */
  requestPasswordReset: async (resetData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post('/auth/password/reset', resetData);
    return response.data;
  },

  /** Confirm password reset — POST /auth/password/reset/confirm */
  confirmPasswordReset: async (resetData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post('/auth/password/reset/confirm', resetData);
    return response.data;
  },

  /** Enable 2FA — POST /recruiter/settings/2fa/enable */
  enable2FA: async (): Promise<unknown> => {
    const response = await httpClient.post('/recruiter/settings/2fa/enable');
    return response.data;
  },

  /** Disable 2FA — POST /recruiter/settings/2fa/disable */
  disable2FA: async (disableData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.post('/recruiter/settings/2fa/disable', disableData);
    return response.data;
  },

  /** Delete account — DELETE /recruiter/account/delete */
  deleteAccount: async (deleteData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.delete('/recruiter/account/delete', { data: deleteData });
    return response.data;
  },

  // ── Profile & Settings ────────────────────────────────────────────────────────

  /** Get recruiter profile — GET /recruiter/profile */
  getProfile: async (): Promise<unknown> => {
    const response = await httpClient.get('/recruiter/profile');
    return response.data;
  },

  /** Update recruiter profile — PUT /recruiter/profile */
  updateProfile: async (profileData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.put('/recruiter/profile', profileData);
    return response.data;
  },

  /** Update notification preferences — PUT /recruiter/preferences */
  updatePreferences: async (preferencesData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.put('/recruiter/preferences', preferencesData);
    return response.data;
  },

  /** Update company information — PUT /recruiter/company */
  updateCompany: async (companyData: JsonPayload): Promise<unknown> => {
    const response = await httpClient.put('/recruiter/company', companyData);
    return response.data;
  },
};
