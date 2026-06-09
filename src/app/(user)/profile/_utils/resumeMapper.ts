import { ResumeExtractResponse, ContactField, SocialLinkField, TechnicalSkillItem, CertificationItem } from '@/api/resumeParsingApi';
import { ProfileData } from '../_types/ProfileData';
import { normalizeDegree, normalizeStream } from './education-normalizer';

type AnyRecord = Record<string, unknown>;

const asStr = (v: unknown): string => (v !== null && v !== undefined ? String(v) : '');
const asArr = <T = AnyRecord>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

const buildDescription = (
    achievements?: Array<{ text: string; tier?: string; tier_confidence?: number }>,
    responsibilities?: Array<{ text: string; tier?: string; tier_confidence?: number }>
): string => {
    const items: string[] = [];
    if (achievements?.length) items.push(...achievements.map(a => `• ${a.text}`));
    if (responsibilities?.length) items.push(...responsibilities.map(r => `• ${r.text}`));
    return items.join('\n').trim();
};

export const formatPhoneNumber = (value: string): string => value || '';

export const formatPhoneNumberFromResume = (value: string): string => {
    if (!value) return '';
    if (value.startsWith('+')) return value;
    return `+91 ${value}`;
};

export const mapResumeToProfile = (resumeData: ResumeExtractResponse): Partial<ProfileData> => {
    try {
        const profileData: Partial<ProfileData> = {};

        if (!resumeData || !resumeData.parsed_data) {
            console.warn('Resume data is missing or invalid');
            return profileData;
        }

        const parsed = resumeData.parsed_data;
        // v1 had llm_data wrapper; v2 puts everything at top level
        const llm = (parsed.llm_data || {}) as AnyRecord;

        // -------------------------
        // PERSONAL INFORMATION
        // -------------------------
        if (parsed.contact) {
            const extractContactField = (field: ContactField): string => {
                if (typeof field === 'string') return field;
                return field?.value || '';
            };

            const extractSocialLink = (field: SocialLinkField | undefined): string => {
                if (!field) return '';
                if (typeof field === 'string') return field;
                return field?.url || '';
            };

            const name = extractContactField(parsed.contact.name);
            const location = extractContactField(parsed.contact.location);
            const phoneValue = extractContactField(parsed.contact.phone);
            const phoneNumber = phoneValue ? formatPhoneNumberFromResume(phoneValue) : '';

            const linkedinUrl = extractSocialLink(parsed.social_links?.linkedin);
            const githubUrl = extractSocialLink(parsed.social_links?.github);

            // portfolio may be { url, valid } (v2) or string[] (v1)
            const portfolioRaw = parsed.social_links?.portfolio;
            const portfolioUrl = Array.isArray(portfolioRaw)
                ? (portfolioRaw[0] || '')
                : extractSocialLink(portfolioRaw as SocialLinkField | undefined);

            profileData.personalInformation = {
                fullName: name?.trim() || '',
                phone: phoneNumber,
                location: location?.trim() || '',
                linkedin: linkedinUrl?.trim() || '',
                github: githubUrl?.trim() || '',
                website: portfolioUrl?.trim() || '',
                summary: Array.isArray(parsed.summary)
                    ? parsed.summary.join(' ').trim()
                    : (parsed.summary?.trim() || ''),
                headline: Array.isArray(parsed.headline) ? (parsed.headline[0] || '') : '',
            };
        }

        // -------------------------
        // DATE HELPERS
        // -------------------------
        const parseResumeDate = (dateStr: string): string => {
            if (!dateStr || dateStr.toLowerCase() === 'present') return '';
            try {
                const monthMap: Record<string, string> = {
                    jan: '01', january: '01', feb: '02', february: '02',
                    mar: '03', march: '03', apr: '04', april: '04',
                    may: '05', jun: '06', june: '06', jul: '07', july: '07',
                    aug: '08', august: '08', sep: '09', september: '09',
                    oct: '10', october: '10', nov: '11', november: '11',
                    dec: '12', december: '12',
                };
                const parts = dateStr.toLowerCase().trim().split(' ');
                if (parts.length === 2) {
                    const month = monthMap[parts[0]];
                    const year = parts[1];
                    if (month && year) return `${year}-${month}-01`;
                }
                if (parts.length === 1) return `${parts[0]}-01-01`;
                return '';
            } catch {
                return '';
            }
        };

        const splitResumeDateRange = (dateRange: string): { start: string; end: string } => {
            if (!dateRange.includes('-') && !dateRange.includes('–')) return { start: '', end: '' };
            const sep = dateRange.includes('–') ? '–' : '-';
            const [startStr, endStr] = dateRange.split(sep).map(s => s.trim());
            return { start: parseResumeDate(startStr), end: parseResumeDate(endStr) };
        };

        const parseSingleDate = (duration: string): { start: string; end: string } => {
            if (!duration) return { start: '', end: '' };
            const d = new Date(duration);
            if (isNaN(d.getTime())) return { start: '', end: '' };
            const yyyy = d.getFullYear();
            const mm = (d.getMonth() + 1).toString().padStart(2, '0');
            return { start: `${yyyy}-${mm}-01`, end: `${yyyy}-${mm}-02` };
        };

        // -------------------------
        // EDUCATION
        // -------------------------
        // v2: top level; v1: inside llm_data
        const educationData = asArr<AnyRecord>(
            parsed.education || llm.education || (parsed as AnyRecord).education
        );

        if (educationData.length > 0) {
            profileData.education = educationData.map((edu) => {
                let start = '', end = '';
                const duration = asStr(edu.duration);

                if (duration) {
                    if (duration.includes('to') || duration.includes('-') || duration.includes('–')) {
                        ({ start, end } = splitResumeDateRange(duration));
                    } else {
                        ({ start, end } = parseSingleDate(duration));
                    }
                } else if (edu.passed_out) {
                    // v2: passed_out is a graduation year like "2023"
                    end = `${edu.passed_out}-01-01`;
                }

                const gradeRaw = edu.grade ?? edu.grade_percentage;
                const cgpa = (() => {
                    if (gradeRaw === null || gradeRaw === undefined) return undefined;
                    const num = parseFloat(asStr(gradeRaw).replace('%', ''));
                    if (isNaN(num)) return undefined;
                    return parseFloat((num > 10 ? num / 10 : num).toFixed(2));
                })();

                return {
                    institution: asStr(edu.college),
                    degree: normalizeDegree(asStr(edu.degree)) || 'Other',
                    stream: normalizeStream(asStr(edu.branch)) || 'Other',
                    cgpa,
                    start_date: start,
                    end_date: end,
                };
            });
        }

        // -------------------------
        // WORK EXPERIENCE + INTERNSHIPS
        // -------------------------
        const allWorkExperience: Array<{
            company: string;
            job_title: string;
            location: string;
            start_date: string;
            end_date: string;
            description: string;
            currently_working: boolean;
        }> = [];

        // v2: top level; v1: inside llm_data
        const experienceData = asArr<AnyRecord>(
            parsed.experience || llm.experience || (parsed as AnyRecord).experience
        );

        if (experienceData.length > 0) {
            const mapped = experienceData
                .filter((exp) => exp.company || exp.role)
                .map((exp) => {
                    let start = '', end = '';
                    if (exp.start_date) {
                        start = parseResumeDate(asStr(exp.start_date));
                        end = parseResumeDate(asStr(exp.end_date));
                    } else {
                        ({ start, end } = splitResumeDateRange(asStr(exp.duration)));
                    }
                    return {
                        company: asStr(exp.company),
                        job_title: asStr(exp.role),
                        location: asStr(exp.location) || 'India',
                        start_date: start,
                        end_date: end,
                        description: buildDescription(
                            exp.achievements as Array<{ text: string }> | undefined,
                            exp.responsibilities as Array<{ text: string }> | undefined
                        ),
                        currently_working: !end,
                    };
                });
            allWorkExperience.push(...mapped);
        }

        // v2: internships top level with start_date/end_date; v1: inside llm_data with duration
        const internshipsData = asArr<AnyRecord>(
            parsed.internships || llm.internships || (parsed as AnyRecord).internships
        );

        if (internshipsData.length > 0) {
            const mapped = internshipsData.map((intern) => {
                let start = '', end = '';
                if (intern.start_date) {
                    start = parseResumeDate(asStr(intern.start_date));
                    end = parseResumeDate(asStr(intern.end_date));
                } else if (intern.duration) {
                    ({ start, end } = splitResumeDateRange(asStr(intern.duration)));
                }
                return {
                    company: asStr(intern.company),
                    job_title: asStr(intern.role),
                    location: asStr(intern.location),
                    start_date: start,
                    end_date: end,
                    description: buildDescription(
                        intern.achievements as Array<{ text: string }> | undefined,
                        intern.responsibilities as Array<{ text: string }> | undefined
                    ),
                    currently_working: false,
                };
            });
            allWorkExperience.push(...mapped);
        }

        if (allWorkExperience.length > 0) {
            allWorkExperience.sort((a, b) => {
                if (!a.end_date) return -1;
                if (!b.end_date) return 1;
                return b.end_date.localeCompare(a.end_date);
            });
            profileData.workExperience = allWorkExperience;
        }

        // -------------------------
        // SKILLS (Technical + Soft)
        // -------------------------
        const allSkills: string[] = [];

        // v2: top level; v1: inside llm_data
        const technicalSkillsData = asArr<TechnicalSkillItem>(
            parsed.technical_skills || llm.technical_skills || (parsed as AnyRecord).technical_skills
        );
        if (technicalSkillsData.length > 0) {
            allSkills.push(...technicalSkillsData.map((item) =>
                typeof item === 'string' ? item : item.skill
            ));
        }

        const softSkillsData = asArr<string>(
            parsed.soft_skills || llm.soft_skills || (parsed as AnyRecord).soft_skills
        );
        if (softSkillsData.length > 0) {
            allSkills.push(...softSkillsData.map(String));
        }

        if (allSkills.length > 0) {
            profileData.skills = allSkills;
        }

        // -------------------------
        // PROJECTS
        // -------------------------
        const projectsData = asArr<AnyRecord>(
            parsed.projects || llm.projects || (parsed as AnyRecord).projects
        );
        if (projectsData.length > 0) {
            profileData.projects = projectsData.map((project) => ({
                project_name: asStr(project.title),
                description:
                    buildDescription(
                        project.achievements as Array<{ text: string }> | undefined,
                        project.responsibilities as Array<{ text: string }> | undefined
                    ) ||
                    asArr<string>(project.key_contributions).join('\n'),
                technologies: asArr<string>(project.tech_stack).join(', '),
                role: '',
                project_link: '',
                start_date: '',
                end_date: '',
            }));
        }

        // -------------------------
        // ACHIEVEMENTS
        // -------------------------
        if (parsed.achievements && parsed.achievements.length > 0) {
            profileData.achievements = parsed.achievements.map((a) => ({
                title: a || '',
                description: '',
                date: '',
            }));
        }

        // -------------------------
        // CERTIFICATIONS
        // -------------------------
        const certificationsData = asArr<CertificationItem>(
            parsed.certifications || (parsed as AnyRecord).certifications
        );
        if (certificationsData.length > 0) {
            profileData.certifications = certificationsData.map((cert) => {
                if (typeof cert === 'object' && cert && 'full_name' in cert) {
                    return {
                        certification_name: cert.full_name || '',
                        issuer: cert.issuing_organization || '',
                        start_date: '',
                        end_date: cert.year || '',
                        credential_id: cert.code || '',
                    };
                }

                const certStr = String(cert || '').trim();
                let certName = certStr;
                let issuer = '';

                const fromMatch = certStr.match(/from\s+([^,\.]*)(?:[,\.]|$)/i);
                if (fromMatch?.[1]) {
                    issuer = fromMatch[1].trim();
                    certName = certStr.replace(/\s+from\s+[^,\.]*/i, '').trim();
                }

                const byInMatch = certStr.match(/by\s+([^,\.]+?)\s+(?:in|on)\s+([^,\.]*)/i);
                if (byInMatch?.[1]) {
                    issuer = byInMatch[1].trim();
                    certName = (byInMatch[2] || certStr).trim();
                }

                certName = certName.replace(/^Certified\s+(?:as\s+)?(?:an?\s+)?/i, '').trim();

                return {
                    certification_name: certName || certStr,
                    issuer,
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

export const parseResumeDate = (dateStr: string): string => {
    if (!dateStr || dateStr.toLowerCase() === 'present') return '';
    try {
        const monthMap: Record<string, string> = {
            jan: '01', january: '01', feb: '02', february: '02',
            mar: '03', march: '03', apr: '04', april: '04',
            may: '05', jun: '06', june: '06', jul: '07', july: '07',
            aug: '08', august: '08', sep: '09', september: '09',
            oct: '10', october: '10', nov: '11', november: '11',
            dec: '12', december: '12',
        };
        const parts = dateStr.toLowerCase().trim().split(' ');
        if (parts.length === 2) {
            const month = monthMap[parts[0]];
            const year = parts[1];
            if (month && year) return `${year}-${month}-01`;
        }
        if (parts.length === 1) return `${parts[0]}-01-01`;
        return '';
    } catch {
        return '';
    }
};
