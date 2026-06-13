'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mail,
  PenLine,
  Sparkles,
  Target,
} from 'lucide-react';
import LandingFooter from '@/app/(landing)/_components/LandingFooter';

const benefits = [
  'Uses your resume as the grounding source',
  'Tailors the letter to each job description',
  'Keeps tone professional and recruiter-friendly',
  'Saves generated letters in your dashboard',
];

const steps = [
  {
    icon: FileText,
    title: 'Start with your resume',
    description: 'CareerBot checks for a parsed resume before generating a letter.',
  },
  {
    icon: Target,
    title: 'Paste the job description',
    description: 'The generator pulls role requirements, keywords, and company context.',
  },
  {
    icon: PenLine,
    title: 'Review and reuse',
    description: 'Create a focused draft you can copy, edit, and use for applications.',
  },
];

export default function CoverLetterMarketingPage() {
  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-1.5 transition-opacity hover:opacity-80" aria-label="CareerBot home">
            <Image
              src="/assets/icons/Logo.png"
              alt="CareerBot"
              width={46}
              height={46}
              className="shrink-0"
              style={{ filter: 'hue-rotate(8deg) saturate(130%) brightness(68%)' }}
              priority
            />
            <span className="text-lg font-black tracking-tight text-[#2557a7]">CareerBOT</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/cover-letter/history"
              className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#2557a7] sm:inline-flex"
            >
              My Letters
            </Link>
            <Link
              href="/cover-letter/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#2557a7] px-4 py-2 text-sm font-bold text-white shadow-[0_6px_18px_rgba(37,87,167,0.22)] transition-all hover:bg-[#1e4a94] active:scale-95"
            >
              Start Free
              <ArrowRight size={14} />
            </Link>
          </div>
        </nav>
      </header>

      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 py-3">
          <Link href="/" className="text-xs font-medium text-slate-500 transition-colors hover:text-[#2557a7]">
            Home
          </Link>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="text-xs font-semibold text-[#2557a7]">Cover Letter</span>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#eef2fb_52%,#eaf7f5_100%)] pb-20 pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(37,87,167,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-[1fr_0.92fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#2557a7] shadow-sm">
              <Sparkles size={14} />
              AI Cover Letter Generator
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Create a tailored cover letter from your resume and job description
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Turn a target role into a focused, professional draft that highlights the right experience without starting from a blank page.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cover-letter/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2557a7] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-[#1e4a94]"
              >
                Generate Cover Letter
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/builder"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-[#2557a7] hover:bg-blue-50 hover:text-[#2557a7]"
              >
                Build Resume First
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-blue-200/70 ring-1 ring-slate-200/80">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2557a7]">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">Cover letter draft</p>
                  <p className="text-xs text-slate-500">Generated from resume + JD</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Ready
              </span>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              <p>Dear Hiring Manager,</p>
              <p>
                I am excited to apply for this role. My experience aligns with your requirements in project delivery,
                stakeholder communication, and measurable business outcomes.
              </p>
              <p>
                CareerBot highlights the most relevant resume evidence, then shapes it into a concise letter for the position.
              </p>
            </div>
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#2557a7]">Matched signals</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                <span className="rounded-lg bg-white px-3 py-2">Role keywords</span>
                <span className="rounded-lg bg-white px-3 py-2">Resume proof</span>
                <span className="rounded-lg bg-white px-3 py-2">Tone control</span>
                <span className="rounded-lg bg-white px-3 py-2">Copy ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
              Why It Helps
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Faster letters with better job fit
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Use it when every application needs a slightly different story, but you do not want to rewrite from scratch.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm font-medium leading-relaxed text-slate-700">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef2fb_100%)] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
              How It Works
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Three steps from role to draft
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl border border-white bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/80">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2557a7] text-white">
                    <Icon size={20} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Step {index + 1}</p>
                  <h3 className="mt-2 text-base font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#2557a7] via-[#173b73] to-[#0f766e] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Ready to generate a tailored cover letter?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-100">
            Start with your resume and a job description. CareerBot will handle the first draft.
          </p>
          <Link
            href="/cover-letter/new"
            className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-white px-10 py-4 text-base font-bold text-[#2557a7] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Free
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
