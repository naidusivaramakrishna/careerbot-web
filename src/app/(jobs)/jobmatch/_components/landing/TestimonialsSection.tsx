"use client";

import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";

const testimonials = [
  {
    name: "Sarah K.",
    role: "Product Manager · Microsoft",
    avatar: "SK",
    quote:
      "Went from a 2% to 45% interview response rate after fixing the skill gaps the AI detected. This is the only tool I recommend to anyone job hunting.",
    avatarGradient: "from-[#2557A7] to-[#1a3a8f]",
    metric: "ATS Score: 54 → 87",
  },
  {
    name: "Rahul M.",
    role: "Software Engineer · Google",
    avatar: "RM",
    quote:
      "Got 3 job offers in 2 weeks. The match score showed me exactly which keywords I was missing for each company. Incredibly accurate and fast.",
    avatarGradient: "from-emerald-500 to-emerald-700",
    metric: "ATS Score: 62 → 89",
  },
  {
    name: "Priya S.",
    role: "Data Scientist · Amazon",
    avatar: "PS",
    quote:
      "Finally understood why I kept getting rejected. Eight key requirements were missing from my resume. Fixed them — interviews started the very next week.",
    avatarGradient: "from-amber-400 to-orange-500",
    metric: "ATS Score: 49 → 91",
  },
];

const StarRating = () => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) => (
      <svg key={i} className="w-4 h-4 text-[#FFC85E]" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export default function TestimonialsSection() {
  return (
    <section className="py-10 md:py-14 border-b border-slate-100" style={{ background: "#ffffff" }}>
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
              {/* Top row: stars + metric badge */}
              <div className="flex items-center justify-between mb-4">
                <StarRating />
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {t.metric}
                </span>
              </div>

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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-black shrink-0 text-white bg-linear-to-br ${t.avatarGradient} shadow-md`}>
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Linkedin className="w-3 h-3 text-[#0A66C2]" />
                    <span className="text-[10px] text-slate-400">Verified via LinkedIn</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
}
