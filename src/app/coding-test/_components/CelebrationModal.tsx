'use client';

import { useEffect, useRef } from 'react';
import { ChevronRight, X } from 'lucide-react';

/* ── Confetti colours ── */
const COLORS = ['#10b981','#6366f1','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f43f5e'];

/* ── Deterministic confetti seeds (no random on each render) ── */
const PIECES = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  color: COLORS[i % COLORS.length],
  left: (i * 13 + 7) % 100,          // 0–99 %
  delay: ((i * 0.19) % 1.6),         // 0–1.6 s
  dur: 2.2 + ((i * 0.07) % 1.4),     // 2.2–3.6 s
  size: 7 + (i % 6),                  // 7–12 px
  rotate: (i * 37) % 360,
  isRect: i % 3 !== 0,                // mix squares + circles
}));

/* ── Trophy SVG ── */
function TrophyIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="h-full w-full" aria-hidden>
      {/* Cup */}
      <path d="M20 8h24v20c0 11-8 18-12 18S20 39 20 28V8z" fill="#10b981" />
      {/* Shine */}
      <path d="M26 12 Q28 20 26 28" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" />
      {/* Handles */}
      <path d="M20 12 Q10 12 10 22 Q10 30 20 30" stroke="#10b981" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M44 12 Q54 12 54 22 Q54 30 44 30" stroke="#10b981" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Stem */}
      <rect x="29" y="46" width="6" height="8" rx="1" fill="#10b981" />
      {/* Base */}
      <rect x="22" y="54" width="20" height="4" rx="2" fill="#10b981" />
      {/* Stars */}
      <text x="29" y="7" fontSize="8" fill="#fbbf24">★</text>
      <text x="38" y="9" fontSize="6" fill="#fbbf24">★</text>
      <text x="20" y="9" fontSize="6" fill="#fbbf24">★</text>
    </svg>
  );
}

/* ── Sunburst rays ── */
function Sunburst() {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 100 + 70 * Math.cos(angle);
        const y1 = 100 + 70 * Math.sin(angle);
        const x2 = 100 + 95 * Math.cos(angle);
        const y2 = 100 + 95 * Math.sin(angle);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#d1fae5" strokeWidth={i % 2 === 0 ? 3 : 2} strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

interface Props {
  passed: number;
  total: number;
  onClose: () => void;
  onNextChallenge: () => void;
  hasNext: boolean;
}

export default function CelebrationModal({
  passed, total, onClose, onNextChallenge, hasNext,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* ── Keyframe injections ── */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes trophy-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          30%       { transform: translateY(-12px) scale(1.08); }
          60%       { transform: translateY(-4px) scale(1.03); }
        }
        @keyframes celebration-in {
          0%   { opacity: 0; transform: scale(0.85) translateY(24px); }
          100% { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.12); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes sunburst-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      >
        {/* ── Falling confetti ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          {PIECES.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                top: '-16px',
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: p.isRect ? `${p.size * 0.6}px` : `${p.size}px`,
                borderRadius: p.isRect ? '2px' : '50%',
                background: p.color,
                transform: `rotate(${p.rotate}deg)`,
                animation: `confetti-fall ${p.dur}s ${p.delay}s ease-in forwards`,
              }}
            />
          ))}
        </div>

        {/* ── Card ── */}
        <div
          className="relative mx-4 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
          style={{ animation: 'celebration-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* ── Top section: green gradient + trophy ── */}
          <div className="relative flex h-52 items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
            {/* Spinning sunburst */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'sunburst-spin 18s linear infinite' }}
            >
              <div className="relative h-48 w-48">
                <Sunburst />
              </div>
            </div>

            {/* Trophy */}
            <div
              className="relative z-10 h-28 w-28 drop-shadow-xl"
              style={{ animation: 'trophy-bounce 1.4s ease-in-out infinite' }}
            >
              <TrophyIcon />
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-8 pb-8 pt-2 text-center">
            {/* Label */}
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-500">
              Challenge Complete
            </p>

            {/* Headline */}
            <h2 className="text-3xl font-extrabold text-slate-900">You did it!</h2>

            {/* Score pill */}
            <p className="mt-1 text-sm font-medium text-slate-400">
              {passed}/{total} tests passed
            </p>

            {/* Buttons */}
            <div className="mt-6 flex flex-col gap-3">
              {hasNext ? (
                <button
                  type="button"
                  onClick={onNextChallenge}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-600 active:scale-95"
                >
                  Next Challenge
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { window.location.href = '/coding-test/problems'; }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-600 active:scale-95"
                >
                  Browse More Problems
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold uppercase tracking-wide text-slate-400 transition hover:text-slate-600"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
