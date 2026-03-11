/**
 * Auto-fill Helper
 * Provides utility functions for handling both regular and auto-fill profile data additions
 */

import {
    addEducation,
    addEducationAutoFill,
    addExperience,
    addExperienceAutoFill,
    addSkill,
    addSkillAutoFill,
    addCertification,
    addCertificationAutoFill,
    addProject,
    addProjectAutoFill,
    Education,
    Experience,
    Skill,
    Certification,
    Projects,
    EducationAutoFillRequest,
    ExperienceAutoFillRequest,
    SkillAutoFillRequest,
    CertificationAutoFillRequest,
    ProjectAutoFillRequest,
} from "@/api/userApi";

/**
 * Adds education with proper endpoint selection
 * Uses auto-fill endpoint for incomplete data (resume/LinkedIn import)
 * Uses regular endpoint for complete manual entry
 */
export const addEducationItem = async (
    data: Partial<Education>,
    isAutoFill: boolean = false
): Promise<Education> => {
    if (isAutoFill) {
        return addEducationAutoFill(data as EducationAutoFillRequest);
    }
    return addEducation(data as Omit<Education, "id">);
};

/**
 * Adds experience with proper endpoint selection
 * Uses auto-fill endpoint for incomplete data (resume/LinkedIn import)
 * Uses regular endpoint for complete manual entry
 */
export const addExperienceItem = async (
    data: Partial<Experience>,
    isAutoFill: boolean = false
): Promise<Experience> => {
    if (isAutoFill) {
        return addExperienceAutoFill(data as ExperienceAutoFillRequest);
    }
    return addExperience(data as Omit<Experience, "id">);
};

/**
 * Adds skill with proper endpoint selection
 * Uses auto-fill endpoint for incomplete data (resume/LinkedIn import)
 * Uses regular endpoint for complete manual entry
 */
export const addSkillItem = async (
    data: Partial<Skill>,
    isAutoFill: boolean = false
): Promise<Skill> => {
    if (isAutoFill) {
        return addSkillAutoFill(data as SkillAutoFillRequest);
    }
    return addSkill(data.name || "");
};

/**
 * Adds certification with proper endpoint selection
 * Uses auto-fill endpoint for incomplete data (resume/LinkedIn import)
 * Uses regular endpoint for complete manual entry
 */
export const addCertificationItem = async (
    data: Partial<Certification>,
    isAutoFill: boolean = false
): Promise<Certification> => {
    if (isAutoFill) {
        return addCertificationAutoFill(data as CertificationAutoFillRequest);
    }
    return addCertification(data as Omit<Certification, "id">);
};

/**
 * Adds project with proper endpoint selection
 * Uses auto-fill endpoint for incomplete data (resume/LinkedIn import)
 * Uses regular endpoint for complete manual entry
 */
export const addProjectItem = async (
    data: Partial<Projects>,
    isAutoFill: boolean = false
): Promise<Projects> => {
    if (isAutoFill) {
        return addProjectAutoFill(data as ProjectAutoFillRequest);
    }
    return addProject(data as Omit<Projects, "id">);
};

/**
 * Checks if data has required fields for regular endpoint
 * Returns true if data can be used with regular endpoint, false if auto-fill is needed
 */
export const canUseRegularEndpoint = (data: any, type: "education" | "experience" | "certification" | "project" | "skill"): boolean => {
    switch (type) {
        case "education":
            // Education requires: institution, degree, stream, start_date
            return !!(data.institution && data.degree && data.stream && data.start_date);

        case "experience":
            // Experience requires: job_title, company, job_type, location, start_date
            return !!(data.job_title && data.company && data.job_type && data.location && data.start_date);

        case "certification":
            // Certification requires: certification_name, issuer, start_date, credential_id
            return !!(data.certification_name && data.issuer && data.start_date && data.credential_id);

        case "project":
            // Project requires: project_name, start_date
            return !!(data.project_name && data.start_date);

        case "skill":
            // Skill requires: name
            return !!data.name;

        default:
            return false;
    }
};
