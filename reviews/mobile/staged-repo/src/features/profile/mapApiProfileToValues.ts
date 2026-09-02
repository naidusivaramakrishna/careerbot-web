// Maps a GET /api/v1/profile/ response onto the profile screen's state shape
// (same dict-of-tabs that parseResumeToProfile produces).
//
// Backend stores canonical profile — this is the source of truth on screen mount.
// Fields the backend has not populated yet come back empty; the screen renders
// its empty states and the user can fill them in.
//
// Ported from POC: src/screens/profile/mapApiProfileToValues.js
// DIRECT PORT — TS types only.

import type {
  CertificationEntry,
  EducationEntry,
  EmploymentInfo,
  ProjectEntry,
  SkillEntry,
  WorkEntry,
  ParsedProfileState,
} from './parseResumeToProfile';

function pickString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
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
      return text ? `• ${text}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

// ─── Education ────────────────────────────────────────────────────────────

interface ApiEducation {
  id?: string | number;
  institution?: string;
  college?: string;
  degree?: string;
  stream?: string;
  field_of_study?: string;
  branch?: string;
  cgpa?: string | number;
  grade?: string | number;
  grade_percentage?: string | number;
  start_date?: string;
  start_year?: string;
  end_date?: string;
  end_year?: string;
  passed_out?: string;
  description?: string;
  notes?: string;
}

function mapEducation(items: unknown): (EducationEntry & { id?: string })[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const edu = raw as ApiEducation;
    return {
      id: pickString(edu.id),
      institution: pickString(edu.institution ?? edu.college),
      degree: pickString(edu.degree),
      stream: pickString(edu.stream ?? edu.field_of_study ?? edu.branch),
      cgpa: pickString(edu.cgpa ?? edu.grade ?? edu.grade_percentage),
      start_date: pickString(edu.start_date ?? edu.start_year),
      end_date: pickString(edu.end_date ?? edu.end_year ?? edu.passed_out),
      description: pickString(edu.description ?? edu.notes),
    };
  });
}

// ─── Work ─────────────────────────────────────────────────────────────────

interface ApiWork {
  id?: string | number;
  job_title?: string;
  title?: string;
  role?: string;
  company?: string;
  job_type?: 'full_time' | 'internship' | string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  key_achievements?: string | string[];
}

function mapWork(items: unknown): (WorkEntry & { id?: string })[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const entry = raw as ApiWork;
    return {
      id: pickString(entry.id),
      job_title: pickString(entry.job_title ?? entry.title ?? entry.role),
      company: pickString(entry.company),
      job_type: (pickString(entry.job_type) || 'full_time') as WorkEntry['job_type'],
      location: pickString(entry.location),
      start_date: pickString(entry.start_date),
      end_date: pickString(entry.end_date),
      description: pickString(entry.description),
      key_achievements: Array.isArray(entry.key_achievements)
        ? entry.key_achievements.join('\n')
        : pickString(entry.key_achievements),
    };
  });
}

// ─── Skills ───────────────────────────────────────────────────────────────

interface ApiSkill {
  id?: string | number;
  name?: string;
  skill?: string;
  category?: string;
}

function mapSkills(items: unknown): (SkillEntry & { id?: string })[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((rawItem) => {
      if (!rawItem) return null;
      if (typeof rawItem === 'string') return { id: '', name: rawItem };
      const item = rawItem as ApiSkill;
      const id = item.id ? String(item.id) : '';
      const name = pickString(item.name ?? item.skill);
      return name ? { id, name } : null;
    })
    .filter((item): item is { id: string; name: string } => Boolean(item));
}

// ─── Certifications ───────────────────────────────────────────────────────

interface ApiCertification {
  id?: string | number;
  certification_name?: string;
  name?: string;
  full_name?: string;
  issuer?: string;
  issuing_organization?: string;
  start_date?: string;
  issue_date?: string;
  end_date?: string;
  expiry_date?: string;
  credential_id?: string;
}

function mapCertifications(items: unknown): (CertificationEntry & { id?: string })[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const cert = raw as ApiCertification;
    return {
      id: pickString(cert.id),
      certification_name: pickString(
        cert.certification_name ?? cert.name ?? cert.full_name,
      ),
      issuer: pickString(cert.issuer ?? cert.issuing_organization),
      start_date: pickString(cert.start_date ?? cert.issue_date),
      end_date: pickString(cert.end_date ?? cert.expiry_date),
      credential_id: pickString(cert.credential_id),
    };
  });
}

// ─── Projects ─────────────────────────────────────────────────────────────

interface ApiProject {
  id?: string | number;
  project_name?: string;
  title?: string;
  name?: string;
  role?: string;
  technologies?: string | string[];
  tech_stack?: string | string[];
  start_date?: string;
  end_date?: string;
  project_link?: string;
  url?: string;
  project_url?: string;
  description?: string;
  achievements?: unknown[];
  responsibilities?: unknown[];
}

function mapProjects(items: unknown): (ProjectEntry & { id?: string })[] {
  if (!Array.isArray(items)) return [];

  return items.map((raw) => {
    const proj = raw as ApiProject;
    const description =
      typeof proj.description === 'string'
        ? proj.description
        : [bulletList(proj.achievements), bulletList(proj.responsibilities)]
            .filter(Boolean)
            .join('\n');

    const technologies = Array.isArray(proj.technologies)
      ? proj.technologies.join(', ')
      : pickString(proj.technologies ?? proj.tech_stack);

    return {
      id: pickString(proj.id),
      project_name: pickString(proj.project_name ?? proj.title ?? proj.name),
      role: pickString(proj.role),
      technologies,
      start_date: pickString(proj.start_date),
      end_date: pickString(proj.end_date),
      project_link: pickString(proj.project_link ?? proj.url ?? proj.project_url),
      description,
    };
  });
}

// ─── Employment ───────────────────────────────────────────────────────────

interface ApiEmploymentInfo {
  employment_status?: string;
  preferred_job_type?: string;
  work_mode?: string;
  authorized_to_work?: boolean | null;
  willing_to_relocate?: boolean | null;
  disability_status?: string;
  gender?: string;
  notice_period_days?: number | null;
  preferred_industries?: string[];
  preferred_roles?: string[];
  preferred_locations?: string[];
}

function mapEmployment(info: unknown): EmploymentInfo {
  if (!info || typeof info !== 'object') {
    return {
      employment_status: '',
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

  const data = info as ApiEmploymentInfo;
  const boolToYesNo = (value: boolean | null | undefined): string => {
    if (value === true) return 'yes';
    if (value === false) return 'no';
    return '';
  };
  const joinArray = (value: string[] | undefined): string =>
    Array.isArray(value) ? value.filter(Boolean).join(', ') : '';

  const noticeDays = data.notice_period_days;
  return {
    employment_status: pickString(data.employment_status),
    preferred_job_type: pickString(data.preferred_job_type),
    work_mode: pickString(data.work_mode),
    authorized_to_work: boolToYesNo(data.authorized_to_work),
    willing_to_relocate: boolToYesNo(data.willing_to_relocate),
    disability_status: pickString(data.disability_status),
    gender: pickString(data.gender),
    notice_period_days: noticeDays === null || noticeDays === undefined ? '' : String(noticeDays),
    preferred_industries: joinArray(data.preferred_industries),
    preferred_roles: joinArray(data.preferred_roles),
    preferred_locations: joinArray(data.preferred_locations),
  };
}

function deriveResumeFileName(resumeUrl: unknown): string {
  if (!resumeUrl) return '';
  try {
    const parts = String(resumeUrl).split('?')[0].split('/');
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : '';
  } catch {
    return '';
  }
}

// ─── Top-level ─────────────────────────────────────────────────────────────

interface ApiProfile {
  full_name?: string;
  headline?: string;
  location?: string;
  email?: string;
  phone_number?: string;
  linkedin_url?: string;
  github_url?: string;
  summary?: string;
  profile_picture_url?: string;
  picture_url?: string;
  avatar_url?: string;
  profile_picture?: string;
  resume_url?: string;
  education?: unknown;
  experience?: unknown;
  skills?: unknown;
  certifications?: unknown;
  projects?: unknown;
  employment_info?: unknown;
}

export interface ApiProfileState extends ParsedProfileState {
  personal: ParsedProfileState['personal'] & { profilePictureUrl?: string };
  resume: { fileName: string; resumeUrl: string };
}

export function mapApiProfileToValues(apiProfile: ApiProfile | null | undefined): ApiProfileState {
  const profile = apiProfile ?? {};

  return {
    personal: {
      fullName: pickString(profile.full_name),
      headline: pickString(profile.headline),
      location: pickString(profile.location),
      email: pickString(profile.email),
      phone: pickString(profile.phone_number),
      linkedin: pickString(profile.linkedin_url),
      github: pickString(profile.github_url),
      summary: pickString(profile.summary),
      profilePictureUrl: pickString(
        profile.profile_picture_url ?? profile.picture_url ?? profile.avatar_url ?? profile.profile_picture,
      ),
    },
    education: mapEducation(profile.education),
    work: mapWork(profile.experience),
    skills: mapSkills(profile.skills),
    certifications: mapCertifications(profile.certifications),
    employment: mapEmployment(profile.employment_info),
    projects: mapProjects(profile.projects),
    resume: {
      fileName: deriveResumeFileName(profile.resume_url),
      resumeUrl: pickString(profile.resume_url),
    },
  };
}
