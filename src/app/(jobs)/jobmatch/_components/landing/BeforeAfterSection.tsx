"use client";

import { motion } from "framer-motion";
import { TrendingUp, X, Check, Sparkles, ArrowRight } from "lucide-react";

const beforeIssues = [
  "Missing 8 key ATS keywords",
  "No quantifiable achievements",
  "Skills section incomplete",
  "Generic job title phrasing",
  "No professional summary",
  "Weak passive action verbs",
];

const afterFixes = [
  "All critical keywords added",
  "5 metrics-backed bullet points",
  "Full skill alignment with JD",
  "Role-specific title optimized",
  "AI-written professional summary",
  "Strong active action verbs",
];

export default function BeforeAfterSection() {
  return (
    <section className="py-14 md:py-20" style={{ background: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
      <div className="max-w-5xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}>
          <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-4 border border-[#dde8f8]">
            <Sparkles className="w-3 h-3" /> The Transformation
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#0f172a] mb-3 leading-tight">
            See What AI Optimization Actually Does
          </h2>
          <p className="text-[14px] text-slate-500 max-w-lg mx-auto leading-relaxed">
            Real candidates. Real results. One session — from filtered out to interview ready.
          </p>
        </motion.div>

        {/* Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_56px_1fr] gap-0 items-stretch">

          {/* BEFORE */}
          <motion.div
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.55 }}
            className="rounded-2xl overflow-hidden border border-red-100"
            style={{ boxShadow: "0 4px 20px rgba(239,68,68,0.08)" }}>

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-[13px] font-bold text-red-600">Before CareerBot</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[22px] font-black text-red-500 leading-none">58</span>
                <span className="text-[10px] text-red-400 font-medium">/ 100</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="px-5 pt-3 pb-2 border-b border-red-50">
              <div className="w-full h-1.5 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full" style={{ width: "58%" }} />
              </div>
            </div>

            {/* Name row */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white">
              <p className="text-[13px] font-semibold text-slate-700">Alex Johnson</p>
              <p className="text-[11px] text-slate-400">Frontend Developer</p>
            </div>

            {/* Issues */}
            <div className="px-5 py-4 bg-white space-y-2.5">
              {beforeIssues.map((label, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 text-red-500" strokeWidth={2.5} />
                  </div>
                  <span className="text-[12.5px] text-slate-500">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Middle arrow */}
          <div className="hidden md:flex flex-col items-center justify-center gap-2 px-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #2557A7, #1a3a8f)", boxShadow: "0 4px 12px rgba(37,87,167,0.3)" }}>
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
            <span className="text-[9px] font-black text-[#2557a7] uppercase tracking-wider text-center leading-tight">AI<br/>Fix</span>
          </div>

          {/* AFTER */}
          <motion.div
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }}
            className="rounded-2xl overflow-hidden border border-emerald-100"
            style={{ boxShadow: "0 4px 20px rgba(5,150,105,0.08)" }}>

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 border-b border-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[13px] font-bold text-emerald-600">After CareerBot</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[22px] font-black text-emerald-500 leading-none">91</span>
                <span className="text-[10px] text-emerald-400 font-medium">/ 100</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="px-5 pt-3 pb-2 border-b border-emerald-50">
              <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-400 rounded-full"
                  initial={{ width: "0%" }} whileInView={{ width: "91%" }}
                  viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} />
              </div>
            </div>

            {/* Name row */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white">
              <p className="text-[13px] font-semibold text-slate-700">Alex Johnson</p>
              <p className="text-[11px] text-emerald-500 font-medium">Senior Frontend Engineer · React & Next.js</p>
            </div>

            {/* Fixes */}
            <div className="px-5 py-4 bg-white space-y-2.5">
              {afterFixes.map((label, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <span className="text-[12.5px] text-slate-600">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Delta callout */}
        <motion.div className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="inline-flex items-center gap-3 bg-white border border-[#dde8f8] rounded-2xl px-7 py-4 shadow-sm">
            <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-[13px] text-slate-600">Average score improvement:</span>
            <span className="text-[#2557A7] font-black text-xl">+33 pts</span>
            <span className="text-[11px] text-slate-400 font-medium">in one session</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
