import { httpClient } from '@/lib/http';
// ==================== INTERFACES ====================

export interface Education {
    id?: string;
    institution: string;
    degree: string;
    stream: string;
    cgpa: string;
    start_date: string;
    end_date?: string;
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
    key_achievements?: string[]
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
    status: string,
    role: string,
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

export interface ApiResponse<T> {
    data?: T;
    message?: string;
    status?: number;
}

// ==================== PROFILE API FUNCTIONS ====================

/**
 * Get user profile
 */

export const getProfile = async (): Promise<UserProfile> => {
    try {
        const response = await httpClient.get<any>('/profile'); // Use any temporarily

        let profileData: UserProfile;

        if (response.data?.data) {
            profileData = response.data.data;
        } else if (response.data && typeof response.data === 'object') {
            // Flat response
            profileData = response.data as UserProfile;
        } else {
            throw new Error('Invalid profile response structure');
        }

        // Validate required fields
        if (!profileData.id && !profileData.email && !profileData.username) {
            throw new Error('Profile missing identity fields');
        }

        return profileData;
    } catch (error: any) {
        throw error;
    }
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
        const response = await httpClient.put<ApiResponse<UserProfile>>(
            'builder/profile/profile/update',
            profileData
        );
        return response.data.data || response.data as unknown as UserProfile;
    } catch (error: any) {
        console.error('Error updating profile:', error);
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
    } catch (error: any) {
        console.error('Error fetching education:', error);
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
    } catch (error: any) {
        console.error('Error adding education:', error);
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
    } catch (error: any) {
        console.error('Error updating education:', error);
        throw error;
    }
};

/**
 * Delete education entry by ID
 */
export const deleteEducation = async (educationId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/education/${educationId}`);
    } catch (error: any) {
        console.error('Error deleting education:', error);
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
    } catch (error: any) {
        console.error('Error fetching experience:', error);
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
    } catch (error: any) {
        console.error('Error adding experience:', error);
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
    } catch (error: any) {
        console.error('Error updating education:', error);
        throw error;
    }
};

/**
 * Delete experience entry by ID
 */
export const deleteExperience = async (experienceId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/experience/${experienceId}`);
    } catch (error: any) {
        console.error('Error deleting education:', error);
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
    } catch (error: any) {
        console.error('Error fetching skills:', error);
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
    } catch (error: any) {
        console.error('Error adding skill:', error);
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
    } catch (error: any) {
        console.error('Error updating skill:', error);
        throw error;
    }
};

/**
 * Delete skill by ID
 */
export const deleteSkill = async (skillId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/skills/${skillId}`);
    } catch (error: any) {
        console.error('Error deleting skill:', error);
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
    } catch (error: any) {
        console.error('Error fetching certifications:', error);
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
    } catch (error: any) {
        console.error('Error adding certification:', error);
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
    } catch (error: any) {
        console.error('Error updating certification:', error);
        throw error;
    }
};

/**
 * Delete certification entry by ID
 */
export const deleteCertification = async (certificationId: string): Promise<void> => {
    try {
        await httpClient.delete(`/profile/certifications/${certificationId}`);
    } catch (error: any) {
        console.error('Error deleting certification:', error);
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
    } catch (error: any) {
        console.error('Error fetching employment info:', error);
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
    } catch (error: any) {
        console.error('Error updating employment info:', error);
        throw error;
    }
};





