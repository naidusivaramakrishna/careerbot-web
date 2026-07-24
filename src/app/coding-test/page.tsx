'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchProblems } from './_lib/api';
import { fetchProgress } from './_lib/gradingApi';
import type { CodingTestLanguage } from './_lib/types';
import OnboardingModal from '@/components/coding-test/OnboardingModal';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';

type Progress = { solved: number; attempted: number; accuracy: number };

const LANG_CONFIG: {
  value: CodingTestLanguage;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'python', label: 'Python', icon: <PythonIcon /> },
  { value: 'java',   label: 'Java',   icon: <JavaIcon /> },
  { value: 'c',      label: 'C',      icon: <CIcon /> },
  { value: 'cpp',    label: 'C++',    icon: <CppIcon /> },
];

const CIRC = 2 * Math.PI * 36; // ≈ 226.2

const onboardingKey = (userId: string) => `coding_test_onboarded_${userId}`;

export default function CodingPracticeHub() {
  const { userId } = useCurrentUserId();
  const [totalProblems, setTotalProblems] = useState<number | null>(null);
  const [progress, setProgress] = useState<Progress>({ solved: 0, attempted: 0, accuracy: 0 });
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check localStorage after userId resolves (SSR-safe, per-user key).
  useEffect(() => {
    if (!userId) return;
    if (!localStorage.getItem(onboardingKey(userId))) setShowOnboarding(true);
  }, [userId]);

  const dismissOnboarding = () => {
    if (userId) localStorage.setItem(onboardingKey(userId), '1');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const loadData = () =>
      Promise.all([
        fetchProblems().then((r) => r.total).catch(() => null),
        fetchProgress().catch(() => null),
      ]).then(([total, prog]) => {
        if (total !== null) setTotalProblems(total);
        if (prog) {
          const attempted = prog.summary.problems_attempted;
          const solved    = prog.summary.problems_accepted;
          setProgress({
            solved,
            attempted,
            accuracy: attempted > 0 ? Math.round((solved / attempted) * 100) : 0,
          });
        }
        setReady(true);
      });

    loadData();

    // Re-fetch when the user returns to this tab (e.g. after submitting on a
    // problem page) so the Solved count always reflects the latest state.
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadData();
    };

    // Also re-fetch when the problem page signals an accepted submit via
    // localStorage (works even if visibilitychange doesn't fire in the same tab).
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'progress_updated') loadData();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const arc = (progress.accuracy / 100) * CIRC;

  return (
    <main className="min-h-screen bg-slate-50">
      {showOnboarding && <OnboardingModal onDismiss={dismissOnboarding} />}

      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">

        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Dashboard
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-indigo-600">
            <span className="font-mono text-sm font-semibold tracking-wide">&lt;/&gt; PRACTICE</span>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Coding Problems
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Choose a programming language to start practicing. Each track has curated
            problems ranging from easy to hard.
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Language cards + browse link ─────────────────────────── */}
          <div className="flex-1">
            <h2 className="mb-4 text-base font-semibold text-slate-800">Select a Language</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {LANG_CONFIG.map((lang) => (
                <Link
                  key={lang.value}
                  href={`/coding-test/problems?language=${lang.value}`}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="shrink-0">{lang.icon}</div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">{lang.label}</p>
                    <p className="text-sm text-slate-500">
                      {ready ? `${totalProblems} Problems` : '— Problems'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-6 text-sm text-slate-500">
              You can also{' '}
              <Link
                href="/coding-test/problems"
                className="font-medium text-indigo-600 hover:underline"
              >
                browse all problems
              </Link>{' '}
              and filter by language, difficulty, or tag.
            </p>
          </div>

          {/* ── Right sidebar ─────────────────────────────────────────── */}
          <div className="flex w-full flex-col gap-4 lg:w-64 lg:shrink-0">

            {/* YOUR PROGRESS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Your Progress
              </p>
              <div className="flex items-center gap-4">
                {/* Donut chart */}
                <svg width="90" height="90" viewBox="0 0 100 100" className="shrink-0">
                  {/* Track */}
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  {/* Arc */}
                  <circle
                    cx="50" cy="50" r="36"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${arc} ${CIRC}`}
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="47" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="600">
                    {progress.attempted === 0 ? '--' : `${progress.accuracy}%`}
                  </text>
                  <text x="50" y="60" textAnchor="middle" fill="#cbd5e1" fontSize="9">
                    accuracy
                  </text>
                </svg>
                {/* Stats */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="text-sm font-medium text-orange-500">Solved</span>
                    <span className="text-sm font-semibold text-slate-700">{progress.solved}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="text-sm font-medium text-indigo-500">Attempted</span>
                    <span className="text-sm font-semibold text-slate-700">{progress.attempted}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="text-sm font-medium text-slate-600">Accuracy</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {progress.attempted === 0 ? '0%' : `${progress.accuracy}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

/* ── Language icon components ─────────────────────────────────────────────── */

function PythonIcon() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        {/* Python-style two-tone snake icon */}
        <path
          d="M18 2C13 2 10 4.5 10 8v3h8v1H7C4 12 2 14.5 2 18s2 6 5 6.5V28c0 3.5 3 6 8 6 5 0 8-2.5 8-6v-3h-8v-1h11c3 0 5-2.5 5-6.5s-2-6.5-5-6.5h-1V8c0-3.5-3-6-7-6z"
          fill="#3776ab"
        />
        <path
          d="M18 34c5 0 8-2.5 8-6v-3h-8v-1h11c3 0 5-2.5 5-6.5s-2-6-5-6.5V8c0-3.5-3-6-8-6-5 0-8 2.5-8 6v3h8v1H7c-3 0-5 2.5-5 6s2 6.5 5 7V28c0 3.5 3 6 8 6h3z"
          fill="#ffd43b"
          opacity="0.85"
        />
        <circle cx="14" cy="10" r="1.5" fill="white" />
        <circle cx="22" cy="26" r="1.5" fill="white" />
      </svg>
    </div>
  );
}

function JavaIcon() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
      <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
        {/* Coffee cup silhouette */}
        <path
          d="M6 14h16l-2 14H8L6 14z"
          fill="#f59e0b"
        />
        <path
          d="M22 16h3a3 3 0 010 6h-3"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 12c0 0 1.5-3 4-4.5C14.5 6 13 3 13 3"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path d="M5 30h20" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function CIcon() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
      <span className="text-xl font-extrabold text-white">C</span>
    </div>
  );
}

function CppIcon() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700">
      <span className="text-base font-extrabold tracking-tight text-white">C++</span>
    </div>
  );
}
