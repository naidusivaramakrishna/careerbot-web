'use client';

import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { DashboardProvider } from '@/contexts/DashboardContext';

export default function CoverLetterDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <Header />
      <div className="flex min-h-screen pt-14" style={{ backgroundColor: '#eef2fb' }}>
        <Sidebar />
        <div
          className="flex-1 overflow-auto"
          style={{ marginLeft: 'var(--sidebar-width, 64px)', transition: 'margin 300ms' }}
        >
          {children}
        </div>
      </div>
    </DashboardProvider>
  );
}
