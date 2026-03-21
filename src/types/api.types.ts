// Centralized API type definitions for CareerBOT

// ============ ERROR TYPES ============
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: string;
  detail?: string | ApiErrorDetail;
  status?: number;
}

export interface ApiErrorDetail {
  error: string;
  message?: string;
  existing_id?: string;
}

// ============ CONTACT TYPES ============
export interface ResumeContact {
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  location?: string;
  address?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
}

// ============ EXPERIENCE TYPES ============
export interface ResumeExperience {
  company?: string;
  organization?: string;
  title?: string;
  role?: string;
  position?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  from?: string;
  to?: string;
  is_current?: boolean;
  currently_working?: boolean;
  contributions?: string[];
  description?: string;
  responsibilities?: string[];
  key_contributions?: string[];
}

// ============ EDUCATION TYPES ============
export interface ResumeEducation {
  institution?: string;
  school?: string;
  university?: string;
  college?: string;
  degree?: string;
  qualification?: string;
  program?: string;
  field_of_study?: string;
  branch?: string;
  specialization?: string;
  start_date?: string;
  end_date?: string;
  from?: string;
  to?: string;
  graduation_year?: string;
  passed_out?: string;
  year?: string;
  gpa?: string;
  grade?: string;
  percentage?: string;
  achievements?: string[];
}

// ============ PROJECT TYPES ============
export interface ResumeProject {
  name?: string;
  title?: string;
  projectName?: string;
  description?: string;
  summary?: string;
  technologies?: string[];
  techStack?: string[];
  tools?: string[];
  url?: string;
  link?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
  period?: string;
  responsibilities?: string[];
  key_contributions?: string[];
  contributions?: string[];
}

// ============ CERTIFICATION TYPES ============
export interface ResumeCertification {
  name?: string;
  title?: string;
  certification?: string;
  issuer?: string;
  issued_by?: string;
  issuedBy?: string;
  date?: string;
  year?: string;
  url?: string;
  link?: string;
  credential_id?: string;
  credentialId?: string;
  expiry_date?: string;
  expiryDate?: string;
}

// ============ ACHIEVEMENT TYPES ============
export interface ResumeAchievement {
  name?: string;
  title?: string;
  description?: string;
  date?: string;
}

// ============ AWARD TYPES ============
export interface ResumeAward {
  name?: string;
  title?: string;
  organization?: string;
  issued_by?: string;
  issuedBy?: string;
  date?: string;
  year?: string;
}

// ============ SKILL TYPES ============
export interface SkillItem {
  skill?: string;
  name?: string;
}

// ============ LANGUAGE TYPES ============
export interface ResumeLanguage {
  language?: string;
  name?: string;
  proficiency?: string;
  level?: string;
}

// ============ RESUME DATA TYPES ============
export interface ResumeData {
  resume_id?: string;
  _id?: string;
  id?: string;
  contact?: ResumeContact;
  personal_info?: ResumeContact;
  personalInfo?: ResumeContact;
  summary?: string;
  professional_summary?: string;
  professionalSummary?: string;
  career_objective?: string;
  objective?: string;
  experience?: ResumeExperience[];
  work_experience?: ResumeExperience[];
  workExperience?: ResumeExperience[];
  professional_experience?: ResumeExperience[];
  education?: ResumeEducation[];
  educational_qualifications?: ResumeEducation[];
  skills?: string[] | SkillItem[];
  technical_skills?: string[] | SkillItem[];
  soft_skills?: string[] | SkillItem[];
  projects?: ResumeProject[];
  project_details?: ResumeProject[];
  certifications?: ResumeCertification[];
  certificates?: ResumeCertification[];
  achievements?: ResumeAchievement[];
  awards?: ResumeAward[];
  languages?: ResumeLanguage[] | string[];
  languages_known?: ResumeLanguage[] | string[];
  internships?: ResumeExperience[];
  volunteering?: ResumeExperience[];
  hobbies?: string[] | Record<string, unknown>[];
  interests?: string[] | Record<string, unknown>[];
  publications?: Record<string, unknown>[];
  references?: Record<string, unknown>[];
  extracurricular_activities?: Record<string, unknown>[];
  certificate_of_participation?: Record<string, unknown>[];
  activities?: Record<string, unknown>[];
  personal_details?: Record<string, unknown>;
  parsed_data?: Record<string, unknown>;
  llm_data?: Record<string, unknown>;
  newly_added_skills?: string[];
  newly_added_soft_skills?: string[];
  social_links?: Record<string, string>;
  file_name?: string;
  success?: boolean;
}

// ============ JOB DESCRIPTION TYPES ============
export interface JobDescription {
  jd_id?: string;
  id?: string;
  existing_id?: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  requirements?: string[];
  skills_required?: string[];
  experience_required?: string;
  salary_range?: string;
}

export interface ParseJDResponse {
  raw: Record<string, unknown>;
  jd_id: string | null;
  duplicate: boolean;
}

// ============ MATCH TYPES ============
export interface MatchResult {
  match_id: string;
  resume_id: string;
  jd_id: string;
  job_description_id?: string;
  overall_score: number;
  ats_score?: number;
  skill_match_score?: number;
  experience_match_score?: number;
  education_match_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  recommendations?: string[];
  duplicate?: boolean;
  data?: Record<string, unknown>;
}

// ============ ATS TYPES ============
export interface ATSScore {
  total_score: number;
  keyword_score: number;
  format_score: number;
  section_score: number;
  missing_keywords?: string[];
  matched_keywords?: string[];
  breakdown?: ATSBreakdown;
  new_ats_score?: number;
  ats_scores?: {
    new?: number;
    old?: number;
  };
}

export interface ATSBreakdown {
  keywords?: number;
  formatting?: number;
  sections?: number;
  readability?: number;
  [key: string]: number | undefined;
}

// ============ ENHANCEMENT TYPES ============
export interface Improvement {
  id: string;
  original_suggestion_id?: string;
  fix_type?: string;
  category: string;
  section?: string | null;
  title: string;
  description: string;
  impact: string;
  impact_points: number;
  before: string;
  after: string;
  action_type?: string | null;
  replacement_text?: string | null;
}

export interface ValidationResults {
  total_issues: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  issues_by_category: Record<string, unknown>;
  all_issues: Improvement[];
}

export interface EnhancementDetails {
  context?: Record<string, unknown>;
  gaps?: {
    missing_keywords?: string[];
    missing_skills?: string[];
    experience_gaps?: string[];
    strength_keywords?: string[];
  };
  enhancements_applied?: Record<string, unknown>;
  v7_features?: Record<string, unknown>;
  validation_results: ValidationResults;
  fixes_applied?: Record<string, unknown>;
}

export interface EnhancementReport {
  summary: string;
  details: EnhancementDetails;
}

// ============ API RESPONSE TYPES ============
export interface ParseResumeResponse {
  resume_id: string;
  file_name: string;
  parsed_data?: ResumeData;
  success?: boolean;
}

export interface EnhanceResumeResponse {
  enhanced_resume_id: string;
  resume_id: string;
  success: boolean;
  mode?: string;
  // New response shape (POST /api/v1/resume/enhance)
  enhancer_state?: {
    resume?: Record<string, unknown>;
    ats_breakdown?: Record<string, unknown>;
  };
  suggestions?: Array<{
    id: string;
    section: string;
    message: string;
    fix_type: string;
    value?: string;
  }>;
  // Legacy/compat fields
  from_cache?: boolean;
  enhanced_resume?: ResumeData;
  enhancement_report?: EnhancementReport;
  user_id?: string;
  correlation_id?: string;
  trace_id?: string;
  Tokens_Used?: unknown;
}

export interface UpdateEnhancedResumeRequest {
  enhanced_sections: Record<string, unknown>;
}

export interface EnhancedResumeHistoryItem {
  id: string;
  user_id: string;
  original_resume_id: string;
  enhancement_type: string;
  enhanced_data: ResumeData;
  original_data: ResumeData;
  ats_score?: ATSScore;
  improvements?: Improvement[];
  enhancement_report: EnhancementReport;
  job_description_id?: string | null;
  region: string;
  created_at: string;
  updated_at: string;
}

export interface MatchAnalytics {
  resume_id?: string;
  jd_id?: string;
  match_id?: string;
  overall_match_percentage?: number;
  skill_match_percentage?: number;
  experience_match_percentage?: number;
  education_match_percentage?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  analysis?: Record<string, unknown>;
}

// ============ SKILL UPDATE TYPES ============
export interface SkillUpdateResponse {
  success: boolean;
  data?: MatchResult;
  skipped?: boolean;
  reason?: string;
  ats_scores?: ATSScore;
  updated_technical_skills?: string[];
  error?: string;
}
