import httpClient from "@/lib/http";
import logger from "@/lib/logger";

// ========== CONTACT ==========
export interface ContactInfo {
    name: string;
    email: string;
    phone: string;
    location: string;
    link_warnings?: string[];
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
    technical_skills: TechnicalSkill[];
}

// ========== TECH SKILLS ==========
export interface TechnicalSkill {
    skill: string;
    category: string;
    count: number;
}

// ========== SOCIAL LINKS ==========
export interface SocialLinks {
    linkedin?: string;
    github?: string;
    hackerrank?: string | null;
    hackerearth?: string | null;
    codechef?: string | null;
    portfolio?: string[];
    leetcode?: string | null;
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

// ========== FORMAT ANALYSIS ==========
export interface FormatAnalysis {
    score: number;
    max_score: number;
    percentage: number;
    formatting: {
        issues: string[];
        details: {
            mixed_fonts: boolean;
            font_families_count: number;
            inconsistent_heading_sizes: boolean;
            heading_sizes_found: number[];
            body_font: string;
            is_multi_column: boolean;
            has_repeating_headers: boolean;
            has_excessive_decorations: boolean;
            line_count: number;
            rect_count: number;
            non_standard_headings: string[];
        };
    };
    structure: {
        details: {
            sections_found: string[];
            sections_missing: string[];
            section_order: string;
            section_order_deduction: number;
            date_format: string;
            repeated_sections: string[];
            has_duplicate_content: boolean;
            duplicate_lines_count: number;
            duplicate_lines: string[];
            has_symbols: boolean;
            symbol_count: number;
        };
    };
    length: {
        word_count: number;
        optimal_range: string;
        page_count: number;
        years_of_experience_estimated: number;
        recommended_pages: number[];
        file: string;
    };
}

// ========== MAIN API RESPONSE ==========
export interface ResumeExtractResponse {
    message: string;
    resume_id: string;
    file_name: string;
    parsing_method: string;
    cache_hit: boolean;
    correlation_id?: string;
    trace_id?: string;

    parsed_data: {
        image_warning?: boolean;
        image_message?: string | null;
        achievements: string[];
        awards?: string[];
        certifications: string[];
        languages?: string[];
        declaration?: string[];
        personal_details?: string[];
        strengths?: string[];
        hobbies_and_interests?: string[];
        volunteering?: string[];
        workshops?: string[];
        publications?: string[];
        references?: string[];
        llm_data: LLMData;
        summary: string | string[];
        contact: ContactInfo;
        social_links: SocialLinks;
        soft_skills?: string[];
        formatting?: FormattingInfo;
        format_analysis?: FormatAnalysis;
        length_score?: LengthScore;
        structure_score?: StructureScore;
        tokens_used?: {
            total: number;
            prompt: number;
            completion: number;
            cost_inr: number;
            cost_usd: number;
            time_stamp: string;
            section: string;
            user_id: string;
            correlation_id: string;
            trace_id: string;
            from_cache: boolean;
        };
        strategy_used?: string;
        user_id?: string;
        _ai_response_headers?: Record<string, string>;
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
