"use client";

import { useEffect, useState } from 'react';
import { AdminRole, AdminPageKey, hasPageAccess, getRequiredRoles } from '../_utils/permissions';
import { getCurrentAdmin } from '@/api/adminAuthApi';
import { logger } from '@/lib/logger';

interface UseAdminAccessReturn {
  userRole: AdminRole | null;
  hasAccess: boolean;
  requiredRoles: AdminRole[];
  loading: boolean;
  error: string | null;
}

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

        // Check cache first (role doesn't change during session)
        const cached = sessionStorage.getItem('admin_role');
        if (cached) {
          const normalizedRole = cached as AdminRole;
          setUserRole(normalizedRole);
          logger.debug(`Admin role from cache: ${normalizedRole}`);
          setLoading(false);
          return;
        }

        const admin = await getCurrentAdmin();
        logger.debug(`getCurrentAdmin response: role=${admin?.role}`);

        if (admin && admin.role) {
          // Normalize role to uppercase (API might return lowercase)
          const normalizedRole = admin.role.toUpperCase() as AdminRole;
          setUserRole(normalizedRole);
          // Cache the role for subsequent page navigations
          sessionStorage.setItem('admin_role', normalizedRole);
          logger.debug(`Admin access check: role=${normalizedRole}, page=${pageKey}, hasAccess=${hasPageAccess(normalizedRole, pageKey)}`);
        } else {
          logger.error('Unable to determine admin role');
          setError('Unable to determine admin role');
          setUserRole(null);
        }
      } catch (err) {
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
