'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Code2, Lock, Zap } from 'lucide-react';
import { fetchHistory, fetchQuota, GradingApiError } from '../coding-test/_lib/gradingApi';
import type { HistoryEntry, QuotaResponse } from '../coding-test/_lib/types';
import { normalizeScore } from '../coding-test/_lib/ui';

// ─── Language icons ───────────────────────────────────────────────────────────

function PythonIcon() {
  return (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
      <path d="M24.047 4C13.374 4 14.028 8.677 14.028 8.677L14.04 13.52h10.2v1.48H9.48S4 14.367 4 25.14c0 10.774 5.953 10.386 5.953 10.386h3.554v-4.998s-.191-5.953 5.853-5.953h10.09s5.66.091 5.66-5.47V9.66S35.889 4 24.047 4z" fill="#3776AB" />
      <path d="M20.772 7.218a2.275 2.275 0 1 1 0 4.55 2.275 2.275 0 0 1 0-4.55z" fill="#FFD43B" />
      <path d="M23.953 44c10.673 0 10.019-4.677 10.019-4.677L33.96 34.48H23.76V33H38.52S44 33.633 44 22.86c0-10.774-5.953-10.386-5.953-10.386h-3.554v4.998s.191 5.953-5.853 5.953H18.55s-5.66-.091-5.66 5.47V38.34S12.111 44 23.953 44z" fill="#FFD43B" />
      <path d="M27.228 40.782a2.275 2.275 0 1 1 0-4.55 2.275 2.275 0 0 1 0 4.55z" fill="#3776AB" />
    </svg>
  );
}

function JavaIcon() {
  return (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
      <path d="M18.114 31.836s-1.44.836.024 1.12c1.764.332 2.672.284 4.62-.32 0 0 .512.32 1.228.6-4.368 1.872-9.884-.108-5.872-1.4z" fill="#E76F00" />
      <path d="M17.43 28.896s-1.616 1.196.852 1.452c3.192.328 5.716.356 10.072-.484 0 0 .356.36.916.56-8.92 2.608-18.856.232-11.84-1.528z" fill="#E76F00" />
      <path d="M23.252 21.556c1.816 2.088-.476 3.968-.476 3.968s4.608-2.38 2.492-5.36c-1.972-2.784-3.484-4.168 4.708-8.936 0 0-12.868 3.212-6.724 10.328z" fill="#E76F00" />
      <path d="M33.468 34.768s1.068.88-1.176 1.56c-4.268 1.292-17.764 1.684-21.512.052-1.348-.588 1.18-1.404 1.972-1.576.828-.18 1.3-.144 1.3-.144-1.496-1.052-9.668 2.068-4.152 2.96 15.04 2.44 27.404-1.1 23.568-2.852z" fill="#E76F00" />
      <path d="M18.81 24.756s-6.864 1.632-2.432 2.224c1.872.252 5.596.196 9.072-.1 2.836-.244 5.684-.76 5.684-.76s-1 .428-1.724.924c-6.96 1.832-20.392 1-16.52-.892 3.276-1.632 5.92-1.396 5.92-1.396z" fill="#E76F00" />
      <path d="M30.152 29.996c7.076-3.676 3.804-7.208 1.52-6.732-.56.12-.812.224-.812.224s.208-.328.608-.468c4.54-1.596 8.032 4.704-1.46 7.196 0 0 .108-.1.144-.22z" fill="#E76F00" />
      <path d="M25.024 8S28.68 11.66 21.588 17.3c-5.636 4.456-1.284 6.996-.004 9.9-3.292-2.972-5.708-5.588-4.088-8.024C19.92 15.144 26.576 13.376 25.024 8z" fill="#E76F00" />
      <path d="M19.57 38.98c6.792.436 17.22-.24 17.46-3.456 0 0-.476 1.22-5.612 2.188-5.796 1.096-12.944.968-17.18.264 0 0 .868.716 5.332 1.004z" fill="#E76F00" />
    </svg>
  );
}

function CIcon() {
  return (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
      <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="#005A9C" />
      <path d="M24 4L6 14v20l18 10V4z" fill="#0073BD" />
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial, sans-serif">C</text>
    </svg>
  );
}

function CppIcon() {
  return (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
      <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="#00427E" />
      <path d="M24 4L6 14v20l18 10V4z" fill="#005A9C" />
      <text x="24" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">C++</text>
    </svg>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const LANGUAGES = [
  { key: 'python', name: 'Python', problems: 31, icon: <PythonIcon />, lightBg: '#EBF5FB' },
  { key: 'java',   name: 'Java',   problems: 35, icon: <JavaIcon />,   lightBg: '#FEF3E7' },
  { key: 'c',      name: 'C',      problems: 28, icon: <CIcon />,      lightBg: '#EBF5FB' },
  { key: 'cpp',    name: 'C++',    problems: 35, icon: <CppIcon />,    lightBg: '#EAF1F8' },
];

// ─── Progress donut ───────────────────────────────────────────────────────────

function DonutRing({ pct }: { pct: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      {/* track */}
      <circle cx="48" cy="48" r={r} fill="none" stroke="#E2E8F0" strokeWidth="9" />
      {/* progress arc — starts at 12 o'clock */}
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke="#F97316"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* centre label */}
      <text x="48" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0F172A" fontFamily="inherit">
        {pct > 0 ? `${pct}%` : '--'}
      </text>
      <text x="48" y="58" textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily="inherit">
        accuracy
      </text>
    </svg>
  );
}

// ─── Progress card ────────────────────────────────────────────────────────────

interface ProgressStats { solved: number; attempted: number; accuracy: number }

function ProgressCard() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHistory(1, 100)
      .then((res) => {
        const entries: HistoryEntry[] = res.entries;
        const attempted = new Set(entries.map((e) => e.problem_slug)).size;
        const scores = entries.map((e) => normalizeScore(e.score)).filter((s): s is number => s !== null);
        const solved = scores.filter((s) => s >= 75).length;
        const accuracy = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        setStats({ solved, attempted, accuracy });
        setAuthed(true);
      })
      .catch((err) => {
        setAuthed(err instanceof GradingApiError && err.status === 401 ? false : null);
      });
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-slate-100">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Your Progress</p>
      </div>

      <div className="px-5 py-5">
        {/* ring + stats row */}
        <div className="flex items-center gap-5">
          <DonutRing pct={authed && stats ? stats.accuracy : 0} />

          <div className="space-y-2.5 flex-1">
            <StatRow label="Solved"    value={authed && stats ? String(stats.solved)    : '--'} color="#F97316" />
            <StatRow label="Attempted" value={authed && stats ? String(stats.attempted) : '--'} color="#3B82F6" />
            <StatRow label="Accuracy"  value={authed && stats ? `${stats.accuracy}%`    : '--'} color="#0F172A" />
          </div>
        </div>

        {/* sign-in prompt */}
        {authed === false && (
          <Link
            href="/?showLogin=true"
            className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Sign In to View Progress
          </Link>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
      <span className="text-sm font-semibold text-slate-400 tabular-nums">{value}</span>
    </div>
  );
}

// ─── Quota card ───────────────────────────────────────────────────────────────

function QuotaCard() {
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetchQuota()
      .then((q) => { setQuota(q); setAuthed(true); })
      .catch((err) => {
        setAuthed(err instanceof GradingApiError && err.status === 401 ? false : null);
      });
  }, []);

  const barPct = quota
    ? Math.min(100, Math.round((quota.submissions_remaining / 50) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Grading Credits</p>
      </div>
      <div className="px-5 py-4">
        {authed === false ? (
          <Link
            href="/?showLogin=true"
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Sign In to View Credits
          </Link>
        ) : quota === null ? (
          <div className="h-10 animate-pulse rounded bg-slate-100" />
        ) : (
          <>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {quota.submissions_remaining}
              </span>
              <span className="text-xs text-slate-400 mb-0.5">submissions left</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${quota.submissions_remaining === 0 ? 'bg-rose-400' : 'bg-amber-400'}`}
                style={{ width: `${Math.min(100, barPct)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {quota.cost_per_submission} credit per submission · {quota.plan} plan
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CodingProblemsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Code2 className="h-5 w-5" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide">Practice</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl tracking-tight">
            Coding Problems
          </h1>
          <p className="mt-2 text-slate-500 text-sm max-w-lg">
            Choose a programming language to start practicing. Each track has curated problems
            ranging from easy to hard.
          </p>
        </header>

        {/* Body: cards + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-8 items-start">

          {/* Left — language cards */}
          <section aria-label="Programming languages">
            <h2 className="text-base font-semibold text-slate-700 mb-4">Select a Language</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LANGUAGES.map((lang) => (
                <Link
                  key={lang.key}
                  href={`/coding-test?language=${lang.key}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: lang.lightBg }}
                  >
                    {lang.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-[15px] leading-tight group-hover:text-indigo-700 transition-colors">
                      {lang.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{lang.problems} Problems</p>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-400">
              You can also{' '}
              <Link href="/coding-test" className="text-indigo-500 hover:underline">
                browse all problems
              </Link>{' '}
              and filter by language, difficulty, or tag.
            </p>
          </section>

          {/* Right sidebar */}
          <aside className="space-y-4">
            <ProgressCard />
            <QuotaCard />
          </aside>

        </div>
      </div>
    </main>
  );
}
