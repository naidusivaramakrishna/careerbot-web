'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ScanSearch,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const stats = [
  { value: '12,400+', label: 'Job seekers' },
  { value: '5 lakh+', label: 'Job listings' },
  { value: '18+', label: 'ATS templates' },
  { value: 'Free', label: 'Plan available' },
];

export default function HeroSection() {
  const [scoreReady, setScoreReady] = useState(false);
  const [activeProfile, setActiveProfile] = useState(0);

  useEffect(() => {
    const scoreTimer = window.setTimeout(() => setScoreReady(true), 500);
    const profileTimer = window.setInterval(() => {
      setActiveProfile((current) => (current + 1) % 3);
    }, 3000);

    return () => {
      window.clearTimeout(scoreTimer);
      window.clearInterval(profileTimer);
    };
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-white pt-16 pb-20 md:pt-24 md:pb-28"
      style={{
        backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f3f8ff 48%, #eaf7f5 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(37,87,167,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#2557a7]"
            >
              <ScanSearch size={14} />
              Resume-ready. Job-ready. Interview-ready.
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
              className="text-4xl font-bold leading-tight tracking-tight text-[#111827] md:text-5xl"
            >
              Build an <span className="text-[#2557a7]">ATS-ready resume</span> and match with
              better jobs
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.2 }}
              className="mt-5 max-w-xl text-lg leading-relaxed text-[#6B7280]"
            >
              CareerBot helps Indian job seekers build resumes, scan ATS gaps, tailor applications,
              find matching jobs, and prepare for interviews in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.3 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/builder/start"
                className="rounded-xl bg-[#2557a7] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition-all hover:bg-[#1e4a94] active:scale-95"
              >
                Build My Resume Free
              </Link>
              <Link
                href="#template-gallery"
                className="rounded-xl border border-slate-300 px-8 py-3.5 text-center text-sm font-semibold text-[#374151] transition-all hover:border-[#2557a7] hover:bg-blue-50 hover:text-[#2557a7]"
              >
                View Resume Templates
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.36 }}
              className="mt-3 text-xs font-medium text-gray-500"
            >
              Free plan available. No credit card required.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
              className="mt-6 flex flex-wrap gap-x-6 gap-y-3"
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-bold leading-none text-[#111827]">{stat.value}</p>
                  <p className="mt-1 text-xs text-[#9CA3AF]">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.2 }}
            className="relative"
          >
            <style>{`
              @keyframes hero-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
              }
            `}</style>

            <div className="relative mx-auto w-full max-w-[520px] lg:mr-0">
              <div
                className="absolute -left-3 -top-3 z-10 hidden rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md sm:flex sm:items-center sm:gap-1.5"
                style={{ animation: 'hero-float 3s ease-in-out infinite' }}
              >
                <CheckCircle2 size={14} className="text-emerald-600" />
                ATS Optimized
              </div>

              <div
                className="absolute -bottom-3 -right-3 z-10 hidden rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-md sm:flex sm:items-center sm:gap-1.5"
                style={{ animation: 'hero-float 3s ease-in-out infinite 0.8s' }}
              >
                <TrendingUp size={14} className="text-[#2557a7]" />
                3x more interviews
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-blue-100/70">
                <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-500" />
                    <span className="truncate text-sm font-medium text-slate-800">Ananya Nair</span>
                    <span className="text-slate-300">·</span>
                    <span className="truncate text-sm text-slate-500">Software Engineer</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      ATS Ready
                    </span>
                    <span className="hidden items-center gap-1 text-xs font-medium text-green-700 sm:inline-flex">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                      Live
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-[200px_1fr]">
                  <div className="border-r border-slate-100 p-3">
                    <div className="max-h-[250px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
                      <div className="relative aspect-[3/4] bg-slate-100">
                        <Image
                          src="/assets/templates/software_engineering.png"
                          alt="Software engineering resume template preview"
                          fill
                          className="object-cover object-top"
                          sizes="180px"
                          priority
                        />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      ATS Score
                    </p>
                    <div className="mt-2 flex items-end gap-1">
                      <span className="text-5xl font-bold leading-none text-[#2557a7]">87</span>
                      <span className="pb-1 text-lg text-slate-400">/100</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all delay-500 duration-1000"
                        style={{ width: scoreReady ? '87%' : '0%' }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Ready to improve</p>

                    <div className="my-3 border-t border-slate-100" />

                    <div className="space-y-2">
                      {[
                        { label: 'Keywords', value: 92, status: 'good' },
                        { label: 'Format', value: 78, status: 'warn' },
                        { label: 'Content', value: 89, status: 'good' },
                      ].map((metric) => (
                        <div key={metric.label} className="flex h-7 items-center gap-2">
                          <span className="w-14 text-xs text-slate-600">{metric.label}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                metric.status === 'good' ? 'bg-blue-500' : 'bg-amber-400'
                              }`}
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs font-medium text-slate-700">
                            {metric.value}%
                          </span>
                          {metric.status === 'good' ? (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          ) : (
                            <AlertCircle size={14} className="text-amber-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-amber-100 bg-amber-50 px-4 py-2.5">
                  <AlertCircle size={15} className="shrink-0 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">Missing:</span>
                  {['Python', 'AWS', 'Docker'].map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs text-amber-800"
                    >
                      {keyword}
                    </span>
                  ))}
                  <button className="cursor-pointer text-xs text-amber-600 underline underline-offset-2">
                    +3 more
                  </button>
                </div>

                <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Sparkles size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-blue-800">AI Suggestion</p>
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          +24% impact
                        </span>
                      </div>
                        <p className="mt-1 truncate text-xs text-blue-600">
                        Add measurable delivery outcomes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-1.5 bg-white px-4 py-3">
                  {[0, 1, 2].map((item) => (
                    <span
                      key={item}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        activeProfile === item ? 'bg-[#2557a7]' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
