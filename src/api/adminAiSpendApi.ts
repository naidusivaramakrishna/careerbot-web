import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

/**
 * What AI is costing, and who is causing it.
 *
 * ADMIN ONLY. The top-students list NAMES people -- that is the point, since
 * finding the one account behaving unlike a student is why a per-user ceiling
 * exists -- but this must never be reachable from a college screen. A
 * placement officer seeing "Ravi cost $47" is a different and much worse
 * product.
 */

export interface SpendByFeature {
  service: string;
  operation: string;
  cost_usd: number;
  calls: number;
}

export interface SpendBySubject {
  id: string;
  cost_usd: number;
  calls: number;
}

export interface AiSpendSummary {
  since: string;
  until: string;
  total_cost_usd: number;
  total_calls: number;
  /**
   * HOW MUCH OF THE TOTAL IS REAL. A figure built mostly from estimates is
   * not one to price from, and a screen that did not say so would be read as
   * though it were. The ratio against total_calls is the reader's confidence.
   */
  measured_calls: number;
  by_feature: SpendByFeature[];
  /** Platform spend (the pool filler) belongs to nobody and appears in the
   *  total but in NEITHER list -- naming a college that did not cause a cost
   *  would be worse than omitting it. */
  top_colleges: SpendBySubject[];
  top_students: SpendBySubject[];
}

export const getAiSpend = async (
  days = 30, limit = 20,
): Promise<AiSpendSummary> => {
  try {
    const { data } = await httpClient.get<AiSpendSummary>(
      `/admin/ai-spend?days=${days}&limit=${limit}`);
    return data;
  } catch (error) {
    logger.error('Error fetching AI spend:', error);
    throw error;
  }
};
