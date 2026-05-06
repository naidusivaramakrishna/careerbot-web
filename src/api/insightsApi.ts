import { httpClient } from '@/lib/http';

// ==================== SKILL GAPS ====================

export interface SkillGapItem {
  skill: string;
  in_jobs_pct: number;
  priority: 'high' | 'low';
}

export interface SkillGapsResponse {
  user_skills: string[];
  target_title: string | null;
  missing_critical: SkillGapItem[];
  missing_nice_to_have: SkillGapItem[];
  strongest_skills: SkillGapItem[];
  jobs_analyzed: number;
  avg_match_band: 'strong' | 'good' | 'partial' | 'low';
}

export interface SkillGapsParams {
  top_n?: number;
  target_title?: string;
}

export const getSkillGaps = async (params: SkillGapsParams = {}): Promise<SkillGapsResponse> => {
  const response = await httpClient.get<SkillGapsResponse>('/insights/skill-gaps', { params });
  return response.data;
};

// ==================== TRENDING SKILLS ====================

export interface TrendingSkillItem {
  skill: string;
  demand_pct: number;
}

export interface TrendingSkillsResponse {
  category: string | null;
  skills: TrendingSkillItem[];
  jobs_analyzed: number;
  period: string;
}

export interface TrendingSkillsParams {
  category?: string;
  top_n?: number;
}

export const getTrendingSkills = async (params: TrendingSkillsParams = {}): Promise<TrendingSkillsResponse> => {
  const response = await httpClient.get<TrendingSkillsResponse>('/insights/trending-skills', { params });
  return response.data;
};

// ==================== MATCH EXPLANATION ====================

export interface ComponentExplanation {
  score: number;
  detail: string;
}

export interface SkillsExplanation extends ComponentExplanation {
  matched: string[];
  missing: string[];
}

export interface TitleExplanation extends ComponentExplanation {
  user_title: string | null;
  job_title: string;
}

export interface ExperienceExplanation extends ComponentExplanation {
  user_years: number;
  job_range: string | null;
}

export interface EducationExplanation extends ComponentExplanation {
  user_level: string | null;
  job_level: string | null;
}

export interface LocationExplanation extends ComponentExplanation {
  user_location: string | null;
  job_location: string | null;
  work_mode: string | null;
}

export interface MatchExplanationResponse {
  job_id: string;
  score: number;
  band: 'strong' | 'good' | 'partial' | 'low';
  explanation: {
    skills: SkillsExplanation;
    title: TitleExplanation;
    experience: ExperienceExplanation;
    education: EducationExplanation;
    location: LocationExplanation;
  };
}

export const getMatchExplanation = async (jobId: string): Promise<MatchExplanationResponse> => {
  const response = await httpClient.get<MatchExplanationResponse>(`/insights/match-explanation/${jobId}`);
  return response.data;
};

const insightsApi = {
  getSkillGaps,
  getTrendingSkills,
  getMatchExplanation,
};

export default insightsApi;
