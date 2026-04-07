'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import logger from '@/lib/logger';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  Plus,
  UserCircle,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
}

export default function DashboardLayout({ children, onSearch }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Check if we're on the dashboard page
  const isDashboard = pathname === '/recruiter/dashboard';

  // Helper to extract username from any response/storage shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractUsername = (data: any): string =>
    data?.username ||
    data?.recruiter?.username ||
    data?.data?.recruiter?.username ||
    data?.data?.username ||
    data?.user?.username ||
    data?.name ||
    data?.fullName ||
    data?.email?.split('@')[0] ||
    data?.recruiter?.email?.split('@')[0] ||
    '';

  // Load user profile — always fetch from API to get current recruiter's data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          const name = extractUsername(data);

          // DETAILED DEBUG LOGGING
          console.log('%c🔍 [AVATAR DEBUG]', 'color: red; font-weight: bold; font-size: 14px');
          console.log('Raw API response data:', data);
          console.log('Extracted username:', name);
          console.log('First letter:', name ? name.charAt(0).toUpperCase() : 'NONE');
          console.log('All possible username fields:');
          console.log('  - data.username:', data?.username);
          console.log('  - data.recruiter?.username:', data?.recruiter?.username);
          console.log('  - data.name:', data?.name);
          console.log('  - data.fullName:', data?.fullName);
          console.log('  - data.email:', data?.email);

          logger.debug('📋 [DashboardLayout] Extracted username from API:', { name, fullData: data });
          if (name) {
            setUserName(name);
            logger.debug('✅ [DashboardLayout] Username: ' + name + ', First letter: ' + name.charAt(0).toUpperCase());
          }

          // Also update localStorage with fresh data
          localStorage.setItem('recruiterData', JSON.stringify(data));
          const company = data?.company_name || data?.companyName || data?.company || data?.organization || '';
          if (company) setCompanyName(company);
        } else {
          // If API fails, show nothing instead of using stale cache
          console.log('%c❌ API FAILED', 'color: red; font-weight: bold');
          console.log('Response status:', response.status);
          logger.warn('Failed to fetch recruiter profile:', response.status);
          setUserName('');
        }
      } catch (error) {
        logger.error('Error loading user profile:', error);
        setUserName('');
      }
    };

    loadUserProfile();
  }, []);

  // Notifications — built from localStorage interviews
  const [notifications, setNotifications] = useState<{ id: number; message: string; time: string; type: string }[]>([]);

  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem('interviews');
      const items: { id: number; message: string; time: string; type: string }[] = [];
      if (stored) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const interviews: any[] = JSON.parse(stored);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interviews.forEach((iv: any) => {
          if (iv.date === todayStr && (iv.status === 'Scheduled' || iv.status === 'Rescheduled')) {
            items.push({ id: iv.id, message: `Interview with ${iv.candidateName} is scheduled today at ${iv.time}`, time: 'Today', type: 'interview' });
          }
          if (iv.status === 'Rescheduled') {
            items.push({ id: iv.id * 100, message: `Interview with ${iv.candidateName} has been rescheduled`, time: 'Recent', type: 'reschedule' });
          }
        });
      }
      setNotifications(items);
    } catch {}
  }, [pathname]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
    console.log('Searching for:', query);
  };

  const notificationRef = useRef<HTMLDivElement>(null);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  // Close notifications dropdown when pathname changes
  useEffect(() => {
    setShowNotifications(false);
  }, [pathname]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications && typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  const navigationItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/recruiter/dashboard' },
    { label: 'Jobs', icon: Briefcase, href: '/recruiter/posted-jobs' },
    { label: 'Candidates', icon: Users, href: '/recruiter/candidates' },
    { label: 'Interviews', icon: Calendar, href: '/recruiter/interviews' },
    { label: 'Messages', icon: MessageSquare, href: '/recruiter/messages' },
    { label: 'Settings', icon: Settings, href: '/recruiter/settings' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            {sidebarOpen && <span className="font-bold text-lg text-gray-900">CareerBot</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-100 rounded-lg transition md:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        {sidebarOpen && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-blue-200 transition"
                title={userName ? `${userName} (${userName.charAt(0).toUpperCase()})` : 'Recruiter Profile'}
              >
                {userName && userName.length > 0 ? (
                  <span className="text-blue-600 font-bold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <UserCircle className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName || 'Loading...'}</p>
                <p className="text-xs text-gray-600 truncate">{companyName || 'Recruiter'}</p>
              </div>
            </div>
            {!userName && (
              <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                ⚠️ Username not loaded
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          {/* Left Side - Only show on Dashboard */}
          {isDashboard && (
            <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          )}

          {/* Right Side - Search (Dashboard only), Notifications, and Post Job */}
          <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
            {/* Search Bar - Only on Dashboard */}
            {isDashboard && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search active jobs, applicants..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm w-64"
                />
              </div>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={handleNotificationClick}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Notifications"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition">
                          <p className="text-sm text-gray-900 font-medium">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Post Job Button */}
            <button
              onClick={() => router.push('/recruiter/job-post')}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus className="w-5 h-5" />
              Post Job
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
