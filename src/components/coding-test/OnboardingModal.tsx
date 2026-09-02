'use client';

import { useCallback, useEffect, useRef } from 'react';
import { BarChart2, Play, Sparkles, X, Zap } from 'lucide-react';

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: Play,
    bg: 'bg-emerald-100',
    fg: 'text-emerald-600',
    title: 'Run your code',
    desc: 'Tests against the visible sample examples instantly. No grading credits used — iterate as many times as you like.',
  },
  {
    icon: Sparkles,
    bg: 'bg-indigo-100',
    fg: 'text-indigo-600',
    title: 'Submit for AI grading',
    desc: 'AI reviews your code against hidden test cases and gives line-level feedback. Uses 1 grading credit per submission.',
  },
  {
    icon: BarChart2,
    bg: 'bg-amber-100',
    fg: 'text-amber-600',
    title: 'Score breakdown',
    desc: 'Each submission is scored out of 100 across four criteria: Correctness, Efficiency, Code Quality, and Edge Cases.',
  },
  {
    icon: Zap,
    bg: 'bg-slate-100',
    fg: 'text-slate-600',
    title: '50 gradings per month',
    desc: 'The free plan includes 50 AI gradings each month. The quota bar on this page shows how many you have remaining.',
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export interface OnboardingModalProps {
  onDismiss: () => void;
}

export default function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  // Focus the CTA on open so keyboard users can dismiss immediately.
  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  // Escape key closes the modal.
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); },
    [onDismiss],
  );
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ct-onboarding-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-slate-100">
          <div>
            <p className="font-mono text-[11px] font-semibold text-indigo-600 uppercase tracking-widest mb-1">
              &lt;/&gt; Coding Practice
            </p>
            <h2 id="ct-onboarding-title" className="text-xl font-bold text-slate-900">
              How it works
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              30 seconds to read — then you&apos;re off.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 space-y-5">
          {STEPS.map(({ icon: Icon, bg, fg, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}
                aria-hidden
              >
                <Icon className={`h-4 w-4 ${fg}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            ref={btnRef}
            type="button"
            onClick={onDismiss}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Got it, let&apos;s practice!
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            This won&apos;t show again once you dismiss it.
          </p>
        </div>
      </div>
    </div>
  );
}
