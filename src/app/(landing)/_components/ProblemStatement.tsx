'use client';

import { motion } from 'framer-motion';
import { FileWarning, Layers, RefreshCw, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ProblemCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

const problems: ProblemCard[] = [
  {
    icon: Layers,
    title: 'Formatting breaks confidence',
    description: 'Most resume tools make candidates fight spacing, sections, exports, and template consistency before the content is even ready.',
  },
  {
    icon: RefreshCw,
    title: 'Every role needs a different version',
    description: 'A generic resume rarely matches the job description. Candidates need faster ways to tailor bullets, skills, and summaries.',
  },
  {
    icon: FileWarning,
    title: 'Weak bullets hide real impact',
    description: 'Responsibilities often sound flat without metrics, ownership, tools, and outcomes recruiters can scan quickly.',
  },
  {
    icon: Send,
    title: 'Export anxiety slows applications',
    description: 'Before applying, job seekers need a clean PDF or DOCX that looks professional and stays readable after download.',
  },
];

export default function ProblemStatement() {
  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <motion.div
          className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr]"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div>
            <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#2557a7]">
              The problem
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-4xl">
              A resume should not feel like a design project before every application.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              CareerBot keeps resume creation focused on the work that matters: clear sections,
              stronger bullets, recruiter-friendly layouts, and clean exports.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {problems.map((problem, index) => {
              const Icon = problem.icon;
              return (
                <motion.div
                  key={problem.title}
                  className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/70"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-70px' }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.06 }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-[#2557a7]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 text-base font-extrabold text-slate-950">{problem.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{problem.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
