# MSW Integration Testing Guide

## 🎯 Overview

**MSW (Mock Service Worker)** intercepts HTTP requests at the network level, making integration tests realistic and maintainable.

### Key Benefits Over `vi.mock()`

| Aspect | vi.mock() | MSW |
|--------|-----------|-----|
| **Request Interception** | Manual per test | Automatic |
| **Network Simulation** | ❌ No | ✅ Yes (delays, errors) |
| **Request Logging** | ❌ No | ✅ Yes |
| **Request Validation** | ❌ No | ✅ Yes |
| **Error Simulation** | Manual | ✅ Built-in |
| **Realism** | Low | High |
| **Maintainability** | Low | High |

---

## 📁 MSW Setup Structure

```
src/tests/integration/
├── shared/
│   ├── msw-handlers.ts      ← API endpoint definitions
│   ├── msw-server.ts        ← Server setup & utilities
│   ├── api-mocks.ts         ← Mock response data
│   └── test-helpers.ts      ← Utility functions
│
├── vitest.setup.ts          ← MSW initialization
│
└── features/
    ├── dashboard/
    │   └── dashboard-credits-sync.integration.test.ts
    ├── communication/
    │   └── communication-flow.integration.test.ts
    └── ...
```

---

## 🚀 Running Integration Tests

### Feature-Specific Tests
```bash
npm run test:integration:dashboard        # Dashboard tests only
npm run test:integration:communication    # Communication tests only
npm run test:integration:credits          # Credits tests only
npm run test:integration:resume           # Resume tests only
npm run test:integration:mock-interview   # Mock interview tests only
npm run test:integration:settings         # Settings tests only
```

### All Integration Tests
```bash
npm run test:integration                  # Run all integration tests
npm run test:integration -- --watch       # Watch mode
npm run test:integration -- --coverage    # With coverage report
```

### Pre-Commit Check
```bash
npm run test:pre-commit                   # Unit + Integration tests
```

---

## 💡 How MSW Works

### 1. **Request Interception** (Automatic)
```typescript
// MSW intercepts this real fetch call:
const response = await fetch('/api/dashboard/summary');

// MSW matches it against handlers and returns mock data:
http.get('/api/dashboard/summary', () => {
  return HttpResponse.json({ plan: { credits: 100 } });
})
```

### 2. **Test-Specific Behavior** (Using `useHandler`)
```typescript
it('handles credit deduction', async () => {
  // Default handler returns 100 credits
  let res = await fetch('/api/dashboard/summary');
  let data = await res.json();
  expect(data.plan.credits).toBe(100);

  // Override handler for this test only
  useHandler(
    http.get('/api/dashboard/summary', () => {
      return HttpResponse.json({
        plan: { credits: 90 }
      });
    })
  );

  // Now returns 90 credits
  res = await fetch('/api/dashboard/summary');
  data = await res.json();
  expect(data.plan.credits).toBe(90);

  // Automatically reset after test
});
```

### 3. **Request Validation**
```typescript
// MSW can log/validate requests:
http.post('/api/communication/submit-response', ({ request }) => {
  // Validate request body
  // Log request details
  // Return response
  return HttpResponse.json({ success: true });
})
```

---

## 📝 Writing Integration Tests with MSW

### Basic Pattern
```typescript
import { describe, it, expect } from 'vitest';
import { useHandler } from '../../shared/msw-server';
import { http, HttpResponse } from 'msw';

describe('Feature Integration', () => {
  it('tests feature workflow', async () => {
    // 1. Make API call (MSW intercepts automatically)
    const response = await fetch('/api/endpoint');
    const data = await response.json();

    // 2. Assert response
    expect(data).toBeDefined();

    // 3. Override handler for specific test behavior
    useHandler(
      http.get('/api/endpoint', () => {
        return HttpResponse.json({ modified: true });
      })
    );

    // 4. Test modified behavior
    const response2 = await fetch('/api/endpoint');
    const data2 = await response2.json();
    expect(data2.modified).toBe(true);

    // Handlers automatically reset after test
  });
});
```

---

## 🎯 Common Integration Test Scenarios

### Scenario 1: Check Credits → Use Feature → Update Dashboard
```typescript
it('deducts credits after feature use', async () => {
  // Check initial balance
  const check1 = await fetch('/api/credits/check', {
    method: 'POST',
    body: JSON.stringify({ feature: 'assessment' }),
  });
  const data1 = await check1.json();
  expect(data1.credits_remaining).toBe(100);

  // Use feature (API deducts 10 credits)
  await fetch('/api/assessment/submit', { method: 'POST' });

  // Check new balance
  const check2 = await fetch('/api/credits/check', {
    method: 'POST',
    body: JSON.stringify({ feature: 'assessment' }),
  });
  const data2 = await check2.json();
  expect(data2.credits_remaining).toBe(90);
});
```

### Scenario 2: Simulate Network Error
```typescript
it('handles API errors gracefully', async () => {
  useHandler(
    http.get('/api/endpoint', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    })
  );

  const response = await fetch('/api/endpoint');
  expect(response.status).toBe(500);

  const data = await response.json();
  expect(data.error).toBeDefined();
});
```

### Scenario 3: Simulate Network Delay
```typescript
it('handles slow API responses', async () => {
  useHandler(
    http.get('/api/endpoint', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      return HttpResponse.json({ data: 'slow response' });
    })
  );

  const start = Date.now();
  const response = await fetch('/api/endpoint');
  const elapsed = Date.now() - start;

  expect(elapsed).toBeGreaterThanOrEqual(2000);
  expect(response.ok).toBe(true);
});
```

---

## 🔧 MSW Configuration

### Global Handler Setup
All default handlers are defined in `msw-handlers.ts`:

```typescript
// Default returns success
http.get('/api/dashboard/summary', () => {
  return HttpResponse.json(mockResponses.dashboard.success);
}),
```

### Override Handlers During Test
Use `useHandler()` to override for specific tests:

```typescript
useHandler(
  http.get('/api/endpoint', () => {
    return HttpResponse.json({ custom: 'response' });
  })
);
```

### Reset All Handlers
Automatic after each test via `afterEach()` hook in `vitest.setup.ts`

---

## 📊 Test Coverage with MSW

### What's Tested
✅ API request/response contracts
✅ Feature workflows across API calls
✅ Credit deduction and sync
✅ Error handling
✅ Network behavior (delays, failures)
✅ Dashboard updates after API calls

### What's NOT Tested Here
❌ Browser rendering (use React Testing Library for components)
❌ Real backend logic (backend has its own tests)
❌ Full E2E flows (use Playwright for that)

---

## 🐛 Debugging Integration Tests

### View MSW Requests
```typescript
// MSW logs all intercepted requests to console
// Look for: "GET /api/..." in browser/terminal console
```

### Check Handler Matches
```typescript
// If MSW doesn't match a request, you'll see:
// "Error: [MSW] Unhandled GET /api/endpoint"

// Solution: Add matching handler in msw-handlers.ts
```

### Validate Request Data
```typescript
http.post('/api/endpoint', async ({ request }) => {
  const body = await request.json();
  console.log('Request received:', body);
  return HttpResponse.json({ ok: true });
})
```

---

## 📋 Integration Test Checklist

- ✅ MSW handlers defined in `msw-handlers.ts`
- ✅ Default responses cover all endpoints
- ✅ Test-specific behavior uses `useHandler()`
- ✅ Error scenarios tested
- ✅ Request/response contracts validated
- ✅ Feature workflows verified end-to-end

---

## 🔗 Integration Testing + Unit Testing

```
Unit Tests (146+)
├── Test individual functions
├── Use vi.mock() for API mocks
└── Quick (run all in 20s)

Integration Tests (Building)
├── Test feature workflows
├── Use MSW for realistic API calls
└── Medium speed (run all in 30s)

E2E Tests (Coming)
├── Test complete user journeys
├── Use Playwright (real browser)
└── Slower (run all in 5+ min)
```

---

## 🚀 Next Steps

1. ✅ MSW setup complete
2. ✅ Handlers defined for all endpoints
3. ✅ Example tests created (Dashboard, Communication)
4. 📝 Create remaining tests (Resume, Mock Interview, Settings, Credits)
5. ✅ Run and verify integration tests pass
6. 🎭 Move to Phase 3: Playwright E2E testing

---

## 📚 Resources

- [MSW Documentation](https://mswjs.io/)
- [MSW Handlers Guide](https://mswjs.io/docs/getting-started/mocks)
- [HTTP Response Examples](https://mswjs.io/docs/recipes/mocking-error-responses)
