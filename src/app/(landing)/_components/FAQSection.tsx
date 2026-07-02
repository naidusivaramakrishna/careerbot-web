'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const faqs = [
  {
    q: 'Is CareerBot free?',
    a: 'Yes. CareerBot has a free plan with resume builder access and basic career tools. Paid plans unlock higher usage and premium AI features.',
  },
  {
    q: 'How accurate is the AI enhancement?',
    a: 'CareerBot uses your resume content and target role context to suggest clearer, more impact-focused bullet points. You stay in control of every edit.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'You can export resumes as PDF. Paid plans can include DOCX export depending on the plan limits shown at checkout.',
  },
  {
    q: 'Can I scan my resume against a job description?',
    a: 'Yes. Paste a job description and CareerBot compares your resume against role keywords, skills, and requirements.',
  },
  {
    q: 'Does CareerBot support cover letters?',
    a: 'Yes. The cover letter tool generates personalized drafts matched to your resume and the job description.',
  },
  {
    q: 'How long does it take to build a resume?',
    a: 'Most users can create a strong first draft in minutes, then improve sections with guided AI suggestions.',
  },
  {
    q: 'Can I download as PDF or DOCX?',
    a: 'Yes. PDF export is available, and DOCX export is supported where included in your plan.',
  },
  {
    q: 'Is my resume data safe?',
    a: 'Your data is handled securely and used to power your career workflow. You can manage account data from settings.',
  },
  {
    q: 'What makes CareerBot better than others?',
    a: 'CareerBot combines resume building, ATS checks, job matching, cover letters, mock interviews, and mock tests in one connected workflow.',
  },
];

function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.32, delay: index * 0.025 }}
      className="overflow-hidden rounded-lg border border-[#dce8fb] bg-white"
    >
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-black text-[#08143f]">{faq.q}</span>
        <ChevronDown size={16} className={`shrink-0 text-[#2557a7] transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="border-t border-[#e8f0fb] px-5 pb-4 pt-3 text-sm font-medium leading-6 text-[#52617e]">{faq.a}</p>}
    </motion.div>
  );
}

export default function FAQSection() {
  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-[1080px] px-4">
        <div className="text-center">
          <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1.5 text-[10px] font-black uppercase text-[#2557a7]">
            FAQ
          </span>
          <h2 className="mt-3 text-[28px] font-black leading-tight text-[#08143f] md:text-[34px]">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {faqs.map((faq, index) => (
            <FAQItem key={faq.q} faq={faq} index={index} />
          ))}
        </div>

        <p className="mt-7 text-center text-sm font-medium text-[#52617e]">
          Still have questions? Email us at{' '}
          <a href="mailto:support@careerbot.com" className="font-black text-[#2557a7] hover:underline">
            support@careerbot.com
          </a>
        </p>
      </div>
    </section>
  );
}
