"use client";

import React from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your resume",
    description: "Upload a PDF or DOCX resume — or build one from scratch in our builder. Takes under 30 seconds.",
  },
  {
    number: "02",
    icon: BarChart3,
    title: "Review your ATS report",
    description: "Get your ATS score with keyword gaps, formatting issues, and section-level feedback instantly.",
  },
  {
    number: "03",
    icon: Wand2,
    title: "Optimize with AI",
    description: "Follow AI-powered recommendations to fix each issue and watch your score improve in real time.",
  },
  {
    number: "04",
    icon: Send,
    title: "Apply with confidence",
    description: "Download your optimized resume and apply with higher chances of clearing automated ATS filters.",
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

function HowATSScoreWorksPage() {
  return (
    <div className="bg-white">

      {/* ── How It Works ── */}
      <section className="py-16 md:py-24 bg-white">
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
              Get Results in 4 Simple Steps
            </h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              Our resume scanner checks your resume&apos;s layout, content, and style — then gives you targeted fixes to improve your score.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const iconStyles = [
                { bg: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)", iconColor: "#1d4ed8", glow: "rgba(59,130,246,0.20)" },
                { bg: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)", iconColor: "#059669", glow: "rgba(16,185,129,0.20)" },
                { bg: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)", iconColor: "#7c3aed", glow: "rgba(124,58,237,0.20)" },
                { bg: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", iconColor: "#d97706", glow: "rgba(217,119,6,0.20)" },
              ][idx];

              return (
                <motion.div
                  key={idx}
                  className="flex flex-col items-center text-center group"
                  variants={cardVariant}
                >
                  {/* Icon shape */}
                  <div className="relative mb-6">
                    <div
                      className="w-20 h-20 rounded-[28px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                      style={{
                        background: iconStyles.bg,
                        boxShadow: `0 8px 28px ${iconStyles.glow}`,
                      }}
                    >
                      <Icon className="w-9 h-9" style={{ color: iconStyles.iconColor }} />
                    </div>
                    {/* Step number badge */}
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-[12px] font-black flex items-center justify-center border-2 border-white"
                      style={{
                        background: "linear-gradient(135deg, #2557a7, #1a3a8f)",
                        boxShadow: "0 2px 8px rgba(37,87,167,0.35)",
                      }}
                    >
                      {idx + 1}
                    </div>
                  </div>

                  <h3 className="text-[15px] font-bold text-[#0f172a] mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed max-w-50">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA */}
          <motion.div
            className="flex justify-center mt-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <button
              className="inline-flex items-center gap-2.5 text-white font-bold px-9 py-3.5 rounded-xl transition-all duration-200 text-sm"
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
              Optimize Your Resume Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

        </div>
      </section>

      {/* ── 4 Key Factors ── */}
      <section className="py-16 md:py-24 bg-[#F8FAFD]">
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
