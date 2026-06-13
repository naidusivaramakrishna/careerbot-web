import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';
// ==================== INTERFACES ====================

export interface Education {
    id?: string;
    institution: string;
    degree: string;
    stream: string;
    cgpa?: number;
    start_date: string;
    end_date?: string;
}
export interface Projects {
    id?: string;
    project_name?: string;
    role?: string;
    technologies?: string;
    start_date: string;
    end_date?: string;
    description?: string;
    project_link?: string;
}
export interface Experience {
    id?: string;
    job_title: string;
    company: string;
    job_type: string;
    location: string;
    start_date: string;
    end_date?: string;
    description?: string
}

export interface Skill {
    id?: string;
    name: string;
}
export interface Certification {
    id?: string;
    certification_name: string
    issuer: string
    start_date: string;
    end_date?: string;
    credential_id: string
}

export interface EmploymentInfo {
    id?: string;
    authorized_to_work?: boolean;
    disability_status?: string;
    gender?: string;
    willing_to_relocate?: boolean;
    employment_status?: string;
    work_mode?: string;
    preferred_job_type?: string;
    notice_period_days?: number | string;
    preferred_industries?: string[];
    preferred_roles?: string[];
    preferred_locations?: string[];
}


export interface UserProfile {
    id?: string;
    username?: string;
    full_name?: string;
    headline?: string;
    email?: string;
    phone_number?: string;
    location?: string;
    summary?: string;
    is_verified?: boolean
    status?: string,
    role?: string,
    linkedin_url?: string;
    github_url?: string;
    skills?: string[];
    education?: Education[];
    experience?: string[];
    certifications?: string[];
    career_insights?: string[];
    employment_info?: [];
    created_at?: string;
    last_login?: string;
}

export interface ProfilePictureResponse {
    message?: string;
    picture_url: string;
    filename?: string;
    source?: "google" | "linkedin" | "uploaded";
}

export interface ResumeUploadResponse {
    message: string;
    resume_url: string;
    filename: string;
}

export interface ResumeResponse {
    resume_url: string;
    resume_id?: string;
    id?: string;
    filename?: string;
}

export interface ResumeDeleteResponse {
    message: string;
}

export interface ApiResponse<T> {
    data?: T;
    message?: string;
    status?: number;
}

// Auto-fill request types (all fields optional)
export interface EducationAutoFillRequest {
    degree?: string;
    institution?: string;
    stream?: string;
    cgpa?: number;
    start_date?: string;
    end_date?: string;
}

export interface ExperienceAutoFillRequest {
    job_title?: string;
    company?: string;
    job_type?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
}

export interface SkillAutoFillRequest {
    name?: string;
}

export interface CertificationAutoFillRequest {
    certification_name?: string;
    issuer?: string;
    start_date?: string;
    end_date?: string;
    credential_id?: string;
}

export interface ProjectAutoFillRequest {
    project_name?: string;
    role?: string;
    technologies?: string;
    start_date?: string;
    end_date?: string;
    project_link?: string;
    description?: string;
}

// ==================== PROFILE API FUNCTIONS ====================

/**
 * Get user profile
 */

export const getProfile = async (options?: { skipAuthRedirect?: boolean }): Promise<UserProfile> => {
    try {
        // ✅ httpOnly cookies sent automatically by httpClient with withCredentials
        const response = await httpClient.get<ApiResponse<UserProfile>>(
            '/profile/',
            options?.skipAuthRedirect ? { headers: { 'X-Skip-Login-Redirect': 'true' } } : undefined
        );

        let profileData: UserProfile;

        if (response.data?.data) {
            profileData = response.data.data;
        } else if (response.data && typeof response.data === 'object') {
            // Flat response
            profileData = response.data as unknown as UserProfile;
        } else {
            throw new Error('Invalid profile response structure');
        }

        // Validate required fields
        if (!profileData.id && !profileData.email && !profileData.username) {
            throw new Error('Profile missing identity fields');
        }

        return profileData;
    } catch (error) {
        logger.error('Error fetching profile:', error);
        throw error;
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
        const response = await httpClient.put<ApiResponse<UserProfile>>(
            '/profile/update',
            profileData
        );
        return response.data.data || response.data as unknown as UserProfile;
    } catch (error) {
        logger.error('Error updating profile:', error);
        throw error;
    }
};

// ==================== EDUCATION API FUNCTIONS ====================

/**
 * Get all education entries
 */
export const getEducation = async (): Promise<Education[]> => {
    try {
        const response = await httpClient.get<ApiResponse<Education[]>>('/profile/education');

        // Handle different response structures
        if (response.data.data) {
            return response.data.data || [];
        }

        // If response.data itself is an array
        if (Array.isArray(response.data)) {
            return response.data;
        }

        return [];
    } catch (error) {
        logger.error('Error fetching education:', error);
        throw error;
    }
};

/**
 * Add new education entry
 */
export const addEducation = async (educationData: Omit<Education, 'id'>): Promise<Education> => {
    try {
        const response = await httpClient.post<ApiResponse<Education>>(
            '/profile/education',
            educationData
        );
        return response.data.data || response.data as unknown as Education;
    } catch (error) {
        logger.error('Error adding education:', error);
        throw error;
    }
};

/**
 * Update education entry by ID
 */
export const updateEducation = async (
    educationId: string,
    educationData: Partial<Education>
): Promise<Education> => {
    try {
        const response = await httpClient.put<ApiResponse<Education>>(
            `/profile/education/${educationId}`,
            educationData
        );
        return response.data.data || response.data as unknown as Education;
    } catch (error) {
        logger.error('Error updating education:', error);
        throw error;
    }
};

/**
 * Delete education entry by ID
 */
export const deleteEducation = async (educationId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/education/${educationId}`);
    } catch (error) {
        logger.error('Error deleting education:', error);
        throw error;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date for display (optional helper)
 */
export const formatEducationDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });
};

// ==================== EXPERIENCE API FUNCTIONS ====================

/**
 * Get all experience entries
 */
export const getExperience = async (): Promise<Experience[]> => {
    try {
        const response = await httpClient.get<ApiResponse<Experience[]>>('/profile/experience');

        // Handle different response structures
        if (response.data.data) {
            return response.data.data || [];
        }

        // If response.data itself is an array
        if (Array.isArray(response.data)) {
            return response.data;
        }

        return [];
    } catch (error) {
        logger.error('Error fetching experience:', error);
        throw error;
    }
};

/**
 * Add new experience entry
 */
export const addExperience = async (experienceData: Omit<Experience, 'id'>): Promise<Experience> => {
    try {
        const response = await httpClient.post<ApiResponse<Experience>>(
            '/profile/experience',
            experienceData
        );
        return response.data.data || response.data as unknown as Experience;
    } catch (error) {
        logger.error('Error adding experience:', error);
        throw error;
    }
};

/**
 * Update experience entry by ID
 */
export const updateExperience = async (
    experienceId: string,
    experienceData: Partial<Experience>
): Promise<Experience> => {
    try {
        const response = await httpClient.put<ApiResponse<Experience>>(
            `/profile/experience/${experienceId}`,
            experienceData
        );
        return response.data.data || response.data as unknown as Experience;
    } catch (error) {
        logger.error('Error updating education:', error);
        throw error;
    }
};

/**
 * Delete experience entry by ID
 */
export const deleteExperience = async (experienceId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/experience/${experienceId}`);
    } catch (error) {
        logger.error('Error deleting education:', error);
        throw error;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date for display (optional helper)
 */
export const formatExperienceIdDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });
};

// ==================== PROJECTS API FUNCTIONS ====================

/**
 * Get all projects entries
 */
export const getProjects = async (): Promise<Projects[]> => {
    try {
        const response = await httpClient.get<ApiResponse<Projects[]>>('/profile/projects');

        // Handle different response structures
        if (response.data.data) {
            return response.data.data || [];
        }

        // If response.data itself is an array
        if (Array.isArray(response.data)) {
            return response.data;
        }

        return [];
    } catch (error) {
        logger.error('Error fetching projects:', error);
        throw error;
    }
};

/**
 * Add new projects entry
 */
export const addProject = async (projectsData: Omit<Projects, 'id'>): Promise<Projects> => {
    try {
        const response = await httpClient.post<ApiResponse<Projects>>(
            '/profile/projects',
            projectsData
        );
        return response.data.data || response.data as unknown as Projects;
    } catch (error) {
        logger.error('Error adding projects:', error);
        throw error;
    }
};

/**
 * Update projects entry by ID
 */
export const updateProjects = async (
    projectId: string,
    projectsData: Partial<Projects>
): Promise<Projects> => {
    try {
        const response = await httpClient.put<ApiResponse<Projects>>(
            `/profile/projects/${projectId}`,
            projectsData
        );
        return response.data.data || response.data as unknown as Projects;
    } catch (error) {
        logger.error('Error updating project:', error);
        throw error;
    }
};

/**
 * Delete project entry by ID
 */
export const deleteProject = async (projectId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/projects/${projectId}`);
    } catch (error) {
        logger.error('Error deleting project:', error);
        throw error;
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format date for display (optional helper)
 */
export const formatProjectIdDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });
};

// ==================== SKILLS API FUNCTIONS ====================

/**
 * Get all skills
 */

export const getSkills = async (): Promise<Skill[]> => {
    try {
        const response = await httpClient.get<ApiResponse<Skill[]>>('/profile/skills');

        // Handle different response structures
        if (response.data.data) {
            return response.data.data || [];
        }

        // If response.data itself is an array
        if (Array.isArray(response.data)) {
            return response.data;
        }

        return [];
    } catch (error) {
        logger.error('Error fetching skills:', error);
        throw error;
    }
};

/**
 * Add new skill
 */
export const addSkill = async (skillName: string): Promise<Skill> => {
    try {
        const response = await httpClient.post<ApiResponse<Skill>>(
            '/profile/skills',
            { name: skillName }
        );
        return response.data.data || response.data as unknown as Skill;
    } catch (error) {
        logger.error('Error adding skill:', error);
        throw error;
    }
};

/**
 * Update skill by ID
 */
export const updateSkill = async (
    skillId: string,
    skillName: string
): Promise<Skill> => {
    try {
        const response = await httpClient.put<ApiResponse<Skill>>(
            `/profile/skills/${skillId}`,
            { name: skillName }
        );
        return response.data.data || response.data as unknown as Skill;
    } catch (error) {
        logger.error('Error updating skill:', error);
        throw error;
    }
};

/**
 * Delete skill by ID
 */
export const deleteSkill = async (skillId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/skills/${skillId}`);
    } catch (error) {
        logger.error('Error deleting skill:', error);
        throw error;
    }
};

// ==================== CERTIFICATION API FUNCTIONS ====================

/**
 * Get all certification entries
 */
export const getCertification = async (): Promise<Certification[]> => {
    try {
        const response = await httpClient.get<ApiResponse<Certification[]>>('/profile/certifications');

        // Handle different response structures
        if (response.data.data) {
            return response.data.data || [];
        }

        // If response.data itself is an array
        if (Array.isArray(response.data)) {
            return response.data;
        }

        return [];
    } catch (error) {
        logger.error('Error fetching certifications:', error);
        throw error;
    }
};

/**
 * Add new certification entry
 */
export const addCertification = async (certificationData: Omit<Certification, 'id'>): Promise<Certification> => {
    try {
        const response = await httpClient.post<ApiResponse<Certification>>(
            '/profile/certifications',
            certificationData
        );
        return response.data.data || response.data as unknown as Certification;
    } catch (error) {
        logger.error('Error adding certification:', error);
        throw error;
    }
};

/**
 * Update certification entry by ID
 */
export const updateCertification = async (
    certificationId: string,
    certificationData: Partial<Certification>
): Promise<Certification> => {
    try {
        const response = await httpClient.put<ApiResponse<Certification>>(
            `/profile/certifications/${certificationId}`,
            certificationData
        );
        return response.data.data || response.data as unknown as Certification;
    } catch (error) {
        logger.error('Error updating certification:', error);
        throw error;
    }
};

/**
 * Delete certification entry by ID
 */
export const deleteCertification = async (certificationId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/certifications/${certificationId}`);
    } catch (error) {
        logger.error('Error deleting certification:', error);
        throw error;
    }
};

// ==================== EMPLOYMENT INFO API FUNCTIONS ====================

/**
 * Get employment information
 */
export const getEmploymentInfo = async (): Promise<EmploymentInfo> => {
    try {
        const response = await httpClient.get<ApiResponse<EmploymentInfo>>('/profile/employment-info');
        return response.data.data || response.data as unknown as EmploymentInfo;
    } catch (error) {
        logger.error('Error fetching employment info:', error);
        throw error;
    }
};

/**
 * Update employment information
 */
export const updateEmploymentInfo = async (employmentData: Partial<EmploymentInfo>): Promise<EmploymentInfo> => {
    try {
        const response = await httpClient.put<ApiResponse<EmploymentInfo>>(
            '/profile/employment-info',
            employmentData
        );
        return response.data.data || response.data as unknown as EmploymentInfo;
    } catch (error) {
        logger.error('Error updating employment info:', error);
        throw error;
    }
};


/**
 * Upload or update user profile picture
 */
export const uploadProfilePicture = async (file: File): Promise<ProfilePictureResponse> => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await httpClient.post<ProfilePictureResponse>(
            "/profile/picture/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        return response.data;
    } catch (error) {
        logger.error("Error uploading profile picture:", error);
        throw error;
    }
};

/**
 * Get current user's profile picture
 */
export const getProfilePicture = async (
    options?: { skipAuthRedirect?: boolean }
): Promise<ProfilePictureResponse> => {
    try {
        const response = await httpClient.get<ProfilePictureResponse>(
            "/profile/picture",
            options?.skipAuthRedirect ? { headers: { 'X-Skip-Login-Redirect': 'true' } } : undefined
        );
        return response.data;
    } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status !== 404) {
            logger.error("Error fetching profile picture:", error);
        }
        throw error;
    }
};

/**
 * Delete current user's profile picture
 */
export const deleteProfilePicture = async (): Promise<{ message: string }> => {
    try {
        const response = await httpClient.delete<{ message: string }>("/profile/picture");
        return response.data;
    } catch (error) {
        logger.error("Error deleting profile picture:", error);
        throw error;
    }
};

// ==================== AUTO-FILL API FUNCTIONS ====================

/**
 * Add education from auto-fill (resume/LinkedIn import)
 * All fields are optional
 */
export const addEducationAutoFill = async (educationData: EducationAutoFillRequest): Promise<Education> => {
    try {
        const response = await httpClient.post<ApiResponse<Education>>(
            '/profile/education/auto-fill',
            educationData        );
        return response.data.data || response.data as unknown as Education;
    } catch (error) {
        logger.error('Error adding education via auto-fill:', error);
        throw error;
    }
};

/**
 * Add experience from auto-fill (resume/LinkedIn import)
 * All fields are optional
 */
export const addExperienceAutoFill = async (experienceData: ExperienceAutoFillRequest): Promise<Experience> => {
    try {
        const response = await httpClient.post<ApiResponse<Experience>>(
            '/profile/experience/auto-fill',
            experienceData        );
        return response.data.data || response.data as unknown as Experience;
    } catch (error) {
        logger.error('Error adding experience via auto-fill:', error);
        throw error;
    }
};

/**
 * Add skill from auto-fill (resume/LinkedIn import)
 * All fields are optional
 */
export const addSkillAutoFill = async (skillData: SkillAutoFillRequest): Promise<Skill> => {
    try {
        const response = await httpClient.post<ApiResponse<Skill>>(
            '/profile/skills/auto-fill',
            skillData        );
        return response.data.data || response.data as unknown as Skill;
    } catch (error) {
        logger.error('Error adding skill via auto-fill:', error);
        throw error;
    }
};

/**
 * Add certification from auto-fill (resume/LinkedIn import)
 * All fields are optional
 */
export const addCertificationAutoFill = async (certificationData: CertificationAutoFillRequest): Promise<Certification> => {
    try {
        const response = await httpClient.post<ApiResponse<Certification>>(
            '/profile/certifications/auto-fill',
            certificationData        );
        return response.data.data || response.data as unknown as Certification;
    } catch (error) {
        logger.error('Error adding certification via auto-fill:', error);
        throw error;
    }
};

/**
 * Add project from auto-fill (resume/LinkedIn import)
 * All fields are optional
 */
export const addProjectAutoFill = async (projectData: ProjectAutoFillRequest): Promise<Projects> => {
    try {
        const response = await httpClient.post<ApiResponse<Projects>>(
            '/profile/projects/auto-fill',
            projectData        );
        return response.data.data || response.data as unknown as Projects;
    } catch (error) {
        logger.error('Error adding project via auto-fill:', error);
        throw error;
    }
};

// ==================== RESUME API FUNCTIONS ====================

/**
 * Upload or replace user's resume (PDF, DOCX, or DOC)
 */
export const uploadResume = async (file: File): Promise<ResumeUploadResponse> => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await httpClient.post<ResumeUploadResponse>(
            "/profile/resume/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        return response.data;
    } catch (error) {
        logger.error("Error uploading resume:", error);
        throw error;
    }
};

/**
 * Get current user's resume URL
 */
export const getResume = async (): Promise<ResumeResponse> => {
    try {
        const response = await httpClient.get<ResumeResponse>("/profile/resume");
        return response.data;
    } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError?.response?.status !== 404) {
            logger.error("Error fetching resume:", error);
        }
        throw error;
    }
};

/**
 * Delete current user's resume
 */
export const deleteResume = async (): Promise<ResumeDeleteResponse> => {
    try {
        const response = await httpClient.delete<ResumeDeleteResponse>("/profile/resume");
        return response.data;
    } catch (error) {
        logger.error("Error deleting resume:", error);
        throw error;
    }
};
