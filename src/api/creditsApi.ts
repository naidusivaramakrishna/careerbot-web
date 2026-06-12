/**
 * Credits API
 *
 * Endpoints for managing user credits and credit balance.
 */

import httpClient from '@/lib/http';

export interface CreditsBalance {
  credits_remaining: number;
  credits_total: number;
  plan_id: string;
  plan_name: string;
  plan_expires_at?: string | null;
}

export interface UsageItem {
  id: string;
  feature: string;
  feature_label: string;
  credits_used: number;
  timestamp: string;
  result_summary?: string;
  status: 'success' | 'failed' | 'pending';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CreditsUsageResponse {
  total: number;
  items: UsageItem[];
  pagination: PaginationInfo;
}

export interface CreditCheckRequest {
  feature: string;
}

export interface CreditCheckResponse {
  can_proceed: boolean;
  credit_cost: number;
  credits_remaining: number;
  balance_after: number;
  is_low_balance: boolean;
}

/**
 * GET /credits/balance
 * Returns the user's current credit balance and plan information.
 * Useful for real-time credit updates without fetching the entire dashboard.
 */
export async function getCreditsBalance(
  options: { skipAuthRedirect?: boolean } = {}
): Promise<CreditsBalance> {
  const response = await httpClient.get<CreditsBalance>('/credits/balance', {
    headers: {
      ...(options.skipAuthRedirect && { 'X-Skip-Login-Redirect': 'true' }),
    },
  });
  return response.data;
}

/**
 * GET /credits/usage
 * Returns the user's credit usage history with pagination support.
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 */
export async function getCreditsUsage(
  page: number = 1,
  limit: number = 20,
): Promise<CreditsUsageResponse> {
  const response = await httpClient.get<CreditsUsageResponse>('/credits/usage', {
    params: { page, limit },
  });
  return response.data;
}

/**
 * POST /credits/check
 * Pre-checks if the user has sufficient credits before performing a feature action.
 * Returns credit cost, remaining balance, and low balance status.
 * @param feature - Feature identifier (e.g., 'ats_scan', 'resume_parse')
 */
export async function checkCredits(feature: string): Promise<CreditCheckResponse> {
  const response = await httpClient.post<CreditCheckResponse>('/credits/check', {
    feature,
  });
  return response.data;
}
