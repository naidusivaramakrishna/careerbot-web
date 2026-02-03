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
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
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
}
 
export interface JobSearchParams {
  query?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  skills?: string[];
  skip?: number;
  limit?: number;
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
 
export interface MatchedJob {
  job_id: string;
  title: string;
  company: string;
  match_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  match_details?: Record<string, unknown>;
}
 
export interface ProfileMatchingPayload {
  user_id?: string;
  skills?: string[];
  experience_level?: string;
  preferred_locations?: string[];
  preferred_job_types?: string[];
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
 
// ==================== HELPER FUNCTION ====================
 
/**
 * Get request headers with correlation ID
 */
function getRequestConfig() {
  const correlationId = getCorrelationId();
  return {
    headers: correlationId ? { 'X-Correlation-ID': correlationId } : {},
  };
}
 
// ==================== API CALLS ====================
 
/**
 * Create a new job
 * POST /api/v1/jobs/
 */
export const createJob = async (jobData: Job): Promise<ApiResponse<Job>> => {
  try {
    const response = await httpClient.post<ApiResponse<Job>>('/jobs/', jobData, getRequestConfig());
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Search for jobs with filters
 * GET /api/v1/jobs/search
 */
export const searchJobs = async (params: JobSearchParams): Promise<ApiResponse<Job[]>> => {
  try {
    const response = await httpClient.get<ApiResponse<Job[]>>('/jobs/search', {
      params,
      ...getRequestConfig(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Get list of jobs (minimal info)
 * GET /api/v1/jobs/list
 */
export const listJobsMinimal = async (
  skip: number = 0,
  limit: number = 10
): Promise<ApiResponse<JobListMinimal[]>> => {
  try {
    const response = await httpClient.get<ApiResponse<JobListMinimal[]>>('/jobs/list', {
      params: { skip, limit },
      ...getRequestConfig(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Update a job
 * PUT /api/v1/jobs/{job_id}
 */
export const updateJob = async (jobId: string, jobData: Partial<Job>): Promise<ApiResponse<Job>> => {
  try {
    const response = await httpClient.put<ApiResponse<Job>>(
      `/jobs/${jobId}`,
      jobData,
      getRequestConfig()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Delete a job
 * DELETE /api/v1/jobs/{job_id}
 */
export const deleteJob = async (jobId: string): Promise<ApiResponse<{ id: string }>> => {
  try {
    const response = await httpClient.delete<ApiResponse<{ id: string }>>(
      `/jobs/${jobId}`,
      getRequestConfig()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Get job analytics/statistics
 * GET /api/v1/jobs/analytics/stats
 */
export const getJobAnalytics = async (): Promise<ApiResponse<JobAnalytics>> => {
  try {
    const response = await httpClient.get<ApiResponse<JobAnalytics>>(
      '/jobs/analytics/stats',
      getRequestConfig()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Clear job caches
 * DELETE /api/v1/jobs/cache/clear
 */
export const clearJobCaches = async (): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await httpClient.delete<ApiResponse<{ message: string }>>(
      '/jobs/cache/clear',
      getRequestConfig()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Health check for jobs service
 * GET /api/v1/jobs/health
 */
export const jobsHealthCheck = async (): Promise<ApiResponse<{ status: string }>> => {
  try {
    const response = await httpClient.get<ApiResponse<{ status: string }>>(
      '/jobs/health',
      getRequestConfig()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Run job aggregator to fetch and process jobs
 * POST /api/v1/jobs/aggregator/run
 */
export const runJobAggregator = async (): Promise<ApiResponse<{ job_count: number; status: string }>> => {
  try {
    const response = await httpClient.post<ApiResponse<{ job_count: number; status: string }>>(
      '/jobs/aggregator/run',
      {},
      getRequestConfig()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Get cleaned/processed jobs from aggregator
 * GET /api/v1/jobs/aggregator/jobs/cleaned
 *
 * @param skip - Number of records to skip (default: 0)
 * @param limit - Max records to return (default: 20)
 * @param source - Filter by source (indeed, linkedin, etc.)
 */
export const getCleanedJobs = async (
  skip: number = 0,
  limit: number = 20,
  source?: string
): Promise<ApiResponse<CleanedJob[]>> => {
  try {
    const params: { skip: number; limit: number; source?: string } = { skip, limit };
    if (source) params.source = source;
 
    const response = await httpClient.get<ApiResponse<CleanedJob[]>>(
      '/jobs/aggregator/jobs/cleaned',
      {
        params,
        ...getRequestConfig(),
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Match user profile with jobs
 * POST /api/v1/jobs/aggregator/profile-matching
 */
export const matchProfileWithJobs = async (
  profileData: ProfileMatchingPayload
): Promise<ApiResponse<MatchedJob[]>> => {
  try {
    const response = await httpClient.post<ApiResponse<MatchedJob[]>>(
      '/jobs/aggregator/profile-matching',
      profileData,
      getRequestConfig()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
/**
 * Get matched jobs for user profile
 * GET /api/v1/jobs/aggregator/jobs/matched
 */
export const getMatchedJobs = async (
  skip: number = 0,
  limit: number = 10
): Promise<ApiResponse<MatchedJob[]>> => {
  try {
    const response = await httpClient.get<ApiResponse<MatchedJob[]>>(
      '/jobs/aggregator/jobs/matched',
      {
        params: { skip, limit },
        ...getRequestConfig(),
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
 
const jobsApi = {
  createJob,
  searchJobs,
  listJobsMinimal,
  updateJob,
  deleteJob,
  getJobAnalytics,
  clearJobCaches,
  jobsHealthCheck,
  runJobAggregator,
  getCleanedJobs,
  matchProfileWithJobs,
  getMatchedJobs,
};

export default jobsApi;
