'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

const features: {
  iconSrc: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  color: string;
  bg: string;
}[] = [
  {
    iconSrc: '/images/landing/feature-resume-builder.png',
    title: 'AI Resume Builder',
    description: 'Create ATS-friendly resumes in minutes with AI suggestions and proven templates.',
    cta: 'Build Resume',
    href: '/builder/start',
    color: '#2b78bc',
    bg: '#eef5ff',
  },
  {
    iconSrc: '/images/landing/feature-parser.png',
    title: 'Resume Parser',
    description: 'Extract and structure your resume data instantly and accurately with AI.',
    cta: 'Parse Resume',
    href: '/parser',
    color: '#0f9f8f',
    bg: '#eafffa',
  },
  {
    iconSrc: '/images/landing/feature-enhancer.png',
    title: 'Resume Enhancer',
    description: 'Improve content, clarity, and impact with AI-powered recommendations.',
    cta: 'Enhance Now',
    href: '/builder/start',
    color: '#7c3aed',
    bg: '#f2edff',
  },
  {
    iconSrc: '/images/landing/feature-cover-letter.png',
    title: 'AI Cover Letter',
    description: 'Generate personalized cover letters that match the job description perfectly.',
    cta: 'Create Cover Letter',
    href: '/cover-letter',
    color: '#4f46e5',
    bg: '#eef2ff',
  },
  {
    iconSrc: '/images/landing/feature-job-search.png',
    title: 'Job Search',
    description: 'Find active job openings from top portals in one clean place.',
    cta: 'Search Jobs',
    href: '/jobs',
    color: '#16a34a',
    bg: '#eafaf0',
  },
  {
    iconSrc: '/images/landing/feature-job-match.png',
    title: 'Job Match',
    description: 'Get AI-powered job matches that fit your skills and experience.',
    cta: 'Find Matches',
    href: '/jobmatch',
    color: '#f97316',
    bg: '#fff2e8',
  },
  {
    iconSrc: '/images/landing/feature-mock-interview.png',
    title: 'Mock Interview',
    description: 'Practice interviews with AI interviewers and get real-time feedback.',
    cta: 'Start Mock Interview',
    href: '/mock-interview',
    color: '#8b5cf6',
    bg: '#f2edff',
  },
  {
    iconSrc: '/images/landing/feature-mock-test.png',
    title: 'Mock Test',
    description: 'Take role-based tests to evaluate your skills and improve your chances.',
    cta: 'Start Mock Test',
    href: '/mock-test',
    color: '#fb7185',
    bg: '#fff1f2',
  },
];

const testCategories = [
  { icon: Sparkles, title: 'Arithmetic', desc: 'Percentages, ratio, time & work', color: '#2f77ff', bg: '#1d5fd8' },
  { icon: ClipboardCheck, title: 'Aptitude', desc: 'Quant, data, verbal ability', color: '#1fc489', bg: '#0d996d' },
  { icon: Brain, title: 'Reasoning', desc: 'Logic, coding, seating, puzzles', color: '#f15a7d', bg: '#d93f68' },
  { icon: Code2, title: 'Technical', desc: 'DSA, SQL, OOP, Programming', color: '#8c6cff', bg: '#6f4fe0' },
  { icon: MessageCircle, title: 'Communication', desc: 'Speaking, workplace communication', color: '#9b5cff', bg: '#753cd7' },
];

const promoCards = [
  {
    title: 'AI Mock Interview',
    description: 'Practice real interview questions based on your target role. Get AI feedback on clarity, confidence, and completeness.',
    bullets: ['Role-specific question bank', 'AI evaluates your answers', 'Improve and track progress'],
    href: '/mock-interview',
    cta: 'Start Mock Interview',
    image: '/images/landing/mock-interview-promo-card.png',
    alt: 'AI mock interview dashboard with avatar, score, and feedback metrics',
  },
  {
    title: 'AI Cover Letter Generator',
    description: 'Generate personalized, job-specific cover letters in seconds using AI.',
    bullets: ['Matches job description', 'Personalized tone', 'ATS & recruiter friendly'],
    href: '/cover-letter',
    cta: 'Create Cover Letter',
    image: '/images/landing/cover-letter-promo-card.png',
    alt: 'Cover letter document preview with approved checkmark',
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#2557a7]">
      {children}
    </span>
  );
}

function BrowserExtensionBand() {
  return (
    <motion.div
      className="mt-5 grid items-center gap-6 rounded-lg border border-[#dce8fb] bg-[#f8fbff] px-7 py-6 lg:grid-cols-[1.45fr_1fr]"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <div className="flex gap-6">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center">
          <Image
            src="/images/landing/browser-extension-icon.png"
            alt=""
            width={96}
            height={96}
            className="h-[70px] w-[70px] object-contain"
            unoptimized
          />
        </div>
        <div>
          <h3 className="text-xl font-black text-[#08143f]">Browser Extension for Job Descriptions</h3>
          <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#435373]">
            Use our Chrome extension to extract job descriptions from any website and use them in Resume, Cover Letter and Job Match instantly.
          </p>
          <Link
            href="/extension"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-black text-[#2557a7] shadow-sm ring-1 ring-[#dce8fb] transition hover:bg-[#eef5ff]"
          >
            <Image
              src="/images/landing/chrome-icon.png"
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] object-contain"
              unoptimized
            />
            Add to Chrome
          </Link>
        </div>
      </div>

      <div className="relative h-[148px] overflow-hidden rounded-lg border border-[#dce8fb] bg-white lg:h-[154px]">
        <Image
          src="/images/landing/browser-extension-panel-v2.png"
          alt="Browser extension extracting a job description from a product manager posting"
          width={2048}
          height={864}
          className="h-full w-full object-cover object-center"
          unoptimized
        />
      </div>
    </motion.div>
  );
}

export function CareerPromoSection() {
  return (
    <section className="bg-white py-8">
      <div className="mx-auto grid max-w-[1320px] gap-5 px-4 lg:grid-cols-2 lg:px-8">
        {promoCards.map((card, index) => (
          <motion.article
            key={card.title}
            className="grid min-h-[260px] overflow-hidden rounded-2xl border border-[#dce8fb] bg-[#f7fbff] p-7 shadow-[0_16px_42px_rgba(37,87,167,0.08)] lg:grid-cols-[0.9fr_1.1fr]"
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-black leading-tight text-[#08143f]">{card.title}</h2>
              <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-[#435373]">{card.description}</p>
              <ul className="mt-5 space-y-3">
                {card.bullets.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-bold text-[#243a68]">
                    <CheckCircle2 size={18} className="shrink-0 fill-[#2b78bc] text-white" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={card.href} className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-black text-[#2b78bc]">
                {card.cta}
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="relative mt-6 min-h-[190px] lg:mt-0">
              <Image
                src={card.image}
                alt={card.alt}
                width={card.title === 'AI Cover Letter Generator' ? 880 : 900}
                height={card.title === 'AI Cover Letter Generator' ? 720 : 520}
                className="h-full w-full object-contain drop-shadow-[0_22px_38px_rgba(37,87,167,0.13)]"
                unoptimized
              />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

export function MockTestSection() {
  return (
    <section id="mock-test" className="bg-white pb-12 pt-3">
      <div className="mx-auto max-w-[1320px] px-4 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#244b9a] bg-[radial-gradient(circle_at_72%_20%,rgba(93,76,222,0.55),transparent_28%),linear-gradient(110deg,#071f55_0%,#0b3174_58%,#071f55_100%)] p-8 text-white shadow-[0_22px_52px_rgba(7,31,85,0.28)] md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <div className="text-center">
                <span className="inline-flex rounded-full bg-[#1454c8] px-4 py-1.5 text-[11px] font-black uppercase tracking-wide text-blue-100 ring-1 ring-white/10">
                  Practice & Improve
                </span>
                <h2 className="mt-4 text-[28px] font-black leading-tight md:text-[34px]">Ace company aptitude and technical tests</h2>
                <p className="mt-3 text-sm font-semibold text-blue-100">Timed, scored and tailored to the company or role you&apos;re targeting.</p>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                {testCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.title} className="text-center sm:text-left lg:text-center">
                      <div
                        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_14px_28px_rgba(0,0,0,0.22)] sm:mx-0 lg:mx-auto"
                        style={{ backgroundColor: category.bg, boxShadow: `0 14px 30px ${category.color}45` }}
                      >
                        <Icon size={24} strokeWidth={2.4} />
                      </div>
                      <h3 className="mt-5 text-sm font-black">{category.title}</h3>
                      <p className="mt-3 text-sm font-medium leading-6 text-blue-100/85">{category.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(139,92,246,0.95),rgba(35,76,198,0.9))] p-7 shadow-[0_18px_42px_rgba(0,0,0,0.18)] ring-1 ring-white/12">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/12 text-white ring-1 ring-white/20">
                <ChartNoAxesColumnIncreasing size={25} />
              </div>
              <h3 className="mt-5 text-xl font-black">Track Performance</h3>
              <p className="mt-4 text-base font-medium leading-7 text-blue-50">
                Detailed analytics, accuracy, percentile and improvement recommendations.
              </p>
              <Link
                href="/mock-test"
                className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-black text-[#6142d6] shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:bg-blue-50"
              >
                Start Mock Test
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FeaturesSection() {
  return (
    <div id="features" className="bg-white">
      <section className="py-8">
        <div className="mx-auto max-w-[1320px] px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>Complete Career Platform</SectionLabel>
            <h2 className="mt-4 text-[30px] font-black leading-tight text-[#08143f] md:text-[36px]">
              Every tool you need to land your next job
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-[#52617e]">
              From building a standout resume to acing the final interview, CareerBot covers every step of your job search in one place.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              return (
                <motion.article
                  key={feature.title}
                  className="group rounded-lg border border-[#dce8fb] bg-white p-5 shadow-[0_10px_26px_rgba(37,87,167,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(37,87,167,0.12)]"
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.38, ease: 'easeOut', delay: index * 0.035 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: feature.bg }}>
                    <Image
                      src={feature.iconSrc}
                      alt=""
                      width={48}
                      height={48}
                      className="h-11 w-11 object-contain"
                      unoptimized
                    />
                  </div>
                  <h3 className="mt-4 text-[15px] font-black text-[#08143f]">{feature.title}</h3>
                  <p className="mt-2 min-h-[58px] text-xs font-medium leading-5 text-[#52617e]">{feature.description}</p>
                  <Link href={feature.href} className="mt-4 inline-flex items-center gap-1.5 text-xs font-black" style={{ color: feature.color }}>
                    {feature.cta}
                    <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                  </Link>
                </motion.article>
              );
            })}
          </div>

          <BrowserExtensionBand />
        </div>
      </section>
    </div>
  );
}
