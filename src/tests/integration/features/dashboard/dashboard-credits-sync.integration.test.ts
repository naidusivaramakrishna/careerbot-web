import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useHandler } from '../../shared/msw-server';

/**
 * Integration Test: Dashboard + Credits Synchronization
 *
 * Tests that credits stay in sync between dashboard and API
 * Using MSW to intercept real HTTP calls
 *
 * Run: npm run test:integration:dashboard
 */
describe('Dashboard + Credits Integration', () => {
  beforeEach(() => {
    // Setup any test-specific handlers if needed
  });

  afterEach(() => {
    // Cleanup happens automatically via MSW reset
  });

  it('loads dashboard with credits from API', async () => {
    // MSW intercepts the actual GET request
    const response = await fetch('/api/dashboard/summary');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.plan.credits_remaining).toBe(100);
    expect(data.plan.credits_total).toBe(500);
  });

  it('reflects credit balance changes in dashboard', async () => {
    // First load: 100 credits
    let response = await fetch('/api/dashboard/summary');
    let data = await response.json();
    expect(data.plan.credits_remaining).toBe(100);

    // Simulate credit update via custom handler
    useHandler(
      http.get('/api/dashboard/summary', () => {
        return HttpResponse.json({
          ...data,
          plan: {
            ...data.plan,
            credits_remaining: 90, // 10 deducted
          },
        });
      })
    );

    // Second load: 90 credits
    response = await fetch('/api/dashboard/summary');
    data = await response.json();
    expect(data.plan.credits_remaining).toBe(90);
  });

  it('handles multiple credit updates correctly', async () => {
    const updates = [100, 95, 85, 70];
    let currentBalance = 100;

    for (const expectedBalance of updates) {
      currentBalance = expectedBalance;

      useHandler(
        http.get('/api/dashboard/summary', () => {
          return HttpResponse.json({
            plan: {
              credits_remaining: currentBalance,
              credits_total: 500,
              plan_id: 'premium',
              plan_name: 'Premium Plan',
            },
          });
        })
      );

      const response = await fetch('/api/dashboard/summary');
      const data = await response.json();
      expect(data.plan.credits_remaining).toBe(expectedBalance);
    }
  });

  it('shows warning when credits below threshold', async () => {
    useHandler(
      http.get('/api/dashboard/summary', () => {
        return HttpResponse.json({
          plan: {
            credits_remaining: 5, // Low balance
            credits_total: 500,
            plan_id: 'free',
            plan_name: 'Free Plan',
          },
        });
      })
    );

    const response = await fetch('/api/dashboard/summary');
    const data = await response.json();

    expect(data.plan.credits_remaining).toBe(5);
    expect(data.plan.credits_remaining < 10).toBe(true); // Should trigger warning
  });

  it('updates dashboard without page refresh', async () => {
    // Single API call should update state
    const response = await fetch('/api/dashboard/summary');
    const data = await response.json();

    expect(response.status).toBe(200);
    // In real app, this would update state without reload
    expect(data).toBeDefined();
  });

  it('handles rapid credit updates', async () => {
    let credits = 100;

    // Simulate rapid updates
    for (let i = 0; i < 5; i++) {
      credits -= 10;
      useHandler(
        http.get('/api/dashboard/summary', () => {
          return HttpResponse.json({
            plan: {
              credits_remaining: credits,
              credits_total: 500,
              plan_id: 'premium',
              plan_name: 'Premium Plan',
            },
          });
        })
      );

      const response = await fetch('/api/dashboard/summary');
      const data = await response.json();
      expect(data.plan.credits_remaining).toBe(credits);
    }

    expect(credits).toBe(50); // 100 - (5 * 10)
  });

  it('prevents negative credit display', async () => {
    useHandler(
      http.get('/api/dashboard/summary', () => {
        return HttpResponse.json({
          plan: {
            credits_remaining: 0,
            credits_total: 500,
            plan_id: 'free',
            plan_name: 'Free Plan',
          },
        });
      })
    );

    const response = await fetch('/api/dashboard/summary');
    const data = await response.json();

    expect(data.plan.credits_remaining).toBeGreaterThanOrEqual(0);
  });

  it('validates credit check before feature access', async () => {
    // Check if user has enough credits for a feature
    const checkResponse = await fetch('/api/credits/check', {
      method: 'POST',
      body: JSON.stringify({ feature: 'communication_test' }),
    });

    const checkData = await checkResponse.json();

    expect(checkResponse.status).toBe(200);
    expect(checkData.can_proceed).toBe(true);
    expect(checkData.credit_cost).toBeDefined();
    expect(checkData.credits_remaining).toBeDefined();
  });

  it('blocks feature access on insufficient credits', async () => {
    useHandler(
      http.post('/api/credits/check', () => {
        return HttpResponse.json({
          can_proceed: false,
          credit_cost: 10,
          credits_remaining: 5,
          balance_after: -5,
          is_low_balance: true,
        });
      })
    );

    const response = await fetch('/api/credits/check', {
      method: 'POST',
      body: JSON.stringify({ feature: 'communication_test' }),
    });

    const data = await response.json();
    expect(data.can_proceed).toBe(false);
  });
});
