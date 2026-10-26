/**
 * A college's feature switches, as they apply to its STUDENTS.
 *
 * A platform admin can switch a feature off for a college. careerbot-api
 * refuses the engine's start routes for that college's students (403,
 * `details.error === "COLLEGE_FEATURE_DISABLED"`), and
 * GET /institution/feature-access returns the same list so the web can hide
 * what the server would refuse. One answer for "hide" and "refuse".
 *
 * KEYS MUST MATCH careerbot-api exactly: app/core/institution/entitlements.py
 * (_KNOWN_FEATURES, the admin switch) and
 * app/services/institution_org_service/feature_gate.py (ENGINE_FEATURES).
 */

export const COLLEGE_FEATURE_DISABLED = 'COLLEGE_FEATURE_DISABLED';

/** Features that are an engine a student starts. Same list as the API's
 *  ENGINE_FEATURES; the other switchable keys (resume_tools, job_matching,
 *  rankings) are not enforced on an engine today. */
export const ENGINE_FEATURES = [
  'mock_test',
  'coding_test',
  'mock_interview',
  'english_assessment',
] as const;

export type EngineFeature = (typeof ENGINE_FEATURES)[number];

export const ENGINE_FEATURE_LABELS: Record<EngineFeature, string> = {
  mock_test: 'Mock Test',
  coding_test: 'Coding Practice',
  mock_interview: 'Mock Interview',
  english_assessment: 'Communication Assessment',
};

export function isEngineFeature(value: unknown): value is EngineFeature {
  return typeof value === 'string' && (ENGINE_FEATURES as readonly string[]).includes(value);
}

/**
 * A stored deny-list as a set of names: trimmed, lower-cased, non-strings
 * dropped. The same reading as the API's normalise_deny_list, and the one
 * EnabledFeaturesCard uses, so a college page and the navigation can never
 * disagree about what " Mock_Test " means.
 */
export function normaliseDisabledFeatures(list: unknown): Set<string> {
  if (typeof list === 'string') {
    const one = list.trim().toLowerCase();
    return one ? new Set([one]) : new Set();
  }
  if (!Array.isArray(list)) return new Set();
  const out = new Set<string>();
  for (const f of list) {
    if (typeof f === 'string' && f.trim()) out.add(f.trim().toLowerCase());
  }
  return out;
}

/**
 * Sidebar item id -> the feature that item opens. Interview Notes is the
 * interview-prep part of the mock interview (the API gates /generate-notes
 * under mock_interview), so it goes with it.
 */
export const NAV_ITEM_FEATURE: Record<string, EngineFeature> = {
  mock_test: 'mock_test',
  coding_test: 'coding_test',
  mock_interview: 'mock_interview',
  comm_assess: 'english_assessment',
  interview_notes: 'mock_interview',
};

/** Drop items whose feature is switched off, then any group left empty. */
export function withoutDisabledFeatures<
  G extends { label: string; items: ReadonlyArray<{ id: string }> },
>(groups: G[], disabled: ReadonlySet<string>): G[] {
  if (disabled.size === 0) return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        const feature = NAV_ITEM_FEATURE[item.id];
        return !feature || !disabled.has(feature);
      }),
    }))
    .filter((g) => g.items.length > 0);
}

/**
 * Pages that only SHOW past results. The API keeps reads open when a feature
 * is switched off (a student does not lose sight of their own results), so
 * the web does too.
 */
const READ_ONLY_PREFIXES = [
  '/mock-test/history',
  '/mock-test/results',
  '/mock-test/leaderboard',
  '/mock-test/weak-areas',
  '/mock-interview/history',
  '/mock-interview/report',
  '/coding-test/history',
  '/communication/report',
  '/communication/feedback',
];

/** Public marketing pages for the engine. They start nothing, and are seen
 *  signed-out, so they are never gated. */
const LANDING_PAGES = ['/mock-interview', '/communication', '/prep'];

const startsWithSegment = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Whether this page USES the feature (and so is gated), or only shows past
 *  results / marketing (and is not). */
export function isGatedPage(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (LANDING_PAGES.includes(pathname)) return false;
  return !READ_ONLY_PREFIXES.some((p) => startsWithSegment(pathname, p));
}

// ── the API refusal ─────────────────────────────────────────────

/**
 * The feature named by a COLLEGE_FEATURE_DISABLED refusal, or null.
 *
 * Reads the axios error as it leaves careerbot-api's global handler:
 *   { success: false, error: { error_code: "HTTP_403",
 *       details: { error: "COLLEGE_FEATURE_DISABLED", feature, reason } } }
 */
export function collegeFeatureFromError(err: unknown): EngineFeature | null {
  const response = (err as { response?: { status?: number; data?: unknown } } | null)?.response;
  if (!response || response.status !== 403) return null;
  const data = response.data as { error?: { details?: { error?: unknown; feature?: unknown } } } | null;
  const details = data?.error?.details;
  if (!details || details.error !== COLLEGE_FEATURE_DISABLED) return null;
  return isEngineFeature(details.feature) ? details.feature : null;
}

export function collegeFeatureMessage(feature: EngineFeature): string {
  return `${ENGINE_FEATURE_LABELS[feature]} is not available through your college right now. Your placement officer can tell you more.`;
}

const REFUSED_EVENT = 'careerbot-college-feature-refused';

/** Announce that the API refused a feature for this student. */
export function notifyCollegeFeatureRefused(feature: EngineFeature): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<EngineFeature>(REFUSED_EVENT, { detail: feature }));
}

export function onCollegeFeatureRefused(handler: (feature: EngineFeature) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => {
    const feature = (e as CustomEvent<unknown>).detail;
    if (isEngineFeature(feature)) handler(feature);
  };
  window.addEventListener(REFUSED_EVENT, listener);
  return () => window.removeEventListener(REFUSED_EVENT, listener);
}
