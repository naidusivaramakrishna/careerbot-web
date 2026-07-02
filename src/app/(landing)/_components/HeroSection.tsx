'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
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

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-white pb-8 pt-10 md:pb-12 md:pt-14"
      style={{
        background:
          'radial-gradient(circle at 72% 22%, rgba(37,87,167,0.12), transparent 30%), linear-gradient(180deg,#ffffff 0%,#f6faff 72%,#ffffff 100%)',
      }}
    >
      <div className="mx-auto max-w-[1240px] px-4 lg:px-8">
        <div className="grid items-center gap-9 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {trustBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={badge.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[#d7e5ff] bg-[#f3f7ff] px-3 py-1.5 text-[11px] font-black text-[#2557a7]"
                  >
                    <Icon size={13} strokeWidth={2.7} />
                    {badge.label}
                  </span>
                );
              })}
            </div>

            <h1 className="max-w-[620px] text-[42px] font-black leading-[1.02] tracking-tight text-[#08143f] sm:text-[54px] lg:text-[64px]">
              Build a polished, <span className="text-[#0d5be1]">job-ready resume</span> in minutes
            </h1>
            <p className="mt-6 max-w-[560px] text-[15px] font-medium leading-7 text-[#33446c] sm:text-base">
              Create a resume from guided sections, improve every bullet with AI, choose a recruiter-friendly
              template, and export a clean PDF or DOCX when it is ready.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/builder/start"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#0b55d9] px-7 text-sm font-black text-white shadow-[0_14px_28px_rgba(13,91,225,0.24)] transition hover:-translate-y-0.5 hover:bg-[#0848ba]"
              >
                Build My Resume Free
              </Link>
              <Link
                href="/browse-templates"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[#d6e3f8] bg-white px-7 text-sm font-black text-[#2557a7] shadow-[0_12px_28px_rgba(37,87,167,0.08)] transition hover:-translate-y-0.5 hover:bg-[#f7fbff]"
              >
                View Resume Templates
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.08 }}
            className="relative min-h-[330px] lg:min-h-[430px]"
          >
            <div className="relative mx-auto w-full max-w-[600px]">
              <Image
                src="/images/landing/hero-art-v2.png"
                alt="CareerBot resume builder preview with resume score, templates, and AI rewrite panels"
                width={1584}
                height={1024}
                priority
                unoptimized
                className="h-auto w-full object-contain drop-shadow-[0_28px_48px_rgba(37,87,167,0.14)]"
              />
            </div>
          </motion.div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {proofCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-[#dce8fb] bg-white px-4 py-3 shadow-[0_10px_26px_rgba(37,87,167,0.07)]"
              >
                <Icon size={18} className="text-[#0d5be1]" />
                <span className="text-xs font-black leading-5 text-[#10235f]">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
