import { EmploymentInfo } from "@/api/userApi";

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
        currently_studying?: boolean;
    }[];

    workExperience?: {
        id?: string;
        job_title?: string;
        company?: string;
        job_type?: string;
        location?: string;
        start_date?: string;
        end_date?: string;
        description?: string;
        currently_working?: boolean;
    }[];

    internships?: {
        id?: string;
        job_title?: string;
        company?: string;
        location?: string;
        start_date?: string;
        end_date?: string;
        description?: string;
    }[];

    certifications?: {
        id?: string;
        certification_name?: string;
        issuer?: string;
        start_date?: string;
        end_date?: string;
        credential_id?: string;
    }[];

    employmentInfo?: Partial<EmploymentInfo>;

    skills?: string[];

    careerInsights?: {
        careerObjective?: string;
        strengths?: string[];
        improvementAreas?: string[];
        preferredRoles?: string[];
        workPreference?: "onsite" | "remote" | "hybrid";
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
        id?: string;
        title?: string;
        description?: string;
        date?: string;
        issuer?: string;
        source_section?: string;
    }[];

    languages?: {
        id?: string;
        language?: string;
        proficiency?: "beginner" | "intermediate" | "advanced" | "fluent" | "native";
    }[];

    softSkills?: string[];

    hobbies?: {
        id?: string;
        name?: string;
        description?: string;
    }[];

    resume_url?: string;
}
