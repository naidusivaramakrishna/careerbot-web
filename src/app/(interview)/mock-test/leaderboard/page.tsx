'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLeaderboard, getProgressAnalytics, Leaderboard, ProgressAnalytics } from '@/api/mockTestApi';
import LoadingScreen from '../_components/LoadingScreen';
import HighlightBox from '../_components/HighlightBox';

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [analytics, setAnalytics]     = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      getLeaderboard().catch(() => null),
      getProgressAnalytics().catch(() => null),
    ]).then(([lb, pa]) => {
      setLeaderboard(lb);
      setAnalytics(pa);
    }).finally(() => setLoading(false));
  }, []);

  const entries = leaderboard?.entries ?? [];

  if (loading) return <LoadingScreen label="Loading leaderboard" />;

  const yourScore = leaderboard?.your_score ?? analytics?.best_score ?? null;

  return (
    <div className="min-h-screen" style={{ background: '#F8F9FB' }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 pb-16">

        {/* Breadcrumb — same shape as section intro */}
        <div className="mb-6 text-sm flex items-center gap-2">
          <button onClick={() => router.push('/mock-test')} style={{ color: '#64748B' }} className="hover:underline">Mock Tests</button>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span className="font-semibold" style={{ color: '#0F172A' }}>Leaderboard</span>
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
          <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ borderColor: '#E5E7EB', background: '#F8FAFC' }}>
                <Trophy size={22} style={{ color: '#1e3a8a' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Leaderboard
                </h2>
                <p className="text-sm max-w-xl leading-relaxed" style={{ color: '#64748B' }}>
                  Top performers {leaderboard?.period ?? 'across all time'}.{' '}
                  {leaderboard?.total_participants
                    ? <>Ranked among <span className="font-bold" style={{ color: '#0F172A' }}>{leaderboard.total_participants}</span> participants.</>
                    : 'Start a test to enter the ranks.'}
                </p>
              </div>
            </div>

            {leaderboard?.your_rank != null && (
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Your rank</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: '#1e3a8a' }}>#{leaderboard.your_rank}</p>
              </div>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="rounded-xl px-5 py-10 text-center" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: '#dbeafe' }}>
                <Users size={20} style={{ color: '#1e3a8a' }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: '#0F172A' }}>No leaderboard data yet</h3>
              <p className="text-sm" style={{ color: '#475569' }}>Complete a test to claim your spot on the board.</p>
            </div>
          ) : (
            <>
              <p className="text-base font-bold mb-3" style={{ color: '#0F172A' }}>Top performers:</p>

              {/* Numbered <ol> — mirrors section intro instructions list */}
              <ol className="space-y-3 mb-7">
                {entries.map((entry, i) => {
                  const rank = entry.rank ?? i + 1;
                  const isYou = entry.name === 'You' || rank === leaderboard?.your_rank;
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

                  return (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-3 text-[15px] leading-relaxed rounded-xl px-3 py-3 transition"
                      style={{ background: isYou ? '#EFF6FF' : 'transparent', border: isYou ? '1px solid #BFDBFE' : '1px solid transparent' }}
                    >
                      {/* Rank — medal for top 3, numbered for the rest */}
                      <span className="shrink-0 w-7 text-center pt-0.5">
                        {medal ? (
                          <span
                            className="text-lg leading-none"
                            role="img"
                            aria-label={rank === 1 ? '1st place' : rank === 2 ? '2nd place' : '3rd place'}
                          >{medal}</span>
                        ) : (
                          <span className="font-semibold tabular-nums" style={{ color: '#475569' }}>{rank}.</span>
                        )}
                      </span>

                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold truncate" style={{ color: isYou ? '#1e3a8a' : '#000' }}>
                            {entry.name || '—'}
                          </span>
                          {isYou && (
                            <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: '#1e3a8a', color: '#fff' }}>You</span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-xs" style={{ color: '#64748B' }}>
                          <span>
                            <span className="font-bold tabular-nums" style={{ color: '#0F172A' }}>{entry.score ?? 0}</span>
                            {' '}<span className="text-[10px] font-bold tracking-wider uppercase">score</span>
                          </span>
                          {entry.accuracy != null && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums"
                              style={{ background: '#dcfce7', color: '#15803d' }}>
                              {entry.accuracy}%
                            </span>
                          )}
                          {entry.tests_completed != null && (
                            <span className="tabular-nums" style={{ color: '#94A3B8' }}>
                              {entry.tests_completed} <span className="text-[10px] font-bold tracking-wider uppercase">tests</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ol>

              <HighlightBox>
                <p className="text-sm leading-relaxed" style={{ color: '#2d2d2d' }}>
                  {leaderboard?.your_rank != null
                    ? <>You&apos;re ranked <span className="font-bold" style={{ color: '#1e3a8a' }}>#{leaderboard.your_rank}</span>{' '}
                       of <span className="font-bold" style={{ color: '#0F172A' }}>{leaderboard.total_participants ?? entries.length}</span>{' '}
                       — keep practicing to climb the board.</>
                    : 'Take a test to lock in your first rank.'}
                </p>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Your rank</p>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: '#1e3a8a' }}>
                      {leaderboard?.your_rank != null ? `#${leaderboard.your_rank}` : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Your score</p>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: '#0F172A' }}>
                      {yourScore ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94A3B8' }}>Participants</p>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: '#0F172A' }}>
                      {leaderboard?.total_participants ?? entries.length}
                    </p>
                  </div>
                </div>
              </HighlightBox>
            </>
          )}
        </div>

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
            Take a Test <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
