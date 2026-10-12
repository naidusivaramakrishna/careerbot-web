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

// ==================== CREDIT HISTORY (own account) ====================

/** GET — the signed-in user's own credit ledger (?page=&page_size=). */
export const CREDITS_HISTORY_PATH = '/credits/history';

/**
 * One ledger row as the END USER may see it. Deliberately has no admin
 * fields (admin_id / admin_email / reason / idempotency_key): the mapper
 * below builds rows from an allow-list, so even if the backend ever leaks
 * those keys they never reach the UI.
 */
export interface UserCreditHistoryItem {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  feature: string | null;
  balance_after: number | null;
  description: string | null;
}

export interface UserCreditHistoryResponse {
  items: UserCreditHistoryItem[];
  page: number;
  page_size: number;
  total: number;
}

const toUserHistoryItem = (raw: unknown, index: number): UserCreditHistoryItem => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    id: typeof r.id === 'string' && r.id ? r.id : `row-${index}`,
    created_at: typeof r.created_at === 'string' ? r.created_at : '',
    type: typeof r.type === 'string' ? r.type : 'other',
    amount: typeof r.amount === 'number' ? r.amount : 0,
    feature: typeof r.feature === 'string' ? r.feature : null,
    balance_after: typeof r.balance_after === 'number' ? r.balance_after : null,
    description: typeof r.description === 'string' ? r.description : null,
  };
};

export async function getMyCreditHistory(
  page: number = 1,
  pageSize: number = 20,
): Promise<UserCreditHistoryResponse> {
  const response = await httpClient.get<{ items?: unknown[]; page?: number; page_size?: number; total?: number }>(
    CREDITS_HISTORY_PATH,
    { params: { page, page_size: pageSize } },
  );
  const d = response.data ?? {};
  return {
    items: Array.isArray(d.items) ? d.items.map(toUserHistoryItem) : [],
    page: typeof d.page === 'number' ? d.page : page,
    page_size: typeof d.page_size === 'number' ? d.page_size : pageSize,
    total: typeof d.total === 'number' ? d.total : 0,
  };
}
