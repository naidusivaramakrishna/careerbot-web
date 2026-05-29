'use client';

import { FileText, Search, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: '1',
    icon: FileText,
    title: 'Upload or build your resume',
    description: 'Start from scratch or upload your current resume. ~2 min to get started.',
  },
  {
    number: '2',
    icon: Search,
    title: 'Scan and tailor it for each job',
    description: 'Paste a job description and see your match score. Update keywords in ~5 min.',
  },
  {
    number: '3',
    icon: MessageSquare,
    title: 'Apply, track, and prepare',
    description: 'Generate a cover letter, practice the interview, and apply with confidence.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] py-24">
      <div className="relative max-w-6xl mx-auto px-4">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
            How It Works
          </span>
          <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl md:text-4xl font-bold text-transparent">
            Get Hired in 3 Simple Steps
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Gradient connector - desktop only */}
          <div
            className="hidden md:block absolute left-[calc(16.67%+36px)] right-[calc(16.67%+36px)] h-0.5 bg-gradient-to-r from-blue-200 via-teal-400 to-blue-200 rounded-full"
            style={{ top: '56px' }}
            aria-hidden="true"
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-white bg-white p-6 text-center shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-100/60"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.12 }}
              >
                <div className="relative flex-shrink-0">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2557a7] to-teal-600 shadow-md transition-transform duration-300 group-hover:scale-105">
                    <Icon size={28} color="white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-[#2557a7] text-[#2557a7] text-xs font-bold flex items-center justify-center shadow-sm">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#111827]">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-[#6B7280] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
