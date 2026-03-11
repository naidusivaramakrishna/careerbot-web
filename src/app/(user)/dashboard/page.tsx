"use client";

/**
 * Dashboard Home Page
 *
 * Rendering logic (per design spec):
 *   resume_uploaded === false → First-Time Dashboard (onboarding)
 *   resume_uploaded === true  → Full Analytics Dashboard
 *
 * Data is provided by DashboardContext (set up in ClientLayout).
 */

import React from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { PlanStatusCard } from './_components/PlanStatusCard';
import { CreditBalanceCard } from './_components/CreditBalanceCard';
import { ProfileCompletenessCard } from './_components/ProfileCompletenessCard';
import { RecommendedNextStep } from './_components/RecommendedNextStep';
import { QuickActionsGrid } from './_components/QuickActionsGrid';
import { RecentActivityPanel } from './_components/RecentActivityPanel';
import { ScoreSummaryPanel } from './_components/ScoreSummaryPanel';
import { StatsRowSkeleton } from './_components/skeletons/StatsRowSkeleton';
import { NextStepSkeleton } from './_components/skeletons/NextStepSkeleton';
import { QuickActionsSkeleton } from './_components/skeletons/QuickActionsSkeleton';
import { ActivityScoreSkeleton } from './_components/skeletons/ActivityScoreSkeleton';
import FirstTimeDashboard from './_components/FirstTimeDashboard';
import { toast } from 'sonner';

const DashboardPage: React.FC = () => {
  const { data: dashboardData, loading, error } = useDashboard();

  /* Loading */
  if (loading) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <StatsRowSkeleton />
        <NextStepSkeleton />
        <QuickActionsSkeleton />
        <ActivityScoreSkeleton />
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

  /* First-Time User: no resume uploaded */
  if (!dashboardData.progress.resume_uploaded) {
    return <FirstTimeDashboard />;
  }

  /* Full Analytics Dashboard */
  return (
    <div className="p-5 md:p-7 max-w-[1400px] mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Welcome back, {dashboardData.user.name}! 👋
        </h1>
        <p className="text-gray-500 text-sm">Your AI Career Command Center</p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <PlanStatusCard
            planName={dashboardData.plan.plan_name}
            planId={dashboardData.plan.plan_id}
            creditsTotal={dashboardData.plan.credits_total}
            planExpiresAt={dashboardData.plan.plan_expires_at}
          />
          <CreditBalanceCard
            creditsRemaining={dashboardData.plan.credits_remaining}
            creditsTotal={dashboardData.plan.credits_total}
          />
          <ProfileCompletenessCard
            completeness={dashboardData.profile.completeness}
            missingFields={dashboardData.profile.missing_fields}
          />
        </div>

        <RecommendedNextStep
          recommendedStep={dashboardData.recommended_step}
          progress={dashboardData.progress}
        />

        <QuickActionsGrid usageCounts={dashboardData.usage_counts} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <RecentActivityPanel activities={dashboardData.recent_activity} />
          </div>
          <ScoreSummaryPanel
            atsScore={dashboardData.best_scores.ats_score}
            jobMatchScore={dashboardData.best_scores.job_match_score}
            interviewScore={dashboardData.best_scores.interview_score}
          />
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
};

export default DashboardPage;
