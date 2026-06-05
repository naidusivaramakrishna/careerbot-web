"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Zap, Briefcase, FileText, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onAnalyzeClick?: () => void;
}

const matchedSkills = ["React", "TypeScript", "Node.js", "REST APIs"];
const missingSkills = ["Docker", "GraphQL"];

const HeroSection: React.FC<HeroSectionProps> = ({ onAnalyzeClick }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="relative overflow-hidden py-20 lg:py-28 xl:py-32 bg-[#EEF4FF]">

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #2557A725 1.2px, transparent 1.2px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* Subtle radial glow centre-left */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2557A7]/6 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-8 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-12 lg:gap-16 items-center">

          {/* ── LEFT COLUMN ── */}
          <motion.div
            className="flex flex-col gap-7"
            initial={{ opacity: 0, y: 32 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Badge */}
            <div className="flex items-center gap-2.5 bg-white text-[#2557A7] font-bold text-[11px] tracking-widest px-4 py-2 rounded-full w-fit shadow-md border border-[#dde8f8] uppercase">
              <div className="w-5 h-5 rounded-full bg-[#FFC85E] flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-[#2557A7]" />
              </div>
              AI Job Matching
            </div>

            {/* Heading */}
            <h1 className="font-extrabold leading-[1.12] text-[#0f172a] tracking-tight text-[1.75rem] md:text-[2rem] lg:text-[2.45rem]">
              See Exactly How Your Resume
              <br />
              <span className="text-[#2557A7]">Fits Any Job</span>{" "}
              <span className="text-[#0f172a]">— In Seconds</span>
            </h1>

            {/* Description */}
            <p className="text-base lg:text-[1.05rem] text-slate-500 leading-relaxed max-w-[500px]">
              Upload your resume, paste any job description — get a precise AI fit score with an exact breakdown of matched and missing skills.
            </p>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={onAnalyzeClick}
                className="inline-flex items-center gap-2.5 bg-[#2557A7] hover:bg-[#1c4590] text-white font-bold px-8 py-4 rounded-full shadow-[0_4px_28px_rgba(37,87,167,0.38)] hover:shadow-[0_8px_36px_rgba(37,87,167,0.52)] hover:scale-[1.03] active:scale-100 transition-all duration-300 text-[15px] whitespace-nowrap"
              >
                Analyze My Resume
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="flex items-center gap-1.5 text-slate-400 text-sm">
                <ShieldCheck className="w-4 h-4 text-slate-300" />
                Free · No signup needed
              </span>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-5 pt-0.5">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Zap className="w-4 h-4 text-[#FFC85E] shrink-0" />
                Results in{" "}
                <span className="text-[#2557A7] font-bold ml-0.5">~15 sec</span>
              </div>

              <span className="w-px h-4 bg-slate-200" />

              <span className="text-sm text-slate-500">
                Match accuracy{" "}
                <span className="text-[#2557A7] font-bold">92%</span>
              </span>

              <span className="w-px h-4 bg-slate-200" />

              <span className="text-sm text-slate-500">
                <span className="text-[#2557A7] font-bold">50,000+</span> resumes analyzed
              </span>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN ── */}
          <motion.div
            className="relative flex justify-center lg:justify-end lg:translate-x-6"
            initial={{ opacity: 0, x: 48 }}
            animate={mounted ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Soft glow halo */}
            <div className="absolute inset-0 -m-8 bg-[#2557A7]/10 rounded-[48px] blur-3xl pointer-events-none" />
            <div className="absolute inset-0 -m-2 bg-[#FFC85E]/6 rounded-[32px] blur-xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-[420px]">

              {/* Floating "Live Analysis" badge */}
              <div className="absolute -top-4 right-5 z-20 inline-flex items-center gap-1.5 bg-white border border-[#dde8f8] rounded-full px-3.5 py-1.5 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-[#2557A7] font-bold text-xs tracking-wide">Live Analysis</span>
              </div>

              {/* Main card */}
              <div
                className="bg-white rounded-2xl border border-[#dde8f8] overflow-hidden"
                style={{ boxShadow: "0 16px 56px rgba(37,87,167,0.16), 0 2px 8px rgba(37,87,167,0.06)" }}
              >
                {/* Card header */}
                <div className="bg-[#2557A7] px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                    <Briefcase className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[11px] tracking-widest uppercase">Match Analysis</p>
                    <p className="text-white/60 text-[11px] mt-0.5 truncate">Senior Frontend Engineer · Modal Labs</p>
                  </div>
                  <span className="bg-[#FFC85E] text-[#7a4f00] font-extrabold text-sm px-3 py-1.5 rounded-lg shrink-0 leading-none">
                    82 / 100
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5">

                  {/* Match score row */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">Match Score</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      ✓ Good Match
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mb-5 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#2557A7] rounded-full"
                      initial={{ width: 0 }}
                      animate={mounted ? { width: "82%" } : {}}
                      transition={{ duration: 1.2, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5 text-center">
                      <p className="text-[26px] font-black text-green-600 leading-none mb-1">16</p>
                      <p className="text-[11px] font-semibold text-green-800">Skills Matched</p>
                    </div>
                    <div className="bg-[#fff5f5] border border-[#fecaca] rounded-xl p-3.5 text-center">
                      <p className="text-[26px] font-black text-red-500 leading-none mb-1">3</p>
                      <p className="text-[11px] font-semibold text-red-800">Skills Missing</p>
                    </div>
                  </div>

                  {/* Skill pills */}
                  <p className="text-[9px] font-bold tracking-[0.15em] text-slate-300 uppercase mb-2.5">Skill Analysis</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="bg-[#f0fdf4] text-green-800 border border-[#bbf7d0] text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      >
                        ✓ {s}
                      </span>
                    ))}
                    {missingSkills.map((s) => (
                      <span
                        key={s}
                        className="bg-[#fff5f5] text-red-700 border border-[#fecaca] text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      >
                        ✕ {s}
                      </span>
                    ))}
                  </div>

                  {/* Card footer */}
                  <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <FileText className="w-3 h-3 shrink-0" />
                      resume_sanjay.pdf
                    </span>
                    <span className="text-[11px] font-bold text-[#2557A7]">Analyzed in 14s →</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
