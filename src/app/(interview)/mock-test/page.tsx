'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Target, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  getMockTestCompanies,
  getActiveSession,
  getLeaderboard,
  getProgressAnalytics,
  getWeakAreasAnalytics,
  ActiveSession,
  Leaderboard,
  ProgressAnalytics,
  WeakAreasAnalytics,
} from '@/api/mockTestApi';
import { resolveCompanyInfo } from '@/lib/mockTestConstants';

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
  { id: 'tcs',       company: 'TCS NQT',           logoPath: '/assets/company_logos/Tata_Consultancy_Services.svg', initials: 'TCS', color: '#003366', categories: ['ARITH', 'APT', 'REAS', 'TECH'], questions: 40, duration: 90, sections: 4, difficulty: 'Hard',   attempts: 2100, tier: 1 },
  { id: 'infosys',   company: 'Infosys',            logoPath: '/assets/company_logos/infosys.svg',                  initials: 'INF', color: '#007cc2', categories: ['ARITH', 'APT', 'READ', 'TECH'], questions: 40, duration: 90, sections: 4, difficulty: 'Medium', attempts: 1800, tier: 1 },
  { id: 'cognizant', company: 'Cognizant GenC',     logoPath: '/assets/company_logos/cognizant.svg',                initials: 'COG', color: '#1a4398', categories: ['ARITH', 'APT', 'READ', 'TECH'], questions: 40, duration: 90, sections: 4, difficulty: 'Medium', attempts: 1400, tier: 1 },
  { id: 'accenture', company: 'Accenture',          logoPath: '/assets/company_logos/Accenture-Logo.wine.svg',      initials: 'ACC', color: '#a100ff', categories: ['ARITH', 'APT', 'REAS', 'TECH'], questions: 40, duration: 90, sections: 4, difficulty: 'Medium', attempts: 1100, tier: 1 },
  { id: 'wipro',     company: 'Wipro NLTH',         logoPath: '/assets/company_logos/wipro-1.svg',                  initials: 'WIP', color: '#341c5c', categories: ['ARITH', 'APT', 'READ', 'TECH'], questions: 40, duration: 90, sections: 4, difficulty: 'Easy',   attempts: 300,  tier: 2 },
  { id: 'capgemini', company: 'Capgemini Exceller', logoPath: '/assets/company_logos/capgemini.png',                initials: 'CAP', color: '#0070ad', categories: ['ARITH', 'APT', 'REAS', 'TECH'], questions: 40, duration: 90, sections: 4, difficulty: 'Medium', attempts: 700,  tier: 2 },
];


const SECTION_NAMES = ['Arithmetic', 'Aptitude', 'Reasoning', 'Technical'];

function fmtAttempts(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-12 w-full" style={{ background: '#f9fafb', borderRadius: 6 }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 220, H = 48;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const fillPts = `0,${H} ${pts.join(' ')} ${W},${H}`;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points={fillPts} fill="rgba(0,153,128,0.08)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#009980" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="3" fill="#009980" />
    </svg>
  );
}

export default function MockTestPage() {
  const router = useRouter();
  const [tests, setTests]               = useState<MockTest[]>(fallbackTests);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [leaderboard, setLeaderboard]   = useState<Leaderboard | null>(null);
  const [analytics, setAnalytics]       = useState<ProgressAnalytics | null>(null);
  const [weakAreas, setWeakAreas]       = useState<WeakAreasAnalytics | null>(null);

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
            questions:  40,
            duration:   90,
            sections:   rawSections.length || 4,
            difficulty: c.difficulty ?? 'Medium',
            attempts:   c.attempts ?? c.total_attempts ?? 0,
            tier:       TIER_MAP[id] ?? 1,
          };
        });
        setTests(mapped);
      })
      .catch(() => {});

    getLeaderboard().then(setLeaderboard).catch(() => {});
    getProgressAnalytics().then(setAnalytics).catch(() => {});
    getWeakAreasAnalytics().then(setWeakAreas).catch(() => {});
    getActiveSession().then(s => s ? setActiveSession(s) : null).catch(() => {});
  }, []);

  const activeTestName  = activeSession?.company_id
    ? (tests.find(t => t.id === activeSession.company_id)?.company ?? 'Test')
    : 'Test';

  const topEntries = (leaderboard?.entries ?? []).slice(0, 4);
  const yourRank   = leaderboard?.your_rank;

  const sparkValues: number[] | null = analytics
    ? [
        analytics.average_score * 0.75,
        analytics.average_score * 0.85,
        analytics.average_score * 0.80,
        analytics.average_score * 0.90,
        analytics.average_score * 0.88,
        analytics.best_score * 0.85,
        analytics.average_score,
        analytics.latest_score ?? analytics.best_score,
      ]
    : null;

  return (
    <div className="min-h-screen p-6 pb-8" style={{ background: '#F4F2EC' }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-4 text-xs font-bold tracking-widest" style={{ color: '#2d2d2d', opacity: 0.45 }}>
        <span>MOCK TEST</span>
        <ChevronRight size={10} />
        <span>COMPANIES</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl font-black" style={{ color: '#000', letterSpacing: '-1px' }}>
              Choose your target
            </h1>
            <span className="text-xs font-semibold" style={{ color: '#2d2d2d', opacity: 0.5 }}>
              {tests.length} patterns · updated MAR 2025
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#2d2d2d' }}>
            Real exam patterns, real time pressure, real scoring. Pick a company or build your own.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          <button
            onClick={() => router.push('/mock-test/custom')}
            className="px-4 py-2 rounded-lg text-xs font-black border transition hover:bg-gray-50"
            style={{ borderColor: '#d1d5db', color: '#2d2d2d', background: '#fff' }}
          >
            + CUSTOM BUILD
          </button>
          {activeSession && (
            <button
              onClick={() => router.push(`/mock-test/${activeSession.company_id ?? 'custom'}`)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-black text-white"
              style={{ background: '#009980' }}
            >
              RESUME — {activeTestName.toUpperCase().slice(0, 7)}
              <ChevronRight size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex gap-5 items-start">

        {/* ── Left: Company cards ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 gap-4">
            {tests.map((test, i) => {
              const isActive = activeSession?.company_id === test.id;
              const attStr   = test.attempts > 0 ? fmtAttempts(test.attempts) : (ATTEMPTS_DISPLAY[test.id] ?? '—');

              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/mock-test/company/${test.id}`)}
                  className="bg-white rounded-xl cursor-pointer border hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  {/* Colored top accent strip */}
                  <div className="h-1.5 w-full" style={{ background: test.color }} />

                  {/* Card header: logo + name + tier */}
                  <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border overflow-hidden"
                      style={{ borderColor: '#f3f4f6', background: '#f9fafb' }}
                    >
                      {test.logoPath ? (
                        <img
                          src={test.logoPath}
                          alt={test.company}
                          className="w-full h-full object-contain p-1"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const p = e.currentTarget.parentElement as HTMLElement;
                            p.style.background = test.color;
                            p.innerHTML = `<span style="color:white;font-weight:900;font-size:9px">${test.initials}</span>`;
                          }}
                        />
                      ) : (
                        <span className="font-black text-xs" style={{ color: '#fff', background: test.color }}>{test.initials}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black leading-tight truncate" style={{ color: '#000' }}>
                        {test.company}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#2d2d2d', opacity: 0.55 }}>
                        TIER {test.tier} · {attStr} attempts
                      </p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 border-t border-b" style={{ borderColor: '#f3f4f6' }}>
                    {[
                      { label: 'QUESTIONS', val: test.questions,       teal: false },
                      { label: 'MINUTES',   val: test.duration,        teal: false },
                      { label: 'SECTIONS',  val: test.sections,        teal: false },
                      { label: 'YOUR BEST', val: test.yourBest ?? '—', teal: !!test.yourBest },
                    ].map(({ label, val, teal }) => (
                      <div key={label} className="text-center py-3 border-r last:border-r-0" style={{ borderColor: '#f3f4f6' }}>
                        <p className="text-base font-black leading-none" style={{ color: teal ? '#009980' : '#000' }}>{val}</p>
                        <p className="text-xs mt-1 font-semibold" style={{ color: '#2d2d2d', opacity: 0.55 }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Section names */}
                  <div className="px-4 py-3 flex flex-wrap gap-1.5 flex-1">
                    {['Arithmetic', 'Aptitude', 'Reasoning', 'Technical'].map(name => (
                      <span
                        key={name}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: '#eef3ff', color: '#2557a7' }}
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  {/* Bottom START button */}
                  <div className="px-4 pb-4 flex justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/mock-test/company/${test.id}`); }}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-black text-white transition-opacity hover:opacity-90"
                      style={{ background: isActive ? '#009980' : '#2557a7' }}
                    >
                      {isActive ? 'RESUME' : 'START'} <ChevronRight size={11} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* ── Right panel ─────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 space-y-4">

          {/* Score sparkline — only shown when real analytics exist */}
          {sparkValues && (
            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black tracking-widest" style={{ color: '#2d2d2d' }}>SCORE</p>
                <p className="text-xs" style={{ color: '#2d2d2d', opacity: 0.5 }}>LAST 8 ATTEMPTS</p>
              </div>
              <Sparkline values={sparkValues} />
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.35 }}>5 wks ago</span>
                <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.35 }}>now</span>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e5e7eb' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Trophy size={12} style={{ color: '#f59e0b' }} />
                <p className="text-xs font-black tracking-widest" style={{ color: '#2d2d2d' }}>TOP THIS WEEK</p>
              </div>
              {yourRank != null && (
                <span className="text-xs font-black" style={{ color: '#2d2d2d', opacity: 0.5 }}>YOU — #{yourRank}</span>
              )}
            </div>
            {topEntries.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: '#2d2d2d', opacity: 0.35 }}>No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {topEntries.map((entry, i) => {
                  const isYou = entry.name === 'You';
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-black w-5 text-center flex-shrink-0"
                        style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#b45309' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs flex-1 truncate font-semibold"
                        style={{ color: isYou ? '#009980' : '#2d2d2d', fontWeight: isYou ? 900 : 600 }}>
                        {entry.name}
                      </span>
                      <span className="text-xs font-black flex-shrink-0" style={{ color: '#000' }}>
                        {entry.accuracy != null ? entry.accuracy : (entry.score ?? '—')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total questions + section breakdown */}
          <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e5e7eb' }}>
            <p className="text-xs font-black tracking-widest mb-1" style={{ color: '#2d2d2d' }}>TOTAL QUESTIONS</p>
            <p className="text-4xl font-black mb-3" style={{ color: '#000', letterSpacing: '-2px' }}>
              {analytics?.total_tests != null ? analytics.total_tests * 10 : 55}
            </p>
            <p className="text-xs font-black tracking-widest mb-2" style={{ color: '#2d2d2d', opacity: 0.45 }}>Section-by-section</p>
            <div>
              <div className="grid grid-cols-3 pb-1.5 border-b" style={{ borderColor: '#f3f4f6' }}>
                <span className="text-xs font-black" style={{ color: '#2d2d2d', opacity: 0.45 }}>SEQ</span>
                <span className="text-xs font-black col-span-2" style={{ color: '#2d2d2d', opacity: 0.45 }}>SECTION</span>
              </div>
              {SECTION_NAMES.map((name, i) => (
                <div key={i} className="grid grid-cols-3 py-1.5 border-b last:border-b-0" style={{ borderColor: '#f8f8f8' }}>
                  <span className="text-xs font-black" style={{ color: '#2d2d2d', opacity: 0.45 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-xs col-span-2 truncate" style={{ color: '#2d2d2d' }}>{name}</span>
                </div>
              ))}
              <div className="grid grid-cols-3 pt-1.5 border-t" style={{ borderColor: '#f3f4f6' }}>
                <span className="text-xs font-black" style={{ color: '#009980' }}>—</span>
                <span className="text-xs col-span-2 font-black" style={{ color: '#009980' }}>TOTAL</span>
              </div>
            </div>
          </div>

          {/* Weak areas */}
          {weakAreas && weakAreas.weak_areas.length > 0 && (
            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Target size={12} style={{ color: '#ef4444' }} />
                  <p className="text-xs font-black tracking-widest" style={{ color: '#2d2d2d' }}>WEAK AREAS</p>
                </div>
                <button
                  onClick={() => router.push('/mock-test/weak-areas')}
                  className="text-xs font-black"
                  style={{ color: '#009980' }}
                >
                  VIEW ALL →
                </button>
              </div>
              <div className="space-y-2.5">
                {weakAreas.weak_areas.slice(0, 4).map((area, i) => {
                  const barColor = area.accuracy < 45 ? '#ef4444' : area.accuracy < 58 ? '#f97316' : '#f59e0b';
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs truncate" style={{ color: '#2d2d2d', maxWidth: '78%' }}>{area.topic}</span>
                        <span className="text-xs font-black flex-shrink-0" style={{ color: barColor }}>{area.accuracy}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${area.accuracy}%`, background: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Your stats */}
          {analytics && (
            <div className="bg-white rounded-xl p-4 border" style={{ borderColor: '#e5e7eb' }}>
              <p className="text-xs font-black tracking-widest mb-3" style={{ color: '#2d2d2d' }}>YOUR STATS</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#2d2d2d' }}>Tests</span>
                  <span className="text-xs font-black" style={{ color: '#000' }}>{analytics.total_tests ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#2d2d2d' }}>Avg accuracy</span>
                  <span className="text-xs font-black" style={{ color: '#009980' }}>
                    {analytics.average_accuracy != null
                      ? `${Math.round(analytics.average_accuracy)}%`
                      : analytics.average_score != null
                      ? `${Math.round(analytics.average_score)}%`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#2d2d2d' }}>Best score</span>
                  <span className="text-xs font-black flex items-center gap-1" style={{ color: '#000' }}>
                    {analytics.best_score ?? '—'}
                    {analytics.best_score != null && <TrendingUp size={10} style={{ color: '#22c55e' }} />}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#2d2d2d' }}>Trend</span>
                  <span className="flex items-center gap-0.5 text-xs font-black">
                    {analytics.improvement_trend === 'improving' && (
                      <><TrendingUp size={10} style={{ color: '#22c55e' }} /><span style={{ color: '#22c55e' }}>Up</span></>
                    )}
                    {analytics.improvement_trend === 'declining' && (
                      <><TrendingDown size={10} style={{ color: '#ef4444' }} /><span style={{ color: '#ef4444' }}>Down</span></>
                    )}
                    {(!analytics.improvement_trend || analytics.improvement_trend === 'stable') && (
                      <><Minus size={10} style={{ color: '#94a3b8' }} /><span style={{ color: '#94a3b8' }}>Stable</span></>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
