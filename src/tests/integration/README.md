# Integration Testing Guide

## 📁 Feature-Wise Integration Tests Structure

```
src/tests/integration/
├── features/
│   ├── dashboard/
│   │   ├── dashboard-credits-sync.test.ts
│   │   └── dashboard-data-refresh.test.ts
│   │
│   ├── resume-builder-enhancer/
│   │   ├── resume-build-and-save.test.ts
│   │   ├── resume-enhance-flow.test.ts
│   │   └── resume-template-integration.test.ts
│   │
│   ├── communication/
│   │   ├── communication-flow.test.ts
│   │   ├── communication-timer-tracking.test.ts
│   │   └── communication-credits-deduction.test.ts
│   │
│   ├── mock-interview/
│   │   ├── mock-interview-workflow.test.ts
│   │   ├── mock-interview-notes-sync.test.ts
│   │   └── mock-interview-session-persistence.test.ts
│   │
│   ├── settings/
│   │   └── settings-profile-sync.test.ts
│   │
│   └── credits/
│       ├── credits-deduction-flow.test.ts
│       └── credits-multi-tab-sync.test.ts
│
└── shared/
    ├── api-mocks.ts
    └── test-helpers.ts
```

## 🚀 Run Integration Tests Feature-Wise

### **Specific Feature Integration Tests**
```bash
# Dashboard integration (2 tests)
npm run test:integration:dashboard

# Resume Builder & Enhancer integration (3 tests)
npm run test:integration:resume

# Communication integration (3 tests)
npm run test:integration:communication

# Mock Interview integration (3 tests)
npm run test:integration:mock-interview

# Settings integration (1 test)
npm run test:integration:settings

# Credits integration (2 tests)
npm run test:integration:credits
```

### **All Integration Tests**
```bash
# Run all integration tests together
npm run test:integration

# Watch mode
npm run test:integration -- --watch

# With coverage
npm run test:integration -- --coverage
```

### **Specific Test File**
```bash
# Single test file
npx vitest src/tests/integration/features/dashboard/dashboard-credits-sync.test.ts

# Single feature directory
npx vitest src/tests/integration/features/dashboard/
```

---

## 🎯 What Integration Tests Cover (By Feature)

### **Dashboard Integration (2 tests)**
Tests how Dashboard works with other systems:
1. **Dashboard + Credits Sync**
   - User views dashboard
   - Credits updated from another tab
   - Dashboard reflects credit changes
   - No hard refresh needed

2. **Dashboard + Data Refresh**
   - Dashboard loads initial data
   - User performs action affecting data
   - Manual refresh button works
   - New data displays correctly

---

### **Resume Builder & Enhancer Integration (3 tests)**
Tests how Resume features work together and with other systems:
1. **Build Resume → Save → Display**
   - Create resume with sections
   - Save to backend
   - Retrieve from API
   - Display in dashboard list

2. **Enhance Resume → Preview → Save**
   - Parse existing resume
   - Call enhance API
   - Show preview to user
   - Save enhanced version
   - Update in dashboard

3. **Resume + Templates → Generation**
   - Select template
   - Bind resume data
   - Generate preview
   - Export to PDF

---

### **Communication Integration (3 tests)**
Tests how Communication feature integrates with system:
1. **Start Assessment → Complete Flow**
   - Generate test
   - Start timer
   - Submit responses
   - Calculate score
   - Save to history

2. **Timer + Exit Confirmation**
   - Timer starts on assessment begin
   - Exit shows confirmation
   - Cancel exit continues
   - Confirm exit cleans up state

3. **Assessment → Credits Deduction**
   - Check credits before start
   - Complete assessment
   - API deducts credits
   - Dashboard reflects new balance

---

### **Mock Interview Integration (3 tests)**
Tests complete Mock Interview workflow:
1. **Full Mock Interview Workflow**
   - Generate notes from resume
   - Complete practice rounds
   - Pass readiness gate
   - Start live interview
   - Get score and report

2. **Interview → Notes Sync**
   - Notes generation from resume
   - Resume data updates
   - Notes refresh shows changes
   - Interview uses latest notes

3. **Session Persistence**
   - Start interview
   - Pause mid-interview
   - Close browser
   - Reopen → Session recovers
   - Continue where left off

---

### **Settings Integration (1 test)**
Tests Settings interactions:
1. **Profile Update → Dashboard Sync**
   - Update profile in settings
   - Close settings
   - Dashboard shows updated info
   - No page refresh needed

---

### **Credits Integration (2 tests)**
Tests credit system across features:
1. **Feature Usage → Credits Deduction**
   - Check balance
   - Use feature (ATS scan, enhance, etc.)
   - API processes request
   - Credits deducted
   - Real-time update in UI

2. **Multi-Tab Credit Sync**
   - Tab A: Use feature → deduct credits
   - Tab B: See real-time update
   - No polling needed
   - BroadcastChannel works
   - Fallback to focus event works

---

## 📋 Integration Test Patterns

Each integration test follows this pattern:

```typescript
describe('Dashboard + Credits Integration', () => {
  // 1. Setup: Mock APIs, create test data
  beforeEach(async () => {
    // ...
  });

  // 2. Test: Simulate user interaction across features
  it('syncs credits when updated in another tab', async () => {
    // User views dashboard with 100 credits
    // Another tab deducts 10 credits
    // Dashboard receives update event
    // Dashboard shows 90 credits
    // Assertion: credits updated
  });

  // 3. Teardown: Clean up
  afterEach(() => {
    // ...
  });
});
```

---

## ✅ Key Points

1. **Feature-Isolated** - Test one feature at a time if you want
2. **No Manual Coordination** - Each integration test is independent
3. **Fast Execution** - Can run individual feature tests in seconds
4. **CI/CD Friendly** - Run all or subset based on changed files
5. **Easy Debugging** - Focus on single feature when issues arise

---

## 🔧 Development Workflow

### **While Building a Feature**
```bash
# Test only the feature you're working on
npm run test:integration:resume -- --watch

# Get instant feedback on integration
```

### **Before Committing**
```bash
# Test the feature you changed
npm run test:integration:resume

# Test related features that might be affected
npm run test:integration:dashboard
npm run test:integration:credits
```

### **Before Pushing**
```bash
# Full integration test suite
npm run test:integration

# Verify with unit tests too
npm test
```

### **In CI/CD**
```yaml
# Run tests based on changed files
if src/app/dashboard/* changed:
  npm run test:integration:dashboard
  npm run test:dashboard

if src/app/resume-builder/* changed:
  npm run test:integration:resume
  npm test:resume

# Always run full suite before merge:
npm run test:integration
npm test
```

---

## 🎯 When to Add Integration Tests

Add integration tests when:
- ✅ Two features need to work together
- ✅ Data flows between multiple components
- ✅ API calls affect UI across features
- ✅ State needs syncing
- ✅ User workflow spans multiple pages

---

## 📊 Testing Strategy Summary

```
Unit Tests (146+):              Feature-wise ✅ Fast
├── Each component/function
├── No external dependencies
└── Quick feedback

Integration Tests (14):          Feature-wise ✅ Medium
├── Multiple components together
├── Mock APIs but real flow
└── Test real scenarios

E2E Tests (10+):                 User journeys (Phase 3)
├── Full browser
├── Real backend (staging)
└── Complete workflows
```

---

## 📝 Next: Create Integration Tests

Ready to create these integration tests with same senior-level quality as unit tests?

Each integration test will:
- ✅ Test realistic feature interactions
- ✅ Use proper mocking (APIs only)
- ✅ Cover edge cases
- ✅ Be feature-isolated
- ✅ Run in parallel
- ✅ Complete in < 2s each
