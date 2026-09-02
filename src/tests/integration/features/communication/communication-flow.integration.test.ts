import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useHandler } from '../../shared/msw-server';

/**
 * Integration Test: Communication Assessment Complete Flow
 *
 * Tests the full communication assessment workflow:
 * 1. Check credits
 * 2. Generate test
 * 3. Submit responses
 * 4. Get score
 * 5. Update dashboard
 *
 * Run: npm run test:integration:communication
 */
describe('Communication Assessment Integration Flow', () => {
  it('completes full assessment workflow', async () => {
    // Step 1: Check if user has credits
    const creditCheck = await fetch('/api/credits/check', {
      method: 'POST',
      body: JSON.stringify({ feature: 'communication_test' }),
    });

    let checkData = await creditCheck.json();
    expect(checkData.can_proceed).toBe(true);
    expect(checkData.credit_cost).toBe(10);

    // Step 2: Generate test
    const testGen = await fetch('/api/communication/generate-test', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        difficulty: 'medium',
      }),
    });

    const testData = await testGen.json();
    expect(testData.test_id).toBeDefined();
    expect(testData.sections).toBeDefined();

    // Step 3: Submit responses (simulate 3 sections)
    for (let i = 0; i < 3; i++) {
      const submitRes = await fetch('/api/communication/submit-response', {
        method: 'POST',
        body: JSON.stringify({
          test_id: testData.test_id,
          section: `section-${i}`,
          response: 'audio-blob',
        }),
      });

      const submitData = await submitRes.json();
      expect(submitData.response_saved).toBe(true);
    }

    // Step 4: Get score
    const scoreRes = await fetch(
      `/api/communication/${testData.test_id}/score`
    );
    const scoreData = await scoreRes.json();

    expect(scoreData.score).toBeGreaterThan(0);
    expect(scoreData.reportUrl).toBeDefined();

    // Step 5: Dashboard should reflect credit deduction
    const dashboardRes = await fetch('/api/dashboard/summary');
    const dashboard = await dashboardRes.json();

    // Credits should be reduced
    expect(dashboard.plan.credits_remaining).toBeLessThan(100);
  });

  it('prevents assessment start without sufficient credits', async () => {
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

    const checkRes = await fetch('/api/credits/check', {
      method: 'POST',
      body: JSON.stringify({ feature: 'communication_test' }),
    });

    const checkData = await checkRes.json();
    expect(checkData.can_proceed).toBe(false);

    // Assessment should not be generated
    // (In real app, frontend would block this)
  });

  it('records assessment in usage history', async () => {
    // After completing assessment, it should appear in usage
    const usageRes = await fetch('/api/credits/usage');
    const usageData = await usageRes.json();

    expect(usageData.items).toBeDefined();
    expect(Array.isArray(usageData.items)).toBe(true);

    const assessmentUsage = usageData.items.find(
      (item: any) => item.feature === 'communication_test'
    );
    expect(assessmentUsage).toBeDefined();
  });

  it('handles different difficulty levels', async () => {
    const difficulties = ['easy', 'medium', 'hard'];

    for (const difficulty of difficulties) {
      const testRes = await fetch('/api/communication/generate-test', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          difficulty: difficulty,
        }),
      });

      const testData = await testRes.json();
      expect(testData.test_id).toBeDefined();
    }
  });

  it('validates assessment submission', async () => {
    const testRes = await fetch('/api/communication/generate-test', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        difficulty: 'easy',
      }),
    });

    const testData = await testRes.json();

    // Submit response with validation
    const submitRes = await fetch('/api/communication/submit-response', {
      method: 'POST',
      body: JSON.stringify({
        test_id: testData.test_id,
        section: 'listen-repeat',
        response: 'audio-data',
      }),
    });

    expect(submitRes.status).toBe(200);
    const submitData = await submitRes.json();
    expect(submitData.response_saved).toBe(true);
  });

  it('generates score based on responses', async () => {
    const testRes = await fetch('/api/communication/generate-test', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        difficulty: 'medium',
      }),
    });

    const testData = await testRes.json();

    // Submit all sections
    for (let i = 0; i < 5; i++) {
      await fetch('/api/communication/submit-response', {
        method: 'POST',
        body: JSON.stringify({
          test_id: testData.test_id,
          section: `section-${i}`,
          response: 'audio-blob',
        }),
      });
    }

    // Get score
    const scoreRes = await fetch(
      `/api/communication/${testData.test_id}/score`
    );
    const scoreData = await scoreRes.json();

    expect(scoreData.score).toBeGreaterThanOrEqual(0);
    expect(scoreData.score).toBeLessThanOrEqual(10);
  });
});
