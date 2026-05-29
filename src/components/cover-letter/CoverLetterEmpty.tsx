import { Fragment } from 'react';
import Link from 'next/link';
import { FileText, ArrowRight, Sparkles } from 'lucide-react';

const STEPS = [
  { number: '1', label: 'Upload Resume' },
  { number: '2', label: 'Paste Job Description' },
  { number: '3', label: 'Get Letter' },
] as const;

const PILLS = [
  { icon: '✨', label: 'AI-Powered' },
  { icon: '🎯', label: 'Job-Targeted' },
  { icon: '📥', label: 'Download PDF' },
] as const;

export default function CoverLetterEmpty() {
  return (
    <div className="flex-1 flex items-center justify-center px-8 py-12 overflow-y-auto">
      <div className="flex flex-col items-center text-center max-w-lg w-full">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 flex-shrink-0">
          <FileText className="w-9 h-9 text-[#2557a7]" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-slate-800 mb-3">
          Create Your First Cover Letter
        </h2>

        {/* Subtext */}
        <p className="text-slate-500 leading-relaxed mb-6 max-w-md">
          Generate a personalized, job-targeted cover letter in seconds.
          Tailored to your resume and job description.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {PILLS.map((pill) => (
            <span
              key={pill.label}
              className="text-sm text-slate-600 bg-slate-100 rounded-full px-3 py-1"
            >
              {pill.icon} {pill.label}
            </span>
          ))}
        </div>

        {/* How it works — 3 mini steps */}
        <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
          {STEPS.map((step, i) => (
            <Fragment key={step.number}>
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center min-w-[100px]">
                <p className="text-xs font-bold text-[#2557a7] mb-1">{step.number}</p>
                <p className="text-xs font-medium text-slate-700">{step.label}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
            </Fragment>
          ))}
        </div>

        {/* Primary CTA */}
        <Link
          href="/cover-letter/new"
          className="inline-flex items-center justify-center gap-2 bg-[#2557a7] hover:bg-[#1e4a94] text-white font-semibold py-3.5 px-8 rounded-xl text-base transition-all shadow-md hover:shadow-lg max-w-sm w-full"
        >
          <Sparkles className="w-4 h-4" />
          Generate Your First Cover Letter
        </Link>

        {/* Micro-copy */}
        <p className="mt-3 text-xs text-slate-400">
          Free · No credit card required · Takes 30 seconds
        </p>
      </div>
    </div>
  );
}