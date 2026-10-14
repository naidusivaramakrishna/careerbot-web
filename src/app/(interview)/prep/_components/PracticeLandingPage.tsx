"use client";

import { ElementType } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type LandingStep = {
  icon: ElementType;
  title: string;
  body: string;
};

type PracticeLandingPageProps = {
  accent: "managerial" | "hr" | "technical";
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: { value: string; label: string }[];
  steps: LandingStep[];
  tips: string[];
  outcomes: string[];
  ctaLabel: string;
  loading: boolean;
  error: string | null;
  onStart: () => void;
};

export default function PracticeLandingPage({
  eyebrow,
  title,
  subtitle,
  stats,
  steps,
  tips,
  outcomes,
  ctaLabel,
  loading,
  error,
  onStart,
}: PracticeLandingPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-5 lg:py-5">
      <section className="rounded-xl border border-gray-200 bg-white shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2557a7]/20 bg-[#2557a7]/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#2557a7]">
                <Sparkles size={11} />
                {eyebrow}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                <ShieldCheck size={11} className="text-[#2557a7]" />
                Guided practice
              </span>
            </div>
            <h1 className="text-lg font-black leading-tight text-gray-950 sm:text-xl">
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-xs font-medium leading-5 text-gray-600">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2557a7] px-4 py-2.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(37,87,167,0.16)] transition-colors hover:bg-[#1f4b91] active:bg-[#183f7d] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : ctaLabel}
            {!loading && <ChevronRight size={14} />}
          </button>
        </div>

        {error && (
          <div role="alert" className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 sm:mx-5">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#2557a7]" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <p className="text-lg font-black tabular-nums text-[#2557a7]">{stat.value}</p>
                  <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-3.5 py-2.5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">Practice flow</p>
                  <h2 className="text-xs font-black text-gray-950">What happens next</h2>
                </div>
                <ArrowRight size={14} className="text-gray-400" />
              </div>
              <div className="divide-y divide-gray-200">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <article key={step.title} className="grid gap-2.5 px-3.5 py-3 sm:grid-cols-[28px_minmax(0,1fr)]">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2557a7]/8 text-[#2557a7]">
                        <Icon size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-gray-400">0{index + 1}</span>
                          <h3 className="text-xs font-black text-gray-900">{step.title}</h3>
                        </div>
                        <p className="mt-0.5 max-w-2xl text-[11px] font-medium leading-4 text-gray-600">{step.body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-gray-200 bg-gray-50 p-3.5">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">Session goals</p>
              <div className="mt-2.5 space-y-2">
                {outcomes.map((outcome) => (
                  <div key={outcome} className="flex items-start gap-2 text-xs font-bold text-gray-800">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#2557a7]" />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-3.5">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">Coach notes</p>
              <div className="mt-2.5 space-y-2">
                {tips.map((tip, index) => (
                  <div key={tip} className="flex items-start gap-2.5 rounded-md bg-gray-50 px-2.5 py-2">
                    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#2557a7] text-[9px] font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-[11px] font-medium leading-4 text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
