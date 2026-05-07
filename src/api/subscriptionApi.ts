/**
 * Subscription API
 *
 * Endpoints for managing subscription plans and plan information.
 */

import httpClient from '@/lib/http';

export interface PlanFeatures {
  resumes_limit: number | string;
  exports_limit: number | string;
  ats_scans_limit: number | string;
  job_matches_limit: number | string;
  assessments_limit: number | string;
  ai_features: string;
  support: string;
  additional?: string[];
}

export interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  price_inr: number;
  price_display: string;
  credits: number;
  popular: boolean;
  recommended: boolean;
  features: PlanFeatures;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
}

export interface CurrentSubscription {
  plan_id: string;
  plan_name: string;
  status: string;
  billing_cycle: string | null;
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
  cancelled_at: string | null;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  next_reset_at: string | null;
}

/**
 * GET /subscription/plans
 * Returns all available subscription plans with features and pricing.
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
  const response = await httpClient.get<SubscriptionPlansResponse>('/subscription/plans');
  return response.data;
}

/**
 * GET /subscription/current
 * Returns the current user's subscription details including plan, billing status, and credit info.
 */
export async function getCurrentSubscription(): Promise<CurrentSubscription> {
  const response = await httpClient.get<CurrentSubscription>('/subscription/current');
  return response.data;
}
