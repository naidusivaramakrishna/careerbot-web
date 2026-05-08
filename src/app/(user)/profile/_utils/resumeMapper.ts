import { ResumeExtractResponse, ContactField, SocialLinkField, TechnicalSkillItem, CertificationItem } from '@/api/resumeParsingApi';
import { ProfileData } from '../_types/ProfileData';
import { normalizeDegree, normalizeStream } from './education-normalizer';

/**
 * Consolidate achievements and responsibilities into a single description
 * Combines both arrays with bullets, ordered by tier priority
 */
const buildDescription = (
    achievements?: Array<{ text: string; tier?: string; tier_confidence?: number }>,
    responsibilities?: Array<{ text: string; tier?: string; tier_confidence?: number }>
): string => {
    const items: string[] = [];

    if (achievements?.length) {
        items.push(...achievements.map(a => `• ${a.text}`));
    }

    if (responsibilities?.length) {
        items.push(...responsibilities.map(r => `• ${r.text}`));
    }

    return items.join('\n').trim();
};

/**
 * Format phone number - returns as-is for backend validation
 * Backend will validate phone number format and return error if invalid
 */
export const formatPhoneNumber = (value: string): string => {
    return value || '';
};

/**
 * Format phone number from resume extraction
 * Adds +91 prefix to 10-digit numbers from resume parsing
 * Example: 9876543210 → +91 9876543210
 */
export const formatPhoneNumberFromResume = (value: string): string => {
    if (!value) return '';
    // If already has country code, return as-is
    if (value.startsWith('+')) return value;
    // Add +91 prefix for 10-digit numbers
    return `+91 ${value}`;
};

/**

* Maps resume extraction response to ProfileData format
* @param resumeData - The extracted resume data
* @returns ProfileData object ready to be used in the application
  */
export const mapResumeToProfile = (resumeData: ResumeExtractResponse): Partial<ProfileData> => {
    try {
        const profileData: Partial<ProfileData> = {};

        if (!resumeData || !resumeData.parsed_data) {
            console.warn('Resume data is missing or invalid');
            return profileData;
        }

        const parsed = resumeData.parsed_data;
        const llm = parsed.llm_data || {};

    // -------------------------
    // PERSONAL INFORMATION
    // -------------------------
    if (parsed.contact) {
        // Extract name, email, location, and phone from nested objects
        const extractContactField = (field: ContactField): string => {
            if (typeof field === 'string') return field;
            return field?.value || '';
        };

        const name = extractContactField(parsed.contact.name);
        const location = extractContactField(parsed.contact.location);
        const phoneValue = extractContactField(parsed.contact.phone);

        let phoneNumber = '';
        if (phoneValue) {
            phoneNumber = formatPhoneNumberFromResume(phoneValue);
        }

        // Extract social links from nested url property
        const extractSocialLink = (field: SocialLinkField | undefined): string => {
            if (!field) return '';
            if (typeof field === 'string') return field;
            return field?.url || '';
        };

        const linkedinUrl = extractSocialLink(parsed.social_links?.linkedin);
        const githubUrl = extractSocialLink(parsed.social_links?.github);

        profileData.personalInformation = {
            fullName: name?.trim() || '',
            phone: phoneNumber,
            location: location?.trim() || '',
            linkedin: linkedinUrl?.trim() || '',
            github: githubUrl?.trim() || '',
            // Ensure summary is always a string, handle if it's accidentally an array
            summary: Array.isArray(parsed.summary)
                ? parsed.summary.join(' ').trim()
                : (parsed.summary?.trim() || ''),
            headline: '',
        };
    }

    // -------------------------
    // EDUCATION
    // -------------------------
    function splitResumeDateRange(dateRange: string) {
        // Handle both hyphen (-) and en-dash (–)
        if (!dateRange.includes("-") && !dateRange.includes("–")) return { start: "", end: "" };
        const separator = dateRange.includes("–") ? "–" : "-";
        const [startStr, endStr] = dateRange.split(separator).map(s => s.trim());
        const start = parseResumeDate(startStr);
        const end = parseResumeDate(endStr);
        return { start, end };
    }

    const parseSingleDate = (duration: string) => {
        if (!duration) return { start: "", end: "" };

        // Convert "March 2017" → "2017-03-01"
        const parsed = new Date(duration);
        if (isNaN(parsed.getTime())) return { start: "", end: "" };

        const yyyy = parsed.getFullYear();
        const mm = (parsed.getMonth() + 1).toString().padStart(2, "0");

        return {
            start: `${yyyy}-${mm}-01`,
            end: `${yyyy}-${mm}-02`
        };
    };


    // Check both llm.education and parsed.education
    const parsedData = parsed as Record<string, unknown>;
    const educationData = llm.education || (parsedData.education as Array<Record<string, unknown>>) || [];

    if (Array.isArray(educationData) && educationData?.length > 0) {
        profileData.education = educationData.map((edu) => {
            let start, end;

            if (edu.duration?.includes("to") || edu.duration?.includes("-") || edu.duration?.includes("–")) {
                // Normal range "Aug 2019 - Jul 2023" or "2022–2024" (with en-dash)
                ({ start, end } = splitResumeDateRange(edu.duration));
            } else {
                // Single date "March 2017"
                ({ start, end } = parseSingleDate(edu.duration));
            }
            return {
                institution: edu.college || '',
                // ✅ Default to "Other" if degree is null or empty after normalization
                degree: normalizeDegree(edu.degree) || "Other",
                // ✅ Use the normalized stream value, fallback to "Other" if not matched
                stream: normalizeStream(edu.branch) || "Other",
                cgpa: (() => {
                    if (!edu.grade) return undefined;

                    const raw = edu.grade.toString().replace('%', '')
                    const num = parseFloat(raw);
                    if (isNaN(num)) return undefined;

                    const cgpaValue = num > 10 ? (num / 10) : num;
                    return parseFloat(cgpaValue.toFixed(2));
                })(),
                start_date: start,
                end_date: end,
            };
        });
    }

    // -------------------------
    // WORK EXPERIENCE + INTERNSHIPS
    // -------------------------
    const allWorkExperience = [];

    // Check both llm.experience and parsed.experience
    const experienceData = llm.experience || (parsedData.experience as Array<Record<string, unknown>>) || [];

    // Add work experience
    if (Array.isArray(experienceData) && experienceData?.length > 0) {
        const experience = experienceData
            .filter((exp) => exp.company || exp.role)
            .map((exp) => {
                const { start, end } = splitResumeDateRange(exp.duration || '');
                return {
                    company: exp.company || '',
                    job_title: exp.role || '',
                    location: exp.location || 'India',
                    start_date: start,
                    end_date: end,
                    description: buildDescription(exp.achievements, exp.responsibilities),
                    currently_working: !end,
                };
            });
        allWorkExperience.push(...experience);
    }

    // Add internships
    const internshipsData = llm.internships || (parsedData.internships as Array<Record<string, unknown>>) || [];
    if (Array.isArray(internshipsData) && internshipsData?.length > 0) {
        const internships = internshipsData.map((intern) => {
            const { start, end } = splitResumeDateRange(intern.duration || '');
            return {
                company: intern.company || '',
                job_title: intern.role || '',
                location: '',
                start_date: start,
                end_date: end,
                description: buildDescription(intern.achievements, intern.responsibilities),
                currently_working: false,
            };
        });
        allWorkExperience.push(...internships);
    }

    // Sort by end_date (most recent first, with empty dates at the top for ongoing)
    if (allWorkExperience.length > 0) {
        allWorkExperience.sort((a, b) => {
            if (!a.end_date) return -1; // Currently working goes first
            if (!b.end_date) return 1;
            return b.end_date.localeCompare(a.end_date);
        });
        profileData.workExperience = allWorkExperience;
    }

    // -------------------------
    // SKILLS (Technical + Soft)
    // -------------------------
    const allSkills: string[] = [];

    // Add technical skills - check both llm and parsed
    const technicalSkillsData = llm.technical_skills || (parsedData.technical_skills as TechnicalSkillItem[]) || [];
    if (Array.isArray(technicalSkillsData) && technicalSkillsData?.length > 0) {
        allSkills.push(...technicalSkillsData.map((item: TechnicalSkillItem) => {
            return typeof item === 'string' ? item : item.skill;
        }));
    }

    // Add soft skills - check both llm and parsed
    const softSkillsData = parsed.soft_skills || (parsedData.soft_skills as string[]) || [];
    if (Array.isArray(softSkillsData) && softSkillsData?.length > 0) {
        allSkills.push(...softSkillsData.map((skill: string) => String(skill)));
    }

    if (allSkills.length > 0) {
        profileData.skills = allSkills;
    }

    // -------------------------
    // PROJECTS
    // -------------------------
    const projectsData = llm.projects || (parsedData.projects as Array<Record<string, unknown>>) || [];
    if (Array.isArray(projectsData) && projectsData?.length > 0) {
        profileData.projects = projectsData.map((project) => ({
            project_name: project.title || '',
            description: buildDescription(project.achievements, project.responsibilities) || project.key_contributions?.join('\n') || '',
            technologies: project.tech_stack?.join(', ') || '',
            role: '',
            project_link: '',
            start_date: '',
            end_date: '',
        }));
    }

    // -------------------------
    // ACHIEVEMENTS
    // -------------------------
    if (parsed.achievements?.length > 0) {
        profileData.achievements = parsed.achievements.map((a) => ({
            title: a || '',
            description: '',
            date: '',
        }));
    }

    // -------------------------
    // CERTIFICATIONS
    // -------------------------
    const certificationsData = (parsedData.certifications as CertificationItem[]) || [];
    if (Array.isArray(certificationsData) && certificationsData?.length > 0) {
        profileData.certifications = certificationsData.map((cert: CertificationItem) => {
            // If cert is an object with full_name property, use it directly
            if (typeof cert === 'object' && cert && 'full_name' in cert) {
                return {
                    certification_name: cert.full_name || '',
                    issuer: cert.issuing_organization || '',
                    start_date: '',
                    end_date: cert.year || '',
                    credential_id: cert.code || '',
                };
            }

            // Otherwise, treat as string and parse
            const certStr = String(cert || '').trim();
            let certName = certStr;
            let issuer = '';

            // Parse certification string to extract issuer and name
            // Patterns: "Certified by {issuer} in {name}", "{name} from {issuer}"

            const fromMatch = certStr.match(/from\s+([^,\.]*)(?:[,\.]|$)/i);
            if (fromMatch && fromMatch[1]) {
                issuer = fromMatch[1].trim();
                certName = certStr.replace(/\s+from\s+[^,\.]*/i, '').trim();
            }

            const byInMatch = certStr.match(/by\s+([^,\.]+?)\s+(?:in|on)\s+([^,\.]*)/i);
            if (byInMatch && byInMatch[1]) {
                issuer = byInMatch[1].trim();
                certName = (byInMatch[2] || certStr).trim();
            }

            // Remove "Certified" prefix if present
            certName = certName.replace(/^Certified\s+(?:as\s+)?(?:an?\s+)?/i, '').trim();

            return {
                certification_name: certName || certStr,
                issuer: issuer,
                start_date: '',
                end_date: '',
                credential_id: '',
            };
        });
    }

        return profileData;
    } catch (error) {
        console.error('Error mapping resume to profile:', error);
        return {};
    }
};

/**

* Converts date string to YYYY-MM-DD format
* Handles various date formats from resume
  */
export const parseResumeDate = (dateStr: string): string => {
    if (!dateStr || dateStr.toLowerCase() === 'present') return '';
    try {
        const monthMap: { [key: string]: string } = {
            jan: '01', january: '01',
            feb: '02', february: '02',
            mar: '03', march: '03',
            apr: '04', april: '04',
            may: '05',
            jun: '06', june: '06',
            jul: '07', july: '07',
            aug: '08', august: '08',
            sep: '09', september: '09',
            oct: '10', october: '10',
            nov: '11', november: '11',
            dec: '12', december: '12',
        };
        const parts = dateStr.toLowerCase().trim().split(' ');
        if (parts.length === 2) {
            const month = monthMap[parts[0]];
            const year = parts[1];
            if (month && year) return `${year}-${month}-01`;
        }
        if (parts.length === 1) {
            return `${parts[0]}-01-01`;
        }
        return '';
    } catch {
        return '';
    }
};
