"use client";

/**
 * Recent Activity Page
 *
 * Displays all user activities with pagination and filtering
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity } from '@/types/dashboard.types';
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  ScanSearch,
  UserRoundCheck,
} from 'lucide-react';
import { getDashboardSummary } from '@/api/dashboardApi';
import { toast } from 'sonner';

const RecentActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const activityIcons: Record<string, React.ElementType> = {
    ats_scan: ScanSearch,
    assessment: MessageSquare,
    enhancement: FileText,
    interview: MessageSquare,
    mock_interview: MessageSquare,
    job_application: Briefcase,
    job_match: Briefcase,
    profile_update: UserRoundCheck,
    profile_updated: UserRoundCheck,
    resume_create: FileText,
    resume_enhanced: FileText,
    resume_parse: FileText,
  };

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

    if (diffMins < 1) return 'Just now';
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
  const creditsUsed = activities.reduce((total, activity) => total + Math.max(0, activity.credits_used || 0), 0);
  const completedActions = activities.length;
  const lastActivity = activities[0] ? formatTimeAgo(activities[0].timestamp) : 'No activity';
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter((page) => (
    page === 1 ||
    page === totalPages ||
    Math.abs(page - currentPage) <= 1
  ));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="rounded-2xl border border-gray-200 bg-white px-8 py-7 text-center shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#2557a7]" />
            <p className="mt-4 text-sm font-black text-gray-950">Loading recent activity</p>
            <p className="mt-1 text-sm text-gray-500">Collecting your latest workspace actions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-5 text-gray-950 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.055)] sm:px-6">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-black text-[#2557a7] transition hover:bg-[#eef4ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="mt-1.5 text-[26px] font-black leading-tight tracking-[-0.03em] text-gray-950 sm:text-[30px]">
                Recent activity
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                A clear history of completed resume, profile, ATS, matching, and application actions in your CareerBot workspace.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 sm:min-w-[390px]">
              <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-gray-200">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Actions</p>
                <p className="mt-1 text-lg font-black text-gray-950">{completedActions}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-gray-200">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Credits</p>
                <p className="mt-1 text-lg font-black text-gray-950">{creditsUsed}</p>
              </div>
              <div className="rounded-xl bg-white px-3 py-3 ring-1 ring-gray-200">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Latest</p>
                <p className="mt-1 truncate text-sm font-black text-gray-950">{lastActivity}</p>
              </div>
            </div>
          </div>
        </header>

      {/* Error State */}
      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 ring-1 ring-red-100">
              <AlertCircle size={18} />
            </span>
            <div>
              <p className="text-sm font-black text-red-800">Failed to load activities</p>
              <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!error && activities.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center shadow-[0_18px_55px_rgba(15,23,42,0.055)] sm:px-6">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2557a7] ring-1 ring-[#d9e5f8]">
            <Clock className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-black tracking-[-0.025em] text-gray-950">No activity yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Once you upload a resume, complete your profile, run an ATS scan, match a job, or apply, the completed work will appear here.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#2557a7] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,87,167,0.2)] transition hover:bg-[#1f4a91]"
          >
            Continue setup
          </Link>
        </section>
      ) : (
        <>
          {/* Activity List */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.055)]">
            <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Timeline</p>
                  <h2 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-gray-950">Completed work</h2>
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  Showing {startIdx + 1}-{Math.min(startIdx + itemsPerPage, activities.length)} of {activities.length}
                </p>
              </div>
            </div>

            <div className="space-y-6 px-4 py-4 sm:px-6">
            {Object.entries(groupedActivities).map(([day, dayActivities]) => (
              <div key={day}>
                {/* Day Header */}
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{day}</h3>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                {/* Activities for this day */}
                <div className="relative space-y-2 before:absolute before:left-5 before:top-5 before:h-[calc(100%-40px)] before:w-px before:bg-gray-200">
                  {dayActivities.map((activity) => {
                    const Icon = activityIcons[(activity.feature ?? '').toLowerCase()] ?? ActivityIcon;

                    return (
                    <div
                      key={activity.id}
                      className="relative grid grid-cols-[42px_1fr] gap-3 rounded-2xl border border-transparent px-1 py-2 transition hover:border-gray-200 hover:bg-gray-50 sm:grid-cols-[42px_1fr_auto]"
                    >
                      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-[#d9e5f8] bg-[#eef4ff] text-[#2557a7] shadow-[0_8px_20px_rgba(37,87,167,0.08)]">
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0 self-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-[13px] font-black text-gray-950">{activity.feature_label}</h3>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-black text-gray-500">
                            {activity.credits_used > 0 ? `${activity.credits_used} credits` : 'Free'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {activity.result_summary || 'Action completed successfully'}
                        </p>
                      </div>
                      <div className="col-start-2 self-center text-left sm:col-start-auto sm:text-right">
                        <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-500 ring-1 ring-gray-200">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-[0_18px_55px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm font-semibold text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-black text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Previous
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {pageNumbers.map((page, index) => (
                    <React.Fragment key={page}>
                      {index > 0 && page - pageNumbers[index - 1] > 1 && (
                        <span className="flex h-10 w-8 items-center justify-center text-sm font-black text-gray-400">...</span>
                      )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-xl text-sm font-black transition ${
                        currentPage === page
                          ? 'bg-[#2557a7] text-white shadow-[0_10px_22px_rgba(37,87,167,0.18)]'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                    </React.Fragment>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-black text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </>
      )}
      </div>
    </main>
  );
};

export default RecentActivityPage;
