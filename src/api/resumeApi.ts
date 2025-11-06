import { httpClient } from '@/lib/http';

export interface ResumeResponse {
  id: string;
  personalInfo?: {
    name?: string;
  };
  work_experience?: Array<{
    role?: string;
  }>;
  builder_score?: {
    score?: number;
  };
  updatedAt: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: number;
}

/**
 * Fetch all resumes for the authenticated user
 */
export const getAllResumes = async (): Promise<ResumeResponse[]> => {
  try {
    const response = await httpClient.get<ApiResponse<ResumeResponse[]>>('/resumes/');
    
    // response.data is the ApiResponse<ResumeResponse[]>
    if (response.data.data) {
      return response.data.data || [];
    }
    
    // If response.data itself is an array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching resumes:', error);
    throw error;
  }
};

/**
 * Get a single resume by ID
 */
export const getResumeById = async (resumeId: string): Promise<ResumeResponse> => {
  try {
    const response = await httpClient.get<ApiResponse<ResumeResponse>>(`/resumes/${resumeId}`);
    return (response.data.data || response.data) as ResumeResponse;
  } catch (error: any) {
    console.error('Error fetching resume:', error);
    throw error;
  }
};

/**
 * Delete a resume by ID
 */
export const deleteResume = async (resumeId: string): Promise<void> => {
  try {
    await httpClient.delete(`/resumes/${resumeId}`);
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    throw error;
  }
};

/**
 * Download resume in specified format
 */
export const downloadResume = async (
  resumeId: string, 
  format: 'pdf' | 'docx'
): Promise<Blob> => {
  try {
    const response = await httpClient.get<Blob>(`/resumes/${resumeId}/download`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  } catch (error: any) {
    console.error('Error downloading resume:', error);
    throw error;
  }
};

/**
 * Create a new resume
 */
export const createResume = async (resumeData: any): Promise<ResumeResponse> => {
  try {
    const response = await httpClient.post<ApiResponse<ResumeResponse>>('/resumes/', resumeData);
    return (response.data.data || response.data) as ResumeResponse;
  } catch (error: any) {
    console.error('Error creating resume:', error);
    throw error;
  }
};

/**
 * Update an existing resume
 */
export const updateResume = async (
  resumeId: string, 
  resumeData: any
): Promise<ResumeResponse> => {
  try {
    const response = await httpClient.put<ApiResponse<ResumeResponse>>(
      `/resumes/${resumeId}`, 
      resumeData
    );
    return (response.data.data || response.data) as ResumeResponse;
  } catch (error: any) {
    console.error('Error updating resume:', error);
    throw error;
  }
};