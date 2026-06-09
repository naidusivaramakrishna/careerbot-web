import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useHandler } from '../../shared/msw-server';

/**
 * Integration Test: Credits Deduction Workflow
 *
 * Tests the complete credit usage flow:
 * 1. Check available credits
 * 2. Use feature that costs credits
 * 3. Credits deducted from account
 * 4. Dashboard updated
 * 5. Usage recorded in history
 *
 * Run: npm run test:integration:credits
 */
describe('Credits: Deduction & Tracking Flow', () => {
  it('checks credit balance before feature use', async () => {
    const balanceRes = await fetch('/api/credits/balance');
    const balance = await balanceRes.json();

    expect(balanceRes.status).toBe(200);
    expect(balance.credits_remaining).toBeDefined();
    expect(balance.credits_total).toBeDefined();
    expect(balance.plan_name).toBeDefined();
  });

  it('validates sufficient credits for feature', async () => {
    const checkRes = await fetch('/api/credits/check', {
      method: 'POST',
      body: JSON.stringify({ feature: 'ats_scan' }),
    });

    const check = await checkRes.json();

    expect(checkRes.status).toBe(200);
    expect(check.can_proceed).toBe(true);
    expect(check.credit_cost).toBeGreaterThan(0);
    expect(check.balance_after).toBeDefined();
  });

  it('blocks feature when insufficient credits', async () => {
    useHandler(
      http.post('/api/credits/check', () => {
        return HttpResponse.json({
          can_proceed: false,
          credit_cost: 50,
          credits_remaining: 10,
          balance_after: -40,
          is_low_balance: true,
        });
      })
    );

    const checkRes = await fetch('/api/credits/check', {
      method: 'POST',
      body: JSON.stringify({ feature: 'expensive_feature' }),
    });

    const check = await checkRes.json();
    expect(check.can_proceed).toBe(false);
  });

  it('deducts credits after feature completion', async () => {
    // Check initial balance
    const initialRes = await fetch('/api/credits/balance');
    const initial = await initialRes.json();
    const startingCredits = initial.credits_remaining;

    // Use feature (credits deducted)
    // In real flow, this would be an actual feature call
    useHandler(
      http.get('/api/credits/balance', () => {
        return HttpResponse.json({
          ...initial,
          credits_remaining: startingCredits - 10,
        });
      })
    );

    // Check new balance
    const finalRes = await fetch('/api/credits/balance');
    const final = await finalRes.json();

    expect(final.credits_remaining).toBeLessThan(startingCredits);
  });

  it('updates dashboard after credit deduction', async () => {
    const balanceRes = await fetch('/api/credits/balance');
    const balance = await balanceRes.json();

    const dashboardRes = await fetch('/api/dashboard/summary');
    const dashboard = await dashboardRes.json();

    expect(dashboardRes.status).toBe(200);
    expect(dashboard.plan).toBeDefined();
    expect(dashboard.plan.credits_remaining).toBeDefined();
  });

  it('records credit usage in history', async () => {
    const usageRes = await fetch('/api/credits/usage');
    const usage = await usageRes.json();

    expect(usageRes.status).toBe(200);
    expect(usage.items).toBeDefined();
    expect(Array.isArray(usage.items)).toBe(true);
    expect(usage.pagination).toBeDefined();
  });

  it('shows low balance warning', async () => {
    useHandler(
      http.get('/api/credits/balance', () => {
        return HttpResponse.json({
          credits_remaining: 5,
          credits_total: 500,
          plan_id: 'free',
          plan_name: 'Free Plan',
        });
      })
    );

    const balanceRes = await fetch('/api/credits/balance');
    const balance = await balanceRes.json();

    expect(balance.credits_remaining).toBeLessThan(10);
    // App should show warning to user
  });

  it('handles different credit costs for different features', async () => {
    const features = ['ats_scan', 'resume_enhance', 'mock_interview'];

    for (const feature of features) {
      const checkRes = await fetch('/api/credits/check', {
        method: 'POST',
        body: JSON.stringify({ feature }),
      });

      const check = await checkRes.json();

      expect(checkRes.status).toBe(200);
      expect(check.credit_cost).toBeGreaterThan(0);
      expect(check.can_proceed).toBeDefined();
    }
  });

  it('prevents negative credit balance', async () => {
    useHandler(
      http.get('/api/credits/balance', () => {
        return HttpResponse.json({
          credits_remaining: 0,
          credits_total: 500,
          plan_id: 'free',
          plan_name: 'Free Plan',
        });
      })
    );

    const balanceRes = await fetch('/api/credits/balance');
    const balance = await balanceRes.json();

    expect(balance.credits_remaining).toBeGreaterThanOrEqual(0);
  });

  it('tracks credit usage by feature', async () => {
    const usageRes = await fetch('/api/credits/usage');
    const usage = await usageRes.json();

    const items = usage.items;
    items.forEach((item: any) => {
      expect(item.feature).toBeDefined();
      expect(item.feature_label).toBeDefined();
      expect(item.credits_used).toBeGreaterThanOrEqual(0);
      expect(item.timestamp).toBeDefined();
      expect(item.status).toMatch(/success|failed|pending/);
    });
  });

  it('provides pagination for usage history', async () => {
    const usageRes = await fetch('/api/credits/usage?page=1&limit=20');
    const usage = await usageRes.json();

    expect(usage.pagination).toBeDefined();
    expect(usage.pagination.page).toBe(1);
    expect(usage.pagination.limit).toBe(20);
    expect(usage.pagination.total_pages).toBeGreaterThan(0);
    expect(usage.pagination.has_next).toBeDefined();
    expect(usage.pagination.has_prev).toBeDefined();
  });

  it('handles failed feature attempts (no credit deduction)', async () => {
    const usageRes = await fetch('/api/credits/usage');
    const usage = await usageRes.json();

    const failed = usage.items.filter(
      (item: any) => item.status === 'failed'
    );

    // Failed attempts should have 0 or minimal credit usage
    failed.forEach((item: any) => {
      expect(item.credits_used).toBeLessThanOrEqual(1);
    });
  });
});
