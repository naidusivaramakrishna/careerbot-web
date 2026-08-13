"use client";

import React, { useMemo } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Inbox,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  EnterpriseInterviewPrepIcon as IcoInterview,
  EnterpriseNotificationIcon as IcoNotification,
  EnterpriseJobsIcon as IcoJobs,
  EnterpriseProfileIcon as IcoProfile,
  EnterpriseResumeIcon as IcoResume,
  EnterpriseSubscriptionIcon as IcoCredits,
  EnterpriseSystemNotificationIcon as IcoSystem,
} from "@/components/icons/EnterpriseNavIcons";
import { useNotificationsList } from "@/hooks/useNotificationsList";
import {
  deleteAllNotifications,
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/api/notificationsApi";
import { resolveNotificationRoute } from "@/lib/notificationRoute";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type FilterTab = "all" | "unread" | "job" | "profile" | "resume" | "credit" | "interview" | "system";
type NotificationItem = ReturnType<typeof useNotificationsList>["notifications"][number];

type NotifMeta = {
  icon: React.ReactNode;
  label: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
  glow: string;
};

const NOTIF_META: Record<Exclude<FilterTab, "all" | "unread">, NotifMeta> = {
  job: {
    icon: <IcoJobs size={16} sw={1.9} />,
    label: "Jobs",
    bg: "#f8fafc",
    text: "#2557a7",
    border: "#e5e7eb",
    accent: "#2557a7",
    glow: "rgba(37,87,167,0.12)",
  },
  profile: {
    icon: <IcoProfile size={16} sw={1.9} />,
    label: "Profile",
    bg: "#f8fafc",
    text: "#111827",
    border: "#e5e7eb",
    accent: "#2557a7",
    glow: "rgba(17,24,39,0.08)",
  },
  resume: {
    icon: <IcoResume size={16} sw={1.9} />,
    label: "Resume",
    bg: "#f8fafc",
    text: "#2557a7",
    border: "#e5e7eb",
    accent: "#2557a7",
    glow: "rgba(37,87,167,0.12)",
  },
  credit: {
    icon: <IcoCredits size={16} sw={1.9} />,
    label: "Credits",
    bg: "#f8fafc",
    text: "#111827",
    border: "#e5e7eb",
    accent: "#2557a7",
    glow: "rgba(17,24,39,0.08)",
  },
  interview: {
    icon: <IcoInterview size={16} sw={1.9} />,
    label: "Interview",
    bg: "#f8fafc",
    text: "#2557a7",
    border: "#e5e7eb",
    accent: "#2557a7",
    glow: "rgba(37,87,167,0.12)",
  },
  system: {
    icon: <IcoSystem size={16} sw={1.9} />,
    label: "System",
    bg: "#f8fafc",
    text: "#111827",
    border: "#e5e7eb",
    accent: "#2557a7",
    glow: "rgba(17,24,39,0.08)",
  },
};

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "job", label: "Jobs" },
  { id: "profile", label: "Profile" },
  { id: "resume", label: "Resume" },
  { id: "credit", label: "Credits" },
  { id: "interview", label: "Interview" },
  { id: "system", label: "System" },
];

// Backend category field → filter tab (primary signal)
const CATEGORY_TO_FILTER: Record<string, FilterTab> = {
  credit: "credit",
  profile: "profile",
  resume: "resume",
  job: "job",
  interview: "interview",
  interview_prep: "interview",
  assessment: "interview",
  system: "system",
};

// Notification type field → filter tab (secondary signal)
const TYPE_TO_FILTER: Record<string, FilterTab> = {
  job: "job",
  jobmatch: "job",
  profile: "profile",
  user: "profile",
  account: "profile",
  onboarding: "profile",
  resume: "resume",
  parser: "resume",
  parse: "resume",
  enhance: "resume",
  enhancer: "resume",
  resume_parse: "resume",
  resume_enhance: "resume",
  resume_parsed: "resume",
  resume_created: "resume",
  resume_updated: "resume",
  resume_builder: "resume",
  builder: "resume",
  credit: "credit",
  pricing: "credit",
  payment: "credit",
  interview: "interview",
  mock_interview_live_started: "interview",
  session_abandoned: "interview",
  communication: "interview",
  "mock-test": "interview",
  prep: "interview",
  assessment_started: "interview",
  english_assessment_started: "interview",
  ats: "system",
  atslogin: "system",
  scheduler: "system",
  system: "system",
  info: "system",
};

const resolveFilterCategory = (notification: Pick<NotificationItem, "type" | "title" | "body" | "action_url" | "category"> | string | undefined): FilterTab => {
  if (typeof notification === "string" || notification === undefined) {
    return TYPE_TO_FILTER[(notification ?? "").toLowerCase()] ?? "system";
  }

  // Use backend category as the primary signal — it is the authoritative source
  if (notification.category) {
    const fromCategory = CATEGORY_TO_FILTER[notification.category.toLowerCase()];
    if (fromCategory) return fromCategory;
  }

  // Fall back to type lookup, then keyword matching
  const fromType = TYPE_TO_FILTER[(notification.type ?? "").toLowerCase()];
  if (fromType) return fromType;

  const text = [notification.title, notification.body, notification.action_url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hasAny = (keywords: string[]) => keywords.some((kw) => text.includes(kw));

  if (hasAny(["credit", "pricing", "payment", "subscription", "plan", "balance"])) return "credit";
  if (hasAny(["/profile", "profile", "complete your profile", "personal info", "personal information", "avatar"])) return "profile";
  if (hasAny(["resume", "parser", "parsed", "parse", "enhance", "enhanced", "builder", " cv"])) return "resume";
  if (hasAny(["interview", "communication", "assessment", "english", "mock-test", "mock test", "prep"])) return "interview";
  if (hasAny(["job", "jobmatch", "match", "application", "tracker", "apply"])) return "job";

  return "system";
};

const getNotifMeta = (notification: Pick<NotificationItem, "type" | "title" | "body" | "action_url" | "category"> | string | undefined): NotifMeta =>
  NOTIF_META[resolveFilterCategory(notification) as Exclude<FilterTab, "all" | "unread">] ?? NOTIF_META.system;

const getDateKey = (timestamp: string): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
};

const getDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

const isToday = (timestamp: string): boolean => new Date(timestamp).toDateString() === new Date().toDateString();

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, totalCount, readCount, unreadCount, pagination, currentPage, loading, error, refetch, goToPage, nextPage, prevPage } = useNotificationsList(1, 50);
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all");
  const [query, setQuery] = React.useState("");

  const categoryCounts = useMemo(() => {
    return notifications.reduce<Record<FilterTab, number>>(
      (acc, n) => {
        acc.all += 1;
        if (!n.read) acc.unread += 1;
        acc[resolveFilterCategory(n)] += 1;
        return acc;
      },
      { all: 0, unread: 0, job: 0, profile: 0, resume: 0, credit: 0, interview: 0, system: 0 }
    );
  }, [notifications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchesTab =
        activeTab === "all" ? true : activeTab === "unread" ? !n.read : resolveFilterCategory(n) === activeTab;
      const matchesQuery =
        q.length === 0 ||
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        getNotifMeta(n).label.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [notifications, activeTab, query]);

  const dateGroups = useMemo(() => {
    const groups = new Map<string, NotificationItem[]>();
    filtered.forEach((n) => {
      const key = getDateKey(n.timestamp);
      groups.set(key, [...(groups.get(key) ?? []), n]);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime())
      .map(([dateKey, items]) => ({ dateKey, label: getDateLabel(dateKey), items }));
  }, [filtered]);

  const stats = useMemo(
    () => [
      { label: "Total", value: totalCount, sub: "all notifications", tone: "text-gray-950" },
      { label: "Unread", value: unreadCount, sub: "need review", tone: "text-[#2557a7]" },
      { label: "Read", value: readCount, sub: "handled", tone: "text-gray-950" },
      { label: "Today", value: notifications.filter((n) => isToday(n.timestamp)).length, sub: "latest activity", tone: "text-[#2557a7]" },
    ],
    [totalCount, unreadCount, readCount, notifications]
  );

  const visiblePageNumbers = useMemo(() => {
    const totalPages = pagination.total_pages;
    if (totalPages <= 1) return [];

    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [pagination.total_pages, currentPage]);

  const paginationStart = notifications.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const paginationEnd = notifications.length > 0 ? paginationStart + notifications.length - 1 : 0;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to mark as read";
      toast.error(msg);
    }
  };

  const handleRowClick = (n: NotificationItem) => {
    const route = resolveNotificationRoute(n);
    if (!route) return;
    handleMarkAsRead(n.id);
    router.push(route);
  };

  const handleDismiss = async (id: string) => {
    try {
      await deleteNotification(id);
      refetch();
    } catch {
      toast.error("Failed to dismiss notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      refetch();
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = confirm("Are you sure you want to delete all notifications? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteAllNotifications();
      refetch();
      toast.success("All notifications deleted");
    } catch {
      toast.error("Failed to delete all notifications");
    }
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-gray-50 px-5 py-8 md:px-8">
        <div className="mx-auto flex min-h-[420px] max-w-6xl items-center justify-center rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-[#2557a7]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Loading notifications</p>
            <p className="text-xs text-gray-400">Syncing your latest account activity.</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-gray-50 px-5 py-8 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-700">
            <AlertCircle size={22} />
          </div>
          <p className="text-base font-bold text-gray-900">Failed to load notifications</p>
          <p className="mt-1 text-sm text-gray-700">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gray-50 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="relative px-5 py-5 md:px-7 md:py-6">
            <div className="absolute right-0 top-0 h-28 w-60 rounded-bl-full bg-gray-50" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: "#2557a7" }}>
                  <IcoNotification size={21} sw={1.9} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-gray-950">Notifications</h1>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#2557a7] ring-1 ring-gray-200">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                    Review product updates, resume activity, job signals, credits, and interview prep notifications from one place.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2557a7] px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                  >
                    <CheckCheck size={16} />
                    Mark all read
                  </button>
                )}
                {totalCount > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <Trash2 size={15} />
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <p className={`text-2xl font-black leading-none ${s.tone}`}>{s.value}</p>
              <p className="mt-1 text-sm font-bold text-gray-800">{s.label}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-400">{s.sub}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm md:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notifications"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#2557a7]/30 focus:bg-white focus:ring-4 focus:ring-[#2557a7]/10"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <span className="hidden items-center gap-1.5 whitespace-nowrap px-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-400 lg:flex">
                <Filter size={13} />
                Filter
              </span>
              {FILTER_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const count = categoryCounts[tab.id];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
                      isActive
                        ? "border-transparent bg-[#2557a7] text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#2557a7]/30 hover:bg-[#2557a7]/5 hover:text-[#2557a7]"
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {filtered.length === 0 ? (
          <section className="rounded-3xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 text-gray-300">
              <Inbox size={28} />
            </div>
            <p className="text-base font-bold text-gray-800">Nothing here</p>
            <p className="mt-1 text-sm text-gray-400">No notifications match the selected filter or search.</p>
          </section>
        ) : (
          <section className="space-y-6">
            {dateGroups.map(({ dateKey, label, items }) => {
              return (
                <div key={dateKey}>
                  <div className="mb-2 flex items-center gap-3 px-1">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-400">{label}</span>
                    <div className="h-px flex-1 bg-gray-200/70" />
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-gray-400 ring-1 ring-gray-200">{items.length}</span>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                    {items.map((n) => {
                      const meta = getNotifMeta(n);
                      const route = resolveNotificationRoute(n);
                      const isClickable = route !== null;

                      return (
                        <article
                          key={n.id}
                          onClick={isClickable ? () => handleRowClick(n) : undefined}
                          role={isClickable ? "button" : undefined}
                          tabIndex={isClickable ? 0 : undefined}
                          onKeyDown={isClickable ? (e) => e.key === "Enter" && handleRowClick(n) : undefined}
                          className={`group relative flex gap-4 border-b border-gray-100 px-4 py-4 transition last:border-b-0 md:px-5 ${
                            isClickable ? "cursor-pointer hover:bg-gray-50/80" : "cursor-default"
                          } ${!n.read ? "bg-[#2557a7]/5" : "bg-white"}`}
                        >
                          {!n.read && <span className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full" style={{ background: meta.accent }} />}

                          <div
                            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm"
                            style={{ background: meta.bg, color: meta.text, borderColor: meta.border, boxShadow: `0 10px 24px ${meta.glow}` }}
                          >
                            {meta.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className={`text-sm leading-5 ${n.read ? "font-semibold text-gray-600" : "font-black text-gray-950"}`}>{n.title}</h2>
                                  {!n.read && <span className="h-2 w-2 rounded-full" style={{ background: meta.accent }} />}
                                </div>
                                <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">{n.body}</p>
                              </div>


                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1 self-start opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                            {!n.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(n.id);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 text-[#2557a7] transition hover:bg-[#2557a7]/5"
                                title="Mark as read"
                              >
                                <CheckCheck size={14} />
                              </button>
                            )}
                            {isClickable && (
                              <span className="hidden h-8 w-8 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition group-hover:text-[#2557a7] md:flex">
                                <ArrowUpRight size={14} />
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(n.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                              title="Dismiss"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {pagination.total_pages > 1 && (
          <section className="rounded-3xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:px-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs font-semibold text-gray-500">
                Showing{" "}
                <span className="font-black text-gray-900">
                  {paginationStart}-{paginationEnd}
                </span>{" "}
                on page <span className="font-black text-gray-900">{pagination.page}</span>
                <span className="mx-1 text-gray-300">/</span>
                <span className="font-black text-gray-900">{pagination.total_pages}</span>
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={prevPage}
                  disabled={!pagination.has_prev}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition hover:border-[#2557a7]/30 hover:bg-[#2557a7]/5 hover:text-[#2557a7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>

                {visiblePageNumbers.map((page) => {
                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      disabled={isActive}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-xs font-black transition ${
                        isActive
                          ? "border-transparent bg-[#2557a7] text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#2557a7]/30 hover:bg-[#2557a7]/5 hover:text-[#2557a7]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={nextPage}
                  disabled={!pagination.has_next}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition hover:border-[#2557a7]/30 hover:bg-[#2557a7]/5 hover:text-[#2557a7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
