import type { Notification } from '@/api/notificationsApi';

// Only confirmed, fully-implemented pages
const VALID_EXACT_PATHS = new Set([
  '/jobs',
  '/jobs/tracking',
  '/jobmatch',
  '/tracker',
  '/job-parser',
  '/builder/start',
  '/builder/start/list',
  '/ats',
  '/ats/report',
  '/atslogin',
  '/templates',
  '/parser',
  '/mock-interview',
  '/mock-interview/history',
  '/mock-interview/practice',
  '/mock-test',
  '/mock-test/history',
  '/communication',
  '/prep',
  '/scheduler',
  '/dashboard',
  '/profile',
  '/alerts',
  '/settings/subscription',
]);

// Per-type fallback when action_url is missing or invalid
const TYPE_FALLBACK: Record<string, string | null> = {
  job:           '/jobs',
  jobmatch:      '/jobmatch',
  resume:        '/builder/start/list',
  parser:        '/parser',
  ats:           '/ats',
  atslogin:      '/atslogin',
  interview:     '/mock-interview',
  communication: '/communication',
  'mock-test':   '/mock-test',
  prep:          '/prep',
  scheduler:     '/scheduler',
  credit:        '/settings/subscription',
  pricing:       '/settings/subscription',
  system:        null,
};

function isValidAppPath(path: string): boolean {
  if (!path || !path.startsWith('/')) return false;
  // Strip query string and hash before checking
  const cleanPath = path.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  return VALID_EXACT_PATHS.has(cleanPath);
}

export function resolveNotificationRoute(n: Pick<Notification, 'type' | 'action_url'>): string | null {
  // Only use action_url if it exactly matches a known working page
  if (n.action_url && isValidAppPath(n.action_url)) return n.action_url;
  // Otherwise fall back to type-based routing
  return TYPE_FALLBACK[n.type?.toLowerCase?.()] ?? null;
}

export function isNotificationClickable(n: Pick<Notification, 'type' | 'action_url'>): boolean {
  return resolveNotificationRoute(n) !== null;
}
