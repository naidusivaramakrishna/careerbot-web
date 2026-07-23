// Standalone in-memory admin role cache.
//
// Kept dependency-free (only a type import, erased at runtime) so BOTH the
// useAdminAccess hook AND the auth API (adminLogin / adminLogout) can reset it
// without a circular import — useAdminAccess already imports getCurrentAdmin from
// adminAuthApi, so exporting the cache from the hook would form a cycle.
//
// Module-level so it can't be read or written from browser DevTools (unlike
// sessionStorage). Resets on full page refresh; TTL is enforced by the reader.
import type { AdminRole } from '../_utils/permissions';

let _roleCache: { role: AdminRole; at: number } | null = null;

export const getAdminRoleCache = (): { role: AdminRole; at: number } | null => _roleCache;

export const setAdminRoleCache = (role: AdminRole): void => {
  _roleCache = { role, at: Date.now() };
};

// Called on admin login AND logout so a role from a previous session can never
// gate the UI for the next admin within the TTL window (SPA navigation keeps the
// module alive across login/logout without a full page refresh).
export const clearAdminRoleCache = (): void => {
  _roleCache = null;
};
