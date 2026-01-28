import httpClient from "@/lib/http";
import logger from "@/lib/logger";

// ========== CONTACT ==========
export interface ContactInfo {
    name: string;
    email: string;
    phone: string;
    location: string;
}

// ========== EDUCATION ==========
export interface EducationItem {
    branch: string | null;
    college: string;
    degree: string;
    duration: string;
    grade: string;
    passed_out: number;
}

// ========== EXPERIENCE (empty array in your sample) ==========
export interface ExperienceItem {
    client?: string | null;
    company?: string | null;
    duration?: string | null;
    key_contributions?: string[];
    location?: string | null;
    role?: string | null;
    years?: number | null;
}

// ========== INTERNSHIPS (inside llm_data now!) ==========
export interface InternshipItem {
    company: string;
    duration: string;
    key_contributions: string[];
    role: string;
}

// ========== PROJECTS ==========
export interface ProjectItem {
    client: string | null;
    key_contributions: string[];
    title: string;
}

// ========== OVERALL EXPERIENCE ==========
export interface OverallExperience {
    months: number | null;
    total_experience: number | null;
    years: number | null;
}

// ========== LLM DATA ==========
export interface LLMData {
    education: EducationItem[];
    experience: ExperienceItem[];
    internships: InternshipItem[];
    overall_experience: OverallExperience;
    projects: ProjectItem[];
    soft_skills: string[];
}

// ========== TECH SKILLS ==========
export interface TechnicalSkill {
    skill: string;
    count: number;
}

// ========== SOCIAL LINKS ==========
export interface SocialLinks {
    linkedIn?: string;
    github?: string;
}

// ========== FORMATTING ==========
export interface FormattingInfo {
    FormatScore: number;
    FormatMax: number;
    FormatIssues: string[];
}

// ========== LENGTH SCORE ==========
export interface LengthScore {
    file: string;
    score: number;
    max_score: number;
    details: {
        word_count: number;
        optimal_range: string;
        page_count: number;
        years_of_experience_estimated: number;
        recommended_pages: number[];
        page_score: number;
        word_score: number;
    };
}

// ========== STRUCTURE SCORE ==========
export interface StructureScore {
    score: number;
    max_score: number;
    percentage: number;
    details: {
        sections_found: string[];
        sections_missing: string[];
        section_order: string;
        date_format: string;
    };
}

// ========== MAIN API RESPONSE ==========
export interface ResumeExtractResponse {
    message: string;
    resume_id: string;
    file_name: string;
    parsing_method: string;
    cache_hit: boolean;

    parsed_data: {
        achievements: string[];
        certifications: string[];
        llm_data: LLMData;
        technical_skills: TechnicalSkill[];
        summary: string;
        contact: ContactInfo;
        social_links: SocialLinks;
        formatting: FormattingInfo;
        length_score: LengthScore;
        structure_score: StructureScore;
    };
}


/**
 * Extract resume data from PDF/DOCX file
 * @param file - The resume file (PDF or DOCX)
 * @returns Parsed resume data
 */
export const extractResume = async (file: File): Promise<ResumeExtractResponse> => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await httpClient.post<ResumeExtractResponse>(
            "/parser/parse_resume/",
            formData as unknown as Record<string, unknown>,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        return response.data;
    } catch (error) {
        logger.error("Error extracting resume:", error);
        throw error;
    }
};
