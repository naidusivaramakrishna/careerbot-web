const TENANT_KEY = 'careerbot_tenant_id';

export function getTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TENANT_KEY);
}

export function setTenantId(tenantId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TENANT_KEY, tenantId);
}

export function clearTenantId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TENANT_KEY);
}
