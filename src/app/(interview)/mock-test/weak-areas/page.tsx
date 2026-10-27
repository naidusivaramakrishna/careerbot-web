'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, AlertTriangle, ChevronRight, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWeakAreasAnalytics, getProgressAnalytics, WeakAreasAnalytics, ProgressAnalytics } from '@/api/mockTestApi';
import { resolveTopicTarget } from '@/lib/resolveTopicTarget';
import LoadingScreen from '../_components/LoadingScreen';
import HighlightBox from '../_components/HighlightBox';
import PageBreadcrumb from '../_components/PageBreadcrumb';

// Severity bands, from critical to strong — drives the badge, the accuracy
// number, and the progress-bar color so all three always agree.
const TIERS = [
  { max: 30, label: 'Critical gap',            color: '#b91c1c', bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
  { max: 45, label: 'Major weakness',          color: '#ef4444', bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
  { max: 55, label: 'Needs focused practice',  color: '#f97316', bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' },
  { max: 65, label: 'Below cutoff',            color: '#f59e0b', bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
  { max: 75, label: 'Close to passing',        color: '#eab308', bg: '#FEFCE8', border: '#FEF08A', text: '#A16207' },
  { max: 85, label: 'Almost there',            color: '#84cc16', bg: '#F7FEE7', border: '#D9F99D', text: '#4D7C0F' },
  { max: Infinity, label: 'Strong — keep going', color: '#22c55e', bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
] as const;

const tierFor = (acc: number) => TIERS.find(t => acc < t.max) ?? TIERS[TIERS.length - 1];

export default function WeakAreasPage() {
  const router = useRouter();
  const [weakAreas, setWeakAreas]   = useState<WeakAreasAnalytics | null>(null);
  const [analytics, setAnalytics]   = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getWeakAreasAnalytics().catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Failed to load weak areas';
        setFetchError(msg);
        return null;
      }),
      getProgressAnalytics().catch(() => null),
    ]).then(([wa, pa]) => {
      setWeakAreas(wa);
      setAnalytics(pa);
    }).finally(() => setLoading(false));
  }, []);

  const areas = weakAreas?.weak_areas ?? [];

  if (loading) return <LoadingScreen label="Loading weak areas" />;

  const practiceTopic = (topic: string) => {
    const { category, subcategory } = resolveTopicTarget(topic);
    const params = new URLSearchParams({
      parentSessionId: crypto.randomUUID(),
      categories: category,
      // No `count`: nothing reads it (`grep -rn "get('count')" src` is empty)
      // and the custom builder sizes sections from SECTION_CONFIG, so sending
      // count: '10' advertised a 10-question practice that was never honoured.
    });
    if (subcategory) params.set('subcategory', subcategory);
    router.push(`/mock-test/custom-test?${params.toString()}`);
  };

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-16">

        <PageBreadcrumb items={[{ label: 'Mock Tests', href: '/mock-test/browse' }, { label: 'Weak Areas' }]} />

        {/* Main card — section-intro DNA */}
        <div
          className="bg-white rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: '#E5E7EB',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ borderColor: '#E5E7EB', background: '#F8FAFC' }}>
                <Target size={22} style={{ color: '#1e3a8a' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Weak Areas
                </h2>
                <p className="text-sm max-w-xl leading-relaxed" style={{ color: '#64748B' }}>
                  Topics that need more practice based on your performance across recent tests.
                </p>
              </div>
            </div>

            {!fetchError && areas.length > 0 && (
              <div className="flex items-center gap-5 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Tests</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: '#0F172A' }}>{analytics?.total_tests ?? 0}</p>
                </div>
                <div className="w-px h-8" style={{ background: '#E5E7EB' }} />
                <div className="text-right">
                  <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Avg accuracy</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: '#1e3a8a' }}>
                    {analytics?.average_accuracy != null ? Math.round(analytics.average_accuracy) : '—'}
                    <span className="text-sm font-bold" style={{ color: '#60a5fa' }}>%</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* States */}
          {fetchError ? (
            <div className="rounded-xl px-5 py-5 text-center" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#fee2e2' }}>
                <AlertTriangle size={20} style={{ color: '#dc2626' }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: '#991b1b' }}>Could not load weak areas</h3>
              <p className="text-sm mb-4" style={{ color: '#7f1d1d' }}>{fetchError}</p>
              <button
                onClick={() => { setFetchError(null); setLoading(true); window.location.reload(); }}
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90"
                style={{ background: '#1e3a8a' }}>
                <RefreshCcw size={14} /> Retry
              </button>
            </div>
          ) : areas.length === 0 ? (
            <div className="rounded-xl px-5 py-8 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#dbeafe' }}>
                <TrendingUp size={20} style={{ color: '#1e3a8a' }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: '#0F172A' }}>No weak areas found</h3>
              <p className="text-sm" style={{ color: '#475569' }}>
                Complete more tests to get personalised weak-area insights.
              </p>
            </div>
          ) : (
            <>
              <p className="text-base font-bold mb-4" style={{ color: '#0F172A' }}>Topics to improve</p>

              {/* Card grid — one card per topic, top-accent + hover lift to match the company cards on Browse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
                {areas.map((area, i) => {
                  const acc = area.accuracy ?? 0;
                  const tier = tierFor(acc);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35 }}
                      whileHover={{ y: -3, boxShadow: '0 16px 36px -16px rgba(15,23,42,0.18), 0 4px 14px -4px rgba(15,23,42,0.08)' }}
                      className="relative bg-white rounded-2xl overflow-hidden flex flex-col"
                      style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
                    >
                      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: tier.color }} />

                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 tabular-nums"
                              style={{ background: '#F1F5F9', color: '#475569' }}
                            >
                              {i + 1}
                            </span>
                            <h3 className="font-bold text-[15px] truncate" style={{ color: '#0F172A' }}>{area.topic}</h3>
                          </div>
                          <span
                            className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide whitespace-nowrap"
                            style={{ background: tier.bg, color: tier.text, border: `1px solid ${tier.border}` }}
                          >
                            {tier.label}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-1.5 mb-2">
                          <span className="text-2xl font-bold tabular-nums" style={{ color: tier.color }}>{acc}%</span>
                          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>accuracy</span>
                        </div>

                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${acc}%` }}
                            transition={{ delay: i * 0.05 + 0.15, duration: 0.6 }}
                            style={{ background: tier.color }}
                          />
                        </div>

                        {area.suggestion && (
                          <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: '#64748B' }}>
                            {area.suggestion}
                          </p>
                        )}

                        <button
                          onClick={() => practiceTopic(area.topic)}
                          className="mt-auto self-start inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition hover:opacity-80"
                          style={{ color: '#1e3a8a', background: '#EFF6FF', border: '1px solid #BFDBFE' }}
                        >
                          <RefreshCcw size={11} /> Practice this topic
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <HighlightBox>
                <p className="text-sm leading-relaxed" style={{ color: '#2d2d2d' }}>
                  Based on your last{' '}
                  <span className="font-bold" style={{ color: '#0F172A' }}>{analytics?.total_tests ?? 0}</span>{' '}
                  {(analytics?.total_tests ?? 0) === 1 ? 'test' : 'tests'} · Overall grade{' '}
                  <span className="font-bold" style={{ color: '#1e3a8a' }}>{analytics?.overall_grade ?? '—'}</span>
                </p>
              </HighlightBox>
            </>
          )}
        </div>

        {/* Recommendations card — mirrors company brief's secondary cards */}
        {!fetchError && weakAreas?.recommendations && weakAreas.recommendations.length > 0 && (
          <div
            className="mt-5 bg-white rounded-2xl border overflow-hidden p-6 md:p-8"
            style={{ borderColor: '#E5E7EB', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
          >
            <h3 className="text-base font-bold mb-4" style={{ color: '#0F172A' }}>Recommendations</h3>
            <ol className="space-y-3">
              {weakAreas.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 tabular-nums mt-0.5"
                    style={{ background: '#F1F5F9', color: '#475569' }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: '#2d2d2d' }}>{rec}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Bottom action row — section-intro DNA */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push('/mock-test/browse')}
            className="text-sm font-medium hover:underline"
            style={{ color: '#475569' }}
          >
            ← Back to Tests
          </button>

          <button
            onClick={() => router.push('/mock-test/custom')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(30,58,138,0.5)]"
            style={{ background: '#1e3a8a', boxShadow: '0 4px 14px -4px rgba(30,58,138,0.35)' }}
          >
            Take Practice Test <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
