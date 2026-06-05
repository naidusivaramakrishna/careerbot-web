"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Sparkles, ShieldCheck, Zap } from "lucide-react";

interface HeroATSProps {
  onScanClick?: () => void;
}

const HeroATS: React.FC<HeroATSProps> = ({ onScanClick }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="relative overflow-hidden py-16 lg:py-20 xl:py-24">

      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-br from-[#2557a7] via-[#2557a7] to-[#194386]" />

      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-24 w-[500px] h-[500px] bg-[#2557a7]/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#2557a7]/20 rounded-full blur-3xl" />
      </div>

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-4 lg:gap-6 items-center">

          {/* ── LEFT COLUMN ── */}
          <motion.div
            className="flex flex-col gap-7"
            style={{ paddingLeft: 60 }}
            initial={{ opacity: 0, y: 32 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Badge */}
            <div className="flex items-center gap-2.5 bg-white text-[#2557a7] font-semibold text-xs px-4 py-2 rounded-full w-fit shadow-lg">
              <div className="w-5 h-5 rounded-full bg-[#FFC85E] flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-[#2557a7]" />
              </div>
              AI RESUME ANALYSIS
            </div>

            {/* Heading — locked to 2 lines */}
            <div>
              <h1
                className="font-extrabold leading-[1.15] text-white tracking-tight"
                style={{ fontSize: "3rem" }}
              >
                Transform Your Resume{" "}
                <br className="hidden lg:block" />
                into an ATS-Winning Profile
              </h1>
            </div>

            {/* Description */}
            <p className="text-base lg:text-lg text-white/75 leading-relaxed max-w-[520px]">
              Boost your chances of landing the job with our AI-powered ATS Resume Checker.
              Get a personalized score and actionable suggestions in seconds.
            </p>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={onScanClick}
                className="bg-[#FFC85E] hover:bg-[#f5b83d] text-[#1a1a1a] font-bold px-9 py-4 rounded-full shadow-[0_4px_24px_rgba(255,200,94,0.35)] hover:shadow-[0_8px_32px_rgba(255,200,94,0.5)] hover:scale-105 active:scale-100 transition-all duration-300 text-base whitespace-nowrap"
              >
                Check Your Resume
              </button>
              <span className="flex items-center gap-1.5 text-white/60 text-sm">
                <ShieldCheck className="w-4 h-4 text-white/50" />
                Free · No signup needed
              </span>
            </div>

            {/* Trust indicators row */}
            <div className="flex flex-wrap items-center gap-6 pt-1">

              {/* Trustpilot */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-4 h-4 text-[#00b67a] fill-[#00b67a]" />
                  ))}
                  <Star className="w-4 h-4 text-[#00b67a] fill-[#00b67a] opacity-60" />
                </div>
                <span className="text-white/80 text-sm font-medium">
                  <span className="text-white font-semibold">4.8</span> on
                </span>
                <span className="flex items-center gap-1 text-white font-semibold text-sm">
                  <svg className="w-4 h-4 text-[#00b67a]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0L14.59 8.41H24L16.18 13.59L18.77 22L12 17L5.23 22L7.82 13.59L0 8.41H9.41L12 0Z" />
                  </svg>
                  Trustpilot
                </span>
              </div>

              <div className="w-px h-5 bg-white/20" />

              {/* Scan speed badge */}
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Zap className="w-4 h-4 text-[#FFC85E]" />
                <span>Results in <span className="text-white font-semibold">~10 sec</span></span>
              </div>

              <div className="w-px h-5 bg-white/20" />

              {/* Users count */}
              <span className="text-white/70 text-sm">
                <span className="text-white font-semibold">50,000+</span> resumes scanned
              </span>
            </div>
          </motion.div>

          {/* ── RIGHT COLUMN ── */}
          <motion.div
            className="relative flex justify-center lg:justify-end lg:-translate-x-8"
            initial={{ opacity: 0, x: 48 }}
            animate={mounted ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Glow halo behind image */}
            <div className="absolute inset-0 -m-6 bg-white/10 rounded-[40px] blur-2xl scale-90" />
            <div className="absolute inset-0 -m-2 bg-[#FFC85E]/8 rounded-[32px] blur-xl" />

            {/* Static image */}
            <div className="relative z-10 w-full">
              <Image
                src="/images/atsheroimage.png"
                alt="ATS Resume Checker — AI Scan Preview"
                width={920}
                height={720}
                className="w-full h-auto object-contain drop-shadow-[0_32px_64px_rgba(0,0,0,0.35)] scale-90 origin-center"
                priority
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroATS;
