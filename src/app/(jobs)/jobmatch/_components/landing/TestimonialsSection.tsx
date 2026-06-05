"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Product Manager · Microsoft",
    avatar: "SK",
    quote:
      "Went from a 2% to 45% interview response rate after fixing the skill gaps the AI detected. This is the only tool I recommend to anyone job hunting.",
    avatarClass: "bg-[#EEF4FF] text-[#2557A7]",
  },
  {
    name: "Rahul M.",
    role: "Software Engineer · Google",
    avatar: "RM",
    quote:
      "Got 3 job offers in 2 weeks. The match score showed me exactly which keywords I was missing for each company. Incredibly accurate and fast.",
    avatarClass: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "Priya S.",
    role: "Data Scientist · Amazon",
    avatar: "PS",
    quote:
      "Finally understood why I kept getting rejected. Eight key requirements were missing from my resume. Fixed them — interviews started the very next week.",
    avatarClass: "bg-amber-50 text-amber-700",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="bg-slate-50 py-20 md:py-24 border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-block text-[11px] font-bold text-[#2557A7] uppercase tracking-widest bg-[#EEF4FF] px-4 py-1.5 rounded-full mb-5">
            Success Stories
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-black mb-4 leading-tight">
            Real Results from Real People
          </h2>
          <p className="text-slate-500 text-base max-w-lg mx-auto leading-relaxed">
            Join 50,000+ professionals who landed their dream jobs using CareerBot&apos;s AI matching engine.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-white border-2 border-slate-100 hover:border-[#FFC85E] rounded-2xl p-6 flex flex-col transition-colors duration-300"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
            >
              {/* Yellow quote mark */}
              <span className="text-5xl font-black text-[#FFC85E] leading-none mb-3 select-none">
                &ldquo;
              </span>

              {/* Quote */}
              <p className="text-[14px] text-slate-700 leading-relaxed flex-1 mb-6">
                {t.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-black shrink-0 ${t.avatarClass}`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rating strip */}
        <motion.div
          className="flex justify-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-6 sm:gap-0 sm:divide-x sm:divide-slate-100 bg-white border-2 border-slate-100 rounded-2xl px-8 py-5">
            <div className="flex flex-col items-center px-4">
              <p className="text-3xl font-black text-[#2557A7]">4.8</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Average rating</p>
            </div>
            <div className="flex flex-col items-center px-4">
              <p className="text-3xl font-black text-black">2,400+</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Verified reviews</p>
            </div>
            <div className="flex flex-col items-center px-4">
              <p className="text-3xl font-black text-black">50,000+</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Professionals helped</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
