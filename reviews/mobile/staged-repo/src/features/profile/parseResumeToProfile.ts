// Maps a /api/v1/parser/parse_resume/ response into the profile-screen state.
//
// The parser returns a rich, nested payload. This helper flattens it into the
// shape the profile screen consumes:
//   - flat dicts for personal, skills, employment
//   - arrays of entries for education, work, certifications, projects
//
// Ported from POC: src/screens/profile/parseResumeToProfile.js
// DIRECT PORT — TS types only. Logic identical.

interface ValueWrapped {
  value?: string;
}

function pickString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && typeof (value as ValueWrapped).value === 'string') {
    return (value as ValueWrapped).value!;
  }
  return '';
}

interface BulletItem {
  text?: string;
  [key: string]: unknown;
}

function bulletList(items: unknown, key: string = 'text'): string {
  if (!Array.isArray(items)) return '';

  return items
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return `• ${item}`;
      const text = (item as BulletItem)[key];
      return typeof text === 'string' && text ? `• ${text}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

// ─── Personal ─────────────────────────────────────────────────────────────

interface ParserContact {
  name?: unknown;
  location?: unknown;
  email?: unknown;
  phone?: unknown;
}

interface ParserSocialLink {
  url?: string;
}

interface ParserData {
  contact?: ParserContact;
  social_links?: { linkedin?: ParserSocialLink; github?: ParserSocialLink };
  summary?: unknown;
  education?: unknown[];
  experience?: unknown[];
  internships?: unknown[];
  technical_skills?: unknown[];
  soft_skills?: unknown[];
  certifications?: unknown[];
  projects?: unknown[];
  overall_experience?: { is_fresher?: boolean };
}

interface ParserResponse {
  parsed_data?: ParserData;
  file_name?: string;
}

export interface ProfilePersonal {
  fullName: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string;
}

function mapPersonal(data: ParserData): ProfilePersonal {
  const contact = data.contact ?? {};
  const socials = data.social_links ?? {};

  return {
    fullName: pickString(contact.name),
    headline: '',
    location: pickString(contact.location),
    email: pickString(contact.email),
    phone: pickString(contact.phone),
    linkedin: socials.linkedin?.url ?? '',
    github: socials.github?.url ?? '',
    summary: pickString(data.summary),
  };
}

// ─── Education ────────────────────────────────────────────────────────────

export interface EducationEntry {
  institution: string;
  degree: string;
  stream: string;
  cgpa: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface ParsedEducation {
  college?: unknown;
  degree?: unknown;
  branch?: unknown;
  grade?: string;
  grade_type?: string;
  grade_percentage?: number | string;
  passed_out?: unknown;
}

function mapEducation(data: ParserData): EducationEntry[] {
  return (data.education ?? []).map((rawEdu) => {
    const edu = rawEdu as ParsedEducation;
    const gradeText = edu.grade
      ? `${edu.grade}${edu.grade_type ? ` ${edu.grade_type.toUpperCase()}` : ''}`
      : edu.grade_percentage
        ? String(edu.grade_percentage)
        : '';

    return {
      institution: pickString(edu.college),
      degree: pickString(edu.degree),
      stream: pickString(edu.branch),
      cgpa: gradeText,
      start_date: '',
      end_date: pickString(edu.passed_out),
      description: '',
    };
  });
}

// ─── Work + Internships ───────────────────────────────────────────────────

export interface WorkEntry {
  job_title: string;
  company: string;
  job_type: 'full_time' | 'internship';
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  key_achievements: string;
}

interface ParsedWork {
  role?: unknown;
  title?: unknown;
  company?: unknown;
  location?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  description?: unknown;
  achievements?: unknown[];
  responsibilities?: unknown[];
}

function mapWork(data: ParserData): WorkEntry[] {
  const mapEntry = (rawEntry: unknown, jobType: WorkEntry['job_type']): WorkEntry => {
    const entry = rawEntry as ParsedWork;
    return {
      job_title: pickString(entry.role ?? entry.title),
      company: pickString(entry.company),
      job_type: jobType,
      location: pickString(entry.location),
      start_date: pickString(entry.start_date),
      end_date: pickString(entry.end_date),
      description: pickString(entry.description),
      key_achievements: [bulletList(entry.achievements), bulletList(entry.responsibilities)]
        .filter(Boolean)
        .join('\n'),
    };
  };

  const experience = (data.experience ?? []).map((e) => mapEntry(e, 'full_time'));
  const internships = (data.internships ?? []).map((e) => mapEntry(e, 'internship'));
  return [...experience, ...internships];
}

// ─── Skills ───────────────────────────────────────────────────────────────

export interface SkillEntry {
  name: string;
}

interface ParsedSkill {
  skill?: unknown;
  name?: unknown;
}

function mapSkills(data: ParserData): SkillEntry[] {
  const out: SkillEntry[] = [];
  const technical = data.technical_skills ?? [];
  for (const rawItem of technical) {
    const item = rawItem as ParsedSkill;
    const name = pickString(item?.skill ?? item?.name);
    if (name) out.push({ name });
  }
  const soft = (data.soft_skills ?? []).filter(Boolean);
  for (const rawItem of soft) {
    const name =
      typeof rawItem === 'string'
        ? rawItem
        : pickString((rawItem as ParsedSkill)?.name ?? (rawItem as ParsedSkill)?.skill);
    if (name) out.push({ name });
  }
  return out;
}

// ─── Certifications ───────────────────────────────────────────────────────

export interface CertificationEntry {
  certification_name: string;
  issuer: string;
  start_date: string;
  end_date: string;
  credential_id: string;
}

interface ParsedCertification {
  full_name?: unknown;
  name?: unknown;
  issuing_organization?: unknown;
  issuer?: unknown;
  issue_date?: unknown;
  year?: unknown;
  expiry_date?: unknown;
  credential_id?: unknown;
}

function mapCertifications(data: ParserData): CertificationEntry[] {
  return (data.certifications ?? []).map((rawCert) => {
    const cert = rawCert as ParsedCertification;
    return {
      certification_name: pickString(cert.full_name ?? cert.name),
      issuer: pickString(cert.issuing_organization ?? cert.issuer),
      start_date: pickString(cert.issue_date ?? cert.year),
      end_date: pickString(cert.expiry_date),
      credential_id: pickString(cert.credential_id),
    };
  });
}

// ─── Employment ───────────────────────────────────────────────────────────

export interface EmploymentInfo {
  employment_status: string;
  preferred_job_type: string;
  work_mode: string;
  authorized_to_work: string;
  willing_to_relocate: string;
  disability_status: string;
  gender: string;
  notice_period_days: string;
  preferred_industries: string;
  preferred_roles: string;
  preferred_locations: string;
}

function mapEmployment(data: ParserData): EmploymentInfo {
  return {
    employment_status: data.overall_experience?.is_fresher ? 'student' : '',
    preferred_job_type: '',
    work_mode: '',
    authorized_to_work: '',
    willing_to_relocate: '',
    disability_status: '',
    gender: '',
    notice_period_days: '',
    preferred_industries: '',
    preferred_roles: '',
    preferred_locations: '',
  };
}

// ─── Projects ─────────────────────────────────────────────────────────────

export interface ProjectEntry {
  project_name: string;
  role: string;
  technologies: string;
  start_date: string;
  end_date: string;
  project_link: string;
  description: string;
}

interface ParsedProject {
  title?: unknown;
  name?: unknown;
  role?: unknown;
  tech_stack?: unknown;
  url?: unknown;
  link?: unknown;
  achievements?: unknown[];
  responsibilities?: unknown[];
}

function mapProjects(data: ParserData): ProjectEntry[] {
  return (data.projects ?? []).map((rawProj) => {
    const proj = rawProj as ParsedProject;
    return {
      project_name: pickString(proj.title ?? proj.name),
      role: pickString(proj.role),
      technologies: Array.isArray(proj.tech_stack)
        ? proj.tech_stack.join(', ')
        : pickString(proj.tech_stack),
      start_date: '',
      end_date: '',
      project_link: pickString(proj.url ?? proj.link),
      description: [bulletList(proj.achievements), bulletList(proj.responsibilities)]
        .filter(Boolean)
        .join('\n'),
    };
  });
}

// ─── Top-level ─────────────────────────────────────────────────────────────

export interface ParsedProfileState {
  personal: ProfilePersonal;
  education: EducationEntry[];
  work: WorkEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  employment: EmploymentInfo;
  projects: ProjectEntry[];
  resume: { fileName: string };
}

export interface ParseResumeOptions {
  /** Override response.file_name with the picker's original asset name (avoids cache UUID echoback). */
  originalFileName?: string;
}

export function parseResumeToProfile(
  response: ParserResponse | null | undefined,
  options: ParseResumeOptions = {},
): ParsedProfileState {
  const data = response?.parsed_data ?? {};
  const displayedName = options.originalFileName ?? response?.file_name ?? '';

  return {
    personal: mapPersonal(data),
    education: mapEducation(data),
    work: mapWork(data),
    skills: mapSkills(data),
    certifications: mapCertifications(data),
    employment: mapEmployment(data),
    projects: mapProjects(data),
    resume: { fileName: displayedName },
  };
}
