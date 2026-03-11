/**
 * Admin role-based access control
 * Defines which admin roles have access to specific pages
 */

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';

export type AdminPageKey =
  | 'dashboard'
  | 'user-management'
  | 'admin-management'
  | 'job-management'
  | 'system-monitoring'
  | 'settings';

/**
 * Page permissions mapping
 * Defines which roles can access each page
 */
export const PAGE_PERMISSIONS: Record<AdminPageKey, AdminRole[]> = {
  'dashboard': ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'],
  'user-management': ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'],
  'admin-management': ['SUPER_ADMIN'],
  'job-management': ['SUPER_ADMIN', 'ADMIN'],
  'system-monitoring': ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT'],
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
    'ADMIN': 'Administrator',
    'MODERATOR': 'Moderator',
    'SUPPORT': 'Support Staff',
  };
  return roleMap[role] || role;
};
