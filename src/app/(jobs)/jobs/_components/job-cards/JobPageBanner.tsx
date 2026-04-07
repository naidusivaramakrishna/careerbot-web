"use client";

import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";

const BANNERS = [
  {
    id: 1,
    bg: "linear-gradient(120deg, #1a237e 0%, #283593 50%, #1565c0 100%)",
    patternColor: "rgba(255,255,255,0.04)",
    tag: "Resume AI",
    tagColor: "#90caf9",
    tagBg: "rgba(144,202,249,0.15)",
    title: "Get Hired Faster with an",
    highlight: "AI-Optimized Resume",
    desc: "Our AI analyzes top job descriptions and tailors your resume to pass ATS filters and impress hiring managers.",
    cta: "Build My Resume",
    ctaBg: "#ffffff",
    ctaText: "#1a237e",
    stats: [{ v: "3x", l: "More Callbacks" }, { v: "89%", l: "ATS Pass Rate" }, { v: "2 min", l: "To Generate" }],
    icon: <Sparkles className="w-6 h-6" />,
    accentBar: "#42a5f5",
  },
  {
    id: 2,
    bg: "linear-gradient(120deg, #004d40 0%, #00695c 50%, #00796b 100%)",
    patternColor: "rgba(255,255,255,0.04)",
    tag: "Interview Prep",
    tagColor: "#80cbc4",
    tagBg: "rgba(128,203,196,0.15)",
    title: "Practice Real Interviews with",
    highlight: "Live AI Feedback",
    desc: "Simulate HR and technical rounds with voice-based AI. Get instant scoring on communication, clarity, and confidence.",
    cta: "Start Mock Interview",
    ctaBg: "#ffffff",
    ctaText: "#004d40",
    stats: [{ v: "500+", l: "Questions" }, { v: "Real-time", l: "AI Scoring" }, { v: "Free", l: "To Try" }],
    icon: <TrendingUp className="w-6 h-6" />,
    accentBar: "#26a69a",
  },
  {
    id: 3,
    bg: "linear-gradient(120deg, #4a148c 0%, #6a1b9a 50%, #7b1fa2 100%)",
    patternColor: "rgba(255,255,255,0.04)",
    tag: "Skill Gap",
    tagColor: "#ce93d8",
    tagBg: "rgba(206,147,216,0.15)",
    title: "Close Skill Gaps &",
    highlight: "Land Your Dream Job",
    desc: "CareerBot maps your current skills to target job requirements and gives you a step-by-step learning roadmap.",
    cta: "Analyze My Skills",
    ctaBg: "#ffffff",
    ctaText: "#4a148c",
    stats: [{ v: "1200+", l: "Skills Tracked" }, { v: "45%", l: "Match Boost" }, { v: "Personalized", l: "Roadmap" }],
    icon: <Zap className="w-6 h-6" />,
    accentBar: "#ab47bc",
  },
];

export default function JobPageBanner({ pageIndex }: { pageIndex: number }) {
  const b = BANNERS[pageIndex % BANNERS.length];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden mb-5"
      style={{ background: b.bg, minHeight: 160 }}
    >
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${b.patternColor} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.05)" }} />
      <div className="absolute -bottom-16 right-32 w-36 h-36 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.04)" }} />

      {/* Accent left bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: b.accentBar }} />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 px-8 py-6">
        {/* LEFT: Content */}
        <div className="flex-1 min-w-0">
          {/* Tag */}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3"
            style={{ color: b.tagColor, background: b.tagBg }}
          >
            {b.icon}
            {b.tag}
          </span>

          {/* Title */}
          <h2 className="text-white font-bold text-xl sm:text-2xl leading-snug mb-1">
            {b.title}{" "}
            <span style={{ color: b.tagColor }}>{b.highlight}</span>
          </h2>

          {/* Description */}
          <p className="text-white/60 text-sm leading-relaxed mb-5 max-w-xl">
            {b.desc}
          </p>

          {/* CTA */}
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-opacity hover:opacity-90"
            style={{ background: b.ctaBg, color: b.ctaText }}
          >
            {b.cta}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT: Stats */}
        <div className="flex sm:flex-col gap-4 sm:gap-3 sm:items-end shrink-0">
          {b.stats.map((s) => (
            <div key={s.l} className="text-center sm:text-right">
              <div className="text-white font-extrabold text-lg sm:text-xl leading-none">{s.v}</div>
              <div className="text-white/50 text-xs mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
