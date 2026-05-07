import { ResumeExtractResponse } from '@/api/resumeParsingApi';
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
    const profileData: Partial<ProfileData> = {};
    const parsed = resumeData.parsed_data;
    const llm = parsed.llm_data;

    // -------------------------
    // PERSONAL INFORMATION
    // -------------------------
    if (parsed.contact) {
        let phoneNumber = parsed.contact.phone || '';

        if (phoneNumber) {
            // Add +91 prefix for resume-extracted phone numbers
            phoneNumber = formatPhoneNumberFromResume(phoneNumber);
        }

        profileData.personalInformation = {
            fullName: parsed.contact.name || '',
            email: parsed.contact.email || '',
            phone: phoneNumber,
            location: parsed.contact.location || '',
            linkedin: parsed.social_links?.linkedin || '',
            github: parsed.social_links?.github || '',
            // Ensure summary is always a string, handle if it's accidentally an array
            summary: Array.isArray(parsed.summary)
                ? parsed.summary.join(' ').trim()
                : (parsed.summary || ''),
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


    if (llm.education?.length > 0) {
        profileData.education = llm.education.map((edu) => {
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

    // Add work experience
    if (llm.experience?.length > 0) {
        const experience = llm.experience
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
    if (llm.internships?.length > 0) {
        const internships = llm.internships.map((intern) => {
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

    // Add technical skills
    if (llm.technical_skills?.length > 0) {
        allSkills.push(...llm.technical_skills.map((item) => item.skill));
    }

    // Add soft skills
    if (parsed.soft_skills && parsed.soft_skills.length > 0) {
        allSkills.push(...parsed.soft_skills);
    }

    if (allSkills.length > 0) {
        profileData.skills = allSkills;
    }

    // -------------------------
    // PROJECTS
    // -------------------------
    if (llm.projects?.length > 0) {
        profileData.projects = llm.projects.map((project) => ({
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
    if (parsed.certifications?.length > 0) {
        profileData.certifications = parsed.certifications.map((cert) => {
            // Convert cert to string safely, handling objects, null, undefined
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
