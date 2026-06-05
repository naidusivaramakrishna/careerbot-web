'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, AlertTriangle, ChevronRight, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWeakAreasAnalytics, getProgressAnalytics, WeakAreasAnalytics, ProgressAnalytics } from '@/api/mockTestApi';
import LoadingScreen from '../_components/LoadingScreen';
import HighlightBox from '../_components/HighlightBox';

// Map a weak-area topic label (e.g. "Percentages", "Time & Work") to a
// practiceable category + backend subcategory slug, so "Practice this topic"
// launches a focused custom test instead of the generic company list.
// The subcategory is only set when we can confidently match a valid slug
// (see CATEGORY_SUBCATEGORIES in lib/mockTestConstants).
function resolveTopicTarget(topic: string): { category: string; subcategory?: string } {
  const t = (topic || '').toLowerCase();
  const rules: Array<{ kws: string[]; category: string; sub?: string }> = [
    { kws: ['percent'],               category: 'arithmetic', sub: 'percentages' },
    { kws: ['profit', 'loss'],        category: 'arithmetic', sub: 'profit_loss' },
    { kws: ['ratio'],                 category: 'arithmetic', sub: 'ratios' },
    { kws: ['interest'],              category: 'arithmetic', sub: 'simple_interest' },
    { kws: ['time', 'work'],          category: 'arithmetic', sub: 'time_and_work' },
    { kws: ['algebra'],               category: 'arithmetic', sub: 'algebra' },
    { kws: ['verbal'],                category: 'aptitude',   sub: 'verbal' },
    { kws: ['abstract'],              category: 'aptitude',   sub: 'abstract' },
    { kws: ['analyt'],                category: 'aptitude',   sub: 'analytical' },
    { kws: ['statistic'],             category: 'aptitude',   sub: 'statistics' },
    { kws: ['geometry'],              category: 'aptitude',   sub: 'geometry' },
    { kws: ['trigon'],                category: 'aptitude',   sub: 'trigonometry' },
    { kws: ['logic', 'reason', 'blood', 'direction', 'coding', 'sequence', 'puzzle'], category: 'reasoning', sub: 'logical' },
    { kws: ['python'],                category: 'technical',  sub: 'python' },
    { kws: ['java'],                  category: 'technical',  sub: 'java' },
    { kws: ['dsa', 'data structure'], category: 'technical',  sub: 'dsa' },
    { kws: ['sql'],                   category: 'technical',  sub: 'sql' },
    { kws: ['oop'],                   category: 'technical',  sub: 'oops' },
    { kws: ['web'],                   category: 'technical',  sub: 'web' },
  ];
  for (const r of rules) {
    if (r.kws.some(k => t.includes(k))) return { category: r.category, subcategory: r.sub };
  }
  if (t.includes('aptitude')) return { category: 'aptitude' };
  if (t.includes('reason'))   return { category: 'reasoning' };
  if (t.includes('tech') || t.includes('program')) return { category: 'technical' };
  return { category: 'arithmetic' };
}

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

  const barColor = (acc: number) =>
    acc < 30 ? '#b91c1c'
    : acc < 45 ? '#ef4444'
    : acc < 55 ? '#f97316'
    : acc < 65 ? '#f59e0b'
    : acc < 75 ? '#eab308'
    : acc < 85 ? '#84cc16' : '#22c55e';

  // Short tiered label shown next to the topic — matches the 7 bands used
  // by suggestionFor() in the API so the headline also varies by score.
  const verdict = (acc: number) =>
    acc < 30 ? 'Critical gap'
    : acc < 45 ? 'Major weakness'
    : acc < 55 ? 'Needs focused practice'
    : acc < 65 ? 'Below cutoff'
    : acc < 75 ? 'Close to passing'
    : acc < 85 ? 'Almost there'
    : 'Strong — keep going';

  if (loading) return <LoadingScreen label="Loading weak areas" />;

  const practiceTopic = (topic: string) => {
    const { category, subcategory } = resolveTopicTarget(topic);
    const params = new URLSearchParams({
      parentSessionId: crypto.randomUUID(),
      categories: category,
      difficulty: 'medium',
      count: '10',
    });
    if (subcategory) params.set('subcategory', subcategory);
    router.push(`/mock-test/custom-test?${params.toString()}`);
  };

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-16">

        {/* Breadcrumb — same shape as section intro */}
        <div className="mb-6 text-sm flex items-center gap-2">
          <button onClick={() => router.push('/mock-test')} style={{ color: '#64748B' }} className="hover:underline">Mock Tests</button>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span className="font-semibold" style={{ color: '#0F172A' }}>Weak Areas</span>
        </div>

        {/* Main card — section-intro DNA */}
        <div
          className="bg-white rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: '#E5E7EB',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.06)',
          }}
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-7">
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
              <p className="text-base font-bold mb-3" style={{ color: '#0F172A' }}>Topics to improve:</p>

              {/* Numbered <ol> — mirrors section intro instructions list */}
              <ol className="space-y-5 mb-7">
                {areas.map((area, i) => {
                  const acc = area.accuracy ?? 0;
                  const color = barColor(acc);
                  return (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex gap-3 text-[15px] leading-relaxed"
                    >
                      <span className="font-semibold tabular-nums shrink-0 w-5 pt-0.5" style={{ color: '#475569' }}>{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                          <div>
                            <span className="font-bold" style={{ color: '#000' }}>{area.topic}:</span>{' '}
                            <span style={{ color: '#2d2d2d' }}>{verdict(acc)}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 shrink-0">
                            <span className="text-xl font-bold tabular-nums" style={{ color }}>{acc}%</span>
                            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>accuracy</span>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${acc}%` }}
                            transition={{ delay: i * 0.04 + 0.15, duration: 0.6 }}
                            style={{ background: color }}
                          />
                        </div>

                        {area.suggestion && (
                          <p className="text-xs leading-relaxed mt-1.5" style={{ color: '#64748B' }}>
                            {area.suggestion}
                          </p>
                        )}

                        <button
                          onClick={() => practiceTopic(area.topic)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold transition hover:opacity-80"
                          style={{ color: '#1e3a8a' }}>
                          <RefreshCcw size={11} /> Practice this topic
                        </button>
                      </div>
                    </motion.li>
                  );
                })}
              </ol>

              {analytics && (
                <HighlightBox>
                  <p className="text-sm leading-relaxed" style={{ color: '#2d2d2d' }}>
                    Based on your last{' '}
                    <span className="font-bold" style={{ color: '#0F172A' }}>{analytics.total_tests ?? 0}</span>{' '}
                    {analytics.total_tests === 1 ? 'test' : 'tests'} · Overall grade{' '}
                    <span className="font-bold" style={{ color: '#1e3a8a' }}>{analytics.overall_grade ?? '—'}</span>
                  </p>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Tests</p>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: '#0F172A' }}>{analytics.total_tests ?? 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Avg accuracy</p>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: '#1e3a8a' }}>
                        {analytics.average_accuracy != null ? Math.round(analytics.average_accuracy) : '—'}
                        <span className="text-base font-bold" style={{ color: '#60a5fa' }}>%</span>
                      </p>
                    </div>
                  </div>
                </HighlightBox>
              )}
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
                  <span className="font-semibold tabular-nums shrink-0 w-5" style={{ color: '#475569' }}>{i + 1}.</span>
                  <span style={{ color: '#2d2d2d' }}>{rec}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Bottom action row — section-intro DNA */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push('/mock-test')}
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
