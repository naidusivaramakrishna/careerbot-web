// API endpoint constants — single source of truth for the careerbot-api surface.
//
// Ported from POC: src/uri/uri.js (endpoints section).
// Direct port + TS const-as-const for autocomplete.
//
// PHASE 1.x TODO: when @careerbot/api-contracts npm package is published,
// move this file there. Mobile + web will both consume the package.

export const authEndpoints = {
  signIn: '/api/v1/auth/signin',
  signUp: '/api/v1/auth/signup',
  signOut: '/api/v1/auth/signout',
  refresh: '/api/v1/auth/refresh',
  profile: '/api/v1/auth/profile',
  requestPasswordReset: '/api/v1/auth/password/reset',
  confirmPasswordReset: '/api/v1/auth/password/reset',
  verifyEmail: '/api/v1/auth/email/verify',
  googleLoginUrl: '/api/v1/auth/google/login-url',
  googleCallback: '/api/v1/auth/google/callback',
  linkedInLoginUrl: '/api/v1/auth/linkedin/login-url',
  linkedInCallback: '/api/v1/auth/linkedin/callback',
  // NEW for mobile (Apple guideline 4.8 — required when Google/LinkedIn shown):
  appleLoginUrl: '/api/v1/auth/apple/login-url',
  appleCallback: '/api/v1/auth/apple/callback',
} as const;

export const profileEndpoints = {
  getProfile: '/api/v1/profile/',
  // PUT updates the Personal section.
  updatePersonal: '/api/v1/profile/update',
  // List-tab CRUD: PUT/DELETE append the entry id ${path}/${id}.
  education: '/api/v1/profile/education',
  experience: '/api/v1/profile/experience',
  skills: '/api/v1/profile/skills',
  certifications: '/api/v1/profile/certifications',
  // Employment info is a single record per user — PUT is upsert.
  employmentInfo: '/api/v1/profile/employment-info',
  projects: '/api/v1/profile/projects',
  // Profile picture (deferred to v1.1 — left here for endpoint awareness).
  picture: '/api/v1/profile/picture',
  pictureUpload: '/api/v1/profile/picture/upload',
  // Resume file storage (distinct from atsEndpoints.parseResume).
  resume: '/api/v1/profile/resume',
  resumeUpload: '/api/v1/profile/resume/upload',
} as const;

export const dashboardEndpoints = {
  // Aggregated dashboard payload: plan, completeness, recommendation, usage, activity.
  summary: '/api/v1/dashboard/summary',
} as const;

export const atsEndpoints = {
  parseResume: '/api/v1/parser/parse_resume/',
  previewResume: '/api/v1/parser/preview/',
  enhanceResume: '/api/v1/resume/enhance',
  // Enhanced-resume base. Append id: ${base}${id} -> DELETE; ${base}${id}/preview -> GET.
  enhancedResumeBase: '/api/v1/resume/enhance/',
  applyFix: '/api/v1/resume/enhance/apply',
  deleteFix: '/api/v1/resume/enhance/delete-fix',
} as const;

// Cross-repo dependencies (per A0..A6 backend coordination doc):
export const meEndpoints = {
  // A2 / A5 — list + revoke devices (NEW on api)
  devices: '/api/v1/me/devices',
  revokeDevice: (id: string) => `/api/v1/me/devices/${id}/revoke`,
  // GDPR Article 17 — delete account (NEW on api)
  deleteAccount: '/api/v1/me/delete',
  // GDPR Article 20 — data export (NEW on api)
  exportData: '/api/v1/me/export',
  // A6 — push token registration (v1.1, deferred)
  pushTokens: '/api/v1/me/push-tokens',
} as const;

// Aggregated for convenience.
export const apiEndpoints = {
  ...authEndpoints,
  ...profileEndpoints,
  ...dashboardEndpoints,
  ...atsEndpoints,
  ...meEndpoints,
} as const;

export type ApiEndpoint = (typeof apiEndpoints)[keyof typeof apiEndpoints];
