import type { Notification } from '@/api/notificationsApi';

const VALID_ROUTE_ROOTS = new Set([
  'jobs', 'jobmatch', 'tracker', 'job-parser', 'analytics',
  'builder', 'ats', 'atslogin', 'templates', 'parser', 'enhancer', 'resume',
  'mock-interview', 'mock-test', 'communication', 'prep', 'scheduler',
  'career', 'assistant', 'chatbot',
  'dashboard', 'profile', 'portfolio', 'feedback', 'onboarding',
  'alerts', 'center',
  'portal', 'pricing', 'settings',
]);

const TYPE_FALLBACK: Record<string, string | null> = {
  job: '/jobs',
  resume: '/builder/start/list',
  interview: '/mock-interview',
  credit: '/settings/subscription',
  system: null,
};

function isValidAppPath(path: string): boolean {
  if (!path || !path.startsWith('/')) return false;
  const root = path.slice(1).split(/[/?#]/)[0];
  return VALID_ROUTE_ROOTS.has(root);
}

export function resolveNotificationRoute(n: Pick<Notification, 'type' | 'action_url'>): string | null {
  if (n.action_url && isValidAppPath(n.action_url)) return n.action_url;
  const fallback = TYPE_FALLBACK[n.type?.toLowerCase?.()] ?? null;
  return fallback;
}

export function isNotificationClickable(n: Pick<Notification, 'type' | 'action_url'>): boolean {
  return resolveNotificationRoute(n) !== null;
}
