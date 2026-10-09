'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Code2, Zap, BarChart3, MessageSquare,
  Bell, Search, ChevronRight, Flame, Target, Trophy, Clock, BookOpen,
} from 'lucide-react';
import { fetchProblems } from './_lib/api';
import { fetchProblemsAnnotated, fetchQuota } from './_lib/gradingApi';
import type { CodingTestLanguage, ProblemWithStatus, QuotaResponse } from './_lib/types';
import OnboardingModal from '@/components/coding-test/OnboardingModal';

const ONBOARDING_KEY = 'coding_test_onboarded';
const DAILY_GOAL = 3;

// ── Nav Config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard',    icon: LayoutDashboard, href: '/coding-test',           exact: true  },
  { label: 'Problems',     icon: Code2,            href: '/coding-test/problems'               },
  { label: 'Practice',     icon: Zap,              href: '/coding-test/playground'             },
  { label: 'History',      icon: Clock,            href: '/coding-test/history'                },
  { label: 'Leaderboard',  icon: BarChart3,        href: null                                  },
  { label: 'Discussions',  icon: MessageSquare,    href: null                                  },
];

const LANG_CONFIG: { value: CodingTestLanguage; label: string; icon: React.ReactNode }[] = [
  { value: 'python', label: 'Python', icon: <PythonIcon /> },
  { value: 'java',   label: 'Java',   icon: <JavaIcon />   },
  { value: 'c',      label: 'C',      icon: <CIcon />      },
  { value: 'cpp',    label: 'C++',    icon: <CppIcon />    },
];

const QUICK_ACTIONS = [
  { label: 'Browse Problems',     icon: Code2,    href: '/coding-test/problems',   color: 'bg-blue-50 text-blue-600'    },
  { label: 'Topic-wise Practice', icon: BookOpen, href: '/coding-test/problems',   color: 'bg-violet-50 text-violet-600'},
  { label: 'Code Playground',     icon: Zap,      href: '/coding-test/playground', color: 'bg-teal-50 text-teal-600'   },
  { label: 'View History',        icon: Clock,    href: '/coding-test/history',    color: 'bg-orange-50 text-orange-500'},
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-56 shrink-0 flex-col"
      style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
          <Code2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">CareerBOT</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : item.href !== null && pathname.startsWith(item.href);
          const isDisabled = item.href === null;
          const Icon = item.icon;

          const cls = [
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
            isActive
              ? 'bg-white/20 text-white shadow-sm'
              : isDisabled
                ? 'cursor-not-allowed text-white/30'
                : 'text-white/60 hover:bg-white/10 hover:text-white',
          ].join(' ');

          if (isDisabled) {
            return (
              <div key={item.label} className={cls}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/40">Soon</span>
              </div>
            );
          }

          return (
            <Link key={item.label} href={item.href!} className={cls}>
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to main */}
      <div className="border-t border-white/10 px-3 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/40 transition-all hover:bg-white/10 hover:text-white/70"
        >
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
          Main Dashboard
        </Link>
      </div>
    </aside>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({ quota }: { quota: QuotaResponse | null }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search problems, topics, tags…"
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100">
          <Bell className="h-4 w-4" />
        </button>
        {quota && (
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold">
            <span className="text-indigo-600">{quota.submissions_remaining}</span>
            <span className="text-slate-400"> AI credits</span>
          </div>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white select-none">
          C
        </div>
      </div>
    </div>
  );
}

// ── Hero Banner ───────────────────────────────────────────────────────────────

function CelebrationCharacter() {
  return (
    <svg width="140" height="150" viewBox="0 0 140 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Plants / leaves */}
      <ellipse cx="18" cy="130" rx="16" ry="8" fill="#22c55e" opacity="0.7" />
      <ellipse cx="22" cy="118" rx="10" ry="5" fill="#16a34a" opacity="0.8" transform="rotate(-30 22 118)" />
      <ellipse cx="10" cy="122" rx="10" ry="5" fill="#22c55e" opacity="0.6" transform="rotate(20 10 122)" />
      <ellipse cx="122" cy="132" rx="14" ry="7" fill="#22c55e" opacity="0.6" />
      <ellipse cx="130" cy="120" rx="9" ry="5" fill="#16a34a" opacity="0.7" transform="rotate(25 130 120)" />

      {/* Trophy */}
      <g transform="translate(72, 18)">
        <rect x="10" y="42" width="12" height="6" rx="2" fill="#fbbf24" />
        <rect x="6" y="48" width="20" height="5" rx="2" fill="#f59e0b" />
        <path d="M5 8 Q5 36 16 36 Q27 36 27 8 Z" fill="#fbbf24" />
        <path d="M5 8 Q0 8 0 16 Q0 26 8 26" stroke="#f59e0b" strokeWidth="2" fill="none" />
        <path d="M27 8 Q32 8 32 16 Q32 26 24 26" stroke="#f59e0b" strokeWidth="2" fill="none" />
        <rect x="11" y="36" width="10" height="6" rx="1" fill="#f59e0b" />
        <path d="M8 18 L16 26 L28 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </g>

      {/* Body — shirt */}
      <path d="M48 95 Q48 130 55 138 Q70 143 85 138 Q92 130 92 95 Z" fill="#ef4444" />
      {/* Collar */}
      <path d="M60 95 L70 108 L80 95" fill="#dc2626" />

      {/* Left arm — raised */}
      <path d="M52 98 Q38 80 50 62" stroke="#fde68a" strokeWidth="12" strokeLinecap="round" fill="none" />
      {/* Left hand holding trophy base */}
      <circle cx="51" cy="60" r="7" fill="#fde68a" />

      {/* Right arm */}
      <path d="M88 98 Q102 86 98 72" stroke="#fde68a" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="97" cy="70" r="7" fill="#fde68a" />

      {/* Head */}
      <circle cx="70" cy="72" r="22" fill="#fde68a" />
      {/* Hair */}
      <path d="M50 66 Q52 48 70 46 Q88 48 90 66" fill="#1c1917" />
      <path d="M50 66 Q48 58 54 54" fill="#1c1917" />
      {/* Eyes */}
      <ellipse cx="63" cy="72" rx="3" ry="3.5" fill="#1c1917" />
      <ellipse cx="77" cy="72" rx="3" ry="3.5" fill="#1c1917" />
      <circle cx="64" cy="71" r="1" fill="white" />
      <circle cx="78" cy="71" r="1" fill="white" />
      {/* Smile */}
      <path d="M63 80 Q70 86 77 80" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <ellipse cx="59" cy="78" rx="4" ry="2.5" fill="#fca5a5" opacity="0.6" />
      <ellipse cx="81" cy="78" rx="4" ry="2.5" fill="#fca5a5" opacity="0.6" />

      {/* Legs */}
      <path d="M60 138 L57 150" stroke="#1d4ed8" strokeWidth="10" strokeLinecap="round" />
      <path d="M80 138 L83 150" stroke="#1d4ed8" strokeWidth="10" strokeLinecap="round" />
      {/* Shoes */}
      <ellipse cx="54" cy="150" rx="8" ry="4" fill="#1c1917" />
      <ellipse cx="86" cy="150" rx="8" ry="4" fill="#1c1917" />

      {/* Sparkles */}
      <text x="100" y="48" fontSize="14" fill="#fbbf24" opacity="0.9">✦</text>
      <text x="112" y="70" fontSize="10" fill="#fbbf24" opacity="0.7">✦</text>
      <text x="20" y="60" fontSize="12" fill="#fbbf24" opacity="0.8">✦</text>
      <text x="32" y="42" fontSize="8" fill="#fff" opacity="0.6">✦</text>
    </svg>
  );
}

function HeroBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl px-8 py-7"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2d2a7a 30%, #4338ca 60%, #6d28d9 100%)' }}
    >
      {/* Dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-purple-400/20 blur-2xl" />
      <div className="pointer-events-none absolute right-24 bottom-0 h-32 w-32 rounded-full bg-indigo-400/15 blur-xl" />

      {/* Text content */}
      <div className="relative z-10 max-w-[58%]">
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Keep Going, Coder! 🚀</h1>
        <p className="mt-1.5 text-sm text-indigo-200">Small steps every day lead to big results.</p>
      </div>

      {/* Boy character illustration */}
      <div className="absolute bottom-0 right-6 z-10">
        <CelebrationCharacter />
      </div>
    </div>
  );
}

// ── Stat Cards ────────────────────────────────────────────────────────────────

function TotalSolvedCard({ solved, total }: { solved: number; total: number | null }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50">
        <Trophy className="h-6 w-6 text-amber-500" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Solved</p>
        <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-slate-800">
          {solved}
          <span className="ml-1 text-sm font-normal text-slate-400">/ {total ?? '—'}</span>
        </p>
      </div>
    </div>
  );
}

function DailyGoalStatCard({ progress, goal }: { progress: number; goal: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50">
        <Target className="h-6 w-6 text-purple-500" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Daily Goal</p>
        <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-slate-800">
          {progress}
          <span className="ml-1 text-sm font-normal text-slate-400">/ {goal}</span>
        </p>
      </div>
    </div>
  );
}

function StreakCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
        <Flame className="h-6 w-6 text-orange-500" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-400">Streak</p>
        <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-orange-600">
          0
          <span className="ml-1 text-sm font-normal text-orange-400">days</span>
        </p>
      </div>
    </div>
  );
}

// ── Progress Donut ────────────────────────────────────────────────────────────

interface RingSpec {
  pct: number;
  r: number;
  color: string;
  trackColor: string;
}

function GlowDonut({
  rings,
  totalSolved,
  grandTotal,
}: {
  rings: RingSpec[];
  totalSolved: number;
  grandTotal: number;
}) {
  const SIZE = 160;
  const CX = 80;
  const CY = 80;

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" aria-hidden>
      {rings.map((ring, i) => {
        const circ = 2 * Math.PI * ring.r;
        const clampedPct = Math.max(ring.pct, 0.5);
        const arc = (Math.min(clampedPct, 100) / 100) * circ;
        const angle = -Math.PI / 2 + (Math.min(clampedPct, 100) / 100) * 2 * Math.PI;
        const dotX = CX + ring.r * Math.cos(angle);
        const dotY = CY + ring.r * Math.sin(angle);

        return (
          <g key={i}>
            <circle cx={CX} cy={CY} r={ring.r} fill="none" stroke={ring.trackColor} strokeWidth="7" />
            <circle
              cx={CX} cy={CY} r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circ}`}
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{ transition: 'stroke-dasharray 0.9s ease' }}
            />
            <circle cx={dotX} cy={dotY} r="4" fill={ring.color} opacity="0.9" />
          </g>
        );
      })}

      <text x={CX} y={CY + 8} textAnchor="middle" fontSize="30" fontWeight="800" fill="#1e293b">{totalSolved}</text>
      <text x={CX} y={CY + 23} textAnchor="middle" fontSize="10" fill="#94a3b8">/ {grandTotal}</text>
      <text x={CX} y={CY + 37} textAnchor="middle" fontSize="9" fill="#94a3b8">{grandTotal > 0 ? Math.round((totalSolved / grandTotal) * 100) : 0}%</text>
    </svg>
  );
}

// ── Your Progress Card ────────────────────────────────────────────────────────

function YourProgressCard({
  stats,
}: {
  stats: {
    easySolved: number; easyTotal: number;
    mediumSolved: number; mediumTotal: number;
    hardSolved: number; hardTotal: number;
    totalSolved: number;
  };
}) {
  const grandTotal = stats.easyTotal + stats.mediumTotal + stats.hardTotal;

  const rings: RingSpec[] = [
    { pct: stats.easyTotal   > 0 ? (stats.easySolved   / stats.easyTotal)   * 100 : 0, r: 62, color: '#22c55e', trackColor: 'rgba(34,197,94,0.18)'  },
    { pct: stats.mediumTotal > 0 ? (stats.mediumSolved / stats.mediumTotal) * 100 : 0, r: 48, color: '#f59e0b', trackColor: 'rgba(245,158,11,0.18)' },
    { pct: stats.hardTotal   > 0 ? (stats.hardSolved   / stats.hardTotal)   * 100 : 0, r: 34, color: '#a855f7', trackColor: 'rgba(168,85,247,0.18)' },
  ];

  const DIFF_ROWS = [
    { label: 'Easy',   color: '#22c55e', solved: stats.easySolved,   total: stats.easyTotal   },
    { label: 'Medium', color: '#f59e0b', solved: stats.mediumSolved, total: stats.mediumTotal },
    { label: 'Hard',   color: '#a855f7', solved: stats.hardSolved,   total: stats.hardTotal   },
  ];

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-bold text-slate-800">Your Progress</p>
        <p className="text-[11px] text-slate-400">Overall completion across all problems</p>
      </div>

      <div className="flex items-center gap-6">
        <GlowDonut rings={rings} totalSolved={stats.totalSolved} grandTotal={grandTotal} />

        <div className="flex-1 space-y-4">
          {DIFF_ROWS.map((row) => {
            const pct = row.total > 0 ? Math.round((row.solved / row.total) * 100) : 0;
            return (
              <div key={row.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                    <span className="text-xs font-semibold text-slate-600">{row.label}</span>
                  </div>
                  <span className="text-xs tabular-nums">
                    <span className="font-bold text-slate-800">{row.solved}</span>
                    <span className="text-slate-400">/{row.total}</span>
                    <span className="ml-1.5 text-slate-400">{pct}%</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: row.color }}
                  />
                </div>
              </div>
            );
          })}

          <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <span className="text-[11px] text-slate-500">Total solved</span>
            <span className="text-[11px] font-bold tabular-nums text-indigo-600">
              {stats.totalSolved}
              <span className="font-normal text-slate-400">/{grandTotal}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick Actions Card ────────────────────────────────────────────────────────

function QuickActionsCard() {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-bold text-slate-800">Quick Actions</p>
      <div className="space-y-1">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-all hover:bg-slate-50"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-sm font-medium text-slate-700">{action.label}</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Language Card ─────────────────────────────────────────────────────────────

function LanguageCard({
  lang,
  total,
  solved,
}: {
  lang: typeof LANG_CONFIG[number];
  total: number | null;
  solved: number;
}) {
  const pct = total && total > 0 ? Math.round((solved / total) * 100) : 0;

  return (
    <Link
      href={`/coding-test/problems?language=${lang.value}`}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50"
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">{lang.icon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{lang.label}</p>
          <p className="text-[11px] text-slate-400">
            {total !== null ? `${total} problems` : 'Loading…'}
          </p>
        </div>
      </div>

      {total !== null ? (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
            />
          </div>
          <p className="text-[10px] tabular-nums text-slate-400">
            {solved}/{total} · {pct}% solved
          </p>
        </>
      ) : (
        <div className="h-1.5 w-full rounded-full bg-slate-100" />
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CodingPracticeHub() {
  const [total, setTotal]                   = useState<number | null>(null);
  const [allProblems, setAllProblems]       = useState<ProblemWithStatus[]>([]);
  const [quota, setQuota]                   = useState<QuotaResponse | null>(null);
  const [ready, setReady]                   = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) setShowOnboarding(true);
  }, []);

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const load = () =>
      Promise.all([
        fetchProblems().then((r) => r.total).catch(() => null),
        fetchProblemsAnnotated().catch(() => [] as ProblemWithStatus[]),
        fetchQuota().catch(() => null),
      ]).then(([count, problems, q]) => {
        setTotal(count);
        setAllProblems(problems);
        if (q) setQuota(q);
        setReady(true);
      }).catch(() => setReady(true));

    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const stats = useMemo(() => {
    const easyTotal    = allProblems.filter((p) => p.difficulty === 'easy').length;
    const mediumTotal  = allProblems.filter((p) => p.difficulty === 'medium').length;
    const hardTotal    = allProblems.filter((p) => p.difficulty === 'hard').length;
    const easySolved   = allProblems.filter((p) => p.difficulty === 'easy'   && p.user_status === 'accepted').length;
    const mediumSolved = allProblems.filter((p) => p.difficulty === 'medium' && p.user_status === 'accepted').length;
    const hardSolved   = allProblems.filter((p) => p.difficulty === 'hard'   && p.user_status === 'accepted').length;
    const totalSolved  = easySolved + mediumSolved + hardSolved;
    return { easySolved, easyTotal, mediumSolved, mediumTotal, hardSolved, hardTotal, totalSolved };
  }, [allProblems]);

  const todaySolved = useMemo(
    () => allProblems.filter((p) => p.user_status === 'accepted').length,
    [allProblems],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef2ff]">
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar quota={quota} />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-5xl space-y-5">

            {/* Hero */}
            <HeroBanner />

            {/* 3 Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TotalSolvedCard solved={stats.totalSolved} total={total} />
              <DailyGoalStatCard progress={Math.min(todaySolved, DAILY_GOAL)} goal={DAILY_GOAL} />
              <StreakCard />
            </div>

            {/* Your Progress + Quick Actions */}
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <YourProgressCard stats={stats} />
              </div>
              <div className="lg:col-span-2">
                <QuickActionsCard />
              </div>
            </div>

            {/* Language Section */}
            <section className="pb-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Select a Language</h2>
                <Link
                  href="/coding-test/problems"
                  className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                >
                  Browse all →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {LANG_CONFIG.map((lang) => (
                  <LanguageCard
                    key={lang.value}
                    lang={lang}
                    total={ready ? total : null}
                    solved={stats.totalSolved}
                  />
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

// ── Language Icons ────────────────────────────────────────────────────────────

function PythonIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
      <svg width="22" height="22" viewBox="0 0 256 255" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="py-top" x1="13%" y1="12%" x2="80%" y2="78%">
            <stop offset="0%" stopColor="#5b9bd5" />
            <stop offset="100%" stopColor="#366994" />
          </linearGradient>
          <linearGradient id="py-bot" x1="19%" y1="21%" x2="91%" y2="88%">
            <stop offset="0%" stopColor="#FFE052" />
            <stop offset="100%" stopColor="#FFC331" />
          </linearGradient>
        </defs>
        <path
          d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z"
          fill="url(#py-top)"
        />
        <path
          d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21H100.073s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 63.159 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z"
          fill="url(#py-bot)"
        />
      </svg>
    </div>
  );
}

function JavaIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50">
      <svg width="20" height="26" viewBox="0 0 48 62" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.1 43.4s-2.4 1.4 1.7 1.9c4.9.5 7.4.5 12.8-.6 0 0 1.4.9 3.4 1.7C24 51.6 8.6 47.1 18.1 43.4z" fill="#F8981D" />
        <path d="M16.6 37.5s-2.7 2 1.4 2.4c5.3.5 9.4.6 16.6-.8 0 0 1 1 2.6 1.5C22.4 44.8 5.9 40.8 16.6 37.5z" fill="#F8981D" />
        <path d="M27.4 23.8c3 3.5-.8 6.6-.8 6.6s7.6-3.9 4.1-8.8C27.4 17 25 14.7 38.5 6.9c0-.1-21.3 5.3-11.1 16.9z" fill="#F8981D" />
        <path d="M41 48.2s1.8 1.5-1.9 2.6C32 53 9.8 53.6 3.6 50.9c-2.2-1 1.9-2.3 3.3-2.6.7-.1 1-.1 1-.1-1.2-.9-7.8 1.7-3.4 2.4C16.8 52.5 37.9 49.6 41 48.2z" fill="#F8981D" />
        <path d="M18.9 31.5s-5.5 1.3-2 1.8c1.5.2 4.5.2 7.3-.1 2.3-.2 4.6-.6 4.6-.6s-1 .4-1.8.9c-7.1 1.9-20.8 1-16.9-.9 3.4-1.6 8.8-.9 8.8-1.1z" fill="#F8981D" />
        <path d="M37.4 39.9c7.2-3.8 3.9-7.4 1.6-6.9-.6.1-.8.2-.8.2s.2-.3.6-.5c4.6-1.6 8.1 4.8-1.5 7.3 0 0 .1-.1.1-.1z" fill="#F8981D" />
        <path d="M30 4S33.2 7.2 27 12.1c-5 3.9-1.1 6.1 0 8.7-2.9-2.6-5-4.9-3.6-7C25.5 10.5 31.4 9 30 4z" fill="#F8981D" />
        <path d="M19.7 56.1c6.9.4 17.6-.2 17.8-3.5 0 0-.5 1.2-5.7 2.2-5.9 1.1-13.2 1-17.6.3 0 0 .9.7 5.5 1z" fill="#F8981D" />
      </svg>
    </div>
  );
}

function CIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50">
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
        <path
          d="M16 3C8.82 3 3 8.82 3 16s5.82 13 13 13 13-5.82 13-13S23.18 3 16 3z"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <path
          d="M20.5 11.5A6.5 6.5 0 1 0 20.5 20.5"
          stroke="#2563eb"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function CppIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50">
      <svg width="28" height="24" viewBox="0 0 36 28" fill="none">
        <path
          d="M14 4A9 9 0 1 0 14 22"
          stroke="#4f46e5"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <line x1="27" y1="10" x2="27" y2="18" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
        <line x1="23" y1="14" x2="31" y2="14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
