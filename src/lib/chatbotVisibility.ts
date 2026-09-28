/**
 * Route-based visibility rules for the floating CareerBot chatbot widget.
 *
 * The chatbot must never appear on pages where it could overlap exam/test
 * controls (timer, submit, next/previous, questions, code editor, etc), and
 * must not render at all (not just be CSS-hidden) on those routes.
 */

// Routes with their own dedicated chat UI, or that have no room for a
// floating widget (admin/recruiter tooling).
const EXCLUDED_PATH_PREFIXES = ['/chatbot', '/admin', '/recruiter'];

// /mock-test/<segment> sub-paths that are browsing/results pages, not the
// live timed test itself (e.g. /mock-test/<id> is the live attempt).
const MOCK_TEST_SAFE_SEGMENTS = new Set([
  'browse', 'custom', 'history', 'instructions', 'leaderboard', 'weak-areas', 'company', 'results',
]);

// /coding-test/<segment> sub-paths that are browsing pages, not a live
// graded coding challenge attempt (e.g. /coding-test/<slug> is the attempt).
const CODING_TEST_SAFE_SEGMENTS = new Set(['playground', 'problems', 'history']);

// /communication/<segment> sub-paths that are results/summary pages, not a
// live timed assessment exercise.
const COMMUNICATION_SAFE_SEGMENTS = new Set(['feedback', 'report']);

const firstSegmentAfter = (pathname: string, base: string): string | null => {
  if (!pathname.startsWith(`${base}/`)) return null;
  return pathname.slice(base.length + 1).split('/')[0] || null;
};

/** True for exam/assessment/test/coding-test pages where the chatbot must be fully hidden. */
const isExamOrAssessmentRoute = (pathname: string): boolean => {
  const mockTestSegment = firstSegmentAfter(pathname, '/mock-test');
  if (mockTestSegment && !MOCK_TEST_SAFE_SEGMENTS.has(mockTestSegment)) return true;

  const codingTestSegment = firstSegmentAfter(pathname, '/coding-test');
  if (codingTestSegment && !CODING_TEST_SAFE_SEGMENTS.has(codingTestSegment)) return true;

  // Live AI mock interview session (video/mic controls, no room to overlap).
  if (pathname.startsWith('/mock-interview/live')) return true;

  const communicationSegment = firstSegmentAfter(pathname, '/communication');
  if (communicationSegment && !COMMUNICATION_SAFE_SEGMENTS.has(communicationSegment)) return true;

  return false;
};

/**
 * Whether the chatbot (launcher or window) may render at all on this route.
 * This is independent of auth state and of the chat window's open/closed
 * state — it only answers "is this page eligible for the chatbot".
 */
export const isChatbotAllowedOnPage = (pathname: string | null | undefined): boolean => {
  if (!pathname) return true;
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  if (isExamOrAssessmentRoute(pathname)) return false;
  return true;
};
