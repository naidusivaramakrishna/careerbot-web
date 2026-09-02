"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, BarChart2 } from "lucide-react";

interface CTABandProps {
  onAnalyzeClick?: () => void;
}

const inlineStats = [
  { label: "50,000+ Resumes Analyzed", icon: BarChart2 },
  { label: "92% Match Accuracy",        icon: Zap },
  { label: "Avg. 14s Analysis",         icon: ShieldCheck },
];

export default function CTABand({ onAnalyzeClick }: CTABandProps) {
  return (
    <section
      className="py-20 md:py-24 px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef4ff 50%, #e8f5f3 100%)", borderTop: "1px solid #e2e8f0" }}
    >

      <div className="relative max-w-3xl mx-auto text-center">

        {/* Badge */}
        <motion.span
          className="inline-block text-[11px] font-bold text-[#2557A7] uppercase tracking-widest bg-[#FFC85E] px-4 py-1.5 rounded-full mb-6"
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          Free Analysis
        </motion.span>

        {/* Headline */}
        <motion.h2
          className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Ready to land your dream job?
        </motion.h2>

        {/* Subtext */}
        <motion.p
          className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed mb-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          See exactly how well your resume fits any job — in seconds. No credit card. No setup.
        </motion.p>

        {/* CTA button */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <button
            onClick={onAnalyzeClick}
            className="inline-flex items-center gap-2 bg-[#2557a7] text-white hover:bg-[#1e4a94] font-bold px-9 py-4 rounded-xl text-sm shadow-[0_8px_32px_rgba(37,87,167,0.25)] hover:shadow-[0_12px_40px_rgba(37,87,167,0.35)] hover:scale-[1.03] active:scale-100 transition-all duration-300"
          >
            Analyze My Resume Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Inline stat pills */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.22 }}
        >
          {inlineStats.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold px-3.5 py-1.5 rounded-full shadow-sm"
            >
              <Icon className="w-3.5 h-3.5 text-[#FFC85E] shrink-0" />
              {label}
            </span>
          ))}
        </motion.div>

        {/* Trust row */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-slate-400 text-xs"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            No credit card required
          </span>
          <span className="hidden sm:block w-px h-4 bg-slate-200" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Results in ~15 seconds
          </span>
          <span className="hidden sm:block w-px h-4 bg-slate-200" />
          <span>50,000+ analyses done</span>
        </motion.div>

      </div>
    </section>
  );
}
