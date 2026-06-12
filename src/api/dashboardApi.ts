/**
 * Dashboard API
 *
 * Endpoints for fetching user dashboard summary and analytics.
 */

import { DashboardSummary } from '@/types/dashboard.types';
import httpClient from '@/lib/http';

/**
 * GET /dashboard/summary
 * Returns the full dashboard aggregation for the authenticated user.
 * (httpClient already prepends /api/v1 to all requests)
 */
export async function getDashboardSummary(
  options: { skipAuthRedirect?: boolean } = {}
): Promise<DashboardSummary> {
  const response = await httpClient.get<DashboardSummary>('/dashboard/summary', {
    headers: {
      ...(options.skipAuthRedirect && { 'X-Skip-Login-Redirect': 'true' }),
    },
  });
  return response.data;
}
