import httpClient from "@/lib/http";
import logger from "@/lib/logger";

// ========== CONTACT FIELD (can be string or nested object) ==========
export type ContactField = string | { value?: string; source?: string };

// ========== CONTACT ==========
export interface ContactInfo {
    name: ContactField;
    email: ContactField;
    phone: ContactField;
    location: ContactField;
    link_warnings?: string[];
}

// ========== EDUCATION ==========
export interface EducationItem {
    branch?: string | null;
    college?: string | null;
    degree?: string | null;
    // Old format: duration range string ("Aug 2019 - Jul 2023")
    duration?: string | null;
    // New v2 format: year of graduation
    passed_out?: string | number | null;
    grade?: string | null;
    grade_type?: string | null;
    grade_percentage?: number | null;
    confidence?: number;
    source?: string;
}

// ========== ACHIEVEMENT / RESPONSIBILITY ITEM ==========
export interface AchievementItem {
    text: string;
    tier?: string;
    tier_confidence?: number;
    semantic?: { tone?: string; claim_type?: string; star_pattern?: string };
    subject_attribution?: string;
}

// ========== EXPERIENCE ==========
export interface ExperienceItem {
    client?: string | null;
    company?: string | null;
    // Old format: "Aug 2019 - Jul 2023"
    duration?: string | null;
    // New v2 format: direct date strings ("Aug 25")
    start_date?: string | null;
    end_date?: string | null;
    key_contributions?: string[];
    location?: string | null;
    role?: string | null;
    years?: number | null;
    achievements?: AchievementItem[];
    responsibilities?: AchievementItem[];
    tech_stack?: string[];
}

// ========== INTERNSHIPS ==========
export interface InternshipItem {
    company: string;
    // Old format: duration range string
    duration?: string | null;
    // New v2 format: direct date strings ("Aug 2025")
    start_date?: string | null;
    end_date?: string | null;
    key_contributions?: string[];
    location?: string | null;
    role: string;
    years?: number | null;
    months?: number | null;
    achievements?: AchievementItem[];
    responsibilities?: AchievementItem[];
    tech_stack?: string[];
}

// ========== PROJECTS ==========
export interface ProjectItem {
    client?: string | null;
    key_contributions?: string[];
    title?: string;
    achievements?: AchievementItem[];
    responsibilities?: AchievementItem[];
    tech_stack?: string[];
    duration?: string | null;
    domain?: string | null;
    source?: string;
}

// ========== OVERALL EXPERIENCE ==========
export interface OverallExperience {
    months: number | null;
    total_experience: number | null;
    years: number | null;
    is_fresher?: boolean;
}

// ========== CERTIFICATION ==========
export type CertificationItem = string | {
    full_name?: string;
    issuing_organization?: string;
    year?: string | null;
    code?: string | null;
    domain?: string;
    confidence?: number;
};

// ========== LLM DATA (old v1 format wrapper — optional in v2) ==========
export interface LLMData {
    education?: EducationItem[];
    experience?: ExperienceItem[];
    internships?: InternshipItem[];
    overall_experience?: OverallExperience;
    projects?: ProjectItem[];
    soft_skills?: string[];
    technical_skills?: TechnicalSkillItem[];
}

// ========== TECH SKILL ==========
export type TechnicalSkillItem = string | {
    skill: string;
    normalized_name?: string;
    category?: string;
    source_heading?: string;
    category_source?: string;
    count?: number;
    usage_count?: number;
    strength?: string;
    proficiency?: string;
    importance?: string;
    final_score?: number;
    years_of_experience?: number;
    last_used_year?: number | null;
    roles_count?: number;
    in_summary?: boolean;
    recency?: number;
    evidence?: Array<{
        text: string;
        section: string;
        company?: string;
        year?: number | null;
        source?: string;
    }>;
    sections_found_in?: string[];
    validation_flag?: string | null;
    validation_flag_detail?: string;
    tech_stack?: { experience: number; projects: number; internships: number };
};

// ========== SOCIAL LINK ==========
export type SocialLinkField = string | { url?: string | null; valid?: boolean };

// ========== SOCIAL LINKS ==========
export interface SocialLinks {
    linkedin?: SocialLinkField;
    github?: SocialLinkField;
    hackerrank?: SocialLinkField;
    hackerearth?: SocialLinkField;
    codechef?: SocialLinkField;
    portfolio?: SocialLinkField | string[] | null;
    leetcode?: SocialLinkField;
}

// ========== PARSE WARNING ==========
export interface ParseWarning {
    code: string;
    severity: string;
    message: string;
    field?: string | null;
    dropped_count?: number;
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
            file_size_bytes?: number;
            is_file_oversize?: boolean;
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
            has_narrow_margins?: boolean;
            min_margin_inches?: number;
            has_likely_photo?: boolean;
            photo_count?: number;
            paste_test_passes?: boolean;
            paste_test_similarity?: number | null;
            non_standard_headings: string[];
            has_resume_title_header?: boolean;
            pii_anti_patterns_found?: string[];
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
            symbol_note?: string;
        };
    };
    length: {
        word_count: number;
        optimal_range: string;
        page_count: number;
        years_of_experience_estimated: number;
        recommended_pages: number[];
        file?: string;
    };
}

// ========== ROUTING FLAGS ==========
export interface RoutingFlags {
    verify_required: boolean;
    verify_recommended: boolean;
    verify_reason: string;
    quality_status: string;
    quality_score: number;
    score_anyway: boolean;
}

// ========== QUALITY ==========
export interface QualityInfo {
    overall_quality_score: number;
    status: string;
    components: {
        confidence: number;
        warnings_score: number;
        completeness: number;
        non_degraded: number;
    };
    trigger_reasons?: string[];
    version?: string;
}

// ========== MAIN API RESPONSE ==========
export interface ResumeExtractResponse {
    message: string;
    resume_id: string;
    file_name: string;
    parsing_method: string;
    cache_hit: boolean;
    correlation_id?: string | null;
    trace_id?: string;
    ats_score?: number | null;
    routing_flags?: RoutingFlags;
    verify_required?: boolean;
    verify_recommended?: boolean;
    verify_reason?: string;

    parsed_data: {
        // ---- Metadata ----
        image_warning?: boolean;
        image_message?: string | null;
        parser_schema_version?: string;
        parser_mode?: string;
        sectionizer_bleed_detected?: boolean;
        metadata?: {
            parser_version: string;
            parser_schema_version?: string;
            prompt_fingerprint?: string;
            parse_time_ms: number;
            parsed_at: string;
        };

        // ---- Contact & identity ----
        contact: ContactInfo;
        social_links: SocialLinks;
        headline?: string[];

        // ---- Content (v2: top-level; v1: inside llm_data) ----
        summary: string | string[];
        education?: EducationItem[];
        experience?: ExperienceItem[];
        internships?: InternshipItem[];
        projects?: ProjectItem[];
        technical_skills?: TechnicalSkillItem[];
        certifications?: CertificationItem[];
        overall_experience?: OverallExperience;
        domain_experience?: Array<{
            domain: string;
            years: number;
            months: number;
            total_experience?: number;
            label?: string;
            depth_level?: string;
            evidence_roles?: string[];
        }>;

        // ---- v1 legacy wrapper (optional in v2) ----
        llm_data?: LLMData;

        // ---- Skills ----
        soft_skills?: string[];

        // ---- Warnings & analysis ----
        parse_warnings?: ParseWarning[];
        warnings?: ParseWarning[];
        quality?: QualityInfo;
        field_confidence?: Record<string, number>;
        field_sources?: Record<string, string>;
        section_metadata?: Array<{
            original_name: string;
            mapped_to: string;
            risk_class: string;
            detection_source?: string;
            confidence?: string;
        }>;
        summary_analysis?: {
            word_count?: number;
            has_metrics?: boolean;
            has_skills?: boolean;
            has_role?: boolean;
            has_cliches?: boolean;
            first_person_count?: number;
            skills_mentioned?: string[];
            impact_metrics?: unknown[];
        };
        achievements_metrics?: unknown[];
        career_progression?: {
            progression_type?: string;
            progression_steps?: unknown[];
            job_stability?: string;
            industry_path?: Record<string, unknown>;
        };

        // ---- Format & structure ----
        format_analysis?: FormatAnalysis;
        formatting?: FormattingInfo;
        length_score?: LengthScore;
        structure_score?: StructureScore;

        // ---- Misc legacy fields ----
        achievements?: string[];
        awards?: string[];
        languages?: string[];
        declaration?: string[];
        personal_details?: string[];
        strengths?: string[];
        hobbies_and_interests?: string[];
        volunteering?: string[];
        workshops?: string[];
        publications?: string[];
        references?: string[];
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
export const extractResume = async (
    file: File,
    options: { skipAuthRedirect?: boolean } = {}
): Promise<ResumeExtractResponse> => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await httpClient.post<ResumeExtractResponse>(
            "/parser/parse_resume/",
            formData,
            {
                timeout: 120000,
                headers: {
                    "Content-Type": "multipart/form-data",
                    ...(options.skipAuthRedirect && {
                        "X-Skip-Auth-Redirect": "true",
                    }),
                },
            }
        );

        return response.data;
    } catch (error) {
        logger.error("Error extracting resume:", error);
        throw error;
    }
};
