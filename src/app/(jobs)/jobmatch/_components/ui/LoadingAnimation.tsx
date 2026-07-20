"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, FileSearch, LockKeyhole, Sparkles } from "lucide-react";

type LoadingStage = "parsing" | "extracting" | "matching" | "scoring" | "generating";

const stages: Array<{ id: LoadingStage; label: string; detail: string; pct: number }> = [
  { id: "parsing", label: "Reading your resume", detail: "Mapping sections and content", pct: 15 },
  { id: "extracting", label: "Finding career signals", detail: "Skills, impact, and experience", pct: 35 },
  { id: "matching", label: "Comparing role requirements", detail: "Required and preferred criteria", pct: 58 },
  { id: "scoring", label: "Calculating match quality", detail: "Weighted ATS compatibility", pct: 78 },
  { id: "generating", label: "Prioritizing your fixes", detail: "Building an actionable report", pct: 92 },
];

export default function LoadingAnimation({ stage }: { stage: LoadingStage }) {
  const activeIndex = Math.max(0, stages.findIndex((item) => item.id === stage));
  const target = stages[activeIndex].pct;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDisplayPct((value) => {
        if (value >= target) {
          window.clearInterval(timer);
          return target;
        }
        return Math.min(value + 1, target);
      });
    }, 32);
    return () => window.clearInterval(timer);
  }, [target]);

  const progressLabel = useMemo(() => `${displayPct}% complete`, [displayPct]);

  return (
    <main className="relative flex min-h-[calc(100vh-56px)] items-center justify-center overflow-hidden bg-[#f5f7fb] px-5 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(52,120,246,0.13),transparent_68%)]" />
      <section aria-live="polite" aria-label="Generating job match report" className="relative w-full max-w-[760px] overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_30px_90px_-34px_rgba(15,23,42,0.35)]">
        <div className="grid gap-8 px-7 py-8 sm:px-10 sm:py-10 md:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
                <Sparkles size={14} /> CareerBOT intelligence
              </div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2557a7] text-white shadow-[0_12px_28px_-10px_rgba(37,87,167,.65)]">
                <FileSearch size={23} />
              </div>
              <h1 className="max-w-[390px] text-[30px] font-extrabold leading-[1.12] tracking-[-0.035em] text-slate-950 sm:text-[36px]">
                Turning your resume into a clearer advantage.
              </h1>
              <p className="mt-4 max-w-[390px] text-[15px] leading-6 text-slate-500">
                We’re reviewing the evidence recruiters and ATS systems care about, then ranking the changes with the highest payoff.
              </p>
            </div>
            <div className="mt-9 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <LockKeyhole size={14} className="text-blue-600" /> Private analysis · usually 15–30 seconds
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-5 sm:p-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-400">Analysis progress</p>
                <p className="mt-1 text-base font-bold text-slate-900">{stages[activeIndex].label}</p>
              </div>
              <span className="text-2xl font-extrabold tracking-[-0.03em] text-blue-700">{displayPct}%</span>
            </div>
            <div className="mb-7 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={progressLabel} aria-valuenow={displayPct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-indigo-500 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${displayPct}%` }} />
            </div>
            <ol className="space-y-1">
              {stages.map((item, index) => {
                const complete = index < activeIndex;
                const active = index === activeIndex;
                return (
                  <li key={item.id} className={`flex gap-3 rounded-xl px-3 py-3 transition-colors ${active ? "bg-white shadow-sm ring-1 ring-slate-200/70" : ""}`}>
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${complete ? "bg-emerald-500 text-white" : active ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {complete ? <Check size={14} strokeWidth={3} /> : index + 1}
                    </span>
                    <div>
                      <p className={`text-[13px] font-bold ${active ? "text-slate-950" : complete ? "text-slate-600" : "text-slate-400"}`}>{item.label}</p>
                      {active && <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{item.detail}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
