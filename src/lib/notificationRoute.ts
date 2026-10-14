import type { Notification } from '@/api/notificationsApi';

// Only confirmed, fully-implemented pages
const VALID_EXACT_PATHS = new Set([
  '/jobslogin',
  '/jobs/tracking',
  '/jobmatch',
  '/tracker',
  '/job-parser',
  '/builder/start',
  '/builder/start/list',
  '/ats/report',
  '/atslogin',
  '/templates',
  '/parser',
  '/mock-interview/live',
  '/mock-interview/history',
  '/prep/notes',
  '/prep/english',
  '/prep/hr',
  '/prep/hr/practice',
  '/prep/managerial',
  '/prep/managerial/practice',
  '/prep/technical',
  '/prep/technical/practice',
  '/mock-test/history',
  '/dashboard',
  '/profile',
  '/notifications',
  '/settings/subscription',
]);

// Per-type fallback when action_url is missing or invalid
const TYPE_FALLBACK: Record<string, string | null> = {
  job:           '/jobslogin',
  jobmatch:      '/jobmatch',
  profile:       '/profile',
  user:          '/profile',
  account:       '/profile',
  resume:        '/builder/start/list',
  parser:        null,
  ats:           '/atslogin',
  atslogin:      '/atslogin',
  interview:     '/mock-interview/live',
  communication: null,
  'mock-test':   '/mock-test/history',
  prep:          null,
  scheduler:     null,
  credit:        '/settings/subscription',
  pricing:       '/settings/subscription',
  system:        null,
};

// Interview notes moved from /notes/* to /prep/*. Notifications stored before the
// move still carry the old paths: map them the way next.config.ts redirects them
// (/notes/generate -> /prep/notes, any other /notes/<page> -> /prep/<page>).
function withCurrentNotesPath(url: string): string {
  const [, rawPath = '', rest = ''] = url.match(/^([^?#]*)([\s\S]*)$/) ?? [];
  const path = rawPath.replace(/\/$/, '');
  if (path === '/notes/generate') return '/prep/notes' + rest;
  if (path.startsWith('/notes/')) return '/prep' + path.slice('/notes'.length) + rest;
  return url;
}

function isValidAppPath(path: string): boolean {
  if (!path || !path.startsWith('/')) return false;
  // Strip query string and hash before checking
  const cleanPath = path.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  return VALID_EXACT_PATHS.has(cleanPath);
}

export function resolveNotificationRoute(n: Pick<Notification, 'type' | 'action_url'>): string | null {
  // Only use action_url if it exactly matches a known working page
  const actionUrl = n.action_url ? withCurrentNotesPath(n.action_url) : null;
  if (actionUrl && isValidAppPath(actionUrl)) return actionUrl;
  // Otherwise fall back to type-based routing
  return TYPE_FALLBACK[n.type?.toLowerCase?.()] ?? null;
}

export function isNotificationClickable(n: Pick<Notification, 'type' | 'action_url'>): boolean {
  return resolveNotificationRoute(n) !== null;
}
