'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Download,
  FileText,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react';

const highlights = [
  'ATS-friendly layouts',
  'AI-written bullet points',
  'One-click PDF and DOCX export',
];

const resumeSections = [
  { label: 'Profile', status: 'Complete', active: true },
  { label: 'Experience', status: 'Optimized', active: true },
  { label: 'Skills', status: 'Improved', active: false },
  { label: 'Projects', status: 'Drafted', active: true },
];

export default function HeroSection() {
  const [completionReady, setCompletionReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setCompletionReady(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-white pb-20 pt-14 md:pb-24 md:pt-20"
      style={{
        backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f4f8ff 52%, #eaf2ff 100%)',
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
              className="mb-6 flex flex-wrap items-center gap-3"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2557a7]">
                <FileText size={14} />
                Professional AI resume builder
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-[#2557a7] shadow-sm sm:-translate-y-1">
                <LayoutTemplate size={14} />
                Resume template library
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
              className="max-w-3xl text-5xl font-extrabold leading-[1.08] tracking-tight text-[#111827] md:text-6xl"
            >
              Build a polished, <span className="text-[#2557a7]">job-ready resume</span> in minutes
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.2 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5f6f86] md:text-xl"
            >
              Create a resume from guided sections, improve every bullet with AI, choose a recruiter-friendly
              template, and export a clean PDF or DOCX when it is ready.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.3 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/builder/start"
                className="inline-flex items-center justify-center rounded-xl bg-[#2557a7] px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-[#1e4a94] active:scale-95"
              >
                Build My Resume Free
              </Link>
              <Link
                href="/browse-templates"
                className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-8 py-3.5 text-sm font-bold text-[#2557a7] shadow-sm transition-all hover:bg-blue-50"
              >
                View Resume Templates
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
              className="mt-7 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-blue-100 bg-white/80 p-4 shadow-sm shadow-blue-100/50">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2557a7]" />
                  <span className="text-sm font-bold leading-snug text-slate-800">{item}</span>
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
            <div className="relative mx-auto w-full max-w-[560px] pb-10 lg:mr-0">
              <div className="absolute -top-5 left-6 z-20 hidden rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-extrabold text-[#2557a7] shadow-xl shadow-blue-100/70 sm:flex sm:items-center sm:gap-2">
                <LayoutTemplate size={14} />
                70+ resume templates
              </div>

              <div className="absolute -left-4 top-8 z-10 hidden rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-xl shadow-blue-100/70 sm:block">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Resume completion</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-extrabold leading-none text-[#2557a7]">95%</span>
                  <span className="pb-1 text-xs font-semibold text-[#2557a7]">Ready</span>
                </div>
              </div>

              <div className="absolute -bottom-1 right-8 z-20 hidden rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-xl shadow-blue-100/70 sm:block">
                <div className="flex items-center gap-2 text-sm font-bold text-[#2557a7]">
                  <Download size={16} />
                  Export ready
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-[#2557a7]">PDF</span>
                  <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-[#2557a7]">DOCX</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-2xl shadow-blue-100/80">
                <div className="grid min-h-[520px] grid-cols-[190px_1fr] bg-slate-50/70">
                  <div className="space-y-3 border-r border-blue-100 bg-white p-4">
                    <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-[#2557a7]">Sections</p>
                    {resumeSections.map((section) => (
                      <div
                        key={section.label}
                        className={`rounded-xl border p-3 shadow-sm ${
                          section.active ? 'border-blue-100 bg-white' : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-slate-900">{section.label}</p>
                          <span className={`h-2 w-2 rounded-full ${section.active ? 'bg-[#2557a7]' : 'bg-blue-200'}`} />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{section.status}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid min-w-0 grid-cols-[1fr_150px] gap-4 p-5">
                    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                      <div className="relative mx-auto mt-6 aspect-[3/4] w-[72%] overflow-hidden rounded-xl border border-blue-100 bg-slate-100 shadow-lg">
                        <Image
                          src="/assets/templates/software_engineering.png"
                          alt="Resume template preview"
                          fill
                          className="object-cover object-top"
                          sizes="260px"
                          priority
                        />
                      </div>
                      <div className="mx-auto mt-5 h-2 w-[72%] rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-[#2557a7] transition-all delay-300 duration-1000"
                          style={{ width: completionReady ? '95%' : '0%' }}
                        />
                      </div>
                      <div className="mx-auto mt-4 grid w-[72%] gap-2">
                        <div className="h-2 rounded-full bg-blue-50" />
                        <div className="h-2 w-10/12 rounded-full bg-blue-50" />
                        <div className="h-2 w-8/12 rounded-full bg-blue-50" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-blue-100 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#2557a7]">Templates</p>
                        <div className="mt-4 space-y-3">
                          {['Classic', 'Modern', 'Compact'].map((template) => (
                            <div key={template} className="flex items-center justify-between rounded-xl border border-blue-100 px-3 py-3">
                              <span className="text-sm font-bold text-slate-700">{template}</span>
                              <span className="h-2 w-2 rounded-full bg-[#2557a7]" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2557a7]">
                          <Sparkles size={18} />
                        </div>
                        <p className="mt-3 text-sm font-extrabold text-[#2557a7]">AI bullet rewrite</p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          Improve impact with metrics, ownership, and action-focused language.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
