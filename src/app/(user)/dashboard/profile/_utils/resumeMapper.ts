import { ResumeExtractResponse } from '@/api/resumeParsingApi';
import { ProfileData } from '../_types/ProfileData';
import { normalizeDegree, normalizeStream } from './education-normalizer';

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
        // Normalize phone number - add country code if missing
        let phoneNumber = parsed.contact.phone || '';
        const location = parsed.contact.location || '';

        if (phoneNumber) {
            // Remove any spaces, hyphens, or parentheses
            phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

            // Check if phone number already has country code (starts with +)
            const hasCountryCode = phoneNumber.startsWith('+');

            if (!hasCountryCode) {
                // Default to +91 (India) for 10-digit numbers without country code
                // or if location is India
                if (location.toLowerCase().includes('india') || /^\d{10}$/.test(phoneNumber)) {
                    // If it's a 10-digit number, add +91
                    if (/^\d{10}$/.test(phoneNumber)) {
                        phoneNumber = '+91 ' + phoneNumber;
                    }
                    // If it starts with 91 but no +, add the +
                    else if (/^91\d{10}$/.test(phoneNumber)) {
                        phoneNumber = '+91 ' + phoneNumber.substring(2);
                    }
                }
            }
        }

        profileData.personalInformation = {
            fullName: parsed.contact.name || '',
            email: parsed.contact.email || '',
            phone: phoneNumber,
            location: parsed.contact.location || '',
            linkedin: parsed.social_links?.linkedIn || '',
            github: parsed.social_links?.github || '',
            summary: parsed.summary || '',
            headline: '',
        };
    }

    // -------------------------
    // EDUCATION
    // -------------------------
    function splitResumeDateRange(dateRange: string) {
        if (!dateRange.includes("-")) return { start: "", end: "" };
        const [startStr, endStr] = dateRange.split("-").map(s => s.trim());
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

            if (edu.duration?.includes("to") || edu.duration?.includes("-")) {
                // Normal range "Aug 2019 - Jul 2023"
                ({ start, end } = splitResumeDateRange(edu.duration));
            } else {
                // Single date "March 2017"
                ({ start, end } = parseSingleDate(edu.duration));
            }
            return {
                institution: edu.college || '',
                degree: normalizeDegree(edu.degree) || '',
                // ✅ Use the normalized stream value, fallback to "General" if not matched
                stream: normalizeStream(edu.branch) || "General",
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
    // WORK EXPERIENCE
    // -------------------------
    if (llm.experience?.length > 0) {
        profileData.workExperience = llm.experience
            .filter((exp) => exp.company || exp.role)
            .map((exp) => {
                const { start, end } = splitResumeDateRange(exp.duration || '');
                return {
                    company: exp.company || '',
                    job_title: exp.role || '',
                    location: exp.location || 'India',
                    start_date: start,
                    end_date: end || 'Present',
                    description: exp.key_contributions?.join('\n') || '',
                    currently_working: (end || '').toLowerCase() === 'present',
                };
            });
    }

    // -------------------------
    // INTERNSHIPS → WORK EXPERIENCE
    // -------------------------
    if ((!profileData.workExperience || profileData.workExperience.length === 0)
        && llm.internships?.length > 0) {
        profileData.workExperience = llm.internships.map((intern) => {
            const { start, end } = splitResumeDateRange(intern.duration || '');
            return {
                company: intern.company || '',
                job_title: intern.role || '',
                location: '',
                start_date: start,
                end_date: end,
                description: intern.key_contributions?.join('\n') || '',
                currently_working: false,
            };
        });
    }

    // -------------------------
    // SKILLS
    // -------------------------
    if (parsed.technical_skills?.length > 0) {
        profileData.skills = parsed.technical_skills.map((item) => item.skill);
    }

    // -------------------------
    // PROJECTS
    // -------------------------
    if (llm.projects?.length > 0) {
        profileData.projects = llm.projects.map((project) => ({
            project_name: project.title || '',
            description: project.key_contributions?.join('\n') || '',
            technologies: '',
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
        profileData.certifications = parsed.certifications.map((c) => ({
            name: c || '',
            issuer: '',
            date: '',
            credential_id: '',
            credential_url: '',
        }));
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
