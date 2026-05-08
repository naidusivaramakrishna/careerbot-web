'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, TrendingUp, AlertTriangle, ChevronRight, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWeakAreasAnalytics, getProgressAnalytics, WeakAreasAnalytics, ProgressAnalytics } from '@/api/mockTestApi';

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
    acc < 50 ? '#ef4444' : acc < 65 ? '#f97316' : '#f59e0b';

  const verdict = (acc: number) =>
    acc < 50 ? 'Needs urgent practice' : acc < 65 ? 'Needs improvement' : 'Moderate — keep going';

  return (
    <div className="w-full min-h-screen bg-[#F8F9FB]">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 pt-6 pb-0"
        style={{ background: 'linear-gradient(135deg,#eef3ff 0%,#ffffff 100%)' }}>
        <button
          onClick={() => router.push('/mock-test')}
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:opacity-70 transition"
          style={{ color: '#2557a7' }}>
          <ArrowLeft size={14} /> Back to Mock Tests
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#eef3ff' }}>
            <Target size={18} style={{ color: '#2557a7' }} />
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: '#000' }}>Weak Areas</h1>
            <p className="text-xs mt-0.5" style={{ color: '#2d2d2d', opacity: 0.5 }}>
              Topics that need more practice based on your performance
            </p>
          </div>
        </div>

        {/* Stats strip */}
        {analytics && (
          <div className="flex items-center gap-4 pb-5">
            {[
              { label: 'Tests taken', value: analytics.total_tests ?? '—' },
              { label: 'Avg accuracy', value: analytics.average_accuracy != null ? `${Math.round(analytics.average_accuracy)}%` : '—' },
              { label: 'Grade', value: analytics.overall_grade ?? '—' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-xs" style={{ color: '#2d2d2d', opacity: 0.5 }}>{s.label}:</span>
                <span className="text-xs font-black" style={{ color: '#2557a7' }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-2xl mx-auto">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-[#2557a7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fetchError ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-red-200 p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#fef2f2' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            </div>
            <h2 className="text-base font-black mb-1" style={{ color: '#000' }}>Could not load weak areas</h2>
            <p className="text-sm mb-5" style={{ color: '#2d2d2d', opacity: 0.5 }}>{fetchError}</p>
            <button
              onClick={() => { setFetchError(null); setLoading(true); window.location.reload(); }}
              className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90"
              style={{ background: '#2557a7' }}>
              <RefreshCcw size={14} /> Retry
            </button>
          </motion.div>
        ) : areas.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#eef3ff' }}>
              <TrendingUp size={24} style={{ color: '#2557a7' }} />
            </div>
            <h2 className="text-base font-black mb-1" style={{ color: '#000' }}>No weak areas found</h2>
            <p className="text-sm" style={{ color: '#2d2d2d', opacity: 0.5 }}>
              Complete more tests to get personalised weak-area insights.
            </p>
            <button
              onClick={() => router.push('/mock-test')}
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90"
              style={{ background: '#2557a7' }}>
              Take a Test <ChevronRight size={14} />
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {areas.map((area, i) => {
              const acc = area.accuracy ?? 0;
              const color = barColor(acc);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${color}18` }}>
                        <AlertTriangle size={14} style={{ color }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black" style={{ color: '#000' }}>{area.topic}</h3>
                        <p className="text-xs mt-0.5" style={{ color: '#2d2d2d', opacity: 0.5 }}>{verdict(acc)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black" style={{ color }}>{acc}%</div>
                      <div className="text-xs font-bold tracking-wide" style={{ color: '#2d2d2d', opacity: 0.4 }}>ACCURACY</div>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${acc}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                      style={{ background: color }}
                    />
                  </div>

                  {/* Suggestion */}
                  {area.suggestion && (
                    <p className="text-xs leading-relaxed" style={{ color: '#2d2d2d', opacity: 0.6 }}>
                      {area.suggestion}
                    </p>
                  )}

                  <button
                    onClick={() => router.push('/mock-test')}
                    className="mt-3 flex items-center gap-1.5 text-xs font-bold transition hover:opacity-80"
                    style={{ color: '#2557a7' }}>
                    <RefreshCcw size={11} /> Practice this topic
                  </button>
                </motion.div>
              );
            })}

            {/* Recommendations */}
            {weakAreas?.recommendations && weakAreas.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: areas.length * 0.05 + 0.1 }}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-xs font-black mb-3" style={{ color: '#000' }}>Recommendations</h3>
                <ul className="space-y-2">
                  {weakAreas.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#2d2d2d' }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-black"
                        style={{ background: '#2557a7' }}>{i + 1}</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
