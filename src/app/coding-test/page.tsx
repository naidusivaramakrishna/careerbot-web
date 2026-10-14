'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Code2, BarChart3, ChevronRight, Flame, Target, Trophy, BookOpen, TrendingUp,
  Terminal, History, Zap,
} from 'lucide-react';
import { fetchProblems } from './_lib/api';
import { fetchProblemsAnnotated, fetchQuota } from './_lib/gradingApi';
import type { CodingTestLanguage, ProblemWithStatus, QuotaResponse } from './_lib/types';
import OnboardingModal from '@/components/coding-test/OnboardingModal';

const ONBOARDING_KEY = 'coding_test_onboarded';
const DAILY_GOAL = 3;

const LANG_CONFIG: {
  value: CodingTestLanguage;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'python', label: 'Python', icon: <PythonIcon /> },
  { value: 'java',   label: 'Java',   icon: <JavaIcon />   },
  { value: 'c',      label: 'C',      icon: <CIcon />      },
  { value: 'cpp',    label: 'C++',    icon: <CppIcon />    },
];

const QUICK_ACTIONS = [
  { label: 'Browse Problems',      icon: Code2,     href: '/coding-test/problems',   iconBg: 'bg-blue-50',   iconColor: 'text-blue-600'   },
  { label: 'Topic-wise Practice',  icon: BookOpen,  href: '/coding-test/problems',   iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  { label: 'Playground',           icon: Terminal,  href: '/coding-test/playground', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { label: 'Submission History',   icon: History,   href: '/coding-test/history',    iconBg: 'bg-sky-50',    iconColor: 'text-sky-600'    },
];

// ── Hero Banner ───────────────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(130deg, #1e0f5c 0%, #3b1d8f 28%, #4c27a4 58%, #3730a3 82%, #312e81 100%)',
        height: '180px',
      }}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Soft glow behind illustration */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 70% at 58% 88%, rgba(99,102,241,0.2) 0%, transparent 100%)' }}
      />

      {/* LEFT: Text */}
      <div
        className="absolute top-0 bottom-0 left-0 flex flex-col justify-center pl-7"
        style={{ width: '280px' }}
      >
        <p className="mb-0.5 text-[14px] font-medium text-white/90">Hey Shobha! 👋</p>
        <div className="text-[22px] font-black leading-tight text-white tracking-tight">Keep Going,</div>
        <div
          className="text-[22px] font-black leading-tight tracking-tight mb-2"
          style={{ color: '#4DDCF0' }}
        >
          You&apos;re Doing Great!
        </div>
        <p className="text-[12px] font-medium text-white/55 mb-3.5">Solve. Learn. Improve. Repeat.</p>
        <Link
          href="/coding-test/problems"
          className="inline-flex items-center gap-1.5 self-start rounded-full bg-white px-4 py-2 text-[12px] font-bold text-purple-900 shadow transition hover:bg-white/95 hover:shadow-md"
        >
          Start Practicing <span className="text-purple-600">→</span>
        </Link>
      </div>

    </div>
  );
}

// ── Stat Cards ────────────────────────────────────────────────────────────────

function TotalSolvedCard({ solved, total }: { solved: number; total: number | null }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-4 shadow-sm">
      <div className="absolute right-3 top-3 opacity-10">
        <TrendingUp className="h-11 w-11 text-emerald-600" />
      </div>
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <Trophy className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">Total Solved</p>
          <p className="text-[28px] font-extrabold tabular-nums leading-none text-slate-800">
            {solved}
            <span className="ml-1.5 text-sm font-normal text-slate-400">/ {total ?? '—'}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-xs text-emerald-600 font-medium">Keep it up!</span>
      </div>
    </div>
  );
}

function DailyGoalStatCard({ progress, goal }: { progress: number; goal: number }) {
  const pct = goal > 0 ? Math.round((progress / goal) * 100) : 0;
  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 px-5 py-4 shadow-sm">
      <div className="absolute right-3 top-3 opacity-10">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" className="text-violet-600">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <Target className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600">Daily Goal</p>
          <p className="text-[28px] font-extrabold tabular-nums leading-none text-slate-800">
            {progress}
            <span className="ml-1.5 text-sm font-normal text-slate-400">/ {goal}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
        <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StreakCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 px-5 py-4 shadow-sm">
      <div className="absolute right-3 top-3 opacity-10">
        <Flame className="h-11 w-11 text-orange-500" />
      </div>
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-orange-500">Streak</p>
          <p className="text-[28px] font-extrabold tabular-nums leading-none text-orange-600">
            0
            <span className="ml-1.5 text-sm font-normal text-orange-400">days</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {[1,2,3,4,5,6,7].map((d) => (
          <div key={d} className="h-1.5 flex-1 rounded-full bg-orange-100" />
        ))}
      </div>
    </div>
  );
}

// ── Progress Donut ────────────────────────────────────────────────────────────

interface RingSpec { pct: number; color: string }

function GlowDonut({ rings, totalSolved, grandTotal }: { rings: RingSpec[]; totalSolved: number; grandTotal: number }) {
  const SIZE = 145; const CX = 72; const CY = 72; const R = 58; const STROKE = 10;
  const circ = 2 * Math.PI * R;
  const totalPct = grandTotal > 0 ? (totalSolved / grandTotal) * 100 : 0;
  const arc = (totalPct / 100) * circ;

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0" aria-hidden>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={STROKE} />
      {totalPct > 0 && (
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={rings[0].color} strokeWidth={STROKE}
          strokeLinecap="round" strokeDasharray={`${arc} ${circ}`}
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{ transition: 'stroke-dasharray 0.9s ease' }}
        />
      )}
      <circle cx={CX} cy={CY - R} r="5.5" fill={rings[0].color} />
      <text x={CX} y={CY - 2} textAnchor="middle" fontSize="30" fontWeight="800" fill="#1e293b">{totalSolved}</text>
      <text x={CX} y={CY + 17} textAnchor="middle" fontSize="12" fill="#94a3b8">/ {grandTotal}</text>
      <text x={CX} y={CY + 31} textAnchor="middle" fontSize="11" fill="#94a3b8">
        {grandTotal > 0 ? Math.round((totalSolved / grandTotal) * 100) : 0}%
      </text>
    </svg>
  );
}

// ── Your Progress Card ────────────────────────────────────────────────────────

function YourProgressCard({ stats }: {
  stats: {
    easySolved: number; easyTotal: number;
    mediumSolved: number; mediumTotal: number;
    hardSolved: number; hardTotal: number;
    totalSolved: number;
  };
}) {
  const grandTotal = stats.easyTotal + stats.mediumTotal + stats.hardTotal;
  const rings: RingSpec[] = [
    { pct: stats.easyTotal   > 0 ? (stats.easySolved   / stats.easyTotal)   * 100 : 0, color: '#22c55e' },
    { pct: stats.mediumTotal > 0 ? (stats.mediumSolved / stats.mediumTotal) * 100 : 0, color: '#f59e0b' },
    { pct: stats.hardTotal   > 0 ? (stats.hardSolved   / stats.hardTotal)   * 100 : 0, color: '#a855f7' },
  ];
  const DIFF_ROWS = [
    { label: 'Easy',   color: '#22c55e', solved: stats.easySolved,   total: stats.easyTotal   },
    { label: 'Medium', color: '#f59e0b', solved: stats.mediumSolved, total: stats.mediumTotal },
    { label: 'Hard',   color: '#a855f7', solved: stats.hardSolved,   total: stats.hardTotal   },
  ];

  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Your Progress</p>
          <p className="text-[10px] text-slate-400">Overall completion across all problems</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <GlowDonut rings={rings} totalSolved={stats.totalSolved} grandTotal={grandTotal} />
        <div className="flex-1 space-y-2">
          {DIFF_ROWS.map((row) => {
            const pct = row.total > 0 ? Math.round((row.solved / row.total) * 100) : 0;
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                    <span className="text-xs font-medium text-slate-700">{row.label}</span>
                  </div>
                  <span className="text-xs tabular-nums text-slate-500">
                    {row.solved}/{row.total}
                    <span className="ml-1.5 text-slate-400">{pct}%</span>
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: row.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Quick Actions Card ────────────────────────────────────────────────────────

function QuickActionsCard() {
  return (
    <div className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 3L12.5 8H17.5L13.5 11.5L15 17L10 13.5L5 17L6.5 11.5L2.5 8H7.5L10 3Z" fill="#f59e0b"/>
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-800">Quick Actions</p>
      </div>
      <div className="divide-y divide-slate-100">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const rowCls = 'flex items-center gap-3 rounded-xl px-1 py-2 transition-all hover:bg-slate-50';
          const inner = (
            <>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${action.iconBg}`}>
                <Icon className={`h-4 w-4 ${action.iconColor}`} />
              </div>
              <span className="flex-1 text-xs font-medium text-slate-700">{action.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            </>
          );
          return action.href ? (
            <Link key={action.label} href={action.href} className={rowCls}>{inner}</Link>
          ) : (
            <div key={action.label} className={rowCls + ' cursor-default'}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

// ── Popular Topics ─────────────────────────────────────────────────────────────

const POPULAR_TOPICS = [
  { label: 'Dynamic Programming', count: 27, tag: 'Dynamic Programming', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)', icon: 'dp' },
  { label: 'Two Pointers',        count: 13, tag: 'Two Pointers',        gradient: 'linear-gradient(135deg, #c2410c 0%, #ea580c 55%, #fb923c 100%)', icon: 'twoptr' },
  { label: 'Math',                count: 12, tag: 'Math',                gradient: 'linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #2dd4bf 100%)', icon: 'math' },
  { label: 'Binary Search',       count: 12, tag: 'Binary Search',       gradient: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 55%, #a78bfa 100%)', icon: 'binsearch' },
  { label: 'Tree',                count: 12, tag: 'Tree',                gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 55%, #4ade80 100%)', icon: 'tree' },
  { label: 'Stack',               count: 11, tag: 'Stack',               gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 55%, #fbbf24 100%)', icon: 'stack' },
  { label: 'Backtracking',        count: 9,  tag: 'Backtracking',        gradient: 'linear-gradient(135deg, #9f1239 0%, #e11d48 55%, #fb7185 100%)', icon: 'backtrack' },
  { label: 'Infosys',             count: 10, tag: 'Infosys',             gradient: 'linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #818cf8 100%)', icon: 'company' },
];

function TopicCardIcon({ type }: { type: string }) {
  const p = { width: 46, height: 46, viewBox: '0 0 46 46', fill: 'none', 'aria-hidden': true } as const;
  if (type === 'dp') return (
    <svg {...p}>
      <rect x="3" y="3" width="17" height="12" rx="2.5" stroke="white" strokeWidth="2.2" strokeOpacity="0.9"/>
      <rect x="26" y="3" width="17" height="12" rx="2.5" stroke="white" strokeWidth="2.2" strokeOpacity="0.9"/>
      <rect x="3" y="31" width="17" height="12" rx="2.5" stroke="white" strokeWidth="2.2" strokeOpacity="0.9"/>
      <rect x="26" y="31" width="17" height="12" rx="2.5" stroke="white" strokeWidth="2.2" strokeOpacity="0.9"/>
      <line x1="20" y1="9" x2="26" y2="9" stroke="white" strokeWidth="2" strokeOpacity="0.8"/>
      <line x1="11.5" y1="15" x2="11.5" y2="31" stroke="white" strokeWidth="2" strokeOpacity="0.8"/>
      <line x1="34.5" y1="15" x2="34.5" y2="31" stroke="white" strokeWidth="2" strokeOpacity="0.8"/>
    </svg>
  );
  if (type === 'twoptr') return (
    <svg {...p}>
      <rect x="4" y="19" width="38" height="8" rx="4" stroke="white" strokeWidth="2" strokeOpacity="0.35"/>
      <circle cx="11" cy="23" r="5" fill="white" fillOpacity="0.9"/>
      <circle cx="35" cy="23" r="5" fill="white" fillOpacity="0.9"/>
      <path d="M19 23L14 23M14 23L17 20M14 23L17 26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85"/>
      <path d="M27 23L32 23M32 23L29 20M32 23L29 26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.85"/>
    </svg>
  );
  if (type === 'math') return (
    <svg {...p}>
      <text x="23" y="35" textAnchor="middle" fontSize="34" fontWeight="700" fill="white" fillOpacity="0.9" fontFamily="serif">Σ</text>
    </svg>
  );
  if (type === 'binsearch') return (
    <svg {...p}>
      <circle cx="19" cy="20" r="12" stroke="white" strokeWidth="2.5" strokeOpacity="0.9"/>
      <line x1="27.5" y1="29" x2="41" y2="43" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.9"/>
      <line x1="14" y1="20" x2="24" y2="20" stroke="white" strokeWidth="2" strokeOpacity="0.75"/>
      <line x1="19" y1="15" x2="19" y2="25" stroke="white" strokeWidth="2" strokeOpacity="0.75"/>
    </svg>
  );
  if (type === 'tree') return (
    <svg {...p}>
      <circle cx="23" cy="6" r="4.5" fill="white" fillOpacity="0.9"/>
      <circle cx="10" cy="22" r="4.5" fill="white" fillOpacity="0.9"/>
      <circle cx="36" cy="22" r="4.5" fill="white" fillOpacity="0.9"/>
      <line x1="19.5" y1="10" x2="13.5" y2="18" stroke="white" strokeWidth="2" strokeOpacity="0.8"/>
      <line x1="26.5" y1="10" x2="32.5" y2="18" stroke="white" strokeWidth="2" strokeOpacity="0.8"/>
      <circle cx="4" cy="38" r="3.5" fill="white" fillOpacity="0.7"/>
      <circle cx="16" cy="38" r="3.5" fill="white" fillOpacity="0.7"/>
      <circle cx="30" cy="38" r="3.5" fill="white" fillOpacity="0.7"/>
      <circle cx="42" cy="38" r="3.5" fill="white" fillOpacity="0.7"/>
      <line x1="7" y1="26" x2="5" y2="35" stroke="white" strokeWidth="1.8" strokeOpacity="0.7"/>
      <line x1="13" y1="26" x2="15" y2="35" stroke="white" strokeWidth="1.8" strokeOpacity="0.7"/>
      <line x1="33" y1="26" x2="31" y2="35" stroke="white" strokeWidth="1.8" strokeOpacity="0.7"/>
      <line x1="39" y1="26" x2="41" y2="35" stroke="white" strokeWidth="1.8" strokeOpacity="0.7"/>
    </svg>
  );
  if (type === 'stack') return (
    <svg {...p}>
      <rect x="7" y="6"    width="32" height="9" rx="3" fill="white" fillOpacity="0.9"/>
      <rect x="7" y="18.5" width="32" height="9" rx="3" fill="white" fillOpacity="0.7"/>
      <rect x="7" y="31"   width="32" height="9" rx="3" fill="white" fillOpacity="0.45"/>
    </svg>
  );
  if (type === 'backtrack') return (
    <svg {...p}>
      <path d="M39 12 C39 7 33 4 28 6 L10 13 M10 13 L15 9 M10 13 L14 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9"/>
      <path d="M7 34 C7 39 13 42 18 40 L36 33 M36 33 L31 37 M36 33 L32 28" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9"/>
    </svg>
  );
  return (
    <svg {...p}>
      <rect x="7" y="16" width="32" height="26" rx="2" stroke="white" strokeWidth="2.2" strokeOpacity="0.9"/>
      <path d="M7 22 L39 22" stroke="white" strokeWidth="1.5" strokeOpacity="0.4"/>
      <rect x="15" y="4" width="16" height="14" rx="2" stroke="white" strokeWidth="2.2" strokeOpacity="0.9"/>
      <rect x="15" y="28" width="5" height="5" rx="1" fill="white" fillOpacity="0.75"/>
      <rect x="26" y="28" width="5" height="5" rx="1" fill="white" fillOpacity="0.75"/>
      <rect x="15" y="35" width="5" height="7" rx="1" fill="white" fillOpacity="0.75"/>
      <rect x="26" y="35" width="5" height="7" rx="1" fill="white" fillOpacity="0.75"/>
    </svg>
  );
}

function PopularTopicsSection() {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-800">Popular Topics</h2>
        </div>
        <Link
          href="/coding-test/problems"
          className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
        >
          View all →
        </Link>
      </div>
      <div
        className="flex gap-3 pb-1"
        style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {POPULAR_TOPICS.map((topic) => (
          <Link
            key={topic.tag}
            href={`/coding-test/problems?tag=${encodeURIComponent(topic.tag)}`}
            className="group relative flex flex-shrink-0 flex-col overflow-hidden rounded-2xl shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
            style={{ background: topic.gradient, width: '158px', minHeight: '136px' }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
            <div
              className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)' }}
            />
            <div className="relative flex flex-1 items-center justify-center pt-4">
              <TopicCardIcon type={topic.icon} />
            </div>
            <div className="relative px-3.5 pb-3.5 pt-1">
              <p className="text-[13px] font-bold leading-snug text-white">{topic.label}</p>
              <p className="mt-0.5 text-[11px] font-medium text-white/65">
                &lt;/&gt; {topic.count} Problems
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Language Card ─────────────────────────────────────────────────────────────

function LanguageCard({ lang }: { lang: typeof LANG_CONFIG[number] }) {
  return (
    <Link
      href={`/coding-test/problems?language=${lang.value}`}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl p-5 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
      style={{ background: '#4BC8D4', minHeight: '150px' }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border-[2.5px] border-black bg-white shadow-sm transition-transform group-hover:scale-105">
        {lang.icon}
      </div>
      <p className="text-base font-bold text-white">{lang.label}</p>
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
    <div className="min-h-screen bg-slate-100">
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}

      {/* Low-credit banner */}
      {quota && quota.submissions_remaining < 5 && (
        <div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 px-6 py-2 text-center text-sm text-amber-800">
          <span className="font-semibold">{quota.submissions_remaining}</span> AI grading credits remaining.{' '}
          <Link href="/payments" className="font-semibold underline hover:text-amber-900">Upgrade</Link>
        </div>
      )}

      <main className="px-6 py-5">
        <div className="mx-auto max-w-5xl space-y-4">

          {/* Hero */}
          <HeroBanner />

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TotalSolvedCard solved={stats.totalSolved} total={total} />
            <DailyGoalStatCard progress={Math.min(todaySolved, DAILY_GOAL)} goal={DAILY_GOAL} />
            <StreakCard />
          </div>

          {/* Your Progress + Quick Actions */}
          <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <YourProgressCard stats={stats} />
            </div>
            <div className="lg:col-span-2">
              <QuickActionsCard />
            </div>
          </div>

          {/* Language Section */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-800">Select a Language</h2>
              </div>
              <Link
                href="/coding-test/problems"
                className="text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
              >
                Browse all →
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {LANG_CONFIG.map((lang) => (
                <LanguageCard key={lang.value} lang={lang} />
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// ── Language Icons ────────────────────────────────────────────────────────────

function PythonIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 256 255" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="py-blue" x1="12.959%" y1="12.039%" x2="79.639%" y2="78.201%">
          <stop offset="0%" stopColor="#387EB8"/>
          <stop offset="100%" stopColor="#366994"/>
        </linearGradient>
        <linearGradient id="py-yellow" x1="19.128%" y1="20.579%" x2="90.742%" y2="88.429%">
          <stop offset="0%" stopColor="#FFE052"/>
          <stop offset="100%" stopColor="#FFC331"/>
        </linearGradient>
      </defs>
      <path fill="url(#py-blue)" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z"/>
      <path fill="url(#py-yellow)" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21H100.073s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 63.159 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z"/>
    </svg>
  );
}

function JavaIcon() {
  return (
    <svg width="52" height="60" viewBox="0 0 48 62" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M18.1 43.4s-2.4 1.4 1.7 1.9c4.9.5 7.4.5 12.8-.6 0 0 1.4.9 3.4 1.7C24 51.6 8.6 47.1 18.1 43.4z" fill="#5382A1"/>
      <path d="M16.6 37.5s-2.7 2 1.4 2.4c5.3.5 9.4.6 16.6-.8 0 0 1 1 2.6 1.5C22.4 44.8 5.9 40.8 16.6 37.5z" fill="#5382A1"/>
      <path d="M27.4 23.8c3 3.5-.8 6.6-.8 6.6s7.6-3.9 4.1-8.8C27.4 17 25 14.7 38.5 6.9c0-.1-21.3 5.3-11.1 16.9z" fill="#E76F00"/>
      <path d="M41 48.2s1.8 1.5-1.9 2.6C32 53 9.8 53.6 3.6 50.9c-2.2-1 1.9-2.3 3.3-2.6.7-.1 1-.1 1-.1-1.2-.9-7.8 1.7-3.4 2.4C16.8 52.5 37.9 49.6 41 48.2z" fill="#5382A1"/>
      <path d="M18.9 31.5s-5.5 1.3-2 1.8c1.5.2 4.5.2 7.3-.1 2.3-.2 4.6-.6 4.6-.6s-1 .4-1.8.9c-7.1 1.9-20.8 1-16.9-.9 3.4-1.6 8.8-.9 8.8-1.1z" fill="#5382A1"/>
      <path d="M37.4 39.9c7.2-3.8 3.9-7.4 1.6-6.9-.6.1-.8.2-.8.2s.2-.3.6-.5c4.6-1.6 8.1 4.8-1.5 7.3z" fill="#E76F00"/>
      <path d="M30 4S33.2 7.2 27 12.1c-5 3.9-1.1 6.1 0 8.7-2.9-2.6-5-4.9-3.6-7C25.5 10.5 31.4 9 30 4z" fill="#E76F00"/>
    </svg>
  );
}

function CppIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden>
      <polygon points="30,2 56,16 56,44 30,58 4,44 4,16" fill="#00599C"/>
      <text x="30" y="38" textAnchor="middle" fontSize="18" fontWeight="900"
        fontFamily="system-ui,-apple-system,sans-serif" fill="white">C++</text>
    </svg>
  );
}

function CIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden>
      <polygon points="30,2 56,16 56,44 30,58 4,44 4,16" fill="#0ea5e9"/>
      <text x="30" y="38" textAnchor="middle" fontSize="22" fontWeight="900"
        fontFamily="system-ui,-apple-system,sans-serif" fill="white">C</text>
    </svg>
  );
}
