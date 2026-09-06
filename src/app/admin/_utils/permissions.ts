/**
 * Admin role-based access control
 * Defines which admin roles have access to specific pages
 */

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  // Runs every college and sees no money. Narrower than ADMIN, not a rank
  // beneath it: it reaches the college pages and none of the revenue ones.
  | 'PLATFORM_ADMIN'
  | 'MODERATOR'
  | 'SUPPORT';

export type AdminPageKey =
  | 'dashboard'
  | 'user-management'
  | 'admin-management'
  | 'system-monitoring'
  | 'colleges'
  | 'ai-spend'
  | 'settings';

/**
 * Page permissions mapping
 * Defines which roles can access each page
 */
export const PAGE_PERMISSIONS: Record<AdminPageKey, AdminRole[]> = {
  'dashboard': ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'],
  'user-management': ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'],
  'admin-management': ['SUPER_ADMIN'],
  // Onboarding a college is an ADMIN job, not only a founder's: the technical
  // team raises it with the super-admin team and whoever takes it creates the
  // college and appoints its officer. Mirrors the server, where ADMIN holds
  // institutions:create, :cpo:appoint and :cpo:revoke. Moderator and support
  // hold none of them, so the nav must not offer them a page whose every
  // request would be refused.
  // PLATFORM_ADMIN is here because running the colleges is the whole of its
  // job. It is absent from 'dashboard', 'ai-spend', 'user-management',
  // 'admin-management' and 'settings' on purpose -- those carry revenue,
  // consumer data or platform configuration, and the role exists so the
  // college estate can be delegated without them.
  'colleges': ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN'],
  'system-monitoring': ['SUPER_ADMIN', 'ADMIN', 'PLATFORM_ADMIN', 'MODERATOR', 'SUPPORT'],
  // SAME ROLES AS COLLEGES, and for the same reason the backend gates the
  // route on the billing permission: deciding what a college pays and seeing
  // what a college costs are the same job. Moderator and support see neither.
  'ai-spend': ['SUPER_ADMIN', 'ADMIN'],
  'settings': ['SUPER_ADMIN'],
};

/**
 * Check if a user has access to a page
 */
export const hasPageAccess = (userRole: AdminRole | null | undefined, pageKey: AdminPageKey): boolean => {
  if (!userRole) return false;

  // Normalize role to uppercase for comparison
  const normalizedRole = userRole.toUpperCase() as AdminRole;
  const allowedRoles = PAGE_PERMISSIONS[pageKey];
  return allowedRoles.includes(normalizedRole);
};

/**
 * Get required roles for a page
 */
export const getRequiredRoles = (pageKey: AdminPageKey): AdminRole[] => {
  return PAGE_PERMISSIONS[pageKey];
};

/**
 * Format role name for display
 */
export const formatRoleName = (role: AdminRole | string): string => {
  const roleMap: Record<string, string> = {
    'SUPER_ADMIN': 'Super Administrator',
    'PLATFORM_ADMIN': 'Platform Administrator',
    'ADMIN': 'Administrator',
    'MODERATOR': 'Moderator',
    'SUPPORT': 'Support Staff',
  };
  return roleMap[role?.toUpperCase() ?? ''] || role;
};
