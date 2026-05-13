'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell, Settings, LogOut, ScanSearch, Wand2, Briefcase,
  User, AlertCircle, CheckCheck, X, ChevronRight,
} from 'lucide-react';
import { CreditBadge, CreditBadgeSkeleton } from '@/components/credits/CreditBadge';
import { useCreditsBalance } from '@/hooks/useCreditsBalance';
import { useNotificationStream } from '@/hooks/useNotificationStream';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { getProfile, getProfilePicture, UserProfile } from '@/api/userApi';
import { signOut } from '@/api/authApi';
import { Notification } from '@/api/notificationsApi';
import { resolveNotificationRoute } from '@/lib/notificationRoute';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/* ── Notification type mapping ───────────────────────── */
const NOTIF_META: Record<string, { icon: React.ReactNode; grad: string; dot: string }> = {
  job:       { icon: <Briefcase size={14} />,   grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', dot: '#f59e0b' },
  credit:    { icon: <AlertCircle size={14} />, grad: 'linear-gradient(135deg,#f97316,#ef4444)', dot: '#f97316' },
  system:    { icon: <AlertCircle size={14} />, grad: 'linear-gradient(135deg,#94a3b8,#64748b)', dot: '#94a3b8' },
  interview: { icon: <User size={14} />,        grad: 'linear-gradient(135deg,#8b5cf6,#6366f1)', dot: '#8b5cf6' },
  resume:    { icon: <Wand2 size={14} />,       grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)', dot: '#6366f1' },
};

const getNotifMeta = (type: string) => {
  return NOTIF_META[type] || {
    icon: <AlertCircle size={14} />,
    grad: 'linear-gradient(135deg,#5896d7,#2557a7)',
    dot: '#5896d7',
  };
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ── Header ─────────────────────────────────────────── */
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
      try {
        const profile = await getProfile();
        setUserProfile(profile);
        const picRes = await getProfilePicture();
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
    window.addEventListener('profilePictureUpdated', onPicUpdate as EventListener);
    return () => window.removeEventListener('profilePictureUpdated', onPicUpdate as EventListener);
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

  const displayName    = userProfile?.full_name || userProfile?.username || 'User';
  const displayEmail   = userProfile?.email || '';
  const displayInitial = (userProfile?.full_name || userProfile?.username || 'U')[0].toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-full px-4 gap-3">

        {/* Left: Logo + CareerBOT — clicks toggle sidebar */}
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

          {/* Credit Badge */}
          {loading ? (
            <CreditBadgeSkeleton variant="header" />
          ) : balance ? (
            <CreditBadge creditsRemaining={balance.credits_remaining} creditsTotal={balance.credits_total} variant="header" />
          ) : null}

          {/* ── Notification Bell ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifs((v) => !v); setShowMenu(false); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white px-0.5"
                  style={{ background: "#2557a7" }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifs && (
              <div
                className="absolute right-0 top-11 w-[360px] bg-white border border-gray-200 rounded-2xl z-50 overflow-hidden"
                style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)" }}
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span
                        className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white leading-none"
                        style={{ background: "#2557a7" }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#2557a7] hover:text-[#1f4e98] transition-colors"
                    >
                      <CheckCheck size={12} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                        style={{ background: "rgba(88,150,215,0.12)" }}
                      >
                        <Bell size={20} className="text-[#5896d7]" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-0.5">No notifications right now</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map((n: Notification, i: number) => {
                        const meta = getNotifMeta(n.type);
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
                            className={`relative flex items-start gap-3 px-4 py-3 transition-colors group ${
                              isClickable
                                ? `cursor-pointer ${n.read ? 'bg-white hover:bg-gray-50/80' : 'bg-blue-50/50 hover:bg-blue-50/80'}`
                                : `cursor-default ${n.read ? 'bg-white' : 'bg-blue-50/50'}`
                            }`}
                          >
                            {/* Unread dot */}
                            {!n.read && (
                              <span
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: meta.dot }}
                              />
                            )}

                            {/* Icon */}
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5"
                              style={{ background: meta.grad }}
                            >
                              {meta.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                {n.title}
                              </p>
                              <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5 line-clamp-2">
                                {n.body}
                              </p>
                              <p className="text-[10px] font-medium text-gray-400 mt-1">{formatTimeAgo(n.timestamp)}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                              {!n.read && !isClickable && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-100 text-[#2557a7]"
                                  aria-label="Mark as read"
                                  title="Mark as read"
                                >
                                  <CheckCheck size={11} />
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
                                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400"
                                aria-label="Dismiss"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer CTA */}
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <Link
                    href="/alerts"
                    onClick={() => setShowNotifs(false)}
                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "#2557a7" }}
                  >
                    View All Notifications
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── User Avatar + Dropdown ── */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => { setShowMenu((v) => !v); setShowNotifs(false); }}
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition-all focus:outline-none"
              style={{ background: "#2557a7" }}
              aria-label="User menu"
              aria-expanded={showMenu}
            >
              {profilePicUrl ? (
                <Image src={profilePicUrl} alt="Profile" width={32} height={32} className="object-cover w-full h-full" />
              ) : (
                <span className="text-white text-xs font-bold">{displayInitial}</span>
              )}
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                  {displayEmail && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{displayEmail}</p>
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
                  {isLoggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
