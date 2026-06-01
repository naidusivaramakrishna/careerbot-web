"use client";

import { Brain, TrendingUp, Lightbulb, Shield, Zap, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    num: "01",
    icon: Brain,
    title: "Instant ATS Scoring",
    label: "For Job Seekers",
    description: "Real ATS logic to scan, score, and optimize your resume in seconds.",
    items: ["Real ATS algorithms", "Keyword & formatting scores", "Missing keyword detection", "Top ATS compatibility"],
  },
  {
    num: "02",
    icon: Users,
    title: "Deep Section Analysis",
    label: "For Job Seekers",
    description: "Comprehensive analysis of every resume section with expert insights.",
    items: ["Structure & layout check", "Section-wise scoring", "Content gap detection"],
  },
  {
    num: "03",
    icon: Lightbulb,
    title: "Skill Gap Detector",
    label: "For Job Seekers",
    description: "Uncovers hidden skill gaps directly from real job descriptions.",
    items: ["Hard & soft skill mapping", "JD keyword alignment", "ATS match rate boost"],
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "AI Career Insights",
    label: "For Job Seekers",
    description: "AI pinpoints exactly what impresses recruiters — and what needs tuning.",
    items: ["Strength & weakness detection", "Personalized skill advice", "Per-section feedback", "Trend-based updates"],
  },
  {
    num: "05",
    icon: Zap,
    title: "Live Score Tracking",
    label: "For Job Seekers & Recruiters",
    description: "Watch your ATS score update in real time as you edit your resume.",
    items: ["Live score updates", "Instant keyword matching", "Format compatibility checks"],
  },
  {
    num: "06",
    icon: Shield,
    title: "50+ ATS Systems",
    label: "For Recruiters",
    description: "Optimized for over 50 global ATS platforms used by top companies.",
    items: ["50+ ATS platforms covered", "GDPR & CCPA compliant", "Enterprise-grade encryption"],
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function FeaturesSection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "linear-gradient(160deg, #EEF4FF 0%, #ffffff 50%, #F0F6FF 100%)" }}>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.45]"
        style={{
          backgroundImage: "radial-gradient(circle, #2557A715 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-40 right-1/4 w-140 h-140 bg-[#2557a7]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-110 h-110 bg-[#2557a7]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="inline-flex items-center gap-2 bg-[#EEF4FF] border border-[#dde8f8] text-[#2557a7] text-[11px] font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Why Choose Us
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] mb-4 leading-tight">
            Why Professionals Trust Our ATS Analyzer
          </h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
            Advanced AI-driven resume evaluation that mirrors real recruiter behavior and ATS logic.
          </p>
        </motion.div>

        {/* ── 6 Cards Grid ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                variants={cardVariant}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(37,87,167,0.18)" }}
                transition={{ duration: 0.22 }}
                className="rounded-2xl overflow-hidden border border-[#dde8f8] bg-white"
                style={{ boxShadow: "0 2px 8px rgba(37,87,167,0.08), 0 8px 24px rgba(37,87,167,0.06)" }}
              >
                {/* Blue header bar */}
                <div
                  className="flex items-center gap-3 px-5 py-4"
                  style={{ background: "linear-gradient(135deg, #2557a7 0%, #1a3a8f 100%)" }}
                >
                  <span className="text-white/60 text-sm font-bold tracking-widest">{feat.num}</span>
                  <span className="w-px h-4 bg-white/30" />
                  <span className="text-white text-[14px] font-bold">{feat.title}</span>
                </div>

                {/* Card body */}
                <div className="p-6">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#EEF4FF] mb-4">
                    <Icon className="w-6 h-6 text-[#2557a7]" strokeWidth={1.8} />
                  </div>

                  {/* Label */}
                  <p className="text-[13px] font-semibold text-[#2557a7] mb-2">
                    {feat.label}
                  </p>

                  {/* Description */}
                  <p className="text-[13.5px] text-slate-500 leading-relaxed mb-5">
                    {feat.description}
                  </p>

                  {/* Items */}
                  <ul className="space-y-2.5">
                    {feat.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#2557a7] shrink-0" />
                        <span className="text-[13px] text-slate-600">{item}</span>
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
  );
}
