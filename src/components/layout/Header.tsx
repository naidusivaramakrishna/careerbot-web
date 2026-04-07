'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { CreditBadge, CreditBadgeSkeleton } from '@/components/credits/CreditBadge';
import { useCreditsBalance } from '@/hooks/useCreditsBalance';
import { useNotificationStream } from '@/hooks/useNotificationStream';
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount';
import { getProfile, getProfilePicture, UserProfile } from '@/api/userApi';
import { signOut } from '@/api/authApi';
import { NotificationsPanel } from './NotificationsPanel';
import { UserMenuDropdown } from './UserMenuDropdown';
import Image from 'next/image';
import { toast } from 'sonner';

export default function Header() {
  const { data: balance, loading } = useCreditsBalance();
  const { unreadCount: apiUnreadCount, refetch: refetchUnreadCount } = useUnreadNotificationsCount({
    autoRefresh: true,
    refreshInterval: 30000,
  });
  const { notifications, unreadCount: streamUnreadCount, markAsRead, markAllAsRead, remove } = useNotificationStream({
    onNotification: (notification) => {
      toast.success(notification.title);
      refetchUnreadCount();
    },
  });

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

        {/* Logo */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="flex items-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Toggle sidebar"
        >
          <Image src="/assets/icons/Logo.png" alt="CareerBot" width={60} height={60} className="shrink-0 -mr-1" />
          <span className="text-2xl font-bold text-black tracking-tight">CareerBOT</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-3">

          {/* Credit Badge */}
          {loading ? (
            <CreditBadgeSkeleton variant="header" />
          ) : balance ? (
            <CreditBadge creditsRemaining={balance.credits_remaining} creditsTotal={balance.credits_total} variant="header" />
          ) : null}

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifs((v) => !v); setShowMenu(false); }}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black text-white px-0.5"
                  style={{ background: '#2557a7' }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <NotificationsPanel
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss}
                onMarkAllRead={handleMarkAllRead}
                onClose={() => setShowNotifs(false)}
              />
            )}
          </div>

          {/* User Avatar + Dropdown */}
          <div ref={menuRef}>
            <UserMenuDropdown
              displayName={displayName}
              displayEmail={displayEmail}
              displayInitial={displayInitial}
              profilePicUrl={profilePicUrl}
              isLoggingOut={isLoggingOut}
              showMenu={showMenu}
              onToggle={() => { setShowMenu((v) => !v); setShowNotifs(false); }}
              onLogout={handleLogout}
              onClose={() => setShowMenu(false)}
            />
          </div>

        </div>
      </div>
    </header>
  );
}
