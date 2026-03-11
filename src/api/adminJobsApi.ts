import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';
// ==================== TYPES ====================

export type JobStatus = 'active' | 'draft' | 'expired' | 'closed';

// ==================== INTERFACES ====================

export interface CreateJobRequest {
    job_title: string;
    company: string;
    location: string;
    work_mode: 'remote' | 'hybrid' | 'on-site';
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    job_type: 'full-time' | 'part-time' | 'internship' | 'contract';
    number_of_openings: number;
    job_description: string;
    about_company?: string;
    skills?: string[];
    application_url?: string;
    application_deadline?: string;
    who_can_apply?: string;
    company_logo_url?: string;
    status?: JobStatus;
    experience_min?: number;
    experience_max?: number;
}

export interface CreateJobResponse {
    id: string;
    job_title: string;
    company: string;
    status: string;
    posted_date: string;
    message: string;
}

export interface JobListQueryParams {
    page?: number;
    page_size?: number;
    search?: string;
    status?: JobStatus;
    source?: 'admin' | 'scraped';
    work_mode?: 'remote' | 'hybrid' | 'on-site';
    job_type?: 'full-time' | 'part-time' | 'internship' | 'contract';
    salary_min?: number;
    salary_max?: number;
    min_views?: number;
    min_applications?: number;
    minimum_views?: number;
    minimum_applications?: number;
    posted_from?: string; // ISO date
    posted_to?: string; // ISO date
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface JobListItem {
    id: string;
    job_title: string;
    company: string;
    location: string;
    work_mode: string;
    job_type: string;
    salary_min: number;
    salary_max: number;
    salary_currency: string;
    status: JobStatus;
    source: string;
    views_count: number;
    applications_count: number;
    posted_date: string;
    updated_at: string;
}

export interface JobListResponse {
    jobs: JobListItem[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
}

export interface JobDetailsResponse {
    id: string;
    job_title: string;
    company: string;
    location: string;
    work_mode: string;
    salary_min: number;
    salary_max: number;
    salary_currency: string;
    job_type: string;
    number_of_openings: number;
    job_description: string;
    about_company?: string;
    skills: string[];
    application_url?: string;
    application_deadline?: string;
    who_can_apply?: string;
    company_logo_url?: string;
    status: JobStatus;
    source: string;
    experience_min?: number;
    experience_max?: number;
    views_count: number;
    applications_count: number;
    posted_date: string;
    updated_at: string;
}

export interface UpdateJobRequest {
    job_title?: string;
    company?: string;
    location?: string;
    work_mode?: 'remote' | 'hybrid' | 'on-site';
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    job_type?: 'full-time' | 'part-time' | 'internship' | 'contract';
    number_of_openings?: number;
    job_description?: string;
    about_company?: string;
    skills?: string[];
    application_url?: string;
    application_deadline?: string;
    who_can_apply?: string;
    company_logo_url?: string;
    status?: JobStatus;
    experience_min?: number;
    experience_max?: number;
}

export interface UpdateJobResponse {
    id: string;
    message: string;
    updated_at: string;
}

export interface DeleteJobResponse {
    success: boolean;
    message: string;
    job_id: string;
}

export interface BulkUpdateStatusRequest {
    job_ids: string[];
    status: JobStatus;
}

export interface BulkUpdateStatusResponse {
    success: boolean;
    message: string;
    updated_count: number;
    job_ids: string[];
}

export interface BulkDeleteRequest {
    job_ids: string[];
    permanent?: boolean;
}

export interface BulkDeleteResponse {
    success: boolean;
    message: string;
    deleted_count: number;
    job_ids: string[];
}

export interface GetJobLogoResponse {
    success: boolean;
    job_id: string;
    logo_url: string | null;
    has_logo: boolean;
}

export interface RemoveJobLogoResponse {
    success: boolean;
    message: string;
    job_id: string;
}

export interface JobStatisticsResponse {
    total_jobs: number;
    active_jobs: number;
    draft_jobs: number;
    expired_jobs: number;
    closed_jobs: number;
    total_views: number;
    total_applications: number;
    avg_applications_per_job: number;
    jobs_by_type: {
        'full-time': number;
        'part-time': number;
        internship: number;
        contract?: number;
    };
    jobs_by_work_mode: {
        remote: number;
        hybrid: number;
        'on-site': number;
    };
    recent_jobs?: Array<{
        id: string;
        job_title: string;
        company: string;
        posted_date: string;
    }>;
}

export interface ExportJobsQueryParams {
    search?: string;
    status?: JobStatus;
    work_mode?: 'remote' | 'hybrid' | 'on-site';
    job_type?: 'full-time' | 'part-time' | 'internship' | 'contract';
}

// ==================== ADMIN JOBS API FUNCTIONS ====================

/**
 * Create a new job posting
 * 
 * Required fields:
 * - job_title
 * - company
 * - location
 * - work_mode
 * - salary_min, salary_max
 * - job_type
 * - job_description
 * 
 * Optional fields:
 * - about_company
 * - skills
 * - application_url
 * - application_deadline
 * - company_logo_url
 * - experience_min, experience_max
 */
export const createJob = async (
    data: CreateJobRequest
): Promise<CreateJobResponse> => {
    try {
        const response = await httpClient.post<CreateJobResponse>(
            '/admin/jobs/',
            data as unknown as Record<string, unknown>,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error('Error creating job:', error);
        throw error;
    }
};

/**
 * Get list of jobs with filtering, pagination, and sorting
 * 
 * Filters available:
 * - Search by title, company, location
 * - Status (active/draft/expired/closed)
 * - Source (admin/scraped)
 * - Work mode (remote/hybrid/on-site)
 * - Job type (full-time/part-time/internship/contract)
 * - salary_min, salary_max
 * - Minimum views/applications
 * - Posted date range
 * 
 * Sorting:
 * - Sort by any field (posted_date, views_count, etc.)
 * - Ascending or descending order
 */
export const getJobList = async (
    params?: JobListQueryParams
): Promise<JobListResponse> => {
    try {
        const queryParams = new URLSearchParams();

        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.source) queryParams.append('source', params.source);
        if (params?.work_mode) queryParams.append('work_mode', params.work_mode);
        if (params?.job_type) queryParams.append('job_type', params.job_type);
        if (params?.salary_min) queryParams.append('salary_min', params.salary_min.toString());
        if (params?.salary_max) queryParams.append('salary_max', params.salary_max.toString());
        // Support both field names for backwards compatibility
        if (params?.minimum_views) queryParams.append('minimum_views', params.minimum_views.toString());
        else if (params?.min_views) queryParams.append('minimum_views', params.min_views.toString());
        if (params?.minimum_applications) queryParams.append('minimum_applications', params.minimum_applications.toString());
        else if (params?.min_applications) queryParams.append('minimum_applications', params.min_applications.toString());
        if (params?.posted_from) queryParams.append('posted_from', params.posted_from);
        if (params?.posted_to) queryParams.append('posted_to', params.posted_to);
        if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

        const url = `/admin/jobs/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.get<JobListResponse>(url);
        return response.data;
    } catch (error) {
        logger.error('Error fetching job list:', error);
        throw error;
    }
};

/**
 * Get detailed information about a specific job
 * 
 * Returns complete job details including:
 * - All job fields
 * - View count
 * - Applications count
 * - Posted and updated dates
 */
export const getJobDetails = async (
    jobId: string
): Promise<JobDetailsResponse> => {
    try {
        const response = await httpClient.get<JobDetailsResponse>(
            `/admin/jobs/${jobId}`
        );
        return response.data;
    } catch (error) {
        logger.error(`Error fetching job details for ${jobId}:`, error);
        throw error;
    }
};

/**
 * Update an existing job posting
 * 
 * All fields are optional - only provided fields will be updated
 * 
 * Updatable fields:
 * - Job details (title, description, company info)
 * - Salary range
 * - Location and work mode
 * - Skills and requirements
 * - Application deadline
 * - Status (draft/active/closed/expired)
 */
export const updateJob = async (
    jobId: string,
    data: UpdateJobRequest
): Promise<UpdateJobResponse> => {
    try {
        const response = await httpClient.put<UpdateJobResponse>(
            `/admin/jobs/${jobId}`,
            data as unknown as Record<string, unknown>,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error updating job ${jobId}:`, error);
        throw error;
    }
};

/**
 * Delete a job posting
 * 
 * Permanently removes the job from the system
 * ⚠️ This action cannot be undone
 */
export const deleteJob = async (
    jobId: string
): Promise<DeleteJobResponse> => {
    try {
        const response = await httpClient.delete<DeleteJobResponse>(
            `/admin/jobs/${jobId}`
        );
        return response.data;
    } catch (error) {
        logger.error(`Error deleting job ${jobId}:`, error);
        throw error;
    }
};


/**
 * Bulk update job status
 * 
 * Update multiple jobs' status at once
 * 
 * Supported statuses:
 * - draft: Not yet published
 * - active: Currently accepting applications
 * - closed: No longer accepting applications
 * - expired: Application deadline passed
 */
export const bulkUpdateJobStatus = async (
    data: BulkUpdateStatusRequest
): Promise<BulkUpdateStatusResponse> => {
    try {
        const response = await httpClient.post<BulkUpdateStatusResponse>(
            '/admin/jobs/bulk/update-status',
            data as unknown as Record<string, unknown>,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error('Error bulk updating job status:', error);
        throw error;
    }
};

/**
 * Bulk delete jobs
 * 
 * Delete multiple jobs at once
 * 
 * Options:
 * - permanent: If true, jobs are permanently deleted
 * - permanent: If false, jobs are soft-deleted (can be recovered)
 * 
 * ⚠️ Permanent deletion cannot be undone
 */
export const bulkDeleteJobs = async (
    data: BulkDeleteRequest
): Promise<BulkDeleteResponse> => {
    try {
        const response = await httpClient.post<BulkDeleteResponse>(
            '/admin/jobs/bulk/delete',
            data as unknown as Record<string, unknown>,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error('Error bulk deleting jobs:', error);
        throw error;
    }
};

/**
 * Get job statistics overview
 * 
 * Returns comprehensive statistics including:
 * - Total jobs by status
 * - Total views and applications
 * - Average applications per job
 * - Jobs by type (full-time, part-time, etc.)
 * - Jobs by work mode (remote, hybrid, on-site)
 * - Recent job postings
 */
export const getJobStatistics = async (): Promise<JobStatisticsResponse> => {
    try {
        const response = await httpClient.get<JobStatisticsResponse>(
            '/admin/jobs/statistics/overview'
        );
        return response.data;
    } catch (error) {
        logger.error('Error fetching job statistics:', error);
        throw error;
    }
};

/**
 * Export jobs to CSV format
 * 
 * Downloads a CSV file with all jobs matching the provided filters
 * 
 * Available filters:
 * - search: Search by title, company, location
 * - status: Filter by job status
 * - work_mode: Filter by work mode
 * - job_type: Filter by job type
 * 
 * Returns: Blob (CSV file)
 */
export const exportJobsToCSV = async (
    params?: ExportJobsQueryParams
): Promise<Blob> => {
    try {
        const queryParams = new URLSearchParams();

        if (params?.search) queryParams.append('search', params.search);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.work_mode) queryParams.append('work_mode', params.work_mode);
        if (params?.job_type) queryParams.append('job_type', params.job_type);

        const url = `/admin/jobs/export/csv${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.get(url, {
            responseType: 'blob',
        });

        return response.data as Blob;
    } catch (error) {
        logger.error('Error exporting jobs to CSV:', error);
        throw error;
    }
};

/**
 * Helper function to download CSV file
 */
export const downloadJobsCSV = async (
    params?: ExportJobsQueryParams,
    filename: string = 'jobs_export.csv'
): Promise<void> => {
    try {
        const blob = await exportJobsToCSV(params);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        logger.error('Error downloading CSV:', error);
        throw error;
    }
};

/**
 * Upload company logo
 * 
 * Uploads a logo file and returns the URL to use in job creation/update
 * 
 * @param file - The logo file to upload (image file)
 * @returns Promise with the uploaded logo URL
 * 
 * Example usage:
 * ```typescript
 * const logoUrl = await uploadJobLogo(selectedFile);
 * // Use logoUrl in createJob or updateJob
 * await createJob({
 *   ...jobData,
 *   company_logo_url: logoUrl
 * });
 * ```
 */
export const uploadJobLogo = async (file: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await httpClient.post<{ logo_url: string }>(
            '/admin/jobs/logo/upload',
            formData as unknown as Record<string, unknown>,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data.logo_url;
    } catch (error) {
        logger.error('Error uploading job logo:', error);
        throw error;
    }
};

/**
 * Get job logo
 *
 * Retrieves the logo URL and status for a specific job
 *
 * @param jobId - The ID of the job
 * @returns Promise with logo URL and has_logo boolean
 */
export const getJobLogo = async (jobId: string): Promise<GetJobLogoResponse> => {
    try {
        const response = await httpClient.get<GetJobLogoResponse>(
            `/admin/jobs/${jobId}/logo`
        );
        return response.data;
    } catch (error) {
        logger.error(`Error fetching logo for job ${jobId}:`, error);
        throw error;
    }
};

/**
 * Remove job logo
 *
 * Delete/remove the company logo from a job posting.
 * Sets company_logo_url to null for the specified job.
 *
 * Use case:
 * - Remove incorrect logo
 * - Clear logo before re-uploading
 *
 * @param jobId - The ID of the job
 * @returns Promise with success message
 */
export const removeJobLogo = async (jobId: string): Promise<RemoveJobLogoResponse> => {
    try {
        const response = await httpClient.delete<RemoveJobLogoResponse>(
            `/admin/jobs/${jobId}/logo`
        );
        return response.data;
    } catch (error) {
        logger.error(`Error removing logo for job ${jobId}:`, error);
        throw error;
    }
};

/**
 * Publish a draft job (change status to active)
 */
export const publishJob = async (jobId: string): Promise<UpdateJobResponse> => {
    return updateJob(jobId, { status: 'active' });
};

/**
 * Close a job (stop accepting applications)
 *
 * Changes job status from active/draft to 'closed'
 *
 * Use cases:
 * - Position has been filled
 * - Hiring is complete
 * - Need to stop accepting applications
 *
 * @param jobId - The ID of the job to close
 * @returns Promise with update response including updated_at timestamp
 */
export const closeJob = async (jobId: string): Promise<UpdateJobResponse> => {
    try {
        const response = await httpClient.put<UpdateJobResponse>(
            `/admin/jobs/${jobId}/close`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        logger.error(`Error closing job ${jobId}:`, error);
        throw error;
    }
};

/**
 * Reopen a closed job
 */
export const reopenJob = async (jobId: string): Promise<UpdateJobResponse> => {
    return updateJob(jobId, { status: 'active' });
};

/**
 * Get job applications count
 */
export const getJobApplicationsCount = async (
    jobId: string
): Promise<{ job_id: string; applications_count: number }> => {
    try {
        const job = await getJobDetails(jobId);
        return {
            job_id: jobId,
            applications_count: job.applications_count,
        };
    } catch (error) {
        logger.error(`Error fetching applications count for job ${jobId}:`, error);
        throw error;
    }
};

/**
 * Get job views count
 */
export const getJobViewsCount = async (
    jobId: string
): Promise<{ job_id: string; views_count: number }> => {
    try {
        const job = await getJobDetails(jobId);
        return {
            job_id: jobId,
            views_count: job.views_count,
        };
    } catch (error) {
        logger.error(`Error fetching views count for job ${jobId}:`, error);
        throw error;
    }
};
