'use client';

import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { DashboardProvider } from '@/contexts/DashboardContext';

export default function CoverLetterDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <Header />
      <div className="flex h-screen overflow-hidden pt-14" style={{ backgroundColor: '#eef2fb' }}>
        <Sidebar />
        <div
          className="h-[calc(100vh-3.5rem)] flex-1 overflow-y-auto overflow-x-hidden"
          style={{ marginLeft: 'var(--sidebar-width, 64px)', transition: 'margin 300ms' }}
        >
          {children}
        </div>
      </div>
    </DashboardProvider>
  );
}
