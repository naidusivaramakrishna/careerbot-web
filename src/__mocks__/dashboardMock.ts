// Mock Dashboard Data for Development
// This allows frontend development without backend being ready
// Toggle with NEXT_PUBLIC_USE_MOCK_API environment variable

import { DashboardSummary } from '@/types/dashboard.types';

export const mockDashboardSummary: DashboardSummary = {
  user: {
    id: 'user_123',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
  },
  plan: {
    plan_id: 'FREE',
    plan_name: 'Free Plan',
    credits_total: 50,
    credits_remaining: 45,
  },
  profile: {
    completeness: 75, // Backend-computed
    missing_fields: ['LinkedIn URL', 'Certifications', 'Projects'],
  },
  recommended_step: {
    step_number: 3,
    step_name: 'ATS Scan',
    title: 'Check Your ATS Score',
    description: 'Find out how well your resume matches ATS systems and get optimization suggestions.',
    credit_cost: 5,
    estimated_time: '~15 seconds',
    cta_text: 'Start ATS Scan',
    cta_path: '/ats',
    icon: 'Search',
  },
  progress: {
    resume_uploaded: true,
    profile_completed: true, // >= 60%
    ats_scan_done: false,
    resume_enhanced: false,
    job_applied: false,
  },
  usage_counts: {
    resumes_created: 3,
    resumes_parsed: 2,
    ats_scans: 2,
    resumes_enhanced: 1,
    job_matches: 0,
    job_applications: 0,
    assessments_taken: 0,
  },
  best_scores: {
    ats_score: 72,
    job_match_score: undefined,
    interview_score: undefined,
  },
  recent_activity: [
    {
      id: 'act_1',
      feature: 'resume_parse',
      feature_label: 'Resume Parsed',
      credits_used: 5,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      result_summary: 'Found 12 skills, 2 jobs, 1 degree',
    },
    {
      id: 'act_2',
      feature: 'profile_update',
      feature_label: 'Profile Updated',
      credits_used: 0,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    },
    {
      id: 'act_3',
      feature: 'ats_scan',
      feature_label: 'ATS Scan Completed',
      credits_used: 5,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      result_summary: 'Score: 72/100',
    },
    {
      id: 'act_4',
      feature: 'enhancement',
      feature_label: 'Resume Enhanced',
      credits_used: 10,
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      result_summary: '15 improvements applied',
    },
  ],
  trending_roles: [
    {
      title: 'Software Engineer',
      growth: '+18%',
      tag: 'High demand',
      tag_color: '#1f4e98',
      tag_bg: 'rgba(31,78,152,0.1)',
      dot: '#2557a7',
      job_count: 1240,
    },
    {
      title: 'Data Analyst',
      growth: '+12%',
      tag: 'Growing',
      tag_color: '#15803d',
      tag_bg: 'rgba(21,128,61,0.1)',
      dot: '#22c55e',
      job_count: 860,
    },
  ],
};

// Mock for different user states

// New user (just signed up)
export const mockDashboardSummaryNewUser: DashboardSummary = {
  ...mockDashboardSummary,
  plan: {
    plan_id: 'FREE',
    plan_name: 'Free Plan',
    credits_total: 50,
    credits_remaining: 45,
  },
  profile: {
    completeness: 25,
    missing_fields: [
      'Phone',
      'Location',
      'LinkedIn URL',
      'Skills',
      'Experience',
      'Education',
      'Projects',
      'Certifications',
    ],
  },
  recommended_step: {
    step_number: 1,
    step_name: 'Upload Resume',
    title: 'Upload & Parse Your Resume',
    description: 'Upload your resume to auto-fill your profile and save time.',
    credit_cost: 5,
    estimated_time: '~15 seconds',
    cta_text: 'Upload Resume',
    cta_path: '/parser',
    icon: 'Upload',
  },
  progress: {
    resume_uploaded: false,
    profile_completed: false,
    ats_scan_done: false,
    resume_enhanced: false,
    job_applied: false,
  },
  usage_counts: {
    resumes_created: 0,
    resumes_parsed: 0,
    ats_scans: 0,
    resumes_enhanced: 0,
    job_matches: 0,
    job_applications: 0,
    assessments_taken: 0,
  },
  best_scores: {},
  recent_activity: [],
};

// Power user (high activity)
export const mockDashboardSummaryPowerUser: DashboardSummary = {
  ...mockDashboardSummary,
  user: {
    ...mockDashboardSummary.user,
    name: 'Arjun Mehta',
  },
  plan: {
    plan_id: 'PRO',
    plan_name: 'Pro Plan',
    credits_total: 500,
    credits_remaining: 245,
    plan_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  },
  profile: {
    completeness: 100,
    missing_fields: [],
  },
  recommended_step: {
    step_number: 5,
    step_name: 'Browse & Apply',
    title: 'Browse & Apply to Jobs',
    description: 'Your resume is optimized! Start applying to jobs that match your profile.',
    credit_cost: 0,
    estimated_time: 'FREE',
    cta_text: 'Browse Jobs',
    cta_path: '/jobs',
    icon: 'Briefcase',
  },
  progress: {
    resume_uploaded: true,
    profile_completed: true,
    ats_scan_done: true,
    resume_enhanced: true,
    job_applied: true,
  },
  usage_counts: {
    resumes_created: 15,
    resumes_parsed: 8,
    ats_scans: 12,
    resumes_enhanced: 5,
    job_matches: 24,
    job_applications: 18,
    assessments_taken: 2,
  },
  best_scores: {
    ats_score: 89,
    job_match_score: 92,
    interview_score: 78,
  },
  recent_activity: [
    {
      id: 'act_10',
      feature: 'job_application',
      feature_label: 'Applied to Job',
      credits_used: 0,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      result_summary: 'Senior Software Engineer @ Google',
    },
    {
      id: 'act_11',
      feature: 'job_match',
      feature_label: 'Job Match Analysis',
      credits_used: 8,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      result_summary: 'Match: 92% (Excellent)',
    },
    {
      id: 'act_12',
      feature: 'ats_scan',
      feature_label: 'ATS Scan Completed',
      credits_used: 5,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      result_summary: 'Score: 89/100',
    },
  ],
};

// Low credits warning state
export const mockDashboardSummaryLowCredits: DashboardSummary = {
  ...mockDashboardSummary,
  plan: {
    ...mockDashboardSummary.plan,
    credits_remaining: 8, // Low credits
  },
  recommended_step: {
    step_number: 0,
    step_name: 'Upgrade Plan',
    title: 'Upgrade for More Credits',
    description: 'You\'re running low on credits. Upgrade to continue using premium features.',
    credit_cost: 0,
    cta_text: 'View Plans',
    cta_path: '/pricing',
    icon: 'Crown',
  },
};

/**
 * Returns mock dashboard data for the current user state.
 *
 * Switch the return value to test different states:
 *   mockDashboardSummaryNewUser   → First-Time Dashboard (no resume)
 *   mockDashboardSummary          → Returning user (resume uploaded)
 *   mockDashboardSummaryPowerUser → Power user (all steps complete)
 *   mockDashboardSummaryLowCredits → Low credits warning
 */
export function getMockDashboardData(): DashboardSummary {
  return mockDashboardSummaryNewUser; // ← Shows First-Time Dashboard
}
