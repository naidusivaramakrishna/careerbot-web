/**
 * Quota / Credits API
 *
 * Mock-backed stubs for quota and usage-history endpoints.
 * Replace mock calls with real httpClient calls once the backend is ready.
 */

import { QuotaBalance, UsageHistory } from '@/types/quota.types';
import { getMockQuotaBalance, getMockUsageHistory } from '@/__mocks__/quotaMock';

// import httpClient from '@/lib/http';

/**
 * GET /users/me/quota
 * Returns current credit balance and plan info.
 */
export async function getQuotaBalance(): Promise<QuotaBalance> {
  // TODO: Replace with real endpoint when backend is ready
  // const response = await httpClient.get<QuotaBalance>('/users/me/quota');
  // return response.data;

  await new Promise((resolve) => setTimeout(resolve, 300));
  return getMockQuotaBalance();
}

/**
 * GET /users/me/usage-history?page=1&limit=20
 * Returns paginated usage log for the authenticated user.
 */
export async function getUsageHistory(
  page: number = 1,
  limit: number = 20
): Promise<UsageHistory> {
  // TODO: Replace with real endpoint when backend is ready
  // const response = await httpClient.get<UsageHistory>(
  //   `/users/me/usage-history?page=${page}&limit=${limit}`
  // );
  // return response.data;

  await new Promise((resolve) => setTimeout(resolve, 400));
  return getMockUsageHistory('default', page, limit);
}
