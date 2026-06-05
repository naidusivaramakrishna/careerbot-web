'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Target, ChevronRight, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import HighlightBox from './_components/HighlightBox';
import { motion } from 'framer-motion';
import {
  getMockTestCompanies,
  getActiveSession,
  getLeaderboard,
  getProgressAnalytics,
  getWeakAreasAnalytics,
  getMockTestHistory,
  ActiveSession,
  Leaderboard,
  ProgressAnalytics,
  WeakAreasAnalytics,
  HistoryRecord,
} from '@/api/mockTestApi';
import { resolveCompanyInfo } from '@/lib/mockTestConstants';

function formatRelTime(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return `${wk} wk${wk === 1 ? '' : 's'} ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

interface MockTest {
  id: string;
  company: string;
  logoPath: string;
  initials: string;
  color: string;
  categories: string[];
  questions: number;
  duration: number;
  sections: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  attempts: number;
  tier: 1 | 2;
  yourBest?: number;
}

const TIER_MAP: Record<string, 1 | 2> = {
  tcs: 1, infosys: 1, cognizant: 1, accenture: 1, wipro: 2, capgemini: 2,
};

const ATTEMPTS_DISPLAY: Record<string, string> = {
  tcs: '2.1k', infosys: '1.8k', cognizant: '1.4k', accenture: '1.1k', wipro: '300', capgemini: '70k',
};

const fallbackTests: MockTest[] = [
  { id: 'tcs',       company: 'TCS NQT',            logoPath: '/assets/company_logos/Tata_Consultancy_Services.svg', initials: 'TCS', color: '#003366', categories: ['ARITH','APT','REAS','TECH'], questions: 40, duration: 80, sections: 4, difficulty: 'Hard',   attempts: 2100, tier: 1 },
  { id: 'infosys',   company: 'Infosys',            logoPath: '/assets/company_logos/infosys.svg',                  initials: 'INF', color: '#007cc2', categories: ['ARITH','APT','READ','TECH'], questions: 40, duration: 80, sections: 4, difficulty: 'Medium', attempts: 1800, tier: 1 },
  { id: 'cognizant', company: 'Cognizant GenC',     logoPath: '/assets/company_logos/cognizant.svg',                initials: 'COG', color: '#1a4398', categories: ['ARITH','APT','READ','TECH'], questions: 40, duration: 80, sections: 4, difficulty: 'Medium', attempts: 1400, tier: 1 },
  { id: 'accenture', company: 'Accenture',          logoPath: '/assets/company_logos/Accenture-Logo.wine.svg',      initials: 'ACC', color: '#a100ff', categories: ['ARITH','APT','REAS','TECH'], questions: 40, duration: 80, sections: 4, difficulty: 'Medium', attempts: 1100, tier: 1 },
  { id: 'wipro',     company: 'Wipro NLTH',         logoPath: '/assets/company_logos/wipro-1.svg',                  initials: 'WIP', color: '#341c5c', categories: ['ARITH','APT','READ','TECH'], questions: 40, duration: 80, sections: 4, difficulty: 'Easy',   attempts: 300,  tier: 2 },
  { id: 'capgemini', company: 'Capgemini Exceller', logoPath: '/assets/company_logos/capgemini.png',                initials: 'CAP', color: '#0070ad', categories: ['ARITH','APT','REAS','TECH'], questions: 40, duration: 80, sections: 4, difficulty: 'Medium', attempts: 700,  tier: 2 },
];

// Brand palette — solid colors, no gradients.
// blue-700  #1e3a8a  → headings / button backgrounds
// gray-700  #2d2d2d  → body text
// black             → sub-headings, section names, button text on light surfaces
const BRAND_BLUE = '#1e3a8a';

function fmtAttempts(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

// Convert a hex color to rgba with given alpha
function toRGBA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-14 w-full rounded-md" style={{ background: '#F8FAFC' }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 240, H = 56;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 12) - 6;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const fillPts = `0,${H} ${pts.join(' ')} ${W},${H}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#sparkFill)" />
      <polyline points={pts.join(' ')} fill="none" stroke="url(#sparkStroke)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3.25" fill="#1e3a8a" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export default function MockTestPage() {
  const router = useRouter();
  const [tests, setTests]                 = useState<MockTest[]>(fallbackTests);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [leaderboard, setLeaderboard]     = useState<Leaderboard | null>(null);
  const [analytics, setAnalytics]         = useState<ProgressAnalytics | null>(null);
  const [weakAreas, setWeakAreas]         = useState<WeakAreasAnalytics | null>(null);
  const [history, setHistory]             = useState<HistoryRecord[]>([]);

  useEffect(() => {
    getMockTestCompanies()
      .then((companies: any[]) => {
        const mapped: MockTest[] = companies.map((c: any) => {
          const id   = c.company_id || c.id;
          const name = c.company_name || c.name;
          const rawSections = Array.isArray(c.sections) ? c.sections : [];
          const cats = rawSections.length > 0
            ? rawSections.map((s: any) => s.section_name.slice(0, 4).toUpperCase())
            : ['ARITH', 'APT', 'REAS', 'TECH'];
          const info = resolveCompanyInfo(id);
          return {
            id, company: name,
            logoPath: info.logoPath, initials: info.initials, color: info.color,
            categories: cats,
            questions: 40,
            duration:  80,
            sections:  4,
            difficulty: c.difficulty ?? 'Medium',
            attempts: c.attempts ?? c.total_attempts ?? 0,
            tier: TIER_MAP[id] ?? 1,
          };
        });
        if (mapped.length > 0) setTests(mapped);
      })
      .catch(() => {});

    getLeaderboard().then(setLeaderboard).catch(() => {});
    getProgressAnalytics().then(setAnalytics).catch(() => {});
    getWeakAreasAnalytics().then(setWeakAreas).catch(() => {});
    getActiveSession().then(s => s ? setActiveSession(s) : null).catch(() => {});
    getMockTestHistory().then(setHistory).catch(() => {});
  }, []);

  const activeTestName = activeSession?.company_id
    ? (tests.find(t => t.id === activeSession.company_id)?.company ?? 'Test')
    : 'Test';

  const topEntries = (leaderboard?.entries ?? []).slice(0, 4);
  const yourRank   = leaderboard?.your_rank;

  const recentAttempts = history.slice(0, 8).slice().reverse();
  const sparkValues: number[] | null = recentAttempts.length > 0 ? recentAttempts.map(r => r.accuracy) : null;
  const sparkOldestLabel = recentAttempts.length > 0 ? formatRelTime(recentAttempts[0].submitted_at) : '';

  const avgPct = analytics?.average_accuracy != null
    ? `${Math.round(analytics.average_accuracy)}%`
    : analytics?.average_score != null
      ? `${Math.round(analytics.average_score)}%`
      : '—';

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-16">

        {/* Breadcrumb — same shape as section intro */}
        <div className="mb-6 text-sm flex items-center gap-2">
          <span className="font-semibold" style={{ color: '#0F172A' }}>Mock Tests</span>
        </div>

        {/* Hero card — section-intro DNA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border p-8 md:p-10 mb-6"
          style={{
            borderColor: '#E5E7EB',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)',
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                The smarter way to prep for placements
              </h2>
              <p className="text-sm max-w-xl leading-relaxed" style={{ color: '#64748B' }}>
                Pick a company simulator or build your own custom test. Exam-grade timing,
                AI-generated questions, and per-section scoring — so you walk in knowing how it feels.
              </p>
            </div>
          </div>

          <HighlightBox>
            <p className="text-sm leading-relaxed" style={{ color: '#2d2d2d' }}>
              <span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{tests.length} companies</span> ·{' '}
              <span className="font-bold tabular-nums" style={{ color: '#1e3a8a' }}>80 min</span> per test ·{' '}
              <span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>40 questions</span> across 4 sections
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {activeSession && (
                <button
                  onClick={() => router.push(`/mock-test/${activeSession.company_id ?? 'custom'}`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition hover:bg-white"
                  style={{ border: '1px solid #1e3a8a', color: '#1e3a8a' }}
                >
                  Resume — {activeTestName}
                  <ChevronRight size={14} />
                </button>
              )}
              <button
                onClick={() => router.push('/mock-test/custom')}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(30,58,138,0.5)]"
                style={{ background: '#1e3a8a', boxShadow: '0 4px 14px -4px rgba(30,58,138,0.35)' }}
              >
                <Zap size={14} className="transition-transform group-hover:rotate-12" />
                Custom build
              </button>
            </div>
          </HighlightBox>
        </motion.div>

        {/* ── Body grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── Company cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tests.map((test, i) => {
              const isActive = activeSession?.company_id === test.id;
              const attStr   = test.attempts > 0 ? fmtAttempts(test.attempts) : (ATTEMPTS_DISPLAY[test.id] ?? '—');
              const diffMeta = test.difficulty === 'Hard'
                ? { c: '#DC2626', bg: '#FEF2F2', border: '#FECACA' }
                : test.difficulty === 'Easy'
                  ? { c: '#059669', bg: '#ECFDF5', border: '#A7F3D0' }
                  : { c: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  onClick={() => router.push(`/mock-test/company/${test.id}`)}
                  className="group relative bg-white rounded-2xl cursor-pointer overflow-hidden transition-all duration-300"
                  style={{
                    border: '1px solid rgba(15,23,42,0.07)',
                    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                  }}
                  whileHover={{ y: -4, boxShadow: `0 16px 40px -16px ${toRGBA(test.color, 0.35)}, 0 4px 14px -4px rgba(15,23,42,0.08)` }}
                >
                  {/* Top accent: gradient using company color */}
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, ${test.color} 0%, ${toRGBA(test.color, 0.4)} 100%)` }}
                  />
                  {/* Subtle company-color tint at top */}
                  <div
                    className="absolute inset-x-0 top-0 h-32 pointer-events-none"
                    style={{ background: `linear-gradient(180deg, ${toRGBA(test.color, 0.05)} 0%, transparent 100%)` }}
                  />

                  <div className="relative p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                          style={{
                            background: '#fff',
                            border: `1px solid ${toRGBA(test.color, 0.2)}`,
                            boxShadow: `0 1px 2px ${toRGBA(test.color, 0.1)}`,
                          }}
                        >
                          {test.logoPath ? (
                            <img
                              src={test.logoPath}
                              alt={test.company}
                              className="w-full h-full object-contain p-1.5"
                              onError={e => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                                const p = e.currentTarget.parentElement as HTMLElement;
                                p.style.background = test.color;
                                const s = document.createElement('span');
                                s.style.cssText = 'color:white;font-weight:700;font-size:13px';
                                s.textContent = test.initials;
                                p.replaceChildren(s);
                              }}
                            />
                          ) : (
                            <span className="font-bold text-sm text-white">{test.initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold leading-tight truncate tracking-tight" style={{ color: '#0F172A', letterSpacing: '-0.01em' }}>
                            {test.company}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: test.color, background: toRGBA(test.color, 0.08) }}>
                              TIER {test.tier}
                            </span>
                            <span className="text-xs" style={{ color: '#94A3B8' }}>
                              {attStr} attempts
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-semibold px-2 py-1 rounded-md shrink-0 border"
                        style={{ color: diffMeta.c, background: diffMeta.bg, borderColor: diffMeta.border }}
                      >
                        {test.difficulty}
                      </span>
                    </div>

                    {/* Stats — inline pills */}
                    <div
                      className="flex items-stretch rounded-xl overflow-hidden mb-4"
                      style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}
                    >
                      {[
                        { label: 'Questions', val: String(test.questions) },
                        { label: 'Minutes',   val: String(test.duration) },
                        { label: 'Sections',  val: String(test.sections) },
                        { label: 'Best',      val: test.yourBest != null ? String(test.yourBest) : '—', accent: test.yourBest != null },
                      ].map(({ label, val, accent }, idx, arr) => (
                        <div
                          key={label}
                          className="flex-1 text-center py-3 px-2"
                          style={{ borderRight: idx < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}
                        >
                          <p
                            className="text-[15px] font-bold tabular-nums"
                            style={{ color: accent ? '#10B981' : '#0F172A' }}
                          >
                            {val}
                          </p>
                          <p className="text-[10px] mt-0.5 font-medium uppercase tracking-[0.06em]" style={{ color: '#94A3B8' }}>
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Section dots */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {['Arithmetic', 'Aptitude', 'Reasoning', 'Technical'].map(name => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: '#F1F5F9', color: '#000' }}
                        >
                          <span className="w-1 h-1 rounded-full" style={{ background: test.color }} />
                          {name}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#94A3B8' }}>
                        {isActive ? 'Active session' : 'Click to begin'}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); router.push(`/mock-test/company/${test.id}`); }}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all group-hover:translate-x-0.5"
                        style={{
                          background: BRAND_BLUE,
                          boxShadow: '0 2px 8px -2px rgba(30,58,138,0.35)',
                        }}
                      >
                        {isActive ? 'Resume' : 'Start'}
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Right sidebar ──────────────────────────────────────── */}
          <aside className="space-y-4">

            {/* Progress sparkline */}
            {sparkValues && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-5"
                style={{ border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#64748B' }}>Progress</p>
                  <p className="text-[10px]" style={{ color: '#94A3B8' }}>
                    Last {recentAttempts.length} attempt{recentAttempts.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Sparkline values={sparkValues} />
                <div className="flex justify-between mt-2 text-[10px]" style={{ color: '#94A3B8' }}>
                  <span>{sparkOldestLabel}</span>
                  <span>Now</span>
                </div>
              </motion.div>
            )}

            {/* Your stats */}
            {analytics && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-5"
                style={{ border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-4" style={{ color: '#64748B' }}>Your stats</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#94A3B8' }}>Tests</p>
                    <p className="text-[22px] font-bold tabular-nums mt-0.5 tracking-tight" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                      {analytics.total_tests ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#94A3B8' }}>Avg accuracy</p>
                    <p
                      className="text-[22px] font-bold tabular-nums mt-0.5 tracking-tight"
                      style={{
                        background: BRAND_BLUE,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {avgPct}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#94A3B8' }}>Best score</p>
                    <p className="text-[22px] font-bold tabular-nums mt-0.5 tracking-tight" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                      {analytics.best_score ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: '#94A3B8' }}>Trend</p>
                    <p
                      className="text-[18px] font-bold mt-0.5 flex items-center gap-1.5 tracking-tight"
                      style={{
                        color: analytics.improvement_trend === 'improving'
                          ? '#10B981'
                          : analytics.improvement_trend === 'declining'
                            ? '#DC2626'
                            : '#475569',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {analytics.improvement_trend === 'improving' && (<><TrendingUp size={16} /> Up</>)}
                      {analytics.improvement_trend === 'declining' && (<><TrendingDown size={16} /> Down</>)}
                      {(!analytics.improvement_trend || analytics.improvement_trend === 'stable') && 'Stable'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5"
              style={{ border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <Trophy size={13} style={{ color: '#D97706' }} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#64748B' }}>Top this week</p>
                </div>
                {yourRank != null && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#EEF2FF', color: '#4F46E5' }}
                  >
                    You · #{yourRank}
                  </span>
                )}
              </div>
              {topEntries.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: '#94A3B8' }}>Be the first on the board this week.</p>
              ) : (
                <div className="space-y-3">
                  {topEntries.map((entry, i) => {
                    const isYou = entry.name === 'You';
                    const medalBg = i === 0
                      ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                      : i === 1
                        ? 'linear-gradient(135deg, #94A3B8, #64748B)'
                        : i === 2
                          ? 'linear-gradient(135deg, #B45309, #92400E)'
                          : '#F1F5F9';
                    const medalColor = i < 3 ? '#fff' : '#94A3B8';
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span
                          className="text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-md tabular-nums shrink-0"
                          style={{ background: medalBg, color: medalColor }}
                        >
                          {i + 1}
                        </span>
                        <span
                          className="text-xs flex-1 truncate"
                          style={{ color: isYou ? '#4F46E5' : '#0F172A', fontWeight: isYou ? 600 : 500 }}
                        >
                          {entry.name}
                        </span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: '#0F172A' }}>
                          {entry.accuracy != null ? `${entry.accuracy}%` : (entry.score ?? '—')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Focus areas */}
            {weakAreas && weakAreas.weak_areas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-5"
                style={{ border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <Target size={13} style={{ color: '#DC2626' }} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#64748B' }}>Focus areas</p>
                  </div>
                  <button
                    onClick={() => router.push('/mock-test/weak-areas')}
                    className="text-[11px] font-semibold transition-colors hover:opacity-80"
                    style={{ color: '#4F46E5' }}
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-3.5">
                  {weakAreas.weak_areas.slice(0, 4).map((area, i) => {
                    const grad = area.accuracy < 45
                      ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                      : area.accuracy < 58
                        ? 'linear-gradient(90deg, #F97316, #EA580C)'
                        : 'linear-gradient(90deg, #F59E0B, #D97706)';
                    const textColor = area.accuracy < 45 ? '#DC2626' : area.accuracy < 58 ? '#EA580C' : '#D97706';
                    return (
                      <div key={i}>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs font-medium truncate max-w-[75%]" style={{ color: '#0F172A' }}>{area.topic}</span>
                          <span className="text-xs font-bold tabular-nums" style={{ color: textColor }}>{area.accuracy}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(area.accuracy, 4)}%` }}
                            transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                            className="h-full rounded-full"
                            style={{ background: grad }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </aside>
        </div>
      </div>
    </div>
  );
}
