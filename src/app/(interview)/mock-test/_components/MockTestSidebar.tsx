'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutGrid, Wand2, History, Target, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getProgressAnalytics, ProgressAnalytics } from '@/api/mockTestApi';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  soon?: boolean;
  activeFor?: string[]; // extra path prefixes that count as active
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Company tests',
    icon: LayoutGrid,
    path: '/mock-test',
    activeFor: ['/mock-test/company', '/mock-test/results'],
  },
  {
    label: 'Custom builder',
    icon: Wand2,
    path: '/mock-test/custom',
  },
  {
    label: 'History',
    icon: History,
    path: '/mock-test/history',
  },
  {
    label: 'Weak areas',
    icon: Target,
    path: '/mock-test/weak-areas',
  },
  {
    label: 'Leaderboard',
    icon: Trophy,
    path: '/mock-test/leaderboard',
  },
];

export default function MockTestSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);

  useEffect(() => {
    getProgressAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const isActive = (item: NavItem) => {
    if (item.path === '/mock-test') {
      // active on exact /mock-test OR any extra activeFor prefixes
      if (pathname === '/mock-test') return true;
      return (item.activeFor ?? []).some(p => pathname.startsWith(p));
    }
    if (item.soon) return false;
    return pathname.startsWith(item.path);
  };

  const trend = analytics?.improvement_trend;

  return (
    <aside className="fixed top-0 left-0 h-full w-52 bg-white border-r border-slate-200 flex flex-col z-40">

      {/* Logo strip */}
      <div className="px-5 py-4 border-b border-slate-100"
        style={{ background: 'linear-gradient(135deg,#eef3ff 0%,#fff 100%)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black" style={{ color: '#000' }}>Mock Tests</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-black tracking-widest px-2 mb-2"
          style={{ color: '#2d2d2d', opacity: 0.4 }}>
          WORKSPACE
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item);

            return (
              <li key={item.path}>
                <button
                  disabled={item.soon}
                  onClick={() => !item.soon && router.push(item.path)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs"
                  style={{
                    background:  active ? '#eef3ff' : 'transparent',
                    color:       item.soon ? '#2d2d2d' : active ? '#1e3a8a' : '#2d2d2d',
                    fontWeight:  active ? 700 : 500,
                    opacity:     item.soon ? 0.45 : 1,
                    cursor:      item.soon ? 'default' : 'pointer',
                  }}
                >
                  <Icon size={14} style={{
                    color:   active ? '#1e3a8a' : '#2d2d2d',
                    opacity: active ? 1 : 0.5,
                  }} />
                  <span className="flex-1">{item.label}</span>
                  {item.soon && (
                    <span className="text-xs font-black tracking-wide px-1.5 py-0.5 rounded"
                      style={{ background: '#f1f5f9', color: '#94a3b8' }}>
                      SOON
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Stats panel */}
      <div className="px-3 pb-4">
        <div className="rounded-xl border border-slate-100 overflow-hidden" style={{ background: '#f8faff' }}>
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-black tracking-widest" style={{ color: '#2d2d2d', opacity: 0.4 }}>
              YOUR STATS
            </p>
          </div>
          <div className="px-3 py-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.55 }}>Tests</span>
              <span className="text-xs font-black" style={{ color: '#000' }}>
                {analytics?.total_tests ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.55 }}>Avg accuracy</span>
              <span className="text-xs font-black" style={{ color: '#1e3a8a' }}>
                {analytics?.average_accuracy != null
                  ? `${Math.round(analytics.average_accuracy)}%`
                  : analytics?.average_score != null
                  ? `${Math.round(analytics.average_score)}%`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.55 }}>Best score</span>
              <span className="text-xs font-black" style={{ color: '#000' }}>
                {analytics?.best_score != null ? `${analytics.best_score}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.55 }}>Trend</span>
              <span className="flex items-center gap-0.5 text-xs font-black">
                {trend === 'improving' && <><TrendingUp size={10} style={{ color: '#22c55e' }} /><span style={{ color: '#22c55e' }}>Up</span></>}
                {trend === 'declining' && <><TrendingDown size={10} style={{ color: '#ef4444' }} /><span style={{ color: '#ef4444' }}>Down</span></>}
                {(!trend || trend === 'stable') && <><Minus size={10} style={{ color: '#94a3b8' }} /><span style={{ color: '#94a3b8' }}>Stable</span></>}
              </span>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}
