'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Settings, LogOut, CheckCheck, X, ChevronRight, Crown,
  ArrowUpRight,
} from 'lucide-react';
import {
  EnterpriseInterviewPrepIcon as IcoInterview,
  EnterpriseNotificationIcon as IcoNotification,
  EnterpriseJobsIcon as IcoJobs,
  EnterpriseProfileIcon as IcoProfile,
  EnterpriseResumeIcon as IcoResume,
  EnterpriseSubscriptionIcon as IcoCredits,
  EnterpriseSystemNotificationIcon as IcoSystem,
} from '@/components/icons/EnterpriseNavIcons';
import { useCreditsBalance } from '@/hooks/useCreditsBalance';
import { useNotificationStream } from '@/hooks/useNotificationStream';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { getProfile, getProfilePicture, UserProfile } from '@/api/userApi';
import { getDashboardSummary } from '@/api/dashboardApi';
import { signOut } from '@/api/authApi';
import { Notification } from '@/api/notificationsApi';
import { resolveNotificationRoute } from '@/lib/notificationRoute';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type NotificationMeta = {
  icon: React.ReactNode;
  label: string;
  grad: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
};

const NOTIF_META: Record<string, NotificationMeta> = {
  job: {
    icon: <IcoJobs size={14} sw={1.9} />,
    label: 'Jobs',
    grad: '#f8fafc',
    dot: '#2557a7',
    bg: '#f8fafc',
    text: '#2557a7',
    border: '#e5e7eb',
  },
  credit: {
    icon: <IcoCredits size={14} sw={1.9} />,
    label: 'Credits',
    grad: '#f8fafc',
    dot: '#2557a7',
    bg: '#f8fafc',
    text: '#111827',
    border: '#e5e7eb',
  },
  system: {
    icon: <IcoSystem size={14} sw={1.9} />,
    label: 'System',
    grad: '#f8fafc',
    dot: '#2557a7',
    bg: '#f8fafc',
    text: '#111827',
    border: '#e5e7eb',
  },
  interview: {
    icon: <IcoInterview size={14} sw={1.9} />,
    label: 'Interview',
    grad: '#f8fafc',
    dot: '#2557a7',
    bg: '#f8fafc',
    text: '#2557a7',
    border: '#e5e7eb',
  },
  profile: {
    icon: <IcoProfile size={14} sw={1.9} />,
    label: 'Profile',
    grad: '#f8fafc',
    dot: '#2557a7',
    bg: '#f8fafc',
    text: '#111827',
    border: '#e5e7eb',
  },
  resume: {
    icon: <IcoResume size={14} sw={1.9} />,
    label: 'Resume',
    grad: '#f8fafc',
    dot: '#2557a7',
    bg: '#f8fafc',
    text: '#2557a7',
    border: '#e5e7eb',
  },
};

const TYPE_TO_META: Record<string, keyof typeof NOTIF_META> = {
  job: 'job',
  jobmatch: 'job',
  profile: 'profile',
  user: 'profile',
  account: 'profile',
  onboarding: 'profile',
  resume: 'resume',
  parser: 'resume',
  parse: 'resume',
  enhance: 'resume',
  enhancer: 'resume',
  resume_parse: 'resume',
  resume_enhance: 'resume',
  resume_created: 'resume',
  resume_updated: 'resume',
  resume_builder: 'resume',
  builder: 'resume',
  credit: 'credit',
  pricing: 'credit',
  payment: 'credit',
  interview: 'interview',
  communication: 'interview',
  'mock-test': 'interview',
  prep: 'interview',
  ats: 'system',
  atslogin: 'system',
  scheduler: 'system',
  system: 'system',
};

const resolveMetaKey = (notification: Pick<Notification, 'type' | 'title' | 'body' | 'action_url'> | string): keyof typeof NOTIF_META => {
  if (typeof notification === 'string') {
    return TYPE_TO_META[notification.toLowerCase()] ?? 'system';
  }

  const text = [notification.type, notification.title, notification.body, notification.action_url]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const hasAny = (keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

  if (hasAny(['credit', 'pricing', 'payment', 'subscription', 'plan', 'balance'])) return 'credit';
  if (hasAny(['/profile', 'profile', 'user profile', 'complete your profile', 'completeness', 'personal detail', 'personal info', 'personal information', 'avatar'])) return 'profile';
  if (hasAny(['resume', 'parser', 'parsed', 'parse', 'enhance', 'enhanced', 'builder', ' cv'])) return 'resume';
  if (hasAny(['interview', 'communication', 'assessment', 'english', 'mock-test', 'mock test', 'prep', 'score'])) return 'interview';
  if (hasAny(['job', 'jobmatch', 'match', 'application', 'tracker', 'apply'])) return 'job';
  if (hasAny(['ats', 'scan', 'scheduler', 'system', 'security', 'verification', 'verified'])) return 'system';

  return TYPE_TO_META[(notification.type ?? '').toLowerCase()] ?? 'system';
};

const getNotifMeta = (notification: Pick<Notification, 'type' | 'title' | 'body' | 'action_url'> | string) => {
  return NOTIF_META[resolveMetaKey(notification)];
};


/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function Header() {
  const router = useRouter();
  const { data: balance, loading } = useCreditsBalance();
  const { unreadCount: apiUnreadCount, refetch: refetchUnreadCount } = useUnreadNotificationsCount({
    autoRefresh: true,
    refreshInterval: 30000, // Refresh every 30 seconds
  });
  const { notifications, unreadCount: streamUnreadCount, markAsRead, markAllAsRead, remove } = useNotificationStream({
    onNotification: (notification) => {
      // Show a toast when new notification arrives
      toast.success(notification.title);
      // Refetch unread count when new notification arrives
      refetchUnreadCount();
    },
  });

  // Use API unread count as the source of truth, fall back to stream unread count
  const unreadCount = apiUnreadCount > 0 ? apiUnreadCount : streamUnreadCount;
  const panelNotifications = notifications.slice(0, 4);
  const [userProfile,   setUserProfile]  = useState<UserProfile | null>(null);
  const [profilePicUrl, setProfilePicUrl]= useState<string | null>(null);
  const [showMenu,      setShowMenu]     = useState(false);
  const [showNotifs,    setShowNotifs]   = useState(false);
  const [isLoggingOut,  setIsLoggingOut] = useState(false);

  const menuRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current  && !menuRef.current.contains(e.target as Node))  setShowMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  /* Profile */
  useEffect(() => {
    const fetchProfile = async () => {
      // Step 1: try to get the full profile
      let profile: UserProfile | null = null;
      try {
        profile = await getProfile({ skipAuthRedirect: true });
      } catch { /* silently fail */ }

      // Step 2: if profile has no display name (or failed entirely), fall back to
      // dashboard summary which always carries user.name after signup
      if (!profile?.username && !profile?.full_name) {
        try {
          const summary = await getDashboardSummary({ skipAuthRedirect: true });
          if (summary?.user?.name) {
            profile = {
              ...(profile ?? {}),
              full_name: summary.user.name,
              email: profile?.email ?? summary.user.email,
            };
          }
        } catch { /* ignore */ }
      }

      if (profile) setUserProfile(profile);

      // Step 3: profile picture (independent of name)
      try {
        const picRes = await getProfilePicture({ skipAuthRedirect: true });
        if (picRes?.picture_url) {
          const fullUrl = picRes.picture_url.startsWith('http')
            ? picRes.picture_url
            : `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8000'}${picRes.picture_url}`;
          setProfilePicUrl(fullUrl);
        }
      } catch { /* silently fail */ }
    };
    fetchProfile();
    const onPicUpdate = (e: CustomEvent) => {
      const url = e.detail?.profilePicUrl;
      if (url !== undefined) setProfilePicUrl(url);
    };
    const onProfileUpdate = (e: CustomEvent) => {
      setUserProfile((prev) => prev ? {
        ...prev,
        full_name: e.detail?.full_name ?? prev.full_name,
        email: e.detail?.email ?? prev.email,
      } : prev);
    };
    window.addEventListener('profilePictureUpdated', onPicUpdate as EventListener);
    window.addEventListener('profileUpdated', onProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profilePictureUpdated', onPicUpdate as EventListener);
      window.removeEventListener('profileUpdated', onProfileUpdate as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowMenu(false);
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    refetchUnreadCount();
  };

  const handleDismiss = async (id: string) => {
    await remove(id);
    refetchUnreadCount();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    refetchUnreadCount();
  };

  const displayName    = userProfile?.username || userProfile?.full_name || 'User';
  const displayEmail   = userProfile?.email || '';
  const displayInitial = (userProfile?.username || userProfile?.full_name || 'U')[0].toUpperCase();
  const creditPct = balance?.credits_total
    ? Math.min(100, Math.max(0, (balance.credits_remaining / balance.credits_total) * 100))
    : 0;
  const creditStroke = 2 * Math.PI * 8;
  const isLowCredits = creditPct > 0 && creditPct < 20;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-4 gap-3">

        {/* Left: Logo + CareerBOT â€” clicks toggle sidebar */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
          className="flex items-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity -ml-3"
          aria-label="Toggle sidebar"
        >
          <Image
            src="/assets/icons/Logo.png"
            alt="CareerBot"
            width={60} height={60}
            className="shrink-0 -mr-1"
            style={{ filter: "hue-rotate(8deg) saturate(130%) brightness(68%)" }}
          />
          <span className="text-2xl font-bold tracking-tight" style={{ color: "#2557a7" }}>CareerBOT</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-3">

          {/* Plan + credits */}
          {loading ? (
            <div className="hidden sm:flex h-11 w-44 rounded-xl border border-blue-100 bg-blue-50/70 animate-pulse" />
          ) : (
            <Link
              href="/payments"
              className="group flex h-11 w-44 items-center gap-2 rounded-xl border border-blue-100 bg-white px-2.5 pr-2.5 shadow-sm transition-all hover:-translate-y-px hover:border-[#2557a7]/30 hover:shadow-md active:translate-y-0"
              style={{ boxShadow: "0 5px 18px rgba(37,87,167,0.08)" }}
              aria-label={balance ? `Manage ${balance.plan_name} plan` : "Upgrade plan"}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                style={{
                  background: balance?.plan_id === "FREE"
                    ? "linear-gradient(145deg, #6b7280, #4b5563)"
                    : balance?.plan_id === "BASIC"
                    ? "linear-gradient(145deg, #0891b2, #0e7490)"
                    : balance?.plan_id === "ENTERPRISE" || balance?.plan_id === "MAX"
                    ? "linear-gradient(145deg, #7c3aed, #6d28d9)"
                    : "linear-gradient(145deg, #3063cc, #2557a7)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 10px rgba(37,87,167,0.24)",
                }}
              >
                <Crown size={14} strokeWidth={2.1} />
              </span>

              <span className="hidden sm:flex min-w-0 flex-1 flex-col leading-none">
                <span className="text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{ color: balance?.plan_id === "FREE" ? "#6b7280" : balance?.plan_id === "ENTERPRISE" || balance?.plan_id === "MAX" ? "#7c3aed" : "#2557a7" }}
                >
                  {balance ? (balance.plan_name || balance.plan_id) : "Upgrade"}
                </span>
                <span className="mt-1 whitespace-nowrap text-[11px] font-bold text-gray-800">
                  {balance ? (
                    <>
                      <span className={isLowCredits ? "text-red-600" : "text-gray-900"}>{balance.credits_remaining}</span>
                      <span className="font-semibold text-gray-400">/{balance.credits_total}</span>
                      <span className="ml-1 font-semibold text-gray-500">credits</span>
                    </>
                  ) : (
                    "View plans"
                  )}
                </span>
              </span>

              {balance && (
                <span className="relative hidden h-7 w-7 shrink-0 items-center justify-center sm:flex">
                  <svg width="26" height="26" viewBox="0 0 24 24" className="-rotate-90">
                    <circle cx="12" cy="12" r="8" fill="none" stroke="#e8eef8" strokeWidth="2.5" />
                    <circle
                      cx="12"
                      cy="12"
                      r="8"
                      fill="none"
                      stroke={isLowCredits ? "#ef4444" : "#2557a7"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={creditStroke}
                      strokeDashoffset={creditStroke * (1 - creditPct / 100)}
                    />
                  </svg>
                </span>
              )}
            </Link>
          )}

          {/* â”€â”€ Notification Bell â”€â”€ */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifs((v) => !v); setShowMenu(false); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <IcoNotification size={20} sw={1.9} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-3.5 h-3.5 flex items-center justify-center rounded-full text-[8px] font-bold text-white px-0.5 leading-none"
                  style={{ background: "#2557a7" }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifs && (
              <div
                className="absolute right-0 top-11 z-50 w-[calc(100vw-24px)] overflow-hidden rounded-3xl border border-gray-200 bg-white sm:w-[372px]"
                style={{ boxShadow: "0 24px 70px rgba(15,23,42,0.16), 0 4px 14px rgba(15,23,42,0.08)" }}
              >
                <div className="relative overflow-hidden border-b border-gray-200 bg-white px-4 py-3">
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: "#2557a7" }}>
                        <IcoNotification size={17} sw={1.9} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-950">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#2557a7] ring-1 ring-gray-200">
                              {unreadCount > 99 ? '99+' : unreadCount} new
                            </span>
                          )}
                        </div>
                        <p className="mt-px text-[11px] font-medium text-gray-500">Latest account and workflow updates</p>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-xl bg-white px-2.5 text-[11px] font-bold text-[#2557a7] ring-1 ring-gray-200 transition hover:bg-[#2557a7]/5"
                      >
                        <CheckCheck size={13} />
                        Read all
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[390px] overflow-y-auto bg-gray-50 p-2">
                  {panelNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-gray-100">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-[#2557a7] ring-1 ring-gray-200">
                        <IcoNotification size={22} sw={1.9} />
                      </div>
                      <p className="text-sm font-bold text-gray-800">All caught up</p>
                      <p className="mt-1 text-xs leading-5 text-gray-400">No notifications require your attention right now.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {panelNotifications.map((n: Notification) => {
                        const meta = getNotifMeta(n);
                        const route = resolveNotificationRoute(n);
                        const isClickable = route !== null;
                        const handleClick = () => {
                          if (!isClickable) return;
                          handleMarkRead(n.id);
                          setShowNotifs(false);
                          router.push(route!);
                        };
                        return (
                          <div
                            key={n.id}
                            onClick={isClickable ? handleClick : undefined}
                            role={isClickable ? 'button' : undefined}
                            tabIndex={isClickable ? 0 : undefined}
                            onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleClick() : undefined}
                            className={`group relative overflow-hidden rounded-2xl border bg-white px-3 py-2.5 transition ${
                              isClickable ? 'cursor-pointer hover:-translate-y-px hover:border-[#2557a7]/30 hover:shadow-md' : 'cursor-default'
                            } ${n.read ? 'border-gray-100' : 'border-gray-200 bg-[#2557a7]/5 shadow-sm'}`}
                          >
                            {!n.read && <span className="absolute bottom-2.5 left-0 top-2.5 w-1 rounded-r-full" style={{ background: meta.dot }} />}

                            <div className="flex items-start gap-3">
                              <div
                                className="mt-px flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm"
                                style={{ background: meta.bg, color: meta.text, borderColor: meta.border }}
                              >
                                {meta.icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-2">
                                  <p className={`line-clamp-1 text-sm leading-5 ${n.read ? 'font-semibold text-gray-600' : 'font-black text-gray-950'}`}>
                                    {n.title}
                                  </p>
                                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.dot }} />}
                                </div>

                                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-500">{n.body}</p>
                              </div>

                              <div className="flex w-[76px] shrink-0 items-center justify-end gap-1 self-center">
                                {!n.read && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-[#2557a7] transition hover:bg-[#2557a7]/5"
                                    aria-label="Mark as read"
                                    title="Mark as read"
                                  >
                                    <CheckCheck size={13} />
                                  </button>
                                )}
                                {isClickable && (
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition group-hover:text-[#2557a7]">
                                    <ArrowUpRight size={13} />
                                  </span>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition hover:bg-[#2557a7]/5 hover:text-[#2557a7]"
                                  aria-label="Dismiss"
                                  title="Dismiss"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 bg-white p-2">
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifs(false)}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#2557a7] text-[13px] font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
                  >
                    View notification center
                    <ChevronRight size={15} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar + Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => { setShowMenu((v) => !v); setShowNotifs(false); }}
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-gray-300 ring-offset-2 ring-offset-white hover:ring-blue-400 transition-all focus:outline-none"
              style={{ background: "#2557a7" }}
              aria-label="User menu"
              aria-expanded={showMenu}
            >
              {profilePicUrl ? (
                <Image src={profilePicUrl} alt="Profile" width={32} height={32} className="object-cover w-full h-full" unoptimized />
              ) : (
                <span className="text-white text-[13px] font-bold">{displayInitial}</span>
              )}
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  {displayEmail && (
                    <p className="text-[13px] text-gray-500 truncate mt-0.5">{displayEmail}</p>
                  )}
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={15} className="text-gray-400 shrink-0" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <LogOut size={15} className="shrink-0" />
                  {isLoggingOut ? 'Logging outâ€¦' : 'Logout'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}