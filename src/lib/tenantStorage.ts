const TENANT_KEY = 'careerbot_tenant_id';
const TENANT_MAP_KEY = 'careerbot_email_tenant_map';
const DEFAULT_TENANT = 'public';

/**
 * Generate tenant_id for new signups
 * Currently returns "public" for all signups
 * TODO: In future, generate random tenant_id (format: tenant_<random>)
 * when multi-tenant organization support is required
 */
export function generateTenantId(): string {
  // Temporary: Use "public" for all signups
  // Future: return 'tenant_' + Math.random().toString(36).substring(2, 11);
  return 'public';
}

/**
 * Get stored tenant_id or return default ("public")
 * Used before calling signin to include in X-Tenant-Id header
 */
export function getTenantId(): string {
  if (typeof window === 'undefined') return DEFAULT_TENANT;
  return localStorage.getItem(TENANT_KEY) || DEFAULT_TENANT;
}

/**
 * Store tenant_id in localStorage and set as active
 * Called after signup/signin when backend echoes back tenant_id
 */
export function setTenantId(tenantId: string): void {
  if (typeof window === 'undefined') return;
  if (tenantId) {
    localStorage.setItem(TENANT_KEY, tenantId);
  }
}

/**
 * Clear tenant_id on logout
 */
export function clearTenantId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TENANT_KEY);
}

// ==================== MULTI-USER SUPPORT ====================

/**
 * Get tenant_id for a specific email
 * Returns the tenant this email is registered under
 * Used when logging in to find the correct tenant
 */
export function getTenantByEmail(email: string): string | null {
  if (typeof window === 'undefined') return null;
  const mapJson = localStorage.getItem(TENANT_MAP_KEY);
  if (!mapJson) return null;

  try {
    const map = JSON.parse(mapJson) as Record<string, string>;
    return map[email.toLowerCase()] || null;
  } catch {
    return null;
  }
}

/**
 * Store email → tenant mapping and set as active tenant
 * Called after signup/signin to persist which tenant each email belongs to
 * Allows multiple accounts on same browser
 */
export function setTenantForEmail(email: string, tenantId: string): void {
  if (typeof window === 'undefined') return;

  const mapJson = localStorage.getItem(TENANT_MAP_KEY);
  let map: Record<string, string> = {};

  if (mapJson) {
    try {
      map = JSON.parse(mapJson);
    } catch {
      map = {};
    }
  }

  // Store email → tenant mapping
  map[email.toLowerCase()] = tenantId;
  localStorage.setItem(TENANT_MAP_KEY, JSON.stringify(map));

  // Also set as currently active tenant
  setTenantId(tenantId);
}
