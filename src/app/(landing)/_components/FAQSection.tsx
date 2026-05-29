'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const faqs = [
  {
    q: 'Is CareerBot free?',
    a: 'Yes. CareerBot has a free plan with 50 credits per month. Access the ATS Scanner, Resume Builder, and basic templates - no credit card required. Paid plans unlock unlimited scans, AI Enhancer, and premium features.',
  },
  {
    q: 'What is ATS?',
    a: 'ATS (Applicant Tracking System) is software that many companies use to filter and organize applications before a human reads them. If your resume isn\'t ATS-friendly, it may be skipped automatically. CareerBot\'s ATS Scanner checks your resume and shows you exactly what to improve.',
  },
  {
    q: 'Can I scan my resume against a job description?',
    a: 'Yes. Upload a job description and CareerBot will scan your resume against it, showing you your match score and missing keywords. This helps you tailor your resume before applying.',
  },
  {
    q: 'How long does it take to build a resume?',
    a: 'Most users complete their first resume in under 10 minutes. If you\'re enhancing an existing resume with AI, it takes under 30 seconds. Templates are pre-structured so you just fill in your details.',
  },
  {
    q: 'Can I download as PDF or DOCX?',
    a: 'Yes. All resumes can be downloaded as PDF instantly. Pro plan users can also export as DOCX for editing in Word.',
  },
  {
    q: 'Is my resume data safe?',
    a: 'Yes. Your data is encrypted, stored securely, and never shared with third parties. You can delete your data anytime from your account settings. We are fully GDPR-compliant.',
  },
  {
    q: 'Does CareerBot support cover letters?',
    a: 'Yes. CareerBot includes an AI-powered Cover Letter generator that creates personalized letters tailored to any job description.',
  },
];

function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.05 }}
      className="overflow-hidden rounded-xl border border-white bg-white shadow-md shadow-slate-200/70 ring-1 ring-slate-200/80 transition-all duration-300 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-100/60"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-blue-50/60"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
        <ChevronDown
          size={17}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed pt-3">{faq.a}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function FAQSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-24">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">FAQ</span>
          <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl md:text-4xl font-bold text-transparent tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-base text-gray-500 leading-relaxed">
            Everything you need to know before getting started.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.q} faq={faq} index={i} />
          ))}
        </div>

        {/* Bottom contact prompt */}
        <motion.p
          className="mt-8 text-center text-sm text-gray-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Still have questions?{' '}
          <a
            href="mailto:support@careerbot.com"
            className="text-[#2557a7] font-medium hover:underline"
          >
            Email us at support@careerbot.com
          </a>
        </motion.p>
      </div>
    </section>
  );
}
