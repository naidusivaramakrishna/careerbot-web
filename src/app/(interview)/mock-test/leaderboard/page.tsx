'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { getLeaderboard, getProgressAnalytics, Leaderboard, ProgressAnalytics } from '@/api/mockTestApi';

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

  const medalColor = (rank: number) => {
    if (rank === 1) return '#f59e0b';
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#b45309';
    return '#2d2d2d';
  };

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

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#eef3ff' }}>
              <Trophy size={18} style={{ color: '#2557a7' }} />
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color: '#000' }}>Leaderboard</h1>
              <p className="text-xs mt-0.5" style={{ color: '#2d2d2d', opacity: 0.5 }}>
                {leaderboard?.period ?? 'All Time'} · {leaderboard?.total_participants ?? 0} participants
              </p>
            </div>
          </div>

          {leaderboard?.your_rank && (
            <div className="text-right">
              <div className="text-xs font-bold mb-0.5" style={{ color: '#2d2d2d', opacity: 0.5 }}>Your Rank</div>
              <div className="text-2xl font-black" style={{ color: '#2557a7' }}>#{leaderboard.your_rank}</div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 max-w-2xl mx-auto">

        {/* Your stats card */}
        {(leaderboard?.your_rank || analytics) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-5 mb-4 text-white"
            style={{ background: 'linear-gradient(135deg,#2557a7 0%,#1a3d73 100%)' }}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>YOUR RANK</p>
                <p className="text-2xl font-black">#{leaderboard?.your_rank ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>YOUR SCORE</p>
                <p className="text-2xl font-black">{leaderboard?.your_score ?? analytics?.best_score ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>PARTICIPANTS</p>
                <p className="text-2xl font-black">{leaderboard?.total_participants ?? 0}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 podium */}
        {entries.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl border border-slate-200 p-5 mb-4 shadow-sm">
            <div className="flex items-end justify-center gap-3">
              {/* 2nd */}
              <div className="flex flex-col items-center gap-2 pb-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white"
                  style={{ background: '#94a3b8' }}>2</div>
                <div className="text-center">
                  <div className="text-xs font-black" style={{ color: '#000' }}>{entries[1]?.name}</div>
                  <div className="text-xs" style={{ color: '#2d2d2d', opacity: 0.5 }}>{entries[1]?.accuracy ?? entries[1]?.score ?? '—'}</div>
                </div>
                <div className="w-16 h-12 rounded-t-lg" style={{ background: '#f1f5f9' }} />
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center gap-2">
                <Trophy size={18} style={{ color: '#f59e0b' }} />
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm text-white"
                  style={{ background: '#f59e0b' }}>1</div>
                <div className="text-center">
                  <div className="text-xs font-black" style={{ color: '#000' }}>{entries[0]?.name}</div>
                  <div className="text-xs" style={{ color: '#2d2d2d', opacity: 0.5 }}>{entries[0]?.accuracy ?? entries[0]?.score ?? '—'}</div>
                </div>
                <div className="w-16 h-16 rounded-t-lg" style={{ background: '#fff7ed' }} />
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center gap-2 pb-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white"
                  style={{ background: '#b45309' }}>3</div>
                <div className="text-center">
                  <div className="text-xs font-black" style={{ color: '#000' }}>{entries[2]?.name}</div>
                  <div className="text-xs" style={{ color: '#2d2d2d', opacity: 0.5 }}>{entries[2]?.accuracy ?? entries[2]?.score ?? '—'}</div>
                </div>
                <div className="w-16 h-8 rounded-t-lg" style={{ background: '#fef3c7' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Full list */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

          {/* Table header */}
          <div className="grid grid-cols-12 px-5 py-2.5 border-b border-slate-100"
            style={{ background: '#f8faff' }}>
            <span className="col-span-2 text-xs font-black tracking-wider" style={{ color: '#2d2d2d', opacity: 0.4 }}>RANK</span>
            <span className="col-span-5 text-xs font-black tracking-wider" style={{ color: '#2d2d2d', opacity: 0.4 }}>NAME</span>
            <span className="col-span-2 text-xs font-black tracking-wider text-center" style={{ color: '#2d2d2d', opacity: 0.4 }}>SCORE</span>
            <span className="col-span-2 text-xs font-black tracking-wider text-center" style={{ color: '#2d2d2d', opacity: 0.4 }}>ACCURACY</span>
            <span className="col-span-1 text-xs font-black tracking-wider text-center" style={{ color: '#2d2d2d', opacity: 0.4 }}>TESTS</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-2 border-[#2557a7] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <Users size={28} className="text-slate-300" />
              <p className="text-sm text-slate-400">No leaderboard data yet</p>
            </div>
          ) : (
            entries.map((entry, i) => {
              const isYou = entry.name === 'You' || entry.rank === leaderboard?.your_rank;
              return (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center px-5 py-3 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50"
                  style={{ background: isYou ? '#eef3ff' : 'transparent' }}>
                  <div className="col-span-2">
                    {(entry.rank ?? i + 1) <= 3 ? (
                      <span className="text-base">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                    ) : (
                      <span className="text-xs font-black" style={{ color: medalColor(entry.rank ?? i + 1), opacity: 0.5 }}>
                        {String(entry.rank ?? i + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="col-span-5">
                    <span className="text-xs" style={{ fontWeight: isYou ? 800 : 500, color: isYou ? '#2557a7' : '#2d2d2d' }}>
                      {entry.name}
                    </span>
                    {isYou && (
                      <span className="ml-1.5 text-xs font-black px-1.5 py-0.5 rounded text-white"
                        style={{ background: '#2557a7' }}>YOU</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-black" style={{ color: isYou ? '#2557a7' : '#000' }}>
                      {entry.score ?? '—'}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: '#eef3ff', color: '#2557a7' }}>
                      {entry.accuracy != null ? `${entry.accuracy}%` : '—'}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="text-xs text-slate-400">{entry.tests_completed ?? '—'}</span>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}
