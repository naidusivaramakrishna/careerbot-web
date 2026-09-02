"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Briefcase,
  GraduationCap,
  Upload,
  BarChart3,
  Wand2,
  Send,
  Check,
  ArrowRight,
  Sparkles,
  ChevronDown,
  CloudUpload,
  ScanLine,
  Target,
} from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload Your Resume",
    description: "Upload your resume from any device — PDF or DOCX — and our ATS Resume Checker will scan your file for potential issues. Takes under 30 seconds.",
    visual: "upload",
  },
  {
    number: 2,
    icon: BarChart3,
    title: "Review Your Report",
    description: "Get your ATS score with keyword gaps, formatting issues, and section-level feedback instantly across 17+ analysis categories.",
    visual: "report",
  },
  {
    number: 3,
    icon: Wand2,
    title: "Optimize With AI",
    description: "Follow AI-powered recommendations to fix each issue and watch your score improve in real time with targeted action items.",
    visual: "optimize",
  },
  {
    number: 4,
    icon: Send,
    title: "Download & Apply",
    description: "Download your optimized resume and apply with higher ATS pass rates and confidence in every application.",
    visual: "apply",
  },
];

const scoringFactors = [
  {
    icon: Search,
    title: "Keyword Matching",
    description: "Context-aware AI keyword analysis that detects relevance and domain terminology.",
    details: [
      "Context-aware keyword detection",
      "Semantic & exact match evaluation",
      "Measures keyword strength & placement",
      "Detects ATS-critical terminology",
      "Identifies missing role-specific keywords",
    ],
  },
  {
    icon: FileText,
    title: "Format & Structure",
    description: "Ensures your resume is structured in a clean ATS-friendly format that boosts readability.",
    details: [
      "Checks ATS-friendly formatting compliance",
      "Validates heading hierarchy & content order",
      "Detects formatting blockers (icons, tables, shapes)",
      "Checks export quality & metadata",
      "Scores readability, layout clarity & flow",
    ],
  },
  {
    icon: Briefcase,
    title: "Experience Relevance",
    description: "Measures how well your past experience aligns with the job role and required impact.",
    details: [
      "Job title & seniority alignment",
      "Years of hands-on relevant experience",
      "Achievement vs responsibility scoring",
      "Industry/company relevance rating",
      "Role-to-experience match depth",
    ],
  },
  {
    icon: GraduationCap,
    title: "Skills & Qualifications",
    description: "Evaluates technical & soft skills, qualifications, and certifications essential for the role.",
    details: [
      "Evaluates technical & soft skills",
      "Matches required & preferred skills",
      "Infers skill proficiency level",
      "Validates certifications & education",
      "Detects transferable skills",
    ],
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

/* ── Visual panels for the right column ── */
function VisualUpload() {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="relative w-72 h-72">
        {/* Grid background */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #e8f4fd 0%, #dbeafe 100%)",
            backgroundImage: "linear-gradient(rgba(37,87,167,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(37,87,167,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px, 28px 28px",
          }}
        />
        {/* Upload box */}
        <div className="absolute inset-6 bg-white rounded-2xl border-2 border-dashed border-[#93b8e8] flex flex-col items-center justify-center gap-3 shadow-lg">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <CloudUpload className="w-12 h-12 text-[#2557a7]" strokeWidth={1.5} />
          </motion.div>
          <p className="text-[13px] font-semibold text-[#2557a7]">Upload your resume</p>
          {/* Format badges */}
          <div className="flex gap-2">
            {["PDF", "WORD", "TXT"].map((fmt, i) => (
              <motion.span
                key={fmt}
                className="text-[11px] font-bold px-2 py-0.5 rounded"
                style={{ background: i === 0 ? "#ef4444" : i === 1 ? "#374151" : "#14b8a6", color: "#fff" }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {fmt}
              </motion.span>
            ))}
            <motion.span
              className="text-[11px] text-slate-500 self-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              and more!
            </motion.span>
          </div>
        </div>
        {/* Resume card floating */}
        <motion.div
          className="absolute bottom-2 right-2 w-20 h-24 bg-white rounded-xl shadow-xl border border-slate-100 p-2"
          animate={{ rotate: [6, 8, 6], y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="space-y-1.5">
            {[60, 80, 50, 70, 55, 75].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-slate-200" style={{ width: `${w}%` }} />
            ))}
          </div>
          <motion.div
            className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#2557a7] rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-white text-[10px] font-black">+</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function VisualReport() {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-4">
        {/* Score circle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">ATS Score</p>
            <p className="text-3xl font-black text-[#2557a7]">82<span className="text-lg text-slate-400">/100</span></p>
          </div>
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "conic-gradient(#2557a7 300deg, #e2e8f0 0deg)" }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-[#2557a7]" />
            </div>
          </motion.div>
        </div>
        {/* Score bars */}
        {[
          { label: "Keyword Match", pct: 89, color: "#2557a7" },
          { label: "Experience Match", pct: 94, color: "#059669" },
          { label: "Format Score", pct: 97, color: "#d97706" },
        ].map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">{item.label}</span>
              <span className="font-bold" style={{ color: item.color }}>{item.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100">
              <motion.div
                className="h-1.5 rounded-full"
                style={{ background: item.color }}
                initial={{ width: 0 }}
                animate={{ width: `${item.pct}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-[11px] text-green-700 font-semibold">Analysis complete · Top 8% of resumes</span>
        </div>
      </div>
    </motion.div>
  );
}

function VisualOptimize() {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 space-y-3">
        <p className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">Action Items</p>
        {[
          { text: "Add missing role keywords", pts: "+16 pts", color: "#ef4444", bg: "#fef2f2" },
          { text: "Quantify experience bullets", pts: "+12 pts", color: "#d97706", bg: "#fffbeb" },
          { text: "Improve summary section", pts: "+8 pts", color: "#d97706", bg: "#fffbeb" },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: item.bg }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.12 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[12px] text-slate-700 font-medium">{item.text}</span>
            </div>
            <span className="text-[11px] font-black" style={{ color: item.color }}>{item.pts}</span>
          </motion.div>
        ))}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400 font-medium">Potential Score Gain</span>
          </div>
          <motion.p
            className="text-2xl font-black text-[#2557a7]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            +25 pts
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

function VisualApply() {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 flex flex-col items-center gap-4">
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)", boxShadow: "0 8px 32px rgba(37,87,167,0.35)" }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Target className="w-10 h-10 text-white" strokeWidth={1.5} />
        </motion.div>
        <div className="text-center">
          <p className="text-[15px] font-bold text-[#0f172a]">Resume Ready!</p>
          <p className="text-[12px] text-slate-500 mt-1">Optimized for ATS systems</p>
        </div>
        <div className="w-full space-y-2">
          {[
            { label: "ATS Compatibility", val: "98%", ok: true },
            { label: "Keyword Coverage", val: "High", ok: true },
            { label: "Format Quality", val: "Excellent", ok: true },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <span className="text-[11px] text-slate-600 font-medium">{item.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-green-700">{item.val}</span>
                <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const visualMap: Record<string, React.ReactNode> = {
  upload: <VisualUpload />,
  report: <VisualReport />,
  optimize: <VisualOptimize />,
  apply: <VisualApply />,
};

function HowATSScoreWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)" }}>

      {/* ── How It Works ── */}
      <section className="py-16 md:py-24" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 45%, #eef6ff 100%)", borderTop: "1px solid #e2e8f0" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">

          {/* Header */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest border border-[#dde8f8]">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] mb-4 leading-tight">
              How CareerBot&apos;s ATS Checker Works
            </h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              Our free ATS score checker analyzes your resume&apos;s content and structure to verify ATS compatibility and provide actionable steps for improvement.
            </p>
          </motion.div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* LEFT — Accordion steps */}
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isOpen = activeStep === idx;
                const numberColors = [
                  { bg: "#f59e0b", shadow: "rgba(245,158,11,0.35)" },
                  { bg: "#2557a7", shadow: "rgba(37,87,167,0.35)" },
                  { bg: "#7c3aed", shadow: "rgba(124,58,237,0.35)" },
                  { bg: "#059669", shadow: "rgba(5,150,105,0.35)" },
                ][idx];

                return (
                  <motion.div
                    key={idx}
                    variants={cardVariant}
                    className="rounded-2xl border overflow-hidden cursor-pointer transition-colors duration-200"
                    style={{
                      background: isOpen ? "#ffffff" : "#f8fafc",
                      borderColor: isOpen ? "#dde8f8" : "#e8edf5",
                      boxShadow: isOpen ? "0 4px 24px rgba(37,87,167,0.10)" : "none",
                    }}
                    onClick={() => setActiveStep(idx)}
                  >
                    {/* Step header */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      <motion.div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-[14px] font-black"
                        style={{ background: numberColors.bg, boxShadow: `0 4px 12px ${numberColors.shadow}` }}
                        whileHover={{ scale: 1.08 }}
                      >
                        {step.number}
                      </motion.div>
                      <h3 className={`flex-1 text-[15px] font-bold leading-snug ${isOpen ? "text-[#0f172a]" : "text-slate-600"}`}>
                        {step.title}
                      </h3>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 flex items-start gap-4">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: "linear-gradient(135deg, #EEF4FF 0%, #dde8f8 100%)" }}
                            >
                              <Icon className="w-4 h-4 text-[#2557a7]" strokeWidth={2} />
                            </div>
                            <p className="text-[13px] text-slate-500 leading-relaxed">{step.description}</p>
                          </div>
                          {/* Mobile visual (shown only on small screens) */}
                          <div className="lg:hidden px-5 pb-5 h-56 flex items-center justify-center bg-[#f8fafc] rounded-xl mx-4 mb-4">
                            <AnimatePresence mode="wait">
                              {visualMap[step.visual]}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* CTA below steps */}
              <motion.div
                className="pt-2"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.3 }}
              >
                <button
                  className="inline-flex items-center gap-2.5 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 text-sm w-full justify-center"
                  style={{
                    background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)",
                    boxShadow: "0 4px 20px rgba(37,87,167,0.30)",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(37,87,167,0.42)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(37,87,167,0.30)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  Scan My Resume Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>

            {/* RIGHT — Visual panel (desktop only) */}
            <motion.div
              className="hidden lg:flex items-center justify-center sticky top-24 h-[420px] rounded-3xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #eef6ff 0%, #dbeafe 100%)" }}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <AnimatePresence mode="wait">
                <React.Fragment key={activeStep}>
                  {visualMap[steps[activeStep].visual]}
                </React.Fragment>
              </AnimatePresence>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 4 Key Factors ── */}
      <section className="py-16 md:py-24" style={{ background: "linear-gradient(180deg, #eef6ff 0%, #f8fafc 100%)", borderTop: "1px solid #e2e8f0" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">

          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#EEF4FF] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest border border-[#dde8f8]">
              <Sparkles className="w-3 h-3" />
              AI Analysis
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] mb-4 leading-tight">
              4 Key Factors We Analyze
            </h2>
            <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Our ATS intelligence engine evaluates your resume across four core dimensions
              to measure relevance, readability, and job-fit accuracy.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {scoringFactors.map((factor, idx) => {
              const IconComponent = factor.icon;
              return (
                <motion.div
                  key={factor.title}
                  className="relative bg-white rounded-[20px] border border-[#E8EDF5] overflow-hidden group"
                  style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 32px rgba(37,87,167,0.07)" }}
                  variants={cardVariant}
                  whileHover={{ y: -5, boxShadow: "0 8px 16px rgba(0,0,0,0.06), 0 24px 56px rgba(37,87,167,0.14)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)", boxShadow: "0 4px 12px rgba(37,87,167,0.28)" }}
                      >
                        <IconComponent className="w-5 h-5 text-white" strokeWidth={1.8} />
                      </div>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                        style={{ color: "#C8D8EE", background: "#F5F8FF", borderColor: "#E8EDF5" }}
                      >
                        0{idx + 1}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-[#0f172a] mb-1.5 leading-snug">{factor.title}</h3>
                    <p className="text-[12.5px] text-slate-500 leading-relaxed">{factor.description}</p>
                  </div>
                  <div className="px-5 pb-5 pt-4 mx-3 mb-3 rounded-xl" style={{ background: "#EEF4FF" }}>
                    <ul className="space-y-2">
                      {factor.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#fff" }}>
                            <Check className="w-2.5 h-2.5 text-[#2557a7]" strokeWidth={3} />
                          </div>
                          <span className="text-[12px] text-slate-600 leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

    </div>
  );
}

export default HowATSScoreWorksPage;
