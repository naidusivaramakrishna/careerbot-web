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
  try {
    const response = await httpClient.get<DashboardSummary>('/dashboard/summary', {
      headers: {
        ...(options.skipAuthRedirect && { 'X-Skip-Login-Redirect': 'true' }),
      },
    });

    // Enrich dashboard data with mock test analytics
    try {
      const mockTestAnalytics = await httpClient.get<any>('/mock-test/analytics/progress', {
        headers: {
          ...(options.skipAuthRedirect && { 'X-Skip-Login-Redirect': 'true' }),
        },
      });

      const analytics = mockTestAnalytics.data?.data ?? mockTestAnalytics.data;
      if (analytics && analytics.total_tests > 0) {
        response.data.mock_test_stats = {
          total_tests: analytics.total_tests ?? 0,
          average_accuracy: analytics.average_accuracy ?? 0,
          best_score: analytics.best_score ?? 0,
          latest_score: analytics.latest_score,
        };
        response.data.best_scores.mock_test_accuracy = analytics.average_accuracy ?? 0;
      }
    } catch {
      // Mock test analytics endpoint may not be available or user has no tests
      // Continue without it
    }

    return response.data;
  } catch (err) {
    throw err;
  }
}
