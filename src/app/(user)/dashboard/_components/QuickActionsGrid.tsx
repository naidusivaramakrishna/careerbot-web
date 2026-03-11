/**
 * Quick Actions Grid
 *
 * Grid of 8 feature cards with usage counts
 * Uses static costs/labels with dynamic usage counts from API
 */

import React from 'react';
import { QUICK_ACTIONS } from '@/types/dashboard.types';
import { QuickActionCard } from './QuickActionCard';

export interface QuickActionsGridProps {
  usageCounts: Record<string, number>;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ usageCounts }) => {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action) => {
          // Map action IDs to usage count keys
          const usageCountMap: Record<string, string> = {
            'build-resume': 'resumes_created',
            'ats-scan': 'ats_scans',
            'enhance-resume': 'resumes_enhanced',
            'job-match': 'job_matches',
            'browse-jobs': 'job_applications', // Number of applications
            'interview-prep': 'assessments_taken',
            'track-apps': 'job_applications',
            'upgrade-plan': 'upgrades', // Not tracked
          };

          const countKey = usageCountMap[action.id];
          const usageCount = countKey ? usageCounts[countKey] : undefined;

          return (
            <QuickActionCard
              key={action.id}
              {...action}
              usageCount={usageCount}
            />
          );
        })}
      </div>
    </div>
  );
};
