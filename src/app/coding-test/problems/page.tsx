'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Code2,
  LayoutGrid,
  LineChart,
  Moon,
  RotateCw,
  Search,
  SearchX,
  Settings,
  SlidersHorizontal,
  Sun,
  TrendingUp,
  X,
} from 'lucide-react';
import { fetchProblems } from '../_lib/api';
import { fetchProblemsAnnotated } from '../_lib/gradingApi';
import type { CodingTestDifficulty, CodingTestLanguage, ProblemWithStatus } from '../_lib/types';
import { LANGUAGES } from '../_lib/ui';

// ── Constants ──────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted';
type LoadState = 'loading' | 'error' | 'ready';
type ActiveTab = 'all' | 'curated';

const PAGE_SIZE = 20;

const POPULAR_TOPICS = [
  'Basic Programming Concepts',
  'Arrays',
  'Strings',
  'Math',
  'Basic Math',
  'Sorting',
  'Binary Search',
  'Dynamic Programming',
  'Graphs',
  'Segment Trees',
] as const;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'solved', label: 'Solved' },
  { value: 'unsolved', label: 'Unsolved' },
  { value: 'attempted', label: 'Attempted' },
];

const DIFF_COLORS: Record<CodingTestDifficulty, { active: string; idle: string; hover: string }> = {
  easy: {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700',
    idle: 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-600',
  },
  medium: {
    active: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700',
    idle: 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    hover: 'hover:border-amber-300 dark:hover:border-amber-600',
  },
  hard: {
    active: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-400 dark:border-rose-700',
    idle: 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    hover: 'hover:border-rose-300 dark:hover:border-rose-600',
  },
};

const DIFF_BADGE: Record<CodingTestDifficulty, string> = {
  easy: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
  hard: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveTopicTag(topic: string, availableTags: string[]): string {
  if (!availableTags.length) return topic;
  const tLow = topic.toLowerCase();
  const exact = availableTags.find((t) => t.toLowerCase() === tLow);
  if (exact) return exact;
  const stem = tLow.replace(/s$/, '');
  const plural = availableTags.find((t) => t.toLowerCase().replace(/s$/, '') === stem);
  if (plural) return plural;
  const words = tLow.split(/\s+/).filter((w) => w.length >= 4);
  const wordMatch = availableTags.find((t) => {
    const d = t.toLowerCase();
    return words.some((w) => d.startsWith(w) || d.includes(` ${w}`));
  });
  return wordMatch ?? topic;
}

// ── Concentric-ring donut chart ────────────────────────────────────────────
// Outer ring = easy (green), middle = medium (amber), inner = hard (rose).
// Each ring shows progress independently: solved / total for that difficulty.

function SkillsDonut({
  totalSolved,
  easyPct,
  medPct,
  hardPct,
}: {
  totalSolved: number;
  easyPct: number;
  medPct: number;
  hardPct: number;
}) {
  const rings = [
    { r: 52, pct: easyPct, stroke: '#10b981', track: '#d1fae5' },
    { r: 40, pct: medPct, stroke: '#f59e0b', track: '#fef3c7' },
    { r: 28, pct: hardPct, stroke: '#ef4444', track: '#fee2e2' },
  ] as const;

  return (
    <svg width="128" height="128" viewBox="-64 -64 128 128" className="overflow-visible">
      {rings.map((ring) => {
        const circ = 2 * Math.PI * ring.r;
        const filled = ring.pct * circ;
        return (
          <g key={ring.r} transform="rotate(-90)">
            <circle cx="0" cy="0" r={ring.r} fill="none" stroke={ring.track} strokeWidth="9" />
            <circle
              cx="0" cy="0" r={ring.r} fill="none"
              stroke={ring.stroke} strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ}`}
            />
          </g>
        );
      })}
      <text
        textAnchor="middle" y="6"
        fill="currentColor" fontSize="20" fontWeight="700"
        className="fill-slate-900 dark:fill-slate-100"
      >
        {totalSolved}
      </text>
    </svg>
  );
}

// ── Problem status icon ────────────────────────────────────────────────────

function StatusIcon({ status }: { status: 'accepted' | 'attempted' | null }) {
  if (status === 'accepted')
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Solved" />;
  if (status === 'attempted')
    return <Circle className="h-4 w-4 shrink-0 fill-amber-400/20 text-amber-400" aria-label="Attempted" />;
  return <Circle className="h-4 w-4 shrink-0 text-slate-200 dark:text-slate-700" aria-hidden />;
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────

export default function CodingProblemsListPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-50 dark:bg-slate-900" />}>
      <CodingProblemsListContent />
    </Suspense>
  );
}

// ── Main content ───────────────────────────────────────────────────────────

function CodingProblemsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Theme ──────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────
  const paramLang = searchParams.get('language') as CodingTestLanguage | null;
  const validLangs: CodingTestLanguage[] = ['python', 'java', 'cpp', 'c'];

  const [language, setLanguage] = useState<CodingTestLanguage | ''>(
    paramLang && validLangs.includes(paramLang) ? paramLang : 'python',
  );
  const [difficulties, setDifficulties] = useState<Set<CodingTestDifficulty>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [langDropOpen, setLangDropOpen] = useState(false);
  const langDropRef = useRef<HTMLDivElement>(null);

  // ── Data ───────────────────────────────────────────────────────────────
  const [allProblems, setAllProblems] = useState<ProblemWithStatus[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setErrorMessage('');

    fetchProblemsAnnotated({}, controller.signal)
      .then((data) => { setAllProblems(data); setState('ready'); })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        fetchProblems({}, controller.signal)
          .then((res) => {
            setAllProblems(res.problems.map((p) => ({ ...p, user_status: null })));
            setState('ready');
          })
          .catch((fallErr) => {
            if (fallErr instanceof DOMException && fallErr.name === 'AbortError') return;
            setErrorMessage(fallErr instanceof Error ? fallErr.message : 'Something went wrong.');
            setState('error');
          });
      });

    return () => controller.abort();
  }, [reloadKey]);

  // Re-fetch when user returns to tab so counts stay fresh
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') setReloadKey((k) => k + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node))
        setLangDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langDropOpen]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const solved = useMemo(() => {
    const easy = allProblems.filter((p) => p.user_status === 'accepted' && p.difficulty === 'easy').length;
    const medium = allProblems.filter((p) => p.user_status === 'accepted' && p.difficulty === 'medium').length;
    const hard = allProblems.filter((p) => p.user_status === 'accepted' && p.difficulty === 'hard').length;
    return { easy, medium, hard, total: easy + medium + hard };
  }, [allProblems]);

  const totals = useMemo(() => ({
    easy: allProblems.filter((p) => p.difficulty === 'easy').length,
    medium: allProblems.filter((p) => p.difficulty === 'medium').length,
    hard: allProblems.filter((p) => p.difficulty === 'hard').length,
  }), [allProblems]);

  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allProblems) {
      if (p.tag) map.set(p.tag, (map.get(p.tag) ?? 0) + 1);
    }
    return map;
  }, [allProblems]);

  const allTags = useMemo(() => Array.from(topicCounts.keys()).sort(), [topicCounts]);

  const popularTopicTagMap = useMemo(() => {
    const map = new Map<string, string>();
    const claimed = new Set<string>();
    for (const topic of POPULAR_TOPICS) {
      const resolved = resolveTopicTag(topic, allTags);
      if (!claimed.has(resolved)) { map.set(topic, resolved); claimed.add(resolved); }
      else map.set(topic, topic);
    }
    return map;
  }, [allTags]);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = allProblems;

    if (statusFilter === 'solved') list = list.filter((p) => p.user_status === 'accepted');
    else if (statusFilter === 'unsolved') list = list.filter((p) => !p.user_status);
    else if (statusFilter === 'attempted') list = list.filter((p) => p.user_status === 'attempted');

    if (difficulties.size > 0) list = list.filter((p) => difficulties.has(p.difficulty));
    if (tag) list = list.filter((p) => p.tag?.toLowerCase() === tag.toLowerCase());

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.tag?.toLowerCase().includes(q));
    }

    if (companySearch.trim()) {
      const q = companySearch.trim().toLowerCase();
      list = list.filter((p) => p.tag?.toLowerCase().includes(q));
    }

    return list;
  }, [allProblems, statusFilter, difficulties, tag, search, companySearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [statusFilter, difficulties, tag, search, companySearch]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleProblemClick = useCallback(
    (slug: string, lang?: CodingTestLanguage) =>
      async (e: React.MouseEvent) => {
        e.preventDefault();
        try { await document.documentElement.requestFullscreen(); } catch { /* ignore */ }
        router.push(lang ? `/coding-test/${slug}?language=${lang}` : `/coding-test/${slug}`);
      },
    [router],
  );

  function toggleDiff(d: CodingTestDifficulty) {
    setDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  }

  const easyPct = totals.easy > 0 ? solved.easy / totals.easy : 0;
  const medPct = totals.medium > 0 ? solved.medium / totals.medium : 0;
  const hardPct = totals.hard > 0 ? solved.hard / totals.hard : 0;

  const currentLangLabel = LANGUAGES.find((l) => l.value === language)?.label ?? 'Python';

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans dark:bg-slate-900">

        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside className="flex w-[17rem] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-800">

          {/* Brand row */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-700/60">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-lg font-extrabold text-white shadow-sm"
            >
              C
            </Link>
            <div className="flex flex-1 items-center justify-end gap-3">
              {[LayoutGrid, LineChart, Briefcase, Settings].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  className="text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </button>
              ))}
            </div>
          </div>

          {/* Page heading inside sidebar */}
          <div className="px-4 pb-3 pt-5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
              <Code2 className="h-3.5 w-3.5" />
              Coding Practice
            </div>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">
              All Problems
            </h1>
          </div>

          {/* Skills Navigator */}
          <div className="mx-3 mb-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Skills Navigator
            </p>

            {/* Donut + total */}
            <div className="flex justify-center py-1">
              <SkillsDonut
                totalSolved={solved.total}
                easyPct={easyPct}
                medPct={medPct}
                hardPct={hardPct}
              />
            </div>

            {/* Difficulty cards */}
            <div className="mt-4 space-y-2">
              {/* Easy */}
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Easy</span>
                <div className="flex-1 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30" style={{ height: 6 }}>
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: totals.easy > 0 ? `${(solved.easy / totals.easy) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {solved.easy}<span className="font-normal text-slate-400">/{totals.easy}</span>
                </span>
              </div>
              {/* Medium */}
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[11px] font-semibold text-amber-500 dark:text-amber-400">Med</span>
                <div className="flex-1 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-900/30" style={{ height: 6 }}>
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: totals.medium > 0 ? `${(solved.medium / totals.medium) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-amber-500 dark:text-amber-400">
                  {solved.medium}<span className="font-normal text-slate-400">/{totals.medium}</span>
                </span>
              </div>
              {/* Hard */}
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[11px] font-semibold text-rose-500 dark:text-rose-400">Hard</span>
                <div className="flex-1 overflow-hidden rounded-full bg-rose-100 dark:bg-rose-900/30" style={{ height: 6 }}>
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-500"
                    style={{ width: totals.hard > 0 ? `${(solved.hard / totals.hard) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-rose-500 dark:text-rose-400">
                  {solved.hard}<span className="font-normal text-slate-400">/{totals.hard}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Topics */}
          <div className="px-2 pb-6">
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Topics
            </p>
            <ul className="space-y-0.5">
              {POPULAR_TOPICS.map((topic) => {
                const resolvedTag = popularTopicTagMap.get(topic) ?? topic;
                const count = topicCounts.get(resolvedTag) ?? 0;
                const active = tag === resolvedTag;
                return (
                  <li key={topic}>
                    <button
                      type="button"
                      onClick={() => setTag(active ? '' : resolvedTag)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      <span>{topic}</span>
                      {count > 0 && (
                        <span className={`ml-1 text-sm ${active ? 'text-indigo-400' : 'text-slate-400'}`}>
                          ({count})
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Top bar */}
          <header className="flex shrink-0 items-center border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700/60 dark:bg-slate-800">
            <Link
              href="/coding-test"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Practice
            </Link>
          </header>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">

            {/* Learning plan banner */}
            <div className="mx-6 mt-5 flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-700/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>

              <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                  My Learning Plan: Road to Advanced DP
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div className="h-full w-[55%] rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-slate-300" />
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Next step:</p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Road to Advanced DP</p>
              </div>

              <button
                type="button"
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Next step
                <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                  +1
                </span>
              </button>
            </div>

            {/* Tabs + dark mode toggle */}
            <div className="mx-6 mt-4 flex items-end justify-between border-b border-slate-200 dark:border-slate-700/60">
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`pb-3 pr-6 text-base font-semibold transition-colors border-b-2 ${
                    activeTab === 'all'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  All Problems
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('curated')}
                  className={`pb-3 text-base font-semibold transition-colors border-b-2 ${
                    activeTab === 'curated'
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  Curated Lists
                  <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">
                    Blind 75, LeetCode 75
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDark((d) => !d)}
                className="mb-2 flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500"
              >
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {dark ? 'Light' : 'Dark'}-theme
              </button>
            </div>

            {/* ── All Problems tab content ─────────────────────────────── */}
            {activeTab === 'all' && (
              <div className="px-6 pb-8 pt-4">

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search all problems by name or tag"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>

                {/* Filter row */}
                <div className="mb-4 flex flex-wrap items-center gap-2.5">

                  {/* Status pills */}
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
                    {STATUS_FILTERS.map((sf) => (
                      <button
                        key={sf.value}
                        type="button"
                        onClick={() => setStatusFilter(sf.value)}
                        className={`flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                          statusFilter === sf.value
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        {sf.label}
                        {sf.value === 'attempted' && (
                          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Difficulty pills */}
                  {(['easy', 'medium', 'hard'] as CodingTestDifficulty[]).map((d) => {
                    const active = difficulties.has(d);
                    const c = DIFF_COLORS[d];
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDiff(d)}
                        className={`rounded-lg border px-3.5 py-2 text-sm font-semibold capitalize transition-all ${
                          active ? c.active : `${c.idle} ${c.hover}`
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    );
                  })}

                  {/* Language dropdown */}
                  <div className="relative" ref={langDropRef}>
                    <button
                      type="button"
                      onClick={() => setLangDropOpen((o) => !o)}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {currentLangLabel}
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${
                          langDropOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {langDropOpen && (
                      <div className="absolute left-0 top-full z-30 mt-1 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                        {LANGUAGES.map((l) => (
                          <button
                            key={l.value}
                            type="button"
                            onClick={() => { setLanguage(l.value); setLangDropOpen(false); }}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                              language === l.value
                                ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {l.label}
                            {language === l.value && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Company tags search */}
                  <input
                    type="text"
                    placeholder="TCS, Infosys, Amazon..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
                  />

                  {/* All problems / filter toggle */}
                  <button
                    type="button"
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    All problems
                  </button>
                </div>

                {/* Active topic chip */}
                {tag && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Topic:</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800">
                      {POPULAR_TOPICS.find((t) => (popularTopicTagMap.get(t) ?? t) === tag) ?? tag}
                      <button
                        type="button"
                        onClick={() => setTag('')}
                        aria-label="Remove topic filter"
                        className="ml-0.5 rounded-full hover:text-indigo-900 dark:hover:text-indigo-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}

                {/* Results header */}
                {state === 'ready' && filtered.length > 0 && (
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Showing{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {filtered.length}
                      </span>{' '}
                      problems
                    </p>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Acceptance
                    </span>
                  </div>
                )}

                {/* States */}
                {state === 'loading' && <ListSkeleton />}

                {state === 'error' && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/40 dark:bg-rose-900/10">
                    <AlertCircle className="h-8 w-8 text-rose-500" />
                    <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => setReloadKey((k) => k + 1)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
                    >
                      <RotateCw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                )}

                {state === 'ready' && filtered.length === 0 && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
                    <SearchX className="h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      No problems match these filters.
                    </p>
                    {(statusFilter !== 'all' || difficulties.size > 0 || tag || search) && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setDifficulties(new Set());
                          setTag('');
                          setSearch('');
                        }}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}

                {/* Problem list */}
                {state === 'ready' && filtered.length > 0 && (
                  <>
                    <ul className="space-y-2">
                      {visible.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={
                              language
                                ? `/coding-test/${p.slug}?language=${language}`
                                : `/coding-test/${p.slug}`
                            }
                            onClick={handleProblemClick(p.slug, language || undefined)}
                            className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-indigo-700/60"
                          >
                            {/* Status */}
                            <StatusIcon status={p.user_status} />

                            {/* Title + tag */}
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-400">
                                {p.title}
                              </h3>
                              <p className="mt-0.5 truncate text-sm text-slate-400 dark:text-slate-500">
                                {p.tag}
                              </p>
                            </div>

                            {/* Acceptance rate placeholder */}
                            <div className="hidden shrink-0 items-center gap-1 sm:flex">
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                —
                              </span>
                            </div>

                            {/* Difficulty badge */}
                            <span
                              className={`shrink-0 rounded-full px-3 py-0.5 text-sm font-semibold capitalize ${DIFF_BADGE[p.difficulty]}`}
                            >
                              {p.difficulty}
                            </span>

                            {/* Chevron */}
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-400 dark:text-slate-600 dark:group-hover:text-indigo-500" />
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-indigo-300 hover:enabled:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </button>
                        <span className="text-sm text-slate-400 dark:text-slate-500">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-indigo-300 hover:enabled:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Curated Lists tab ────────────────────────────────────── */}
            {activeTab === 'curated' && (
              <div className="px-6 py-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      id: 'blind75',
                      name: 'Blind 75',
                      desc: 'The classic 75-problem list curated by a Facebook engineer — essential for FAANG interviews.',
                      count: 75,
                      color: 'from-indigo-500 to-purple-600',
                    },
                    {
                      id: 'leetcode75',
                      name: 'LeetCode 75',
                      desc: "LeetCode's official study plan — 75 hand-picked problems to master key patterns.",
                      count: 75,
                      color: 'from-amber-500 to-orange-600',
                    },
                  ].map((list) => (
                    <div
                      key={list.id}
                      className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div
                        className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${list.color}`}
                      />
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {list.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {list.desc}
                        </p>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">
                          {list.count} problems
                        </span>
                        <button
                          type="button"
                          className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                          Start list
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
