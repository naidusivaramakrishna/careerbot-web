'use client';

import { Bell, AlertCircle, CheckCheck, X, Briefcase, Wand2, User, ChevronRight } from 'lucide-react';
import { Notification } from '@/api/notificationsApi';
import { resolveNotificationRoute } from '@/lib/notificationRoute';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NOTIF_META: Record<string, { icon: React.ReactNode; grad: string; dot: string }> = {
  job:       { icon: <Briefcase size={14} />,   grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', dot: '#f59e0b' },
  credit:    { icon: <AlertCircle size={14} />, grad: 'linear-gradient(135deg,#f97316,#ef4444)', dot: '#f97316' },
  system:    { icon: <AlertCircle size={14} />, grad: 'linear-gradient(135deg,#94a3b8,#64748b)', dot: '#94a3b8' },
  interview: { icon: <User size={14} />,        grad: 'linear-gradient(135deg,#8b5cf6,#6366f1)', dot: '#8b5cf6' },
  resume:    { icon: <Wand2 size={14} />,       grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)', dot: '#6366f1' },
};

const getNotifMeta = (type: string) =>
  NOTIF_META[type] || { icon: <AlertCircle size={14} />, grad: 'linear-gradient(135deg,#5896d7,#2557a7)', dot: '#5896d7' };

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

interface Props {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationsPanel({ notifications, unreadCount, onMarkRead, onDismiss, onMarkAllRead, onClose }: Props) {
  const router = useRouter();

  return (
    <div
      className="absolute right-0 top-11 w-[360px] bg-white border border-gray-200 rounded-2xl z-50 overflow-hidden"
      style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white leading-none"
              style={{ background: '#2557a7' }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
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
              style={{ background: 'rgba(88,150,215,0.12)' }}
            >
              <Bell size={20} className="text-[#5896d7]" />
            </div>
            <p className="text-sm font-semibold text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-0.5">No notifications right now</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => {
              const meta = getNotifMeta(n.type);
              const route = resolveNotificationRoute(n);
              const isClickable = route !== null;
              const handleClick = () => {
                if (!isClickable) return;
                onMarkRead(n.id);
                onClose();
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
                  {!n.read && (
                    <span
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: meta.dot }}
                    />
                  )}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm mt-0.5"
                    style={{ background: meta.grad }}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-1">{formatTimeAgo(n.timestamp)}</p>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    {!n.read && !isClickable && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-100 text-[#2557a7]"
                        aria-label="Mark as read"
                        title="Mark as read"
                      >
                        <CheckCheck size={11} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
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
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#2557a7' }}
        >
          View All Notifications
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
