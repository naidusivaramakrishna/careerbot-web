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
      className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_82%_21%,rgba(125,211,252,0.46),transparent_28%),radial-gradient(circle_at_74%_76%,rgba(99,102,241,0.22),transparent_31%),radial-gradient(circle_at_21%_62%,rgba(219,234,254,0.72),transparent_36%),linear-gradient(135deg,#ffffff_0%,#f7fbff_42%,#eef6ff_100%)] pb-8 pt-12 md:pb-11 md:pt-16 lg:pt-10"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-28 bottom-5 h-72 w-[620px] rotate-[-17deg] rounded-[999px] bg-[linear-gradient(90deg,rgba(219,234,254,0),rgba(147,197,253,0.36),rgba(255,255,255,0))] blur-2xl" />
        <div className="absolute bottom-20 right-[-7%] h-40 w-[760px] rotate-[-5deg] rounded-[999px] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(79,70,229,0.22),rgba(14,165,233,0.2),rgba(255,255,255,0))] blur-xl" />
        <div className="absolute left-[45%] top-[38%] h-px w-[680px] -rotate-[21deg] bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <div className="absolute right-6 top-20 h-3 w-3 rounded-full bg-white shadow-[0_0_22px_rgba(37,99,235,0.34)]" />
        <div className="absolute bottom-24 left-[43%] h-2 w-2 rounded-full bg-white shadow-[0_0_18px_rgba(37,99,235,0.32)]" />
      </div>

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
                    className="inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-white/58 px-3 py-1.5 text-[10px] font-semibold text-[#2b78bc] shadow-[0_12px_30px_rgba(37,99,235,0.08)] backdrop-blur-md lg:px-4 lg:py-2 lg:text-[11px]"
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
                className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-lg border border-[#d6e3f8] bg-white/88 px-7 text-[13px] font-medium text-[#22679f] shadow-[0_18px_34px_rgba(37,87,167,0.1)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_20px_40px_rgba(37,87,167,0.14)]"
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
                className="flex items-center gap-3 rounded-lg border border-[#dce8fb] bg-white/80 px-4 py-3 shadow-[0_16px_36px_rgba(37,87,167,0.09)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#bdd4ff] hover:bg-white"
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
