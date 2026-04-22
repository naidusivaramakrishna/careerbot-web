'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { getTenantId, setTenantId, clearTenantId } from '@/lib/tenantStorage';

interface TenantContextValue {
  tenantId: string | null;
  setActiveTenant: (id: string) => void;
  clearTenant: () => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenantId, setTenantIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = getTenantId();
    if (stored) setTenantIdState(stored);
  }, []);

  const setActiveTenant = useCallback((id: string) => {
    setTenantId(id);
    setTenantIdState(id);
  }, []);

  const clearTenant = useCallback(() => {
    clearTenantId();
    setTenantIdState(null);
  }, []);

  return (
    <TenantContext.Provider value={{ tenantId, setActiveTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used inside TenantProvider');
  return ctx;
}
