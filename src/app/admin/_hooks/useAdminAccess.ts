"use client";

import { useEffect, useState } from 'react';
import { AdminRole, AdminPageKey, hasPageAccess, getRequiredRoles } from '../_utils/permissions';
import { getCurrentAdmin } from '@/api/adminAuthApi';
import { getAdminRoleCache, setAdminRoleCache, clearAdminRoleCache } from './adminRoleCache';
import { logger } from '@/lib/logger';

interface UseAdminAccessReturn {
  userRole: AdminRole | null;
  hasAccess: boolean;
  requiredRoles: AdminRole[];
  loading: boolean;
  error: string | null;
}

// In-memory role cache lives in a dependency-free module (adminRoleCache) so
// adminLogin/adminLogout can reset it without a circular import. Resets on full
// page refresh, which is acceptable for a 30s TTL.
const ROLE_CACHE_TTL_MS = 30 * 1000;

/**
 * Hook to check if current admin has access to a page
 */
export const useAdminAccess = (pageKey: AdminPageKey): UseAdminAccessReturn => {
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use in-memory cache — not writable from DevTools, unlike sessionStorage
        const cached = getAdminRoleCache();
        const isCacheValid = cached && (Date.now() - cached.at) < ROLE_CACHE_TTL_MS;
        if (isCacheValid) {
          setUserRole(cached!.role);
          logger.debug(`Admin role from cache: ${cached!.role}`);
          setLoading(false);
          return;
        }

        clearAdminRoleCache();

        const admin = await getCurrentAdmin();
        logger.debug(`getCurrentAdmin response: role=${admin?.role}`);

        if (admin && admin.role) {
          const normalizedRole = admin.role.toUpperCase() as AdminRole;
          setUserRole(normalizedRole);
          setAdminRoleCache(normalizedRole);
          logger.debug(`Admin access check: role=${normalizedRole}, page=${pageKey}, hasAccess=${hasPageAccess(normalizedRole, pageKey)}`);
        } else {
          logger.error('Unable to determine admin role');
          setError('Unable to determine admin role');
          setUserRole(null);
        }
      } catch {
        logger.error('Error checking admin access');
        setError('Failed to verify admin permissions');
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [pageKey]);

  return {
    userRole,
    hasAccess: hasPageAccess(userRole, pageKey),
    requiredRoles: getRequiredRoles(pageKey),
    loading,
    error,
  };
};
