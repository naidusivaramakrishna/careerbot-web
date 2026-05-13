"use client";

import React, { useMemo } from "react";
import {
  Bell, ScanSearch, Wand2, Briefcase, User, AlertCircle,
  CheckCheck, X, Inbox, Loader2,
} from "lucide-react";
import { useNotificationsList } from "@/hooks/useNotificationsList";
import { markNotificationAsRead, deleteNotification, markAllNotificationsAsRead, deleteAllNotifications } from "@/api/notificationsApi";
import { resolveNotificationRoute } from "@/lib/notificationRoute";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/* ── Notification type ────────────────────────────── */
type NType = "job" | "credit" | "system" | "interview" | "resume" | string;

/* ── Type mapping ─────────────────────────────────── */
const NOTIF_META: Record<string, { icon: React.ReactNode; bg: string; iconColor: string; label: string; accentColor: string }> = {
  job:       { icon: <Briefcase size={15} />,   bg: "#fffbeb", iconColor: "#d97706", label: "Jobs",      accentColor: "#f59e0b" },
  resume:    { icon: <Wand2 size={15} />,       bg: "#f1f5f9", iconColor: "#475569", label: "Resume",    accentColor: "#64748b" },
  credit:    { icon: <AlertCircle size={15} />, bg: "#fff7ed", iconColor: "#ea580c", label: "Credits",   accentColor: "#f97316" },
  interview: { icon: <User size={15} />,        bg: "#f1f0ff", iconColor: "#7c3aed", label: "Interview", accentColor: "#a855f7" },
  system:    { icon: <AlertCircle size={15} />, bg: "#f0f9ff", iconColor: "#0284c7", label: "System",    accentColor: "#0ea5e9" },
};

const getNotifMeta = (type: string) => {
  return NOTIF_META[type.toLowerCase()] || NOTIF_META.system;
};

const DATE_GROUPS = ["Today", "Yesterday", "Earlier"] as const;
type FilterTab = "all" | "unread" | NType;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all",     label: "All"     },
  { id: "unread",  label: "Unread"  },
  { id: "job",     label: "Jobs"    },
  { id: "resume",  label: "Resume"  },
  { id: "credit",  label: "Credits" },
  { id: "system",  label: "System"  },
];

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDateGroup = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return 'Earlier';
};

/* ── Page ───────────────────────────────────────────── */
export default function AlertsPage() {
  const router = useRouter();
  const { notifications, unreadCount, loading, error, refetch } = useNotificationsList(1, 50);
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all");

  const totalCount = notifications.length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to mark as read';
      toast.error(msg);
    }
  };

  const handleRowClick = (n: typeof notifications[number]) => {
    const route = resolveNotificationRoute(n);
    if (route) {
      handleMarkAsRead(n.id);
      router.push(route);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await deleteNotification(id);
      refetch();
    } catch (err) {
      toast.error('Failed to dismiss notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      refetch();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteAll = async () => {
    // Confirm before deleting all
    const confirmed = confirm('Are you sure you want to delete all notifications? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteAllNotifications();
      refetch();
      toast.success('All notifications deleted');
    } catch (err) {
      toast.error('Failed to delete all notifications');
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "all")    return true;
      if (activeTab === "unread") return !n.read;
      return n.type.toLowerCase() === activeTab.toLowerCase();
    });
  }, [notifications, activeTab]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof notifications> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    filtered.forEach((n) => {
      const dateGroup = getDateGroup(n.timestamp);
      groups[dateGroup].push(n);
    });
    return groups;
  }, [filtered]);

  const stats = useMemo(() => [
    { label: "Total",    value: totalCount,                                               sub: "notifications" },
    { label: "Unread",   value: unreadCount,                                              sub: "need attention" },
    { label: "Today",    value: groupedByDate.Today.length,                               sub: "received today" },
    { label: "Archived", value: groupedByDate.Earlier.length,                             sub: "from earlier"  },
  ], [totalCount, unreadCount, groupedByDate]);

  if (loading) {
    return (
      <div className="p-5 md:p-8 max-w-4xl mx-auto flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#5896d7] animate-spin" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Failed to load notifications</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#2557a7" }}
          >
            <Bell size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">Notifications</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread · ` : "All caught up · "}{totalCount} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: "#2557a7", color: "white" }}
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
          {totalCount > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50"
            >
              <X size={13} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
            <p
              className="text-2xl font-black leading-none"
              style={{ color: i === 1 && s.value > 0 ? "#2557a7" : "#111827" }}
            >
              {s.value}
            </p>
            <p className="text-xs font-semibold text-gray-700 mt-1">{s.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const isActive  = activeTab === tab.id;
          const tabUnread =
            tab.id === "all"    ? 0 :
            tab.id === "unread" ? unreadCount :
            notifications.filter((n) => n.type.toLowerCase() === tab.id.toLowerCase() && !n.read).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isActive
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
              style={isActive ? { background: "#2557a7" } : {}}
            >
              {tab.label}
              {tabUnread > 0 && !isActive && (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-blue-100 text-[#2557a7] text-[9px] font-bold">
                  {tabUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Notification list ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-gray-200 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 border border-gray-100">
            <Inbox size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600">Nothing here</p>
          <p className="text-xs text-gray-400 mt-0.5">No notifications match this filter</p>
        </div>
      ) : (
        <div className="space-y-5">
          {DATE_GROUPS.map((group) => {
            const items = groupedByDate[group as keyof typeof groupedByDate];
            if (items.length === 0) return null;

            return (
              <div key={group}>
                {/* Group label */}
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-semibold text-gray-300">{items.length}</span>
                </div>

                {/* Card group */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden divide-y divide-gray-100">
                  {items.map((n) => {
                    const meta = getNotifMeta(n.type);
                    const route = resolveNotificationRoute(n);
                    const isClickable = route !== null;
                    return (
                      <div
                        key={n.id}
                        onClick={isClickable ? () => handleRowClick(n) : undefined}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onKeyDown={isClickable ? (e) => e.key === "Enter" && handleRowClick(n) : undefined}
                        className={`relative flex items-start gap-3.5 px-5 py-4 transition-colors group ${
                          isClickable
                            ? `cursor-pointer ${n.read ? "hover:bg-gray-50/70" : "bg-blue-50/40 hover:bg-blue-50/60"}`
                            : `cursor-default ${n.read ? "" : "bg-blue-50/40"}`
                        }`}
                      >
                        {/* Unread left accent */}
                        {!n.read && (
                          <div
                            className="absolute left-0 top-3.5 bottom-3.5 w-0.75 rounded-r-full"
                            style={{ background: meta.accentColor }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: meta.bg, color: meta.iconColor }}
                        >
                          {meta.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-[13px] leading-snug ${n.read ? "font-medium text-gray-500" : "font-bold text-gray-900"}`}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                              <span
                                className="hidden md:inline text-[9px] font-semibold px-2 py-0.5 rounded-full border"
                                style={{
                                  color: meta.iconColor,
                                  background: meta.bg,
                                  borderColor: `${meta.accentColor}30`,
                                }}
                              >
                                {meta.label}
                              </span>
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatTimeAgo(n.timestamp)}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                        </div>

                        {/* Hover actions */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                          {!n.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-50 text-[#2557a7] hover:bg-blue-100 transition-colors"
                              title="Mark as read"
                            >
                              <CheckCheck size={12} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors"
                            title="Dismiss"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}
