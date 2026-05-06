export interface ProfileData {
    personalInformation?: {
        fullName?: string;
        headline?: string;
        location?: string;
        email?: string;
        phone?: string;
        website?: string;
        linkedin?: string;
        github?: string;
        summary?: string;
    };
    education?: {
        id?: string;
        institution?: string;
        degree?: string;
        stream?: string;
        cgpa?: number;
        start_date?: string;
        end_date?: string;
    }[];

    workExperience?: {
        id?: string;
        job_title?: string;
        company?: string;
        job_type?: string;
        location?: string;
        start_date?: string;
        end_date?: string;
        description?: string
    }[];

    certifications?: {
        id?: string;
        certification_name?: string;
        issuer?: string;
        start_date?: string;
        end_date?: string;
    }[];

    employmentInfo?: {
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
    };

    skills?: string[];

    careerInsights?: {
        careerObjective?: string;
        strengths?: string[];
        improvementAreas?: string[];
        preferredRoles?: string[];
        workPreference?: "Onsite" | "Remote" | "Hybrid";
        careerHighlights?: string;
        futurePlans?: string;
    };

    projects?: {
        id?: string;
        project_name?: string;
        role?: string;
        technologies?: string;
        start_date?: string;
        end_date?: string;
        description?: string;
        project_link?: string;
    }[];

    achievements?: {
        title?: string;
        description?: string;
        date?: string;
        issuer?: string; // e.g., competition, award organization
    }[];

    languages?: {
        language?: string;
        proficiency?: "Beginner" | "Intermediate" | "Advanced" | "Fluent" | "Native";
    }[];

    hobbies?: {
        name?: string;
        description?: string;
    }[];

    resume_url?: string;
}
