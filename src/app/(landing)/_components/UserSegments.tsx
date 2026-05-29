'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, RefreshCw, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const segments = [
  {
    icon: <GraduationCap size={24} />,
    title: 'Freshers & Students',
    description: 'No experience? No problem. Build a standout resume that gets you past ATS filters and into your first job.',
    cta: 'Build My First Resume',
    href: '/builder',
  },
  {
    icon: <Briefcase size={24} />,
    title: 'Experienced Professionals',
    description: 'Highlight your achievements, quantify your impact, and tailor your resume for every application in seconds.',
    cta: 'Enhance My Resume',
    href: '/builder',
  },
  {
    icon: <RefreshCw size={24} />,
    title: 'Career Switchers',
    description: 'Repositioning your skills for a new field? Our AI rewrites your experience to match your target role.',
    cta: 'Start My Switch',
    href: '/builder',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'Senior & Executive',
    description: 'Present leadership, strategy, and scale with a polished executive resume that opens C-suite doors.',
    cta: 'Build Executive Resume',
    href: '/builder',
  },
];

export default function UserSegments() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_50%,#eff6ff_100%)] py-24">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
            Who It&apos;s For
          </span>
          <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl md:text-4xl font-bold text-transparent tracking-tight">
            Built for every stage of your career
          </h2>
          <p className="mt-4 text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Whether you&apos;re just starting out or aiming for the top - CareerBot adapts to your journey.
          </p>
        </motion.div>

        {/* Segment cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {segments.map((seg, i) => (
            <motion.div
              key={seg.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.08 }}
              className="group flex flex-col gap-4 rounded-2xl border border-white bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:border-[#2557a7] hover:shadow-xl hover:shadow-blue-100"
            >
              {/* Icon */}
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #2557a7 0%, #0f766e 100%)' }}
              >
                {seg.icon}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-2">{seg.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{seg.description}</p>
              </div>

              {/* CTA */}
              <Link
                href={seg.href}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#2557a7] hover:text-[#1f4e98] transition-colors mt-auto"
              >
                {seg.cta}
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
