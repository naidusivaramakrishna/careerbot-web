'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  BarChart2,
  Bookmark,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Home,
  LayoutGrid,
  LayoutList,
  ListFilter,
  Moon,
  RotateCw,
  Search,
  SearchX,
  Shuffle,
  Star,
  Sun,
  Trophy,
  TrendingUp,
  X,
} from 'lucide-react';
import { fetchProblems, fetchTopics } from '../_lib/api';
import { fetchProblemsAnnotated } from '../_lib/gradingApi';
import type { CodingTestDifficulty, CodingTestLanguage, ProblemWithStatus, TopicCategory } from '../_lib/types';
import { LANGUAGES } from '../_lib/ui';

// ── Constants ──────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'solved' | 'unsolved' | 'attempted';
type LoadState = 'loading' | 'error' | 'ready';
type ActiveTab = 'all' | 'favorites' | 'recent';
type ViewMode = 'list' | 'grid';
type SortBy = 'most_recent' | 'acceptance' | 'difficulty';

const PAGE_SIZE = 20;

const CATEGORY_COLORS: Record<string, string> = {
  'Programming Fundamentals': 'bg-emerald-500',
  'Data Structures': 'bg-blue-500',
  'Problem-Solving Patterns': 'bg-violet-500',
  'Algorithms': 'bg-orange-500',
  'Advanced Algorithms': 'bg-red-500',
  'Dynamic Programming': 'bg-yellow-400',
  'Advanced Data Structures': 'bg-amber-700',
};


const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'solved', label: 'Solved' },
  { value: 'unsolved', label: 'Unsolved' },
  { value: 'attempted', label: 'Attempted' },
];

const DIFF_BADGE: Record<CodingTestDifficulty, string> = {
  easy: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800',
  hard: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-800',
};

const TABS: { value: ActiveTab; label: string; icon?: React.ReactNode }[] = [
  { value: 'all',       label: 'All Problems' },
  { value: 'favorites', label: 'Favorites',          icon: <Star  className="h-3.5 w-3.5" /> },
  { value: 'recent',    label: 'Recently Attempted', icon: <Clock className="h-3.5 w-3.5" /> },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function ProgressDonut({ pct, size = 120, label }: { pct: number; size?: number; label?: string }) {
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const arc = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="10"
        className="text-slate-100 dark:text-slate-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="10"
        strokeLinecap="round" strokeDasharray={`${arc} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-indigo-500 transition-all duration-700" />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="currentColor"
        fontSize={size < 100 ? 14 : 22} fontWeight="700"
        className="fill-slate-800 dark:fill-slate-100">
        {pct}%
      </text>
      {label && (
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="currentColor"
          fontSize="10" className="fill-slate-400 dark:fill-slate-500">
          {label}
        </text>
      )}
    </svg>
  );
}

function StatusIcon({ status }: { status: 'accepted' | 'attempted' | null }) {
  if (status === 'accepted')
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-label="Solved" />;
  if (status === 'attempted')
    return <Circle className="h-5 w-5 shrink-0 fill-amber-400/20 text-amber-400" aria-label="Attempted" />;
  return <Circle className="h-5 w-5 shrink-0 text-slate-200 dark:text-slate-700" aria-hidden />;
}

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}
          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            <div>
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-1.5 flex gap-1.5">
                <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700/60" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700/60" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-10 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
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

  const [dark, setDark] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('most_recent');
  const [sortDropOpen, setSortDropOpen] = useState(false);
  const sortDropRef = useRef<HTMLDivElement>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  const paramLang = searchParams.get('language') as CodingTestLanguage | null;
  const validLangs: CodingTestLanguage[] = ['python', 'java', 'cpp', 'c'];

  const [language, setLanguage] = useState<CodingTestLanguage | ''>(
    paramLang && validLangs.includes(paramLang) ? paramLang : 'python',
  );
  const [difficulties, setDifficulties] = useState<Set<CodingTestDifficulty>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [topbarSearch, setTopbarSearch] = useState('');
  const [tag, setTag] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [langDropOpen, setLangDropOpen] = useState(false);
  const [topicDropOpen, setTopicDropOpen] = useState(false);
  const langDropRef = useRef<HTMLDivElement>(null);
  const topicDropRef = useRef<HTMLDivElement>(null);

  const [allProblems, setAllProblems] = useState<ProblemWithStatus[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [topicTree, setTopicTree] = useState<TopicCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') setReloadKey((k) => k + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTopics(controller.signal)
      .then((data) => {
        setTopicTree(data);
        setExpandedCategories(new Set(data.map((c) => c.category)));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!langDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node))
        setLangDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langDropOpen]);

  useEffect(() => {
    if (!topicDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (topicDropRef.current && !topicDropRef.current.contains(e.target as Node))
        setTopicDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [topicDropOpen]);

  useEffect(() => {
    if (!sortDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortDropRef.current && !sortDropRef.current.contains(e.target as Node))
        setSortDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortDropOpen]);

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
    all: allProblems.length,
  }), [allProblems]);

  const overallPct = totals.all > 0 ? Math.round((solved.total / totals.all) * 100) : 0;

  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allProblems) {
      if (p.tag) map.set(p.tag, (map.get(p.tag) ?? 0) + 1);
    }
    return map;
  }, [allProblems]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of topicTree) {
      let count = 0;
      for (const topic of cat.topics) {
        count += topicCounts.get(topic.name) ?? 0;
      }
      map.set(cat.category, count);
    }
    return map;
  }, [topicTree, topicCounts]);

  const popularTopics = useMemo(() => {
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [topicCounts]);

  const recommendedTopics = useMemo(() => {
    const starred: Array<{ name: string; count: number }> = [];
    for (const cat of topicTree) {
      for (const topic of cat.topics) {
        if (topic.is_starred) {
          starred.push({ name: topic.name, count: topicCounts.get(topic.name) ?? 0 });
        }
      }
    }
    if (starred.length >= 4) return starred.slice(0, 4);
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));
  }, [topicTree, topicCounts]);

  const topicColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of topicTree) {
      const color = CATEGORY_COLORS[cat.category] ?? 'bg-slate-400';
      for (const topic of cat.topics) map.set(topic.name, color);
    }
    return map;
  }, [topicTree]);

  const effectiveSearch = topbarSearch || search;

  const filtered = useMemo(() => {
    let list = allProblems;

    if (activeTab === 'favorites') list = list.filter((p) => bookmarked.has(p.slug));
    else if (activeTab === 'recent') list = list.filter((p) => p.user_status != null);

    if (statusFilter === 'solved') list = list.filter((p) => p.user_status === 'accepted');
    else if (statusFilter === 'unsolved') list = list.filter((p) => !p.user_status);
    else if (statusFilter === 'attempted') list = list.filter((p) => p.user_status === 'attempted');

    if (difficulties.size > 0) list = list.filter((p) => difficulties.has(p.difficulty));
    if (tag) list = list.filter((p) => p.tag?.toLowerCase() === tag.toLowerCase());

    if (effectiveSearch.trim()) {
      const q = effectiveSearch.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.tag?.toLowerCase().includes(q));
    }

    if (sortBy === 'difficulty') {
      const order: Record<CodingTestDifficulty, number> = { easy: 0, medium: 1, hard: 2 };
      list = [...list].sort((a, b) => order[a.difficulty] - order[b.difficulty]);
    }

    return list;
  }, [allProblems, statusFilter, difficulties, tag, effectiveSearch, activeTab, bookmarked, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [statusFilter, difficulties, tag, effectiveSearch, activeTab]);

  const handleProblemClick = useCallback(
    (slug: string, lang?: CodingTestLanguage) =>
      async (e: React.MouseEvent) => {
        // Let the browser handle modifier-key clicks (Ctrl/Cmd/Shift or middle-click)
        // so "open in new tab" works normally.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        try { await document.documentElement.requestFullscreen(); } catch { /* ignore */ }
        router.push(lang ? `/coding-test/${slug}?language=${lang}` : `/coding-test/${slug}`);
      },
    [router],
  );

  const toggleBookmark = useCallback((slug: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }, []);

  const currentLangLabel = LANGUAGES.find((l) => l.value === language)?.label ?? 'Python';
  const currentLangFlag = language === 'python' ? '🐍' : language === 'java' ? '☕' : language === 'cpp' ? '⚡' : 'C';

  const SORT_LABELS: Record<SortBy, string> = {
    most_recent: 'Most Recent',
    acceptance: 'Acceptance',
    difficulty: 'Difficulty',
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={dark ? 'dark' : ''}>
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans dark:bg-slate-900">

        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside className="flex w-[240px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white dark:border-slate-700/60 dark:bg-slate-900">

          {/* Brand */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-sm">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight">CodePractice</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Learn • Practice • Grow</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 py-4 space-y-0.5 border-b border-slate-100 dark:border-slate-700/60">
            {[
              { href: '/dashboard', icon: Home, label: 'Home' },
              { href: '/coding-test/problems', icon: Code2, label: 'Problems', active: true },
              { href: '/coding-test', icon: BookOpen, label: 'Study Plan' },
              { href: '/coding-test/history', icon: BarChart2, label: 'Progress' },
              { href: '/coding-test', icon: Trophy, label: 'Leaderboard' },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Learning Path categories */}
          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                LEARNING PATH
              </p>
              <button
                type="button"
                onClick={() => { setTag(''); setExpandedCategories(new Set(topicTree.map((c) => c.category))); }}
                className="text-[10px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View all
              </button>
            </div>
            <div className="space-y-0.5">
              {topicTree.length === 0 ? (
                [80, 64, 72, 56, 48].map((w, i) => (
                  <div key={i} style={{ width: `${w}%` }} className="h-7 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                ))
              ) : (
                topicTree.map((cat) => {
                  const dotColor = CATEGORY_COLORS[cat.category] ?? 'bg-slate-400';
                  const count = categoryCounts.get(cat.category) ?? 0;
                  const isExpanded = expandedCategories.has(cat.category);
                  return (
                    <div key={cat.category}>
                      <button
                        type="button"
                        onClick={() => {
                          setTag('');
                          setExpandedCategories((prev) => {
                            const next = new Set(prev);
                            if (next.has(cat.category)) next.delete(cat.category); else next.add(cat.category);
                            return next;
                          });
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                        <span className="flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-300">{cat.category}</span>
                        <span className="shrink-0 text-xs font-semibold text-slate-400 dark:text-slate-500">{count}</span>
                        <ChevronDown className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-100 pl-3 dark:border-slate-700">
                          {cat.topics.map((topic) => {
                            const topicCount = topicCounts.get(topic.name) ?? 0;
                            const isActive = tag === topic.name;
                            return (
                              <button
                                key={topic.name}
                                type="button"
                                onClick={() => setTag(isActive ? '' : topic.name)}
                                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                                  isActive
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                              >
                                {topic.is_starred && <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400" />}
                                <span className="flex-1 truncate text-xs">{topic.name}</span>
                                <span className={`shrink-0 text-[10px] font-semibold ${isActive ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{topicCount}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Popular Topics */}
          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              POPULAR TOPICS
            </p>
            <div className="space-y-0.5">
              {popularTopics.map(([topicName, count]) => {
                const dotColor = topicColorMap.get(topicName) ?? 'bg-slate-400';
                const active = tag.toLowerCase() === topicName.toLowerCase();
                return (
                  <button
                    key={topicName}
                    type="button"
                    onClick={() => setTag(active ? '' : topicName)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                    <span className="flex-1 truncate text-sm">{topicName}</span>
                    <span className={`shrink-0 text-xs font-semibold ${active ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keep Going! widget */}
          <div className="mx-3 mb-4 mt-auto rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:from-indigo-900/20 dark:to-violet-900/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🔥</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Keep Going!</p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              You&apos;re doing great!<br />
              Small starts create big results.
            </p>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/60 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {solved.total} / {totals.all} problems
              </span>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{overallPct}%</span>
            </div>
          </div>
        </aside>

        {/* ── Main area ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Top bar */}
          <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-700/60 dark:bg-slate-900">
            {/* Global search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search problems, topics, or companies..."
                value={topbarSearch}
                onChange={(e) => setTopbarSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              {topbarSearch && (
                <button type="button" onClick={() => setTopbarSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Dark mode toggle */}
              <button type="button" onClick={() => setDark((d) => !d)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

            </div>
          </header>

          {/* Body row */}
          <div className="flex flex-1 overflow-hidden">

            {/* ── Scrollable main content ──────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">

              {/* Tabs */}
              <div className="mx-5 mt-4 flex items-end border-b border-slate-200 dark:border-slate-700/60 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex shrink-0 items-center gap-1.5 pb-3 pr-5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.value
                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content area */}
              <div className="px-5 pb-8 pt-4">

                {/* Search + filter row */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {/* Inline search */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search problems by name or tag..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Status pills */}
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
                    {STATUS_FILTERS.map((sf) => (
                      <button key={sf.value} type="button" onClick={() => setStatusFilter(sf.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          statusFilter === sf.value
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}>
                        {sf.label}
                      </button>
                    ))}
                  </div>

                  {/* Language */}
                  <div className="relative" ref={langDropRef}>
                    <button type="button" onClick={() => setLangDropOpen((o) => !o)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <span>{currentLangFlag}</span>
                      {currentLangLabel}
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${langDropOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {langDropOpen && (
                      <div className="absolute left-0 top-full z-30 mt-1 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                        {LANGUAGES.map((l) => (
                          <button key={l.value} type="button"
                            onClick={() => { setLanguage(l.value); setLangDropOpen(false); }}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                              language === l.value ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                            {l.label}
                            {language === l.value && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Topics dropdown */}
                  <div className="relative" ref={topicDropRef}>
                    <button type="button" onClick={() => setTopicDropOpen((o) => !o)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {tag || 'All Topics'}
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${topicDropOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {topicDropOpen && (
                      <div className="absolute left-0 top-full z-30 mt-1 max-h-56 w-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                        <button type="button" onClick={() => { setTag(''); setTopicDropOpen(false); }}
                          className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${!tag ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          All Topics
                        </button>
                        {Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1]).map(([t, c]) => (
                          <button key={t} type="button" onClick={() => { setTag(t); setTopicDropOpen(false); }}
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${tag.toLowerCase() === t.toLowerCase() ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {t}
                            <span className="text-xs text-slate-400">{c}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Difficulty pills */}
                  {(['easy', 'medium', 'hard'] as CodingTestDifficulty[]).map((d) => {
                    const active = difficulties.has(d);
                    return (
                      <button key={d} type="button"
                        onClick={() => setDifficulties((prev) => {
                          const next = new Set(prev);
                          if (next.has(d)) next.delete(d); else next.add(d);
                          return next;
                        })}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-all ${
                          active
                            ? d === 'easy' ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400' :
                              d === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400' :
                              'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-400'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    );
                  })}

                  {/* More Filters */}
                  <button type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    <ListFilter className="h-3.5 w-3.5" />
                    More Filters
                  </button>

                  {/* Spacer */}
                  <div className="ml-auto flex items-center gap-2">
                    {/* View mode */}
                    <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
                      <button type="button" onClick={() => setViewMode('list')}
                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-white dark:bg-slate-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <LayoutList className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setViewMode('grid')}
                        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-white dark:bg-slate-600' : 'text-slate-400 hover:text-slate-600'}`}>
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Sort */}
                    <div className="relative" ref={sortDropRef}>
                      <button type="button" onClick={() => setSortDropOpen((o) => !o)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        Sort by: <span className="font-semibold">{SORT_LABELS[sortBy]}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sortDropOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {sortDropOpen && (
                        <div className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          {(Object.keys(SORT_LABELS) as SortBy[]).map((s) => (
                            <button key={s} type="button" onClick={() => { setSortBy(s); setSortDropOpen(false); }}
                              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${sortBy === s ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {SORT_LABELS[s]}
                              {sortBy === s && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active filters chips */}
                {(tag || difficulties.size > 0) && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {tag && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800">
                        {tag}
                        <button type="button" onClick={() => setTag('')} className="ml-0.5 hover:text-indigo-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {Array.from(difficulties).map((d) => (
                      <span key={d} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ring-inset ${DIFF_BADGE[d]}`}>
                        {d}
                        <button type="button" onClick={() => setDifficulties((prev) => { const n = new Set(prev); n.delete(d); return n; })}
                          className="ml-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Results count */}
                {state === 'ready' && (
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{filtered.length}</span> problems found
                    </p>
                    {filtered.length > PAGE_SIZE && (
                      <span className="text-xs text-slate-400">
                        Page {page} of {totalPages}
                      </span>
                    )}
                  </div>
                )}

                {/* States */}
                {state === 'loading' && <ListSkeleton />}

                {state === 'error' && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/40 dark:bg-rose-900/10">
                    <AlertCircle className="h-8 w-8 text-rose-500" />
                    <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{errorMessage}</p>
                    <button type="button" onClick={() => setReloadKey((k) => k + 1)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700">
                      <RotateCw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                )}

                {state === 'ready' && filtered.length === 0 && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
                    <SearchX className="h-8 w-8 text-slate-400" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No problems match these filters.</p>
                    <button type="button"
                      onClick={() => { setStatusFilter('all'); setDifficulties(new Set()); setTag(''); setSearch(''); setTopbarSearch(''); }}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                      Clear all filters
                    </button>
                  </div>
                )}

                {/* Problem list */}
                {state === 'ready' && filtered.length > 0 && viewMode === 'list' && (
                  <>
                    <ul className="space-y-1.5">
                      {visible.map((p, idx) => (
                        <li key={p.slug}>
                          <div className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-indigo-700/60">
                            {/* Status icon */}
                            <StatusIcon status={p.user_status} />

                            {/* Problem number */}
                            <span className="w-7 shrink-0 text-right text-sm font-mono text-slate-400 dark:text-slate-500">
                              {(page - 1) * PAGE_SIZE + idx + 1}.
                            </span>

                            {/* Title + tags */}
                            <Link
                              href={language ? `/coding-test/${p.slug}?language=${language}` : `/coding-test/${p.slug}`}
                              onClick={handleProblemClick(p.slug, language || undefined)}
                              className="flex min-w-0 flex-1 flex-col"
                            >
                              <h3 className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-400">
                                {p.title}
                              </h3>
                              {p.tag && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                    {p.tag}
                                  </span>
                                </div>
                              )}
                            </Link>

                            {/* Acceptance */}
                            <div className="hidden shrink-0 items-center gap-1 sm:flex">
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">—</span>
                            </div>

                            {/* Difficulty badge */}
                            <span className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${DIFF_BADGE[p.difficulty]}`}>
                              {p.difficulty}
                            </span>

                            {/* Bookmark */}
                            <button type="button"
                              onClick={() => toggleBookmark(p.slug)}
                              className={`shrink-0 transition-colors ${bookmarked.has(p.slug) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300 dark:text-slate-700 dark:hover:text-amber-400'}`}>
                              <Bookmark className={`h-4 w-4 ${bookmarked.has(p.slug) ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-5 flex items-center justify-between">
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-indigo-300 hover:enabled:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = i + 1;
                            return (
                              <button key={p} type="button" onClick={() => setPage(p)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'}`}>
                                {p}
                              </button>
                            );
                          })}
                        </div>
                        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:border-indigo-300 hover:enabled:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Grid view */}
                {state === 'ready' && filtered.length > 0 && viewMode === 'grid' && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {visible.map((p) => (
                        <Link key={p.slug}
                          href={language ? `/coding-test/${p.slug}?language=${language}` : `/coding-test/${p.slug}`}
                          onClick={handleProblemClick(p.slug, language || undefined)}
                          className="group flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-indigo-700/60">
                          <div className="flex items-start justify-between gap-2">
                            <StatusIcon status={p.user_status} />
                            <button type="button" onClick={(e) => { e.preventDefault(); toggleBookmark(p.slug); }}
                              className={`shrink-0 transition-colors ${bookmarked.has(p.slug) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300 dark:text-slate-700 dark:hover:text-amber-400'}`}>
                              <Bookmark className={`h-4 w-4 ${bookmarked.has(p.slug) ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-400 line-clamp-2">
                            {p.title}
                          </h3>
                          <div className="mt-auto flex items-center justify-between">
                            {p.tag && (
                              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                {p.tag}
                              </span>
                            )}
                            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${DIFF_BADGE[p.difficulty]}`}>
                              {p.difficulty}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-5 flex items-center justify-center gap-1">
                        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-40 hover:enabled:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          <ChevronLeft className="h-4 w-4" /> Prev
                        </button>
                        <span className="px-4 text-sm text-slate-500">{page} / {totalPages}</span>
                        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:opacity-40 hover:enabled:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          Next <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Right sidebar ────────────────────────────────────────── */}
            <aside className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white px-4 py-5 dark:border-slate-700/60 dark:bg-slate-900 xl:flex xl:flex-col xl:gap-5">

              {/* Your Progress */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Your Progress</p>
                  <Link href="/coding-test/history" className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    View Details →
                  </Link>
                </div>

                <div className="flex justify-center mb-3">
                  <ProgressDonut pct={overallPct} size={110} label="solved" />
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Easy', solved: solved.easy, total: totals.easy, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Medium', solved: solved.medium, total: totals.medium, color: 'text-amber-500 dark:text-amber-400' },
                    { label: 'Hard', solved: solved.hard, total: totals.hard, color: 'text-rose-500 dark:text-rose-400' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className={`w-14 shrink-0 text-xs font-semibold ${row.color}`}>{row.label}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" style={{ height: 5 }}>
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${row.label === 'Easy' ? 'bg-emerald-500' : row.label === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: row.total > 0 ? `${(row.solved / row.total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400">
                        {row.solved}<span className="font-normal text-slate-400">/{row.total}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Access */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Quick Access</p>
                <div className="space-y-2">
                  {[
                    { icon: Shuffle, label: 'Random Problem', desc: 'Try a random problem', href: '/coding-test/problems', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
                    { icon: LayoutGrid, label: 'Topic-Wise Practice', desc: 'Focus on a specific topic', href: '/coding-test/problems', color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
                    { icon: Briefcase, label: 'Company Questions', desc: 'Practice interview questions', href: '/coding-test/problems', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
                    { icon: Calendar, label: 'Daily Challenge', desc: 'Solve 1 problem daily', href: '/coding-test/problems', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
                  ].map((item) => (
                    <Link key={item.label} href={item.href}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-indigo-200 hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-indigo-700/60">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{item.desc}</p>
                      </div>
                      <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recommended Topics */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recommended Topics</p>
                  <button type="button" className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    View all →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {recommendedTopics.map((t) => {
                    const dotColor = topicColorMap.get(t.name) ?? 'bg-slate-400';
                    return (
                      <button key={t.name} type="button" onClick={() => setTag(t.name)}
                        className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-indigo-200 hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-indigo-700/60">
                        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{t.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{t.count} problems</p>
                      </button>
                    );
                  })}
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
