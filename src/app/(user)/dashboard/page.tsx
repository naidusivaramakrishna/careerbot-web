"use client";

import React from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import FirstTimeDashboard from './_components/FirstTimeDashboard';
import { toast } from 'sonner';

const DashboardPage: React.FC = () => {
  const { data: dashboardData, loading, error } = useDashboard();

  /* Loading */
  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-28 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 h-64 bg-gray-100 rounded-xl" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  /* Error */
  if (error || !dashboardData) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-red-700 mb-4">
            We couldn&apos;t load your dashboard data. Please try again.
          </p>
          <button
            onClick={() => { toast.dismiss(); window.location.reload(); }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <FirstTimeDashboard />;
};

export default DashboardPage;
