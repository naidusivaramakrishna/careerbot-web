"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";

const beforeItems = [
  "Missing role-specific keywords",
  "No quantified achievements",
  "Tables & graphics block ATS",
  "Weak passive action verbs",
  "No professional summary",
  "Images & graphics embedded",
  "Inconsistent section headings",
  "Skills section missing entirely",
];

const afterItems = [
  "12 role-specific keywords added",
  "Impact metrics in every bullet",
  "Clean ATS-friendly layout",
  "Strong active action verbs",
  "Professional summary added",
  "No images or graphics used",
  "Standard section headings applied",
  "Skills section fully optimized",
];

interface BeforeAfterSectionProps {
  onScanClick?: () => void;
}

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.05 } }),
};

export default function BeforeAfterSection({ onScanClick }: BeforeAfterSectionProps) {
  return (
    <section
      className="py-14 md:py-20"
      style={{ background: "#ffffff" }}
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest border border-[#dde8f8]">
            <Sparkles className="w-3 h-3" />
            Why It Matters
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#0f172a] mb-3 leading-tight">
            Why Qualified Candidates Still Don&apos;t Get Interview Calls
          </h2>
          <p className="text-[14px] text-slate-500 max-w-2xl mx-auto leading-relaxed mb-6">
            Most companies use ATS to automatically filter resumes before any human sees them.
            If your resume has formatting issues, missing keywords, or vague bullets — it gets
            rejected automatically, even if you&apos;re a perfect fit.
          </p>
          <button
            onClick={onScanClick}
            className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-full transition-all duration-300 text-sm hover:scale-105 active:scale-100 text-white"
            style={{
              background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
              boxShadow: "0 4px 16px rgba(37,87,167,0.30)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Scan Your Resume for Free
          </button>
        </motion.div>

        {/* Two-column comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[13px] font-bold text-slate-700">Before CareerBot</span>
              </div>
              <span className="text-[12px] font-black text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                38 / 100
              </span>
            </div>

            {/* Name strip */}
            <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/60">
              <p className="text-[13px] font-semibold text-slate-700">Jordan Mitchell</p>
              <p className="text-[11px] text-slate-400">Senior Product Designer</p>
            </div>

            {/* Items */}
            <div className="px-5 py-4 space-y-2">
              {beforeItems.map((label, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={cardVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-center gap-3 py-1.5"
                >
                  <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 text-red-500" strokeWidth={2.5} />
                  </div>
                  <span className="text-[12.5px] text-slate-600">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[13px] font-bold text-slate-700">After CareerBot</span>
              </div>
              <span className="text-[12px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                91 / 100
              </span>
            </div>

            {/* Name strip */}
            <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/60">
              <p className="text-[13px] font-semibold text-slate-700">Jordan Mitchell</p>
              <p className="text-[11px] text-slate-400">Senior Product Designer</p>
            </div>

            {/* Items */}
            <div className="px-5 py-4 space-y-2">
              {afterItems.map((label, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={cardVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-center gap-3 py-1.5"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <span className="text-[12.5px] text-slate-600">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
