"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "ATS Score Check",         us: true,  others: true  },
  { feature: "Skill Gap Analysis",       us: true,  others: false },
  { feature: "One-Click Skill Add",      us: true,  others: false },
  { feature: "Resume Section Editor",    us: true,  others: false },
  { feature: "JD Keyword Matching",      us: true,  others: false },
  { feature: "Real-time Score Update",   us: true,  others: false },
];

export default function ComparisonTable() {
  return (
    <section className="py-14 md:py-20 px-6 border-b border-slate-100" style={{ background: "#F7F9FC" }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-block text-[11px] font-bold text-[#2557A7] uppercase tracking-widest bg-[#EEF4FF] border border-[#dde8f8] px-4 py-1.5 rounded-full mb-5">
            Why CareerBot
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] mb-4 leading-tight">
            We Go Further Than<br />
            <span className="text-[#2557A7]">Every Other Tool</span>
          </h2>
          <p className="text-slate-500 text-base max-w-lg mx-auto leading-relaxed">
            Most tools just tell you a score. We show you the gaps and fix them instantly.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          className="rounded-2xl border border-slate-200 overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(37,87,167,0.07)" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] bg-slate-50 border-b border-slate-200">
            <div className="px-6 py-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Feature</span>
            </div>
            <div className="w-36 flex items-center justify-center px-4 py-4 bg-[#2557A7]">
              <span className="text-[12px] font-black text-white uppercase tracking-wider">CareerBot</span>
            </div>
            <div className="w-36 flex items-center justify-center px-4 py-4 bg-slate-100">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Others</span>
            </div>
          </div>

          {/* Rows */}
          {rows.map(({ feature, us, others }, i) => (
            <motion.div
              key={feature}
              className="grid grid-cols-[1fr_auto_auto] border-b border-slate-100 last:border-b-0 hover:bg-[#f8faff] transition-colors duration-150 group"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <div className="px-6 py-4 flex items-center">
                <span className="text-[14px] font-semibold text-slate-700 group-hover:text-[#0f172a] transition-colors">{feature}</span>
              </div>

              {/* Us */}
              <div className="w-36 flex items-center justify-center px-4 py-4 border-l border-[#dde8f8] bg-[#EEF4FF]/30 group-hover:bg-[#EEF4FF]/60 transition-colors">
                {us ? (
                  <div className="w-7 h-7 rounded-full bg-[#2557A7] flex items-center justify-center shadow-sm">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-slate-400" strokeWidth={2.5} />
                  </div>
                )}
              </div>

              {/* Others */}
              <div className="w-36 flex items-center justify-center px-4 py-4 border-l border-slate-100">
                {others ? (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                    <Check className="w-4 h-4 text-slate-500" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-400" strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Callout */}
        <motion.p
          className="text-center text-[13px] text-slate-400 mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          5 exclusive features not available anywhere else — all free to try.
        </motion.p>

      </div>
    </section>
  );
}
