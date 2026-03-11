// src/api/recruiterAuthApiMain.ts

import { RecruiterSignupData, RecruiterLoginData, RecruiterAuthResponse } from '../types/recruiterAuthTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';
const FETCH_TIMEOUT = 30000; // 30 seconds (increased from 10 to allow slow responses)

/**
 * Helper function to add timeout to fetch requests
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    console.log('🌐 API Request:', {
      url,
      method: options.method || 'GET',
      timeout: FETCH_TIMEOUT
    });

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    console.log('📡 API Response:', {
      url,
      status: response.status,
      statusText: response.statusText
    });

    return response;
  } catch (error: any) {
    const errorMsg = String(error?.message || error || 'Unknown error');
    const errorName = error?.name || 'Unknown';

    let diagnosis = '';
    if (errorName === 'AbortError') {
      diagnosis = 'TIMEOUT - Backend took too long or not responding';
    } else if (errorMsg.includes('Failed to fetch')) {
      diagnosis = 'CONNECTION REFUSED - Cannot reach backend at ' + url;
    } else if (errorMsg.includes('CORS')) {
      diagnosis = 'CORS ERROR - Backend CORS not configured for localhost:3000';
    } else {
      diagnosis = 'NETWORK ERROR - Cannot connect to backend';
    }

    const fullError = `
❌ API FAILED
URL: ${url}
Error Type: ${errorName}
Error Message: ${errorMsg}
🔴 DIAGNOSIS: ${diagnosis}
`;

    console.error(fullError);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const recruiterAuthApi = {
  /**
   * Register a new recruiter
   */
  signup: async (data: RecruiterSignupData): Promise<RecruiterAuthResponse> => {
    try {
      // Clean username: remove invalid characters and use email prefix if username is empty
      let cleanUsername = data.username && data.username.trim()
        ? data.username.trim()
        : data.email.split('@')[0];

      // Remove any characters that aren't letters, numbers, underscores, or hyphens
      cleanUsername = cleanUsername.replace(/[^a-zA-Z0-9_-]/g, '_');

      // Backend only expects: email, username, password
      const payload = {
        email: data.email,
        username: cleanUsername,
        password: data.password,
      };

      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/signup/recruiter`, {
        method: 'POST',
        credentials: 'include',  // ✅ COOKIES SENT/RECEIVED AUTOMATICALLY
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Signup response received:', response.status, response.statusText);

      let result: any;
      try {
        result = await response.json();
        console.log('Signup response parsed:', result);
      } catch (parseError) {
        console.error('Failed to parse signup response:', parseError);
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error(`Failed to parse signup response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      if (!response.ok) {
        // Extract detailed validation errors if available
        let errorMessage = 'Signup failed';

        // Check for new error format with validation_errors
        if (result.error && result.error.details && result.error.details.validation_errors) {
          errorMessage = result.error.details.validation_errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(', ');
        }
        // Check for FastAPI detail format
        else if (result.detail) {
          if (Array.isArray(result.detail)) {
            errorMessage = result.detail.map((err: any) => {
              const field = err.loc ? err.loc.join('.') : 'unknown';
              return `${field}: ${err.msg}`;
            }).join(', ');
          } else if (typeof result.detail === 'string') {
            errorMessage = result.detail;
          } else {
            errorMessage = JSON.stringify(result.detail);
          }
        }
        // Check for message field
        else if (result.error && result.error.message) {
          errorMessage = result.error.message;
        } else if (result.message) {
          errorMessage = result.message;
        }

        throw new Error(errorMessage);
      }

      // ✅ TOKENS ARE NOW IN HTTPONLY COOKIES
      // No manual storage needed - browser handles cookies automatically
      // Optionally store recruiter metadata if needed (but not tokens)
      console.log('Checking for recruiter data in signup response:', result);

      if (result.data?.recruiter) {
        console.log('Found recruiter data, storing in localStorage:', result.data.recruiter);
        localStorage.setItem('recruiterData', JSON.stringify(result.data.recruiter));
      } else if (result.user) {
        // Fallback: if backend returns 'user' instead of 'recruiter'
        console.log('Found user data (not under recruiter), storing as recruiterData:', result.user);
        localStorage.setItem('recruiterData', JSON.stringify(result.user));
      } else {
        console.warn('No recruiter or user data found in signup response');
      }

      return result;
    } catch (error: any) {
      // Handle timeout errors specifically
      if (error.name === 'AbortError') {
        console.error('Signup request aborted - timeout or network issue');
        console.error('Timeout duration: 30 seconds');
        console.error('Backend URL:', API_BASE_URL);
        throw new Error(`Signup request timed out (30s). Backend at ${API_BASE_URL} is not responding. Check if backend is running, accessible, and CORS is configured.`);
      }
      console.error('Signup error (not timeout):', error);
      throw error;
    }
  },

  /**
   * Login recruiter
   */
  login: async (data: RecruiterLoginData): Promise<RecruiterAuthResponse> => {
    try {
      // Backend expects OAuth2 format: username and password as form data
      // The 'username' field accepts either email or username
      const formData = new URLSearchParams();
      formData.append('username', data.email); // Can be email or username
      formData.append('password', data.password);

      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        credentials: 'include',  // ✅ COOKIES SENT/RECEIVED AUTOMATICALLY
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      console.log('Login response received:', response.status, response.statusText);

      let result: any;
      try {
        result = await response.json();
        console.log('Login response parsed:', result);
      } catch (parseError) {
        console.error('Failed to parse login response:', parseError);
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error(`Failed to parse login response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      if (!response.ok) {
        // Extract detailed validation errors if available
        let errorMessage = 'Login failed';

        // Check for error.message field first (your backend format)
        if (result.error && result.error.message) {
          errorMessage = result.error.message;
        }
        // Check for new error format with validation_errors
        else if (result.error && result.error.details && result.error.details.validation_errors) {
          errorMessage = result.error.details.validation_errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(', ');
        }
        // Check for FastAPI detail format
        else if (result.detail) {
          if (Array.isArray(result.detail)) {
            errorMessage = result.detail.map((err: any) => {
              const field = err.loc ? err.loc.join('.') : 'unknown';
              return `${field}: ${err.msg}`;
            }).join(', ');
          } else if (typeof result.detail === 'string') {
            errorMessage = result.detail;
          } else {
            errorMessage = JSON.stringify(result.detail);
          }
        }
        // Check for message field
        else if (result.message) {
          errorMessage = result.message;
        }

        throw new Error(errorMessage);
      }

      // ✅ TOKENS ARE NOW IN HTTPONLY COOKIES
      // No manual storage needed - browser handles cookies automatically
      // Optionally store recruiter metadata if needed (but not tokens)
      console.log('Checking for recruiter data in response:', result);

      if (result.data?.recruiter) {
        console.log('Found recruiter data, storing in localStorage:', result.data.recruiter);
        localStorage.setItem('recruiterData', JSON.stringify(result.data.recruiter));
      } else if (result.user) {
        // Fallback: if backend returns 'user' instead of 'recruiter'
        console.log('Found user data (not under recruiter), storing as recruiterData:', result.user);
        localStorage.setItem('recruiterData', JSON.stringify(result.user));
      } else {
        console.warn('No recruiter or user data found in response');
      }

      // Store rememberMe preference if needed
      if (data.rememberMe) {
        localStorage.setItem('recruiterRememberMe', 'true');
      }

      return result;
    } catch (error: any) {
      // Handle timeout errors specifically
      if (error.name === 'AbortError') {
        console.error('Login request aborted - timeout or network issue');
        console.error('Timeout duration: 30 seconds');
        console.error('Backend URL:', API_BASE_URL);
        throw new Error(`Login request timed out (30s). Backend at ${API_BASE_URL} is not responding. Check if backend is running, accessible, and CORS is configured.`);
      }
      console.error('Login error (not timeout):', error);
      throw error;
    }
  },

  /**
   * Logout recruiter
   */
  logout: async (): Promise<void> => {
    try {
      // ✅ CALL SIGNOUT ENDPOINT - Backend clears httpOnly cookies
      await fetchWithTimeout(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        credentials: 'include',  // Include cookies for logout
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clean up local session data
      localStorage.removeItem('recruiterData');
      localStorage.removeItem('recruiterRememberMe');
    }
  },

  /**
   * Get current recruiter data from cache
   */
  getCurrentRecruiter: () => {
    const data = localStorage.getItem('recruiterData');
    return data ? JSON.parse(data) : null;
  },

  /**
   * ✅ CHECK IF RECRUITER IS AUTHENTICATED
   * Verifies session by calling backend profile endpoint
   */
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        credentials: 'include',  // ✅ Cookies sent automatically
      });
      return response.ok;
    } catch (error) {
      console.warn('Authentication check failed:', error);
      return false;
    }
  },

  /**
   * Google OAuth authentication
   */
  googleAuth: async (): Promise<void> => {
    window.location.href = `${API_BASE_URL}/recruiter/auth/google`;
  },

  /**
   * LinkedIn OAuth authentication
   */
  linkedinAuth: async (): Promise<void> => {
    window.location.href = `${API_BASE_URL}/recruiter/auth/linkedin`;
  },

  // ==================== JOB MANAGEMENT APIs ====================

  /**
   * Create a new job posting
   * POST /api/v1/jobs/
   */
  createJob: async (jobData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  /**
   * Get recruiter's posted jobs
   * GET /api/v1/jobs/my-jobs
   */
  getMyJobs: async (): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/my-jobs`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching my jobs:', error);
      throw error;
    }
  },

  /**
   * Get job by ID
   * GET /api/v1/jobs/{job_id}
   */
  getJobById: async (jobId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching job:', error);
      throw error;
    }
  },

  /**
   * Update job posting
   * PUT /api/v1/jobs/{job_id}
   */
  updateJob: async (jobId: string, jobData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  /**
   * Delete job posting
   * DELETE /api/v1/jobs/{job_id}
   */
  deleteJob: async (jobId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  /**
   * Get job applications
   * GET /api/v1/jobs/{job_id}/applications
   */
  getJobApplications: async (jobId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}/applications`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  // ==================== DASHBOARD APIs ====================

  /**
   * Get dashboard statistics
   * GET /api/v1/recruiter/dashboard/stats
   */
  getDashboardStats: async (): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/dashboard/stats`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // ==================== INTERVIEW APIs ====================

  /**
   * Get scheduled interviews
   * GET /api/v1/recruiter/interviews
   */
  getScheduledInterviews: async (): Promise<any> => {
    try {
      const url = `${API_BASE_URL}/recruiter/interviews`;
      console.log('🔗 Fetching interviews from:', url);

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('📊 Response Status:', response.status, response.statusText);

      if (!response.ok) {
        // Handle 404 gracefully - endpoint may not be implemented yet
        if (response.status === 404) {
          console.warn('⚠️ Interviews endpoint not yet implemented on backend. Returning empty array.');
          return [];
        }

        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API error ${response.status}:`, errorData);
        throw new Error(`Failed to fetch interviews: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Successfully fetched interviews');
      console.log('📋 Response data:', data);
      console.log('📋 Response type:', typeof data);
      console.log('📋 Is Array:', Array.isArray(data));
      if (!Array.isArray(data) && typeof data === 'object') {
        console.log('📋 Response keys:', Object.keys(data));
      }

      return data;
    } catch (error: any) {
      console.error('❌ Error fetching interviews:', error?.message);
      return [];  // Return empty array instead of throwing
    }
  },

  /**
   * Get interview details
   * GET /api/v1/recruiter/interviews/{interview_id}
   */
  getInterviewDetails: async (interviewId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/interviews/${interviewId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching interview details:', error);
      throw error;
    }
  },

  /**
   * Schedule interview
   * POST /api/v1/recruiter/interviews
   */
  scheduleInterview: async (interviewData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/interviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error scheduling interview:', error);
      throw error;
    }
  },

  /**
   * Update interview schedule
   * PUT /api/v1/recruiter/interviews/{interview_id}
   */
  updateInterviewSchedule: async (interviewId: string, interviewData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/interviews/${interviewId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error updating interview:', error);
      throw error;
    }
  },

  /**
   * Cancel interview
   * POST /api/v1/recruiter/interviews/{interview_id}/cancel
   */
  cancelInterviewApi: async (interviewId: string, cancelData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/interviews/${interviewId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error cancelling interview:', error);
      throw error;
    }
  },

  // ==================== CANDIDATE ACTIONS APIs ====================

  /**
   * Get candidate details
   * GET /api/v1/jobs/{job_id}/applications/{application_id}
   */
  getCandidateDetails: async (jobId: string, applicationId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}/applications/${applicationId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching candidate details:', error);
      throw error;
    }
  },

  /**
   * Update application status
   * POST /api/v1/jobs/{job_id}/applications/{application_id}/status
   */
  updateApplicationStatus: async (jobId: string, applicationId: string, statusData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}/applications/${applicationId}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error updating application status:', error);
      throw error;
    }
  },

  /**
   * Schedule interview for candidate
   * POST /api/v1/jobs/{job_id}/applications/{application_id}/schedule-interview
   */
  scheduleInterviewForCandidate: async (jobId: string, applicationId: string, interviewData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}/applications/${applicationId}/schedule-interview`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error scheduling interview for candidate:', error);
      throw error;
    }
  },

  /**
   * Reject candidate
   * POST /api/v1/jobs/{job_id}/applications/{application_id}/reject
   */
  rejectCandidate: async (jobId: string, applicationId: string, rejectData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}/applications/${applicationId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rejectData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error rejecting candidate:', error);
      throw error;
    }
  },

  /**
   * Shortlist candidate
   * POST /api/v1/jobs/{job_id}/applications/{application_id}/shortlist
   */
  shortlistCandidate: async (jobId: string, applicationId: string, shortlistData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}/applications/${applicationId}/shortlist`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shortlistData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error shortlisting candidate:', error);
      throw error;
    }
  },

  // ==================== RECRUITER-SPECIFIC CANDIDATE & INTERVIEW APIs ====================

  /**
   * Get candidate details by application ID
   * GET /api/v1/recruiter/candidates/{application_id}
   */
  getCandidateById: async (applicationId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/candidates/${applicationId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching candidate by ID:', error);
      throw error;
    }
  },

  /**
   * Get recruiter's interviews
   * GET /api/v1/recruiter/interviews
   */
  getRecruiterInterviews: async (): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/interviews`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching recruiter interviews:', error);
      throw error;
    }
  },

  /**
   * Update application status directly
   * POST /api/v1/jobs/{job_id}/applications/{application_id}/status
   */
  updateCandidateStatus: async (jobId: string, applicationId: string, statusData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/jobs/${jobId}/applications/${applicationId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error updating candidate status:', error);
      throw error;
    }
  },

  // ==================== MESSAGING APIs ====================

  /**
   * Get all conversations
   * GET /api/v1/recruiter/messages/conversations
   */
  getConversations: async (): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/messages/conversations`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  /**
   * Create a new conversation
   * POST /api/v1/recruiter/messages/conversations
   */
  createConversation: async (conversationData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/messages/conversations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversationData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  /**
   * Get conversation details
   * GET /api/v1/recruiter/messages/conversations/{conversation_id}
   */
  getConversationDetails: async (conversationId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/messages/conversations/${conversationId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching conversation details:', error);
      throw error;
    }
  },

  /**
   * Get messages for a conversation
   * GET /api/v1/recruiter/messages/conversations/{conversation_id}/messages
   */
  getMessages: async (conversationId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/messages/conversations/${conversationId}/messages`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Send a message
   * POST /api/v1/recruiter/messages/conversations/{conversation_id}/messages
   */
  sendMessage: async (conversationId: string, messageData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Mark conversation as read
   * POST /api/v1/recruiter/messages/conversations/{conversation_id}/mark-read
   */
  markConversationAsRead: async (conversationId: string): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/messages/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  // ==================== SECURITY & EMAIL APIs ====================

  /**
   * Verify email with OTP
   * POST /api/v1/auth/email/verify
   */
  verifyEmail: async (emailData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/email/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error verifying email:', error);
      throw error;
    }
  },

  /**
   * Resend verification email
   * POST /api/v1/auth/email/resend
   */
  resendVerificationEmail: async (emailData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/email/resend`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      throw error;
    }
  },

  /**
   * Request password reset
   * POST /api/v1/auth/password/reset
   */
  requestPasswordReset: async (resetData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/password/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  /**
   * Confirm password reset
   * POST /api/v1/auth/password/reset
   */
  confirmPasswordReset: async (resetData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/password/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  },

  /**
   * Enable 2FA
   * POST /api/v1/recruiter/settings/2fa/enable
   */
  enable2FA: async (): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/settings/2fa/enable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  },

  /**
   * Disable 2FA
   * POST /api/v1/recruiter/settings/2fa/disable
   */
  disable2FA: async (disableData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/settings/2fa/disable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disableData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  },

  /**
   * Delete account
   * DELETE /api/v1/recruiter/account/delete
   */
  deleteAccount: async (deleteData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/account/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // ==================== PROFILE & SETTINGS APIs ====================

  /**
   * Get recruiter profile
   * GET /api/v1/recruiter/profile
   */
  getProfile: async (): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  /**
   * Update recruiter profile
   * PUT /api/v1/recruiter/profile
   */
  updateProfile: async (profileData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Update notification preferences
   * PUT /api/v1/recruiter/preferences
   */
  updatePreferences: async (preferencesData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/preferences`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferencesData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  /**
   * Update company information
   * PUT /api/v1/recruiter/company
   */
  updateCompany: async (companyData: any): Promise<any> => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/recruiter/company`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });
      return await response.json();
    } catch (error: any) {
      console.error('Error updating company:', error);
      throw error;
    }
  },
};