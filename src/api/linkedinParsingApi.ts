import httpClient from "@/lib/http";
import logger from "@/lib/logger";

// ========== PERSONAL INFO ==========
export interface personalInfo {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedinurl: string;
    portifoliourl: string;
}

// ========== EDUCATION ==========
export interface EducationItem {
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
}

// ========== EXPERIENCE ==========
export interface ExperienceItem {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
    location: string;
}

// Response type
export interface LinkedinImportResponse {
    personal_info: personalInfo,
    summary: string,
    will_add: {
        education: [],
        experience: ExperienceItem[],
        skills: [],
        certifications: [],
    }
    will_skip: {
        education: EducationItem[],
        experience: [],
        skills: string[],
        certifications: [],
    }
}

// Request type
export interface LinkedinImportRequest {
    linkedin_url: string;
    merge_strategy: "merge" | "replace";
}
export const importLinkedInProfile = async (body: LinkedinImportRequest): Promise<LinkedinImportResponse> => {
    try {
        const response = await httpClient.post("/profile/import/linkedin/preview", body);
        return response.data as LinkedinImportResponse;
    } catch (error) {
        logger.error("Error extracting linkedin:", error);
        throw error;
    }
};
