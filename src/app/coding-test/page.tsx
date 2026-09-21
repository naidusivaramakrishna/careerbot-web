'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight, Target } from 'lucide-react';
import { fetchProblems } from './_lib/api';
import { fetchProblemsAnnotated, fetchQuota } from './_lib/gradingApi';
import type { CodingTestLanguage, ProblemWithStatus, QuotaResponse } from './_lib/types';
import OnboardingModal from '@/components/coding-test/OnboardingModal';

const ONBOARDING_KEY = 'coding_test_onboarded';

const LANG_CONFIG: { value: CodingTestLanguage; label: string; icon: React.ReactNode }[] = [
  { value: 'python', label: 'Python', icon: <PythonIcon /> },
  { value: 'java',   label: 'Java',   icon: <JavaIcon /> },
  { value: 'c',      label: 'C',      icon: <CIcon /> },
  { value: 'cpp',    label: 'C++',    icon: <CppIcon /> },
];

// ── Compact glowing donut (3 rings: easy / medium / hard) ─────────────────────

interface RingSpec {
  pct: number;
  r: number;
  color: string;
  trackColor: string;
}

function GlowDonut({
  rings,
  totalSolved,
  overallPct,
}: {
  rings: RingSpec[];
  totalSolved: number;
  overallPct: number;
}) {
  const SIZE = 168;
  const CX = 84;
  const CY = 84;

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="shrink-0"
      aria-hidden
    >
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

      <text x={CX} y={CY - 13} textAnchor="middle" fontSize="10" fill="#94a3b8" letterSpacing="0.5">SOLVED</text>
      <text x={CX} y={CY + 11} textAnchor="middle" fontSize="30" fontWeight="800" fill="#0d9488">{totalSolved}</text>
      <text x={CX} y={CY + 27} textAnchor="middle" fontSize="10" fill="#0d9488" opacity="0.75">{overallPct}% done</text>
    </svg>
  );
}

// ── Stats Center ──────────────────────────────────────────────────────────────

function StatsCenterCard({
  stats,
}: {
  stats: {
    easySolved: number; easyTotal: number;
    mediumSolved: number; mediumTotal: number;
    hardSolved: number; hardTotal: number;
    totalSolved: number; overallPct: number;
  };
}) {
  const rings: RingSpec[] = [
    {
      pct: stats.easyTotal   > 0 ? (stats.easySolved   / stats.easyTotal)   * 100 : 0,
      r: 66, color: '#0d9488', trackColor: 'rgba(13,148,136,0.12)',
    },
    {
      pct: stats.mediumTotal > 0 ? (stats.mediumSolved / stats.mediumTotal) * 100 : 0,
      r: 51, color: '#d97706', trackColor: 'rgba(217,119,6,0.12)',
    },
    {
      pct: stats.hardTotal   > 0 ? (stats.hardSolved   / stats.hardTotal)   * 100 : 0,
      r: 36, color: '#6366f1', trackColor: 'rgba(99,102,241,0.12)',
    },
  ];

  const DIFF_ROWS = [
    { label: 'Easy',   color: '#0d9488', solved: stats.easySolved,   total: stats.easyTotal },
    { label: 'Medium', color: '#d97706', solved: stats.mediumSolved, total: stats.mediumTotal },
    { label: 'Hard',   color: '#6366f1', solved: stats.hardSolved,   total: stats.hardTotal },
  ];

  const grandTotal = stats.easyTotal + stats.mediumTotal + stats.hardTotal;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative flex h-full flex-col p-5">
        {/* Card header */}
        <div className="mb-4">
          <p className="text-sm font-bold text-slate-800">Stats Center</p>
          <p className="text-[11px] text-slate-400">Your overall progress across all problems</p>
        </div>

        {/* Donut + breakdown side-by-side */}
        <div className="flex flex-1 items-center gap-6">
          <GlowDonut rings={rings} totalSolved={stats.totalSolved} overallPct={stats.overallPct} />

          {/* Difficulty breakdown */}
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
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: row.color }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Total summary row */}
            <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-[11px] text-slate-500">Total solved</span>
              <span className="text-[11px] font-bold tabular-nums text-teal-600">
                {stats.totalSolved}
                <span className="font-normal text-slate-400">/{grandTotal}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Daily Goal ────────────────────────────────────────────────────────────────

function DailyGoalCard({ progress, goal }: { progress: number; goal: number }) {
  const pct = goal > 0 ? Math.min((progress / goal) * 100, 100) : 0;
  const complete = progress >= goal;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
            <Target className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-800">Daily Goal</p>
        </div>
        <Link
          href="/coding-test/problems"
          className="rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }}
        >
          Practice Now
        </Link>
      </div>

      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: complete
              ? 'linear-gradient(90deg, #059669, #10b981)'
              : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">
          {complete ? 'Goal reached! ' : `${progress}/${goal} problems today`}
          {complete && <span className="font-medium text-emerald-600">Nice work!</span>}
        </p>
        <div className="flex items-center gap-1">
          {Array.from({ length: goal }).map((_, i) => (
            <CheckCircle2
              key={i}
              className={`h-3.5 w-3.5 transition-colors ${i < progress ? 'text-teal-500' : 'text-slate-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Advanced Practice ─────────────────────────────────────────────────────────

function AdvancedPracticeCard() {
  return (
    <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-bold text-slate-800">Advanced Practice</p>
      <div className="grid grid-cols-2 gap-3">

        {/* Code Playground */}
        <Link
          href="/coding-test/playground"
          className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-slate-200 transition-all hover:border-teal-300 hover:shadow-md hover:shadow-teal-100"
          style={{ minHeight: 116, background: '#0c1a2e' }}
        >
          {/* Background code lines decoration */}
          <div className="absolute inset-0 overflow-hidden opacity-30 select-none pointer-events-none">
            {[
              { t: 10, l: 8, w: 54, c: '#7dd3fc' },
              { t: 20, l: 8, w: 36, c: '#a5f3fc' },
              { t: 30, l: 8, w: 66, c: '#86efac' },
              { t: 40, l: 8, w: 28, c: '#fde68a' },
              { t: 50, l: 8, w: 48, c: '#c4b5fd' },
              { t: 60, l: 8, w: 40, c: '#7dd3fc' },
              { t: 70, l: 8, w: 58, c: '#86efac' },
            ].map((line, i) => (
              <div
                key={i}
                className="absolute h-[2px] rounded-full"
                style={{ top: line.t, left: line.l, width: line.w, background: line.c }}
              />
            ))}
          </div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #0d9488, #0ea5e9)' }}
            >
              <span className="font-mono text-sm font-bold leading-none text-white">&gt;_</span>
            </div>
          </div>

          {/* Label bar */}
          <div className="relative z-10 border-t border-white/10 bg-black/50 px-3 py-2 backdrop-blur-sm">
            <p className="text-[11px] font-bold text-white">
              <span className="text-teal-400">&gt;</span> Code Playground
            </p>
          </div>
        </Link>

        {/* Mock Interview */}
        <Link
          href="/mock-interview"
          className="group relative flex flex-col justify-end overflow-hidden rounded-xl border border-slate-200 transition-all hover:border-violet-300 hover:shadow-md hover:shadow-violet-100"
          style={{ minHeight: 116, background: '#100820' }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(139,92,246,0.25) 0%, transparent 70%)' }}
          />

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <div className="flex h-4 items-end gap-[2px]">
              {[2, 4, 8, 12, 8, 4, 2, 4, 8, 12, 8, 4, 2].map((h, i) => (
                <div
                  key={i}
                  className="w-[2.5px] rounded-full"
                  style={{ height: h, background: 'linear-gradient(to top, #7c3aed, #c4b5fd)' }}
                />
              ))}
            </div>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="11" rx="3" />
                <path d="M5 10a7 7 0 0014 0" />
                <line x1="12" y1="21" x2="12" y2="17" />
                <line x1="9" y1="21" x2="15" y2="21" />
              </svg>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 bg-black/50 px-3 py-2 backdrop-blur-sm">
            <p className="text-[11px] font-bold text-white">Mock Interview</p>
          </div>
        </Link>

      </div>
    </div>
  );
}

// ── AI Credits badge ──────────────────────────────────────────────────────────

function CreditsBadge({ quota }: { quota: QuotaResponse }) {
  const color =
    quota.submissions_remaining === 0 ? 'text-rose-600'
    : quota.submissions_remaining <= 5 ? 'text-amber-600'
    : 'text-teal-600';

  return (
    <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-right shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">AI Credits</p>
      <div className="mt-0.5 flex items-baseline justify-end gap-1">
        <span className={`text-lg font-extrabold tabular-nums ${color}`}>
          {quota.submissions_remaining}
        </span>
        <span className="text-[11px] text-slate-400">remaining</span>
      </div>
      <p className="text-[10px] capitalize text-slate-400">{quota.plan} plan</p>
    </div>
  );
}

// ── Language card ─────────────────────────────────────────────────────────────

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
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-teal-300 hover:shadow-md hover:shadow-teal-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="shrink-0">{lang.icon}</div>
          <div>
            <p className="text-sm font-semibold leading-tight text-slate-800">{lang.label}</p>
            <p className="text-[11px] text-slate-400">
              {total !== null ? `${total} problems` : 'Loading…'}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-teal-500" />
      </div>

      {total !== null ? (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0d9488, #059669)' }}
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CodingPracticeHub() {
  const [total, setTotal]             = useState<number | null>(null);
  const [allProblems, setAllProblems] = useState<ProblemWithStatus[]>([]);
  const [quota, setQuota]             = useState<QuotaResponse | null>(null);
  const [ready, setReady]             = useState(false);
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
    const grandTotal   = easyTotal + mediumTotal + hardTotal;
    const overallPct   = grandTotal > 0 ? Math.round((totalSolved / grandTotal) * 100) : 0;
    return { easySolved, easyTotal, mediumSolved, mediumTotal, hardSolved, hardTotal, totalSolved, overallPct };
  }, [allProblems]);

  // daily progress: falls back to total accepted (no timestamp on user_status)
  const todaySolved = useMemo(
    () => allProblems.filter((p) => p.user_status === 'accepted').length,
    [allProblems],
  );
  const DAILY_GOAL = 3;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-teal-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to Dashboard
            </Link>
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-xs font-semibold tracking-wider text-teal-600">
                &lt;/&gt; PRACTICE
              </span>
            </div>
            <h1 className="mt-0.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Coding Problems
            </h1>
            <p className="mt-1 max-w-md text-xs text-slate-500">
              Choose a language to start practicing. Curated problems from easy to hard, graded by AI.
            </p>
          </div>

          {/* AI Credits — top-right badge */}
          {quota && <CreditsBadge quota={quota} />}
        </div>

        {/* ── Primary grid: Stats (3/5) + Right column (2/5) ─────────────── */}
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-stretch">

          <div className="lg:col-span-3">
            <StatsCenterCard stats={stats} />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <DailyGoalCard progress={Math.min(todaySolved, DAILY_GOAL)} goal={DAILY_GOAL} />
            <AdvancedPracticeCard />
          </div>
        </div>

        {/* ── Language section ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Select a Language</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                All problems include starter code in every language.{' '}
                <Link href="/coding-test/problems" className="text-teal-600 hover:underline">
                  Browse all problems
                </Link>{' '}
                and filter by difficulty or topic.
              </p>
            </div>
            <Link
              href="/coding-test/problems"
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              Browse all →
            </Link>
          </div>

          {/* 4-column on desktop, 2-column on tablet, 1-column on mobile */}
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
  );
}

// ── Language icons ────────────────────────────────────────────────────────────

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
        {/* C arc */}
        <path
          d="M14 4A9 9 0 1 0 14 22"
          stroke="#4f46e5"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* First + */}
        <line x1="27" y1="10" x2="27" y2="18" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
        <line x1="23" y1="14" x2="31" y2="14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
