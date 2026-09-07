import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

/**
 * Who used which AI feature, and how much of it.
 *
 * TWO SHAPES BECAUSE THERE ARE TWO PRODUCTS. B2C is an individual: the
 * question is what THIS person did, feature by feature. B2B is a college: the
 * question is which student is the outlier. A breakdown and a roster are
 * different screens, so they are different calls.
 *
 * COST IS OPTIONAL ON EVERY TYPE HERE, and that is not defensiveness -- the
 * server omits it entirely for a caller without billing permission, which is
 * how the platform admin role manages colleges without seeing what the
 * platform's AI costs. Rendering must treat missing cost as normal, never as
 * an error or a zero: a displayed "$0.00" would be a lie about a real spend.
 */

export interface UsageRow {
  service: string;
  operation: string;
  calls: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  /** How many of `calls` carry a real measured cost rather than an estimate. */
  measured_calls: number;
  last_used?: string | null;
  /** Absent unless the caller holds billing permission. */
  cost_usd?: number;
}

export interface UsageTotals {
  calls: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  measured_calls: number;
  active_users?: number;
  cost_usd?: number;
}

export interface UserAiUsage {
  user_id: string;
  since: string;
  until: string;
  totals: UsageTotals;
  features: UsageRow[];
}

export interface StudentUsageRow {
  user_id: string;
  display_name: string;
  calls: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  measured_calls: number;
  last_used?: string | null;
  cost_usd?: number;
}

export interface InstitutionAiUsage {
  institution_id: string;
  since: string;
  until: string;
  /** Everyone enrolled, including those who have used no AI at all. */
  member_count: number;
  totals: UsageTotals;
  features: UsageRow[];
  /** Only members who actually used AI, heaviest first, capped by `limit`. */
  students: StudentUsageRow[];
}

/** One person's usage, by feature. The B2C view. */
export const getUserAiUsage = async (
  userId: string, days = 30,
): Promise<UserAiUsage> => {
  try {
    const { data } = await httpClient.get<UserAiUsage>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/ai-usage`,
      { params: { days } },
    );
    return data;
  } catch (error) {
    logger.error('Failed to load user AI usage', error);
    throw error;
  }
};

/** A college's usage and its student roster. The B2B view. */
export const getInstitutionAiUsage = async (
  institutionId: string, days = 30, limit = 50,
): Promise<InstitutionAiUsage> => {
  try {
    const { data } = await httpClient.get<InstitutionAiUsage>(
      `/api/v1/admin/institutions/${encodeURIComponent(institutionId)}/ai-usage`,
      { params: { days, limit } },
    );
    return data;
  } catch (error) {
    logger.error('Failed to load institution AI usage', error);
    throw error;
  }
};

/** Feature keys are stored as snake_case; screens show them to people. */
export const featureLabel = (service: string, operation: string): string => {
  const words = (s: string) =>
    s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return `${words(service)} · ${words(operation)}`;
};

/**
 * Token counts run to millions, and a raw 4183920 is unreadable in a column.
 * Kept above 1000 exact so small numbers stay precise where precision matters.
 */
export const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
};
