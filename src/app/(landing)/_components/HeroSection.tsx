'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Download,
  LayoutTemplate,
  Sparkles,
  UserRound,
} from 'lucide-react';

const trustBadges = [
  { icon: Sparkles, label: 'AI Powered' },
  { icon: Bot, label: 'Trusted by 1M+ Job Seekers' },
];

const proofCards = [
  { icon: LayoutTemplate, label: 'ATS-friendly layouts' },
  { icon: Sparkles, label: 'AI-written bullet points' },
  { icon: Download, label: 'One-click PDF & DOCX export' },
  { icon: UserRound, label: 'Used by 1M+ job seekers' },
];

function HeroDashboard() {
  return (
    <div className="relative w-full max-w-[560px] sm:max-w-[720px] lg:max-w-[min(59vw,1160px)]">
      {/* exact mockup artwork — includes its own frame, pedestal and glow */}
      <Image
        src="/images/landing/hero-mockup-exact.png"
        alt="CareerBOT resume builder dashboard with template, score, job match, and export panels"
        width={988}
        height={710}
        priority
        sizes="(min-width: 1024px) 60vw, (min-width: 640px) 720px, 100vw"
        className="h-auto w-full"
      />
    </div>
  );
}

export default function HeroSection() {
  return (
    <section
      className="relative isolate overflow-hidden bg-white pb-8 pt-12 md:pb-11 md:pt-16 lg:pt-10"
    >
      <div className="mx-auto max-w-[1728px] px-5 lg:px-[60px]">
        <div className="grid items-center gap-8 lg:grid-cols-[40%_minmax(0,1fr)] lg:gap-[28px]">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative z-10"
          >
            <div className="mb-12 flex flex-wrap items-center gap-3">
              {trustBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={badge.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#2b78bc] lg:px-4 lg:py-2 lg:text-[11px]"
                  >
                    <Icon size={13} strokeWidth={2.7} />
                    {badge.label}
                  </span>
                );
              })}
            </div>

            <h1 className="text-[32px] font-bold leading-[1.17] text-[#06113f] sm:text-[40px] lg:text-[48px]">
              Build a polished,
              <br />
              <span className="text-[#2b78bc]">job-ready</span>
              <br />
              <span className="text-[#2b78bc]">resume</span> in
              <br />
              minutes
            </h1>
            <p className="mt-6 max-w-[600px] text-[13px] font-normal leading-[22px] text-[#273b68] lg:text-sm lg:leading-[24px]">
              Create a resume from guided sections, improve every bullet with AI, choose a recruiter-friendly
              template, and export a clean PDF or DOCX when it is ready.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/builder"
                className="inline-flex items-center justify-center rounded-xl bg-[#2557a7] px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-[#1e4a94] active:scale-95"
              >
                Build My Resume Free
                <ArrowRight size={16} strokeWidth={2.8} />
              </Link>
              <Link
                href="/browse-templates"
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-lg border border-[#d6e3f8] bg-white px-7 text-[13px] font-medium text-[#22679f] transition hover:-translate-y-0.5"
              >
                View Resume Templates
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
            className="relative flex justify-center lg:-mr-[60px] lg:justify-end"
          >
            <HeroDashboard />
          </motion.div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {proofCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-[#dce8fb] bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-[#bdd4ff]"
              >
                <Icon size={18} className="shrink-0 text-[#2b78bc]" />
                <span className="text-[11px] font-semibold leading-5 text-[#08184b] lg:text-xs">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
