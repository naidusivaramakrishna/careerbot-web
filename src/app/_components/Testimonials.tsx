'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface Testimonial {
  quote: string;
  name: string;
  city: string;
  initial: string;
  avatarBg: string;
  avatarText: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'My ATS score improved from 45 to 89. I finally understood which keywords were missing and could add them instantly.',
    name: 'Priya S.',
    city: 'Chennai',
    initial: 'P',
    avatarBg: 'bg-violet-100',
    avatarText: 'text-violet-700',
  },
  {
    quote:
      'Spent 30 minutes building a new resume from scratch. The AI enhancement cut my effort in half and made the resume much clearer.',
    name: 'Rahul M.',
    city: 'Hyderabad',
    initial: 'R',
    avatarBg: 'bg-emerald-100',
    avatarText: 'text-emerald-700',
  },
  {
    quote:
      'Before I was applying to jobs blindly. Now I can see my match score and focus on roles where I have a real chance.',
    name: 'Sneha K.',
    city: 'Bangalore',
    initial: 'S',
    avatarBg: 'bg-amber-100',
    avatarText: 'text-amber-700',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f6f9ff_100%)] py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#2557a7] shadow-sm">
            Testimonials
          </span>
          <h2 className="mt-5 bg-gradient-to-r from-slate-950 via-[#2557a7] to-teal-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            Loved by Job Seekers Across India
          </h2>
          <div className="mt-5 flex flex-col items-center gap-1">
            <p className="text-lg font-bold text-[#111827]">12,400+ job seekers</p>
            <p className="text-sm text-[#9CA3AF]">improving their resumes with CareerBot every month</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              className="group flex flex-col gap-4 rounded-2xl border border-l-4 border-white border-l-[#2557a7]/50 bg-white p-6 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-100/60"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
            >
              <span className="-mb-2 select-none font-serif text-5xl leading-none text-blue-100" aria-hidden="true">
                &ldquo;
              </span>

              <div className="flex gap-0.5" aria-label="Positive user feedback">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={16} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                ))}
              </div>

              <p className="flex-1 text-sm leading-relaxed text-[#374151]">{testimonial.quote}</p>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-2">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform duration-300 group-hover:scale-105 ${testimonial.avatarBg}`}>
                  <span className={`text-sm font-semibold ${testimonial.avatarText}`}>{testimonial.initial}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{testimonial.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{testimonial.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
