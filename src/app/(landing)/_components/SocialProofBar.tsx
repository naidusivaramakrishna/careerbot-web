'use client';

import { motion } from 'framer-motion';

const stats = [
  { value: '12,400+', label: 'Job seekers' },
  { value: '5 lakh+', label: 'Job listings' },
  { value: '18+', label: 'ATS templates' },
  { value: '3', label: 'Career stages' },
];

export default function SocialProofBar() {
  return (
    <div className="relative overflow-hidden border-y border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_48%,#eef7f5_100%)] py-12">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`group flex flex-col items-center rounded-2xl border border-white bg-white/80 p-5 text-center shadow-sm shadow-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-100/70 ${
                i === 0 ? 'md:bg-[#2557a7] md:text-white' : ''
              }`}
            >
              <span className={`text-3xl font-bold leading-none ${i === 0 ? 'md:text-white' : 'bg-gradient-to-r from-[#2557a7] to-teal-600 bg-clip-text text-transparent'}`}>
                {stat.value}
              </span>
              <span className={`mt-2 text-sm ${i === 0 ? 'md:text-blue-100' : 'text-slate-500'}`}>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
