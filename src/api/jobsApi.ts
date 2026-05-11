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

export interface JobSearchParams {
  q?: string;           // text search across title, company, location
  query?: string;       // legacy alias for q
  title?: string;       // filter by title (case-insensitive)
  company?: string;     // filter by company (case-insensitive)
  location?: string;    // filter by location (case-insensitive)
  job_type?: string;    // filter by job type (e.g. "Contract")
  source?: string;      // filter by source
  date_from?: string;   // ISO date string
  date_to?: string;     // ISO date string
  page?: number;        // 1-based page number
  skip?: number;        // records to skip (derived from page if omitted)
  limit?: number;       // max records (default 20)
  sort_by?: string;
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

export interface CleanedJob extends Job {
  is_cleaned: boolean;
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
  location?: string;
  mode?: string;
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
  const response = await httpClient.get<ApiResponse<Job>>(`/jobs/${jobId}`, getRequestConfig());
  return response.data;
};

// ==================== LISTING ====================

export const searchJobs = async (params: JobSearchParams): Promise<ApiResponse<Job[]>> => {
  const limit = params.limit || 20;
  const skip = params.skip ?? (params.page ? (params.page - 1) * limit : 0);

  const backendParams: Record<string, unknown> = { skip, limit };

  const q = params.q || params.query;
  if (q) backendParams.q = q;
  if (params.title) backendParams.title = params.title;
  if (params.company) backendParams.company = params.company;
  if (params.location) backendParams.location = params.location;
  if (params.job_type) backendParams.job_type = params.job_type;
  if (params.source) backendParams.source = params.source;
  if (params.date_from) backendParams.date_from = params.date_from;
  if (params.date_to) backendParams.date_to = params.date_to;
  // do NOT send page — backend rejects requests that have both skip and page

  const response = await httpClient.get<ApiResponse<Job[]>>('/jobs/all', {
    params: backendParams,
    ...getRequestConfig(),
  });
  return response.data;
};

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

export const getCleanedJobs = async (skip = 0, limit = 20): Promise<ApiResponse<CleanedJob[]>> => {
  const response = await httpClient.get<ApiResponse<CleanedJob[]>>('/jobs/aggregator/jobs/cleaned', {
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

export const getSmartMatchedJobs = async (params: SmartMatchParams = {}): Promise<SmartMatchResponse> => {
  const response = await httpClient.get<SmartMatchResponse>('/jobs/matched', {
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
  searchJobs,
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
  getCleanedJobs,
  getRecruiterJobs,
  getSmartMatchedJobs,
  applyToJobApi,
  getJobApplications,
  updateApplicationStatus,
};

export default jobsApi;
