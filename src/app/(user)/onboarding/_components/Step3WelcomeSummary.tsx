"use client";

/**
 * Step 2 (formerly Step 3): Welcome / Completion Screen
 *
 * Two-column layout matching Step 1: left = summary, right = features + CTA
 */

import React from 'react';
import {
  CheckCircle, FileText, ScanSearch, Wand2,
  Briefcase, MessageSquare, ArrowRight, Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Step3WelcomeSummaryProps {
  userName:            string;
  creditsAllocated:    number;
  profileCompleteness: number;
  resumeUploaded:      boolean;
}

const FEATURES = [
  { icon: FileText,      label: 'Resume Builder', desc: 'ATS-optimised resumes',    bg: '#eff6ff', color: '#2557a7' },
  { icon: ScanSearch,    label: 'ATS Scanner',    desc: 'Job compatibility score',   bg: '#f0f9ff', color: '#0284c7' },
  { icon: Wand2,         label: 'AI Enhancer',    desc: 'Rewrite & improve bullets', bg: '#faf5ff', color: '#7c3aed' },
  { icon: Briefcase,     label: 'Job Finder',     desc: 'Browse 150+ openings',      bg: '#fffbeb', color: '#d97706' },
  { icon: MessageSquare, label: 'Interview Prep', desc: 'Practice with AI feedback', bg: '#f0fdf4', color: '#16a34a' },
];

export const Step3WelcomeSummary: React.FC<Step3WelcomeSummaryProps> = ({
  userName,
  creditsAllocated,
  profileCompleteness,
  resumeUploaded,
}) => {
  const router = useRouter();

  const setupItems = [
    { label: 'Account created & verified' },
    { label: `${creditsAllocated} free credits activated` },
    { label: `Profile ${profileCompleteness}% complete` },
    ...(resumeUploaded ? [{ label: 'Resume parsed & auto-filled' }] : []),
  ];

  return (
    <div className="flex gap-8 h-full">

      {/* ── Left column ── */}
      <div className="flex-1 flex flex-col gap-3.5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #2557a7, #5896d7)',
              boxShadow: '0 4px 14px rgba(37,87,167,0.35)',
            }}
          >
            <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              You&apos;re all set, {userName}! 🎉
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome to your AI-powered career command centre
            </p>
          </div>
        </div>

        {/* Credits pill */}
        <div
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
          style={{ background: '#eff6ff', border: '1px solid #c7ddf8' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-xs font-semibold text-[#2557a7]">
            {creditsAllocated} free credits ready to use
          </span>
        </div>

        {/* Setup items */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            What we&apos;ve set up for you
          </label>
          <div className="flex flex-col gap-2">
            {setupItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{
                    width: '18px', height: '18px',
                    background: 'linear-gradient(135deg, #2557a7, #5896d7)',
                  }}
                >
                  <svg width="8" height="7" viewBox="0 0 9 8" fill="none" aria-hidden>
                    <path d="M1.5 4L3.5 6L7.5 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700 font-medium leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Help link at bottom */}
        <p className="mt-auto text-xs text-gray-400">
          Need help?{' '}
          <a href="/help" className="font-semibold hover:underline" style={{ color: '#2557a7' }}>
            View Getting Started Guide →
          </a>
        </p>

      </div>

      {/* ── Vertical divider ── */}
      <div className="w-px bg-gray-100 self-stretch" />

      {/* ── Right column ── */}
      <div className="w-72 flex flex-col gap-3 shrink-0">

        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            What you can do now
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-start gap-2 p-2.5 rounded-xl"
                  style={{
                    background: f.bg,
                    border: `1px solid ${f.color}18`,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: f.color + '20' }}
                  >
                    <Icon className="w-3 h-3" style={{ color: f.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 leading-tight truncate">{f.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug line-clamp-1">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA button at bottom */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-auto w-full py-2 px-6 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            background: '#2557a7',
            boxShadow: '0 4px 14px rgba(37,87,167,0.35)',
          }}
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
};
