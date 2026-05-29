'use client';

import Link from 'next/link';
import { ArrowRight, Briefcase, CheckCircle2, FileText, Mail, Mic, PenLine, ScanSearch, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface JourneyCard {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

interface JourneyGroup {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  color: string;
  cards: JourneyCard[];
  metrics: string[];
}

const groups: JourneyGroup[] = [
  {
    eyebrow: 'Build',
    title: 'Create a resume recruiters can read',
    description: 'Start with ATS-friendly templates, improve weak bullets, and export a polished resume without fighting formatting.',
    cta: 'Build My Resume',
    href: '/builder',
    color: '#f59e0b',
    metrics: ['18+ templates', 'PDF and DOCX', 'Real-time guidance'],
    cards: [
      {
        icon: FileText,
        title: 'Resume Builder',
        description: 'Build from scratch with sections designed for Indian job roles.',
        accent: 'bg-amber-50 text-amber-700',
      },
      {
        icon: PenLine,
        title: 'AI Enhancer',
        description: 'Rewrite vague duties into measurable, recruiter-friendly achievements.',
        accent: 'bg-violet-50 text-violet-700',
      },
      {
        icon: CheckCircle2,
        title: 'Template checks',
        description: 'Keep content readable, searchable, and ready to export.',
        accent: 'bg-emerald-50 text-emerald-700',
      },
    ],
  },
  {
    eyebrow: 'Tailor',
    title: 'Match every application to the role',
    description: 'Paste the job description, find keyword gaps, generate targeted content, and know your fit before applying.',
    cta: 'Scan My Resume',
    href: '/atslogin',
    color: '#0d9488',
    metrics: ['JD match score', 'Missing keywords', 'Cover letters'],
    cards: [
      {
        icon: ScanSearch,
        title: 'ATS Scanner',
        description: 'Score your resume against a specific job and see what to fix.',
        accent: 'bg-teal-50 text-teal-700',
      },
      {
        icon: Target,
        title: 'JD Match',
        description: 'Compare skills, role terms, and relevance before you submit.',
        accent: 'bg-blue-50 text-blue-700',
      },
      {
        icon: Mail,
        title: 'Cover Letter',
        description: 'Generate a tailored letter from your resume and target job.',
        accent: 'bg-rose-50 text-rose-700',
      },
    ],
  },
  {
    eyebrow: 'Apply & Prepare',
    title: 'Move from shortlist to interview-ready',
    description: 'Find matching jobs, apply with the right resume, and practice interviews and company tests in the same workspace.',
    cta: 'Explore Jobs',
    href: '/jobs',
    color: '#2557a7',
    metrics: ['5 lakh+ jobs', 'Mock interviews', 'Company tests'],
    cards: [
      {
        icon: Briefcase,
        title: 'Job Search',
        description: 'Browse roles and filter by fit, location, salary, and relevance.',
        accent: 'bg-blue-50 text-blue-700',
      },
      {
        icon: Target,
        title: 'Smart Match',
        description: 'See how closely your resume fits each job before applying.',
        accent: 'bg-cyan-50 text-cyan-700',
      },
      {
        icon: Mic,
        title: 'Interview Prep',
        description: 'Practice mock interviews, aptitude tests, and communication skills.',
        accent: 'bg-emerald-50 text-emerald-700',
      },
    ],
  },
];

function ProductMock({ group }: { group: JourneyGroup }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-white transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            CareerBot workspace
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{group.eyebrow} flow</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: group.color }}
        >
          <CheckCircle2 size={20} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {group.metrics.map((metric, index) => (
          <div key={metric} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{metric}</span>
              <span className="font-semibold" style={{ color: group.color }}>
                {index === 0 ? 'Ready' : 'Included'}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full"
                style={{ width: `${90 - index * 12}%`, backgroundColor: group.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
        <p className="text-xs font-semibold text-slate-900">Recommended next step</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Use this flow before your next application to keep the resume, job match, and interview prep connected.
        </p>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f4f8ff_38%,#f8fafc_100%)] py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage: 'linear-gradient(#dbeafe 1px, transparent 1px), linear-gradient(90deg, #dbeafe 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
        aria-hidden="true"
      />
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="rounded-full border border-blue-100 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
            Complete Career Suite
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            One career workspace: build, tailor, apply, prepare
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#6B7280]">
            CareerBot connects the steps that usually live in separate tools, so every application can be more focused.
          </p>
        </motion.div>

        <div className="mt-14 space-y-8">
          {groups.map((group, index) => (
            <motion.div
              key={group.title}
              className="group relative grid grid-cols-1 gap-8 overflow-hidden rounded-3xl border border-white bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-100/70 lg:grid-cols-[1.05fr_0.95fr] lg:p-8"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
            >
              <div>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                  style={{ backgroundColor: group.color }}
                >
                  {group.eyebrow}
                </span>
                <h3 className="mt-4 bg-gradient-to-r from-slate-950 via-slate-800 to-[#2557a7] bg-clip-text text-2xl font-bold leading-tight text-transparent md:text-3xl">
                  {group.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
                  {group.description}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {group.cards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.title} className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg">
                        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${card.accent}`}>
                          <Icon size={18} />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">{card.title}</h4>
                        <p className="mt-2 text-xs leading-relaxed text-gray-500">{card.description}</p>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href={group.href}
                  className="mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ backgroundColor: group.color }}
                >
                  {group.cta}
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="flex items-center justify-center">
                <ProductMock group={group} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
