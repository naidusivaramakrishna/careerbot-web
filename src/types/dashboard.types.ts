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
    resume_enhanced: boolean;
    job_applied: boolean;
  };
  usage_counts: {
    resumes_created: number;
    resumes_parsed: number;
    ats_scans: number;
    resumes_enhanced: number;
    job_matches: number;
    job_applications: number;
    assessments_taken: number;
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
  feature: string; // "resume_parse" | "ats_scan" | "enhancement" | "job_match" | "assessment" | "profile_update" | "resume_create"
  feature_label: string; // User-friendly name
  credits_used: number;
  timestamp: string; // ISO date
  result_summary?: string; // e.g., "ATS Score: 72", "Match: 78%"
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  cost: number; // Credits, 0 = FREE
  costType: 'credits' | 'free';
  usageCount?: number; // From dashboard summary
  path: string;
  badge?: string; // e.g., "NEW", "POPULAR"
}

// Static configuration for Quick Actions (costs and labels are static)
export const QUICK_ACTIONS: Omit<QuickAction, 'usageCount'>[] = [
  {
    id: 'build-resume',
    label: 'Build Resume',
    description: 'Create a professional resume',
    icon: 'FileText',
    cost: 0,
    costType: 'free',
    path: '/builder/start',
  },
  {
    id: 'ats-scan',
    label: 'ATS Scan',
    description: 'Check your ATS compatibility',
    icon: 'Search',
    cost: 5,
    costType: 'credits',
    path: '/ats',
  },
  {
    id: 'enhance-resume',
    label: 'Enhance Resume',
    description: 'AI-powered resume enhancement',
    icon: 'Sparkles',
    cost: 10,
    costType: 'credits',
    path: '/enhancer',
  },
  {
    id: 'job-match',
    label: 'Job Match',
    description: 'Match resume to job description',
    icon: 'Target',
    cost: 8,
    costType: 'credits',
    path: '/jobmatch',
  },
  {
    id: 'browse-jobs',
    label: 'Browse Jobs',
    description: 'Explore 150+ job opportunities',
    icon: 'Briefcase',
    cost: 0,
    costType: 'free',
    path: '/jobs',
  },
  {
    id: 'interview-prep',
    label: 'Communication',
    description: 'Practice communication skills',
    icon: 'Mic',
    cost: 15,
    costType: 'credits',
    path: '/communication',
  },
  {
    id: 'track-apps',
    label: 'Track Applications',
    description: 'Manage your job applications',
    icon: 'ClipboardList',
    cost: 0,
    costType: 'free',
    path: '/tracker',
  },
  {
    id: 'upgrade-plan',
    label: 'Upgrade Plan',
    description: 'Get more credits and features',
    icon: 'Crown',
    cost: 0,
    costType: 'free',
    path: '/pricing',
    badge: 'PRO',
  },
];

// Progress step configuration
export interface ProgressStep {
  number: number;
  label: string;
  completed: boolean;
}

export const PROGRESS_STEPS = [
  { number: 1, label: 'Upload Resume' },
  { number: 2, label: 'Complete Profile' },
  { number: 3, label: 'ATS Scan' },
  { number: 4, label: 'Enhance' },
  { number: 5, label: 'Apply to Jobs' },
];
