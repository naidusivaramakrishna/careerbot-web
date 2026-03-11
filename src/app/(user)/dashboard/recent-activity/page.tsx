"use client";

/**
 * Recent Activity Page
 *
 * Displays all user activities with pagination and filtering
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity } from '@/types/dashboard.types';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { getDashboardSummary } from '@/api/dashboardApi';
import { toast } from 'sonner';

const RecentActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardSummary();
        setActivities(data.recent_activity);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load activities';
        console.error('Failed to fetch recent activities:', err);
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    return activityDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupActivitiesByDay = (items: Activity[]) => {
    const groups: Record<string, Activity[]> = {};

    items.forEach((activity) => {
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
        dayLabel = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[dayLabel]) groups[dayLabel] = [];
      groups[dayLabel].push(activity);
    });

    return groups;
  };

  // Pagination
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = activities.slice(startIdx, startIdx + itemsPerPage);
  const groupedActivities = groupActivitiesByDay(paginatedActivities);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#5896d7] animate-spin" />
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 max-w-4xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="mb-8 shrink-0">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Recent Activity</h1>
        <p className="text-gray-500">All your actions and activities</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <p className="text-red-700 font-medium">Failed to load activities</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && activities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No activity yet</h3>
          <p className="text-gray-500">Your actions will appear here</p>
        </div>
      ) : (
        <>
          {/* Activity List */}
          <div className="space-y-8 flex-1">
            {Object.entries(groupedActivities).map(([day, dayActivities]) => (
              <div key={day}>
                {/* Day Header */}
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4 sticky top-0 bg-white py-2 z-10">
                  {day}
                </h2>

                {/* Activities for this day */}
                <div className="space-y-0 divide-y divide-gray-100">
                  {dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">
                            {activity.feature_label}
                          </h3>
                          {activity.result_summary && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.result_summary}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>

                        {/* Credits Used */}
                        {activity.credits_used > 0 && (
                          <div className="flex-shrink-0 text-right">
                            <div className="inline-block px-3 py-1 bg-red-50 rounded-full">
                              <span className="text-sm font-semibold text-red-700">
                                -{activity.credits_used} cr
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, activities.length)} of {activities.length} activities
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentActivityPage;
