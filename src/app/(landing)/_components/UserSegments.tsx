'use client';

import { motion } from 'framer-motion';
import { Briefcase, Crown, GraduationCap, RefreshCw } from 'lucide-react';

const segments = [
  {
    icon: GraduationCap,
    title: 'Freshers & Students',
    description: 'No experience? Build a standout resume that gets past ATS.',
  },
  {
    icon: Briefcase,
    title: 'Experienced Professionals',
    description: 'Highlight achievements, impact, and tailor your resume in seconds.',
  },
  {
    icon: RefreshCw,
    title: 'Career Switchers',
    description: 'Rewrite your experience to match your target role with confidence.',
  },
  {
    icon: Crown,
    title: 'Senior & Executive',
    description: 'Present leadership and impact with a polished executive resume.',
  },
];

export default function UserSegments() {
  return (
    <section className="bg-white py-11">
      <div className="mx-auto max-w-[1240px] px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.42 }}
          >
            <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1.5 text-[10px] font-black uppercase text-[#2557a7]">
              Who it&apos;s for
            </span>
            <h2 className="mt-4 text-[30px] font-black leading-tight text-[#08143f] md:text-[36px]">
              Built for every stage of your career
            </h2>
            <p className="mt-3 max-w-lg text-sm font-medium leading-6 text-[#52617e]">
              Whether you&apos;re just starting out or aiming for the top, CareerBot adapts to your journey.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {segments.map((segment, index) => {
              const Icon = segment.icon;
              return (
                <motion.article
                  key={segment.title}
                  className="text-center"
                  initial={false}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.38, delay: index * 0.05 }}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#0d5be1]">
                    <Icon size={27} strokeWidth={2.5} />
                  </div>
                  <h3 className="mt-4 text-sm font-black text-[#08143f]">{segment.title}</h3>
                  <p className="mt-2 text-xs font-medium leading-5 text-[#52617e]">{segment.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
