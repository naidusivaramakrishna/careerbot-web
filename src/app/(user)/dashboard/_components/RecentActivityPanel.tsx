/**
 * Recent Activity Panel
 *
 * Displays recent user actions with timestamps and credit usage
 */

import React from 'react';
import { Activity } from '@/types/dashboard.types';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface RecentActivityPanelProps {
  activities: Activity[];
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({ activities }) => {
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupActivitiesByDay = (activities: Activity[]) => {
    const groups: Record<string, Activity[]> = {};

    activities.forEach((activity) => {
      const date = new Date(activity.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dayLabel: string;
      if (date.toDateString() === today.toDateString()) {
        dayLabel = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dayLabel = 'Yesterday';
      } else {
        dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      if (!groups[dayLabel]) groups[dayLabel] = [];
      groups[dayLabel].push(activity);
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDay(activities);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <Link href="/settings">
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No activity yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your actions will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([day, dayActivities]) => (
            <div key={day}>
              {/* Day Header */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {day}
              </h3>

              {/* Activities for this day */}
              <div className="space-y-3">
                {dayActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
                  >
                    {/* Bullet */}
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.feature_label}
                      </p>
                      {activity.result_summary && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {activity.result_summary}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>

                    {/* Credits Used */}
                    {activity.credits_used > 0 && (
                      <div className="flex-shrink-0 text-xs font-medium text-gray-600">
                        -{activity.credits_used} cr
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
