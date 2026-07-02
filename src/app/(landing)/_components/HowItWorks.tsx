'use client';

import { FileText, Search, Send } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const steps: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: FileText,
    title: 'Upload or build your resume',
    description: 'Start from scratch or upload your current resume.',
  },
  {
    icon: Search,
    title: 'Scan and tailor for each job',
    description: 'Paste a job description and see your match score.',
  },
  {
    icon: Send,
    title: 'Apply, track, and prepare',
    description: 'Generate a cover letter, practice the interview, and apply.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#062b66] py-12 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 78% 34%, rgba(25,108,224,0.35), transparent 24%), linear-gradient(90deg,#06285f 0%,#073372 58%,#05245b 100%)',
        }}
      />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-4 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase text-blue-100 ring-1 ring-white/15">
            How it works
          </span>
          <h2 className="mt-4 text-[30px] font-black leading-tight md:text-[36px]">Get Hired in 3 Simple Steps</h2>

          <div className="relative mt-8 grid gap-8 md:grid-cols-3">
            <div className="absolute left-[15%] right-[15%] top-8 hidden border-t border-dashed border-blue-200/45 md:block" />
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  className="relative text-center"
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0d5be1] shadow-[0_16px_28px_rgba(0,0,0,0.16)]">
                    <Icon size={25} strokeWidth={2.7} />
                  </div>
                  <h3 className="mt-5 text-sm font-black leading-snug">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-[180px] text-xs font-medium leading-5 text-blue-100">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="relative hidden min-h-[250px] lg:block">
          <Image
            src="/images/landing/how-art-v2.png"
            alt="CareerBot job preparation illustration"
            width={1792}
            height={1024}
            loading="eager"
            className="ml-auto h-auto w-[540px] object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.18)]"
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}
