import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/http', () => ({
  httpClient: { get: vi.fn(), put: vi.fn() },
}));

import { httpClient } from '@/lib/http';
import { getLeaderboard, setMyMockTestLeaderboardConsent } from '@/api/mockTestApi';

const get = httpClient.get as unknown as ReturnType<typeof vi.fn>;
const put = httpClient.put as unknown as ReturnType<typeof vi.fn>;

const base = {
  percentile: 50, rank: 2, total_users: 3, avg_score: 40, total_attempts: 3,
  top_10: [
    { display_name: 'topper', score: 90, date: '2026-03-01', is_current_user: false },
    { display_name: 'me', score: 40, date: '2026-03-02', is_current_user: true },
    { display_name: 'Anonymous learner', score: 30, date: null, is_current_user: false },
  ],
};

describe('mock-test leaderboard consent API', () => {
  beforeEach(() => { get.mockReset(); put.mockReset(); });

  it('PUTs only the caller\'s own choice, with no user id', async () => {
    put.mockResolvedValueOnce({ data: { opt_in: true, changed: true } });
    const out = await setMyMockTestLeaderboardConsent(true);
    expect(put).toHaveBeenCalledWith('/mock-test/analytics/leaderboard/consent', { opt_in: true });
    expect(out).toEqual({ opt_in: true, changed: true });
  });

  it('carries my_leaderboard_opt_in through as my_opt_in', async () => {
    get.mockResolvedValueOnce({ data: { ...base, my_leaderboard_opt_in: false } });
    const board = await getLeaderboard();
    expect(board.my_opt_in).toBe(false);
    expect(board.entries.map((e) => e.name)).toEqual(['topper', 'me', 'Anonymous learner']);
    expect(board.entries[1].is_current_user).toBe(true);
  });

  it('a missing or null my_leaderboard_opt_in is UNKNOWN (null), not off', async () => {
    get.mockResolvedValueOnce({ data: { ...base } });
    expect((await getLeaderboard()).my_opt_in).toBeNull();
    get.mockResolvedValueOnce({ data: { ...base, my_leaderboard_opt_in: null } });
    expect((await getLeaderboard()).my_opt_in).toBeNull();
    get.mockResolvedValueOnce({ data: { ...base, my_leaderboard_opt_in: 'true' } });
    expect((await getLeaderboard()).my_opt_in).toBeNull();
  });
});
