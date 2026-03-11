// Quota and Credit System Type Definitions
// Based on CAREERBOT_USER_DASHBOARD_DESIGN_V3.txt Section 9

export interface QuotaBalance {
  credits_remaining: number;
  credits_total: number;
  plan_id: string;
  plan_name: string;
  plan_expires_at?: string;
}

export interface UsageHistory {
  total: number;
  items: UsageLogItem[];
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface UsageLogItem {
  id: string;
  user_id: string;
  feature: string; // "resume_parse" | "ats_scan" | "enhancement" | "job_match" | "assessment" | "jd_parse" | "ai_review"
  feature_label: string;
  credits_used: number;
  tokens_used: number; // Actual LLM tokens (internal metric)
  cost_inr: number; // Cost in INR (internal metric)
  timestamp: string; // ISO date
  from_cache: boolean;
  details?: Record<string, unknown>; // Feature-specific metadata
}

// Credit cost mapping (single source of truth)
export const CREDIT_COSTS: Record<string, number> = {
  resume_parse: 5,
  ats_scan: 5,
  enhancement: 10,
  job_match: 8,
  jd_parse: 3,
  ai_review: 5,
  english_assessment: 15,
  // FREE features
  resume_create: 0,
  resume_export: 0,
  job_browse: 0,
  application_track: 0,
  profile_update: 0,
};

// Credit confirmation modal settings
export interface CreditConfirmSettings {
  featureName: string;
  creditCost: number;
  description: string;
  estimatedTime?: string;
  isFirstUse: boolean;
  balanceAfterAction: number;
}

// Adaptive modal rules
export function shouldShowCreditModal(
  creditCost: number,
  isFirstUse: boolean,
  creditsRemaining: number,
  userPreference?: 'always' | 'high_cost_only'
): boolean {
  // First time using ANY credit feature
  if (isFirstUse) return true;

  // Action costs >= 10 credits
  if (creditCost >= 10) return true;

  // Balance < 2x action cost (low balance warning)
  if (creditsRemaining < creditCost * 2) return true;

  // Action costs 5-9 credits AND user hasn't disabled
  if (creditCost >= 5 && creditCost < 10) {
    return userPreference !== 'high_cost_only';
  }

  // Action costs < 5 credits: inline confirmation only
  return false;
}

// First-use tracking (localStorage keys)
export const FIRST_USE_STORAGE_KEY = 'careerbot_first_use';

export function markFeatureAsUsed(featureId: string): void {
  if (typeof window === 'undefined') return;

  const firstUseData = JSON.parse(
    localStorage.getItem(FIRST_USE_STORAGE_KEY) || '{}'
  );
  firstUseData[featureId] = true;
  localStorage.setItem(FIRST_USE_STORAGE_KEY, JSON.stringify(firstUseData));
}

export function isFirstTimeUsingFeature(featureId: string): boolean {
  if (typeof window === 'undefined') return false;

  const firstUseData = JSON.parse(
    localStorage.getItem(FIRST_USE_STORAGE_KEY) || '{}'
  );
  return !firstUseData[featureId];
}

export function isFirstTimeUsingAnyFeature(): boolean {
  if (typeof window === 'undefined') return false;

  const firstUseData = JSON.parse(
    localStorage.getItem(FIRST_USE_STORAGE_KEY) || '{}'
  );
  return Object.keys(firstUseData).length === 0;
}
