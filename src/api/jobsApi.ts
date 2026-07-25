import { httpClient } from '@/lib/http';
import { getCorrelationId } from '@/lib/correlationId';

// ==================== INTERFACES ====================

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  type?: string;
  description?: string;
  job_description?: string;
  salary?: string | { min?: number; max?: number; currency?: string };
  job_type?: string;
  experience_level?: string;
  skills_required?: string[];
  url?: string;
  posted_date?: string;
  deadline?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
  scraped_at?: string;
  is_cleaned?: boolean;
  recruiter_id?: string;
  mode?: string;
  work_mode?: string;
  is_applied?: boolean;
}

export interface JobListMinimal {
  id: string;
  title: string;
  company: string;
  location?: string;
  job_type?: string;
}
export interface JobAnalytics {
  total_jobs?: number;
  jobs_by_type?: Record<string, number>;
  jobs_by_location?: Record<string, number>;
  jobs_by_company?: Record<string, number>;
  avg_salary?: number;
  top_skills?: string[];
  total_applications?: number;
  success_rate?: number;
}

export interface Pagination {
  total: number;
  skip: number;
  limit: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
  pagination?: Pagination;
}

// ==================== SMARTMATCH TYPES ====================

export interface MatchBreakdown {
  skills: number;
  title: number;
  experience: number;
  education: number;
  location: number;
}

export interface JobMatchScore {
  job_id: string;
  score: number;
  band: 'strong' | 'good' | 'partial' | 'low';
  breakdown: MatchBreakdown;
  matched_skills: string[];
  missing_skills: string[];
  scorer_version: number;
  computed_at: string;
}

export interface MatchedJobItem {
  job: Record<string, unknown>;
  match: JobMatchScore;
}

export interface SmartMatchResponse {
  jobs: MatchedJobItem[];
  total: number;
  skip: number;
  limit: number;
  cache_hit: boolean;
  computed_in_ms: number;
  scorer_version: number;
  profile_version: number;
}

export interface SmartMatchParams {
  skip?: number;
  limit?: number;
  min_score?: number;
  min_skill_score?: number;
  min_experience_score?: number;
  min_education_score?: number;
  location?: string;
  mode?: string;
  // Bypasses the backend's own scored-results cache (see cache_hit on
  // SmartMatchResponse) — needed for "Retry Smart Match" to actually get a
  // fresh computation instead of the same cached response.
  force_refresh?: boolean;
}

// ==================== APPLICATION TYPES ====================

export interface ApplicationPayload {
  cover_letter?: string;
  phone_number?: string;
  experience_years?: string;
  notice_period?: string;
  resume_url?: string;
}

export interface Application {
  id: string;
  job_id: string;
  job_title?: string;
  company?: string;
  candidate_id: string;
  candidate_name?: string;
  candidate_email?: string;
  resume_url?: string;
  cover_letter?: string;
  phone_number?: string;
  experience_years?: string;
  notice_period?: string;
  status: 'new' | 'shortlisted' | 'rejected' | 'hired';
  recruiter_id?: string;
  applied_at: string;
  updated_at?: string;
}

export interface ApplicationsResponse {
  job_id: string;
  total: number;
  applications: Application[];
}

// ==================== HELPER ====================

function getRequestConfig() {
  const correlationId = getCorrelationId();
  return {
    headers: correlationId ? { 'X-Correlation-ID': correlationId } : {},
  };
}

// ==================== CRUD ====================

export const createJob = async (jobData: Partial<Job>): Promise<ApiResponse<Job>> => {
  const response = await httpClient.post<ApiResponse<Job>>('/jobs/', jobData, getRequestConfig());
  return response.data;
};

export const updateJob = async (jobId: string, jobData: Partial<Job>): Promise<ApiResponse<Job>> => {
  const response = await httpClient.put<ApiResponse<Job>>(`/jobs/${jobId}`, jobData, getRequestConfig());
  return response.data;
};

export const deleteJob = async (jobId: string): Promise<ApiResponse<{ id: string }>> => {
  const response = await httpClient.delete<ApiResponse<{ id: string }>>(`/jobs/${jobId}`, getRequestConfig());
  return response.data;
};

export const getJobById = async (jobId: string): Promise<ApiResponse<Job>> => {
  // NOTE: there is no GET /jobs/{job_id} route on the backend (that path only
  // has PUT/DELETE for recruiter CRUD) — candidate-safe single-job lookup by
  // id goes through /jobs/all?id=... instead.
  const response = await httpClient.get<ApiResponse<Job>>('/jobs/all', {
    params: { id: jobId },
    ...getRequestConfig(),
  });
  return response.data;
};

// ==================== LISTING ====================

export const getAllJobs = async (skip = 0, limit = 20, source?: string): Promise<ApiResponse<Job[]>> => {
  const params: Record<string, unknown> = { skip, limit };
  if (source) params.source = source;

  const response = await httpClient.get<ApiResponse<Job[]>>('/jobs/all', {
    params,
    ...getRequestConfig(),
  });
  return response.data;
};

export const listJobsMinimal = async (skip = 0, limit = 10): Promise<ApiResponse<JobListMinimal[]>> => {
  const response = await httpClient.get<ApiResponse<JobListMinimal[]>>('/jobs/list', {
    params: { skip, limit },
    ...getRequestConfig(),
  });
  return response.data;
};

export const getMyJobs = async (skip = 0, limit = 20): Promise<ApiResponse<Job[]>> => {
  const response = await httpClient.get<ApiResponse<Job[]>>('/jobs/my-jobs', {
    params: { skip, limit },
    ...getRequestConfig(),
  });
  return response.data;
};

export const getRecruiterJobs = async (skip = 0, limit = 20): Promise<ApiResponse<Job[]>> => {
  const response = await httpClient.get<ApiResponse<Job[]>>('/recruiters/jobs', {
    params: { skip, limit },
    ...getRequestConfig(),
  });
  return response.data;
};

// ==================== JOB CHAT ====================

export interface JobChatSuggestedAction {
  type: string;
  intent: string;
  credits: number;
  action_type: string;
  endpoint: string;
}

export interface JobChatRequest {
  message: string;
  session_id?: string;
}

export interface JobChatResponse {
  response: string;
  intent: string;
  intent_type: 'free' | 'premium' | 'unknown';
  session_id: string;
  suggested_action: JobChatSuggestedAction | null;
}

export const chatAboutJob = async (
  jobId: string,
  message: string,
  sessionId?: string
): Promise<JobChatResponse> => {
  const body: JobChatRequest = { message };
  if (sessionId) body.session_id = sessionId;
  const response = await httpClient.post<JobChatResponse>(
    `/jobs/${jobId}/chat`,
    body,
    getRequestConfig()
  );
  return response.data;
};

// ==================== SMARTMATCH ====================
// Uses /jobs/scored — scores every job in the pool against the user's
// profile (unlike /jobs/matched, which drops jobs before scoring when they
// share no skills with the profile or demand far more experience).

export const getSmartMatchedJobs = async (params: SmartMatchParams = {}): Promise<SmartMatchResponse> => {
  const response = await httpClient.get<SmartMatchResponse>('/jobs/scored', {
    params,
    ...getRequestConfig(),
  });
  return response.data;
};

// ==================== APPLICATIONS ====================

export const applyToJobApi = async (jobId: string, data: ApplicationPayload): Promise<Application> => {
  const response = await httpClient.post<Application>(`/jobs/${jobId}/apply`, data, getRequestConfig());
  return response.data;
};

export const getJobApplications = async (
  jobId: string,
  skip = 0,
  limit = 50
): Promise<ApplicationsResponse> => {
  const response = await httpClient.get<ApplicationsResponse>(`/jobs/${jobId}/applications`, {
    params: { skip, limit },
    ...getRequestConfig(),
  });
  return response.data;
};

export const updateApplicationStatus = async (
  jobId: string,
  applicationId: string,
  status: 'new' | 'shortlisted' | 'rejected' | 'hired'
): Promise<void> => {
  await httpClient.patch(
    `/jobs/${jobId}/applications/${applicationId}/status`,
    { status },
    getRequestConfig()
  );
};

// ==================== ANALYTICS & ADMIN ====================

export const getJobAnalytics = async (): Promise<ApiResponse<JobAnalytics>> => {
  const response = await httpClient.get<ApiResponse<JobAnalytics>>('/jobs/analytics/stats', getRequestConfig());
  return response.data;
};

export const clearJobCaches = async (): Promise<ApiResponse<{ message: string }>> => {
  const response = await httpClient.delete<ApiResponse<{ message: string }>>('/jobs/cache/clear', getRequestConfig());
  return response.data;
};

export const jobsHealthCheck = async (): Promise<ApiResponse<{ status: string }>> => {
  const response = await httpClient.get<ApiResponse<{ status: string }>>('/jobs/health', getRequestConfig());
  return response.data;
};

export const runJobAggregator = async (): Promise<ApiResponse<{ job_count: number; status: string }>> => {
  const response = await httpClient.post<ApiResponse<{ job_count: number; status: string }>>(
    '/jobs/aggregator/run',
    {},
    getRequestConfig()
  );
  return response.data;
};

const jobsApi = {
  createJob,
  listJobsMinimal,
  getAllJobs,
  getMyJobs,
  updateJob,
  deleteJob,
  getJobById,
  getJobAnalytics,
  clearJobCaches,
  jobsHealthCheck,
  runJobAggregator,
  getRecruiterJobs,
  getSmartMatchedJobs,
  applyToJobApi,
  getJobApplications,
  updateApplicationStatus,
};

export default jobsApi;
