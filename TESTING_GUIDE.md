# Testing Guide - Feature-Wise Organization

## 📁 Test Structure

All unit tests are organized by feature in `src/tests/unit/features/`:

```
src/tests/unit/
├── features/
│   ├── dashboard/
│   │   ├── DashboardPage.test.tsx (12 tests)
│   │   └── FirstTimeDashboard.test.tsx (14 tests)
│   │
│   ├── resume-builder-enhancer/
│   │   ├── ResumeBuilderPage.test.tsx (12 tests)
│   │   └── ResumeLandingPage.test.tsx (17 tests)
│   │
│   ├── communication/
│   │   ├── CommunicationPage.test.tsx (13 tests)
│   │   └── CommunicationHeader.test.tsx (16 tests)
│   │
│   ├── mock-interview/
│   │   └── MockInterviewPage.test.tsx (18 tests)
│   │
│   ├── settings/
│   │   └── SettingsPage.test.tsx (17 tests)
│   │
│   ├── credits/
│   │   ├── CreditsContext.test.tsx (13 tests)
│   │   └── CreditsApi.test.ts (27 tests)
│   │
│   ├── ats/
│   │   ├── ATSLoginPage.test.tsx (20 tests)
│   │   └── ATSHomePage.test.tsx (16 tests)
│   │
│   └── lib/
│       └── computePreviewScore.test.ts (existing)
```

---

## 🚀 Run Tests

### **All Tests**
```bash
npm test                    # Run all tests once
npm run test:watch        # Watch mode
npm run test:ui          # Interactive UI dashboard
npm run test:coverage    # Generate coverage report
```

### **Feature-Wise Testing**
```bash
# Dashboard feature (26 tests)
npm run test:dashboard

# Resume Builder & Enhancer (29 tests)
npm run test:resume

# Communication Assessment (29 tests)
npm run test:communication

# Mock Interview (18 tests)
npm run test:mock-interview

# Settings (17 tests)
npm run test:settings

# Credits Management (40 tests)
npm run test:credits

# ATS Scanner & ATS Login (36 tests)
npm run test:ats

# All features combined (182 tests)
npm run test:all-features
```

---

## 📊 Test Coverage by Feature

| Feature | Tests | Pages | Components | APIs | Contexts |
|---------|-------|-------|-----------|------|----------|
| **Dashboard** | 26 | 1 | 1 | - | - |
| **Resume Builder & Enhancer** | 29 | 1 | 1 | - | - |
| **Communication** | 29 | 1 | 1 | - | - |
| **Mock Interview** | 18 | 1 | - | - | - |
| **Settings** | 17 | 1 | - | - | - |
| **Credits** | 40 | - | - | 1 | 1 |
| **ATS Scanner** | 36 | 1 | 1 | 1 | - |
| **Total** | **182** | **6** | **4** | **2** | **1** |

---

## 🎯 What Each Feature Tests

### **Dashboard**
- Dashboard page loading, errors, data rendering
- User credentials, plan display, resume list
- Stats rendering (resumes created, ATS scans, applications)
- Edge cases (empty resumes, zero stats, different plans)

### **Resume Builder & Enhancer**
- Resume landing page navigation and sections
- Hero CTAs, sign-in modal interactions
- Resume builder loading states, sidebar management
- Search parameters handling (enhanced mode, ATS mode)
- localStorage persistence

### **Communication Assessment**
- Assessment entry page with difficulty selection
- Email loading from user profile
- Test generation and error handling
- Timer display with color changes based on remaining time
- Device loss detection (camera, microphone, both)
- Fullscreen exit detection
- Assessment exit confirmation

### **Mock Interview**
- 5-stage interview workflow visualization
- Progress tracking and completion percentage
- Consent modal management
- Step status (active, completed, locked)
- Session recovery banner
- Navigation to different interview stages

### **Settings**
- User profile loading
- Password reset request with validation
- Email verification resend functionality
- Success/error toast notifications
- Loading states and button disable handling
- Error message display

### **Credits**
- Credit balance fetching
- Usage history with pagination
- Pre-flight credit checks before feature access
- Cross-tab and same-tab credit synchronization
- Low balance detection
- Credit cost calculations

### **ATS Scanner**
- Upload zone rendering and file input accepted formats
- File validation: invalid type, oversized file (>10MB), valid PDF/DOCX/DOC
- File preview: name, size in KB, "Ready to scan" indicator
- Terms of service checkbox gates the scan button
- Loading overlay during scan, redirect to report on success
- Error modal for API failure and exceptions, "Try Again" dismissal
- Landing page: all sections render (Hero, Features, CTABand, FAQ, Footer)
- Upload modal opens from Hero / BeforeAfter / CTABand CTAs and closes correctly
- `processResumeComplete` API: success, credit error normalization, cache hit, failure

---

## 🔧 Development Workflow

### **When Working on a Feature**

1. **Run feature-specific tests during development:**
   ```bash
   npm run test:dashboard -- --watch
   ```

2. **View real-time results with UI:**
   ```bash
   npm run test:ui
   ```

3. **Verify all feature tests pass before committing:**
   ```bash
   npm run test:resume  # or your feature
   ```

4. **Run full suite before pushing:**
   ```bash
   npm test
   ```

---

## 📝 Test File Patterns

All test files follow these patterns:

### **Page Tests** (`.test.tsx`)
- Mock APIs and external dependencies
- Test component rendering
- Test user interactions (clicks, form submissions)
- Test navigation and routing
- Test loading/error states
- Test edge cases

### **Component Tests** (`.test.tsx`)
- Test conditional rendering
- Test prop variations
- Test state management
- Test event handlers
- Test accessibility attributes

### **Context Tests** (`.test.tsx`)
- Test state initialization
- Test state updates
- Test custom events
- Test cross-tab sync
- Test cleanup on unmount

### **API Tests** (`.test.ts`)
- Test HTTP client calls
- Test parameter passing
- Test response handling
- Test error scenarios
- Test different data types

---

## ✅ Test Quality Standards

All tests follow **senior-level best practices**:

- ✅ Comprehensive mocking (APIs, contexts, navigation)
- ✅ Proper setup/teardown with `beforeEach` / `afterEach`
- ✅ Isolated tests with no dependencies
- ✅ Meaningful test descriptions
- ✅ Real-world scenarios covered
- ✅ Edge cases tested
- ✅ Error handling verified
- ✅ React Testing Library best practices

---

## 🔍 Running Specific Test Files

```bash
# Single file
npx vitest src/tests/unit/features/dashboard/DashboardPage.test.tsx

# Multiple files
npx vitest src/tests/unit/features/dashboard/*.test.tsx

# With watch mode
npx vitest src/tests/unit/features/dashboard --watch

# With coverage
npx vitest src/tests/unit/features/dashboard --coverage
```

---

## 📈 Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Unit Tests
  run: npm test

- name: Run Feature Tests
  run: npm run test:all-features

- name: Generate Coverage
  run: npm run test:coverage
```

---

## 🛠️ Next Steps: Phase 2 - Playwright Automation

After unit tests are approved, Phase 2 will implement:
- **End-to-end tests** for critical user flows
- **Playwright** for browser automation
- **Visual regression** testing
- **Performance** testing

See `PLAYWRIGHT_TESTING_GUIDE.md` (coming soon)

---

## 📧 Questions or Issues?

Refer to `vitest.config.ts` and `vitest.setup.ts` for configuration details.
