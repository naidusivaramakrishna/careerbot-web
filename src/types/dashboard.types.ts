// Dashboard Type Definitions
// Based on CAREERBOT_USER_DASHBOARD_DESIGN_V3.txt

export interface DashboardSummary {
  user: {
    id: string;
    name: string;
    email: string;
    profile_picture_url?: string;
  };
  plan: {
    plan_id: string;
    plan_name: string;
    credits_total: number;
    credits_remaining: number;
    plan_expires_at?: string;
  };
  profile: {
    completeness: number; // Backend-computed percentage (0-100)
    missing_fields: string[];
  };
  recommended_step: RecommendedStep;
  progress: {
    resume_uploaded: boolean;
    profile_completed: boolean; // >= 60%
    ats_scan_done: boolean;
    job_applied: boolean;
  };
  usage_counts: {
    resumes_created: number;
    resumes_parsed: number;
    ats_scans: number;
    job_matches: number;
    job_applications: number;
    assessments_taken: number;
    mock_tests_taken: number;
    mock_interviews_taken: number;
    coding_tests_taken: number;
  };
  best_scores: {
    ats_score?: number; // 0-100
    job_match_score?: number; // 0-100
    interview_score?: number; // 0-100
  };
  recent_activity: Activity[];
  trending_roles: TrendingRole[];
}

export interface TrendingRole {
  title: string;
  growth: string;
  tag: string;
  tag_color: string;
  tag_bg: string;
  dot: string;
  job_count?: number;
  vacancies?: number;
}

export interface RecommendedStep {
  step_number: number; // 1-5
  step_name: string;
  title: string;
  description: string;
  credit_cost: number;
  estimated_time?: string;
  cta_text: string;
  cta_path: string;
  icon?: string;
}

export interface Activity {
  id: string;
  type?: string;
  feature: string; // "resume_parse" | "ats_scan" | "enhancement" | "job_match" | "assessment" | "profile_update" | "resume_create"
  feature_label: string; // User-friendly name
  credits_used: number;
  timestamp: string; // ISO date
  result_summary?: string; // e.g., "ATS Score: 72", "Match: 78%"
}

