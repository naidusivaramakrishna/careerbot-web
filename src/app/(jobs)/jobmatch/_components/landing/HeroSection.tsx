"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";

interface HeroSectionProps {
  onAnalyzeClick?: () => void;
}

// ── Step previews ─────────────────────────────────────────────────────────────

function UploadPreview() {
  const [phase, setPhase] = useState<"idle" | "uploading" | "done">("idle");
  const parsed = ["Experience parsed", "Skills parsed", "Education parsed", "Projects parsed"];
  useEffect(() => {
    setPhase("idle");
    const t1 = setTimeout(() => setPhase("uploading"), 500);
    const t2 = setTimeout(() => setPhase("done"), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div className="flex flex-col items-center justify-start h-full gap-3 px-5 pt-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 p-5 flex flex-col items-center gap-2 relative overflow-hidden">
        <motion.div
          initial={{ y: -50, opacity: 0, rotate: -3 }}
          animate={phase !== "idle" ? { y: 0, opacity: 1, rotate: 0 } : { y: -50, opacity: 0, rotate: -3 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 180 }}
          className="absolute top-3 right-4 bg-white rounded-xl shadow-lg px-3 py-1.5 flex items-center gap-2 border border-slate-100">
          <div className="w-6 h-7 rounded bg-blue-600 flex items-center justify-center shrink-0">
            <svg width="10" height="12" viewBox="0 0 12 14" fill="none"><path d="M2 1h5.5L10 3.5V13H2V1z" fill="white" fillOpacity=".9"/><path d="M7 1v3h3" stroke="white" strokeWidth="1.2"/></svg>
          </div>
          <span className="text-[12px] font-semibold text-slate-700">Resume.pdf</span>
        </motion.div>
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2557A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <p className="text-[12px] text-slate-500 font-medium">Drop your resume here</p>
        <p className="text-[11px] text-slate-400">PDF &amp; DOCX only (max 2MB)</p>
        <div className="mt-1 px-4 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded-lg shadow-sm">Upload Resume</div>
      </motion.div>
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            {phase === "uploading" && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-[12px] font-semibold text-slate-600">Uploading Resume.pdf</span>
                  <span className="text-[11px] text-blue-600 font-medium">Analyzing…</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-blue-600 rounded-full" initial={{ width: "0%" }} animate={{ width: "70%" }} transition={{ duration: 1.2 }} />
                </div>
              </div>
            )}
            {phase === "done" && (
              <div className="flex flex-col gap-1.5">
                {parsed.map((item, i) => (
                  <motion.div key={item} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 text-[12px] text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {item}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function JDPreview() {
  const [phase, setPhase] = useState<"idle" | "done">("idle");
  const url = "https://www.linkedin.com/jobs/senior-frontend-engineer-2...";
  useEffect(() => {
    setPhase("idle");
    const t = setTimeout(() => setPhase("done"), 1000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 pb-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="w-full bg-white rounded-2xl shadow-md border border-slate-100 p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Paste a link or text for the job:</p>
        <div className="relative mb-1">
          <input readOnly value={phase === "done" ? url : ""} placeholder="https://linkedin.com/jobs/..." onChange={() => {}}
            className="w-full text-[11.5px] text-slate-600 border-b-2 border-blue-500 bg-transparent pb-1.5 pr-7 outline-none placeholder:text-slate-300" />
          {phase === "done" && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute right-0 top-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.span>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mb-4">Example: https://www.linkedin.com/jobs/…</p>
        <div className="flex gap-2 mb-4">
          <span className="text-[11px] font-semibold text-blue-600 border-b-2 border-blue-600 pb-0.5 cursor-pointer">Paste Link</span>
          <span className="text-[11px] font-semibold text-slate-400 pb-0.5 cursor-pointer">Paste Text</span>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600">Cancel</button>
          <button className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold shadow-sm">Continue</button>
        </div>
      </motion.div>
    </div>
  );
}

function AnalyzePreview() {
  const size = 88; const sw = 7; const r = (size - sw) / 2; const circ = 2 * Math.PI * r;
  const [pct, setPct] = useState(0);
  useEffect(() => { const t = setTimeout(() => setPct(0.82), 200); return () => clearTimeout(t); }, []);
  const matched = ["React", "TypeScript", "Next.js", "Node.js"];
  const missing = [{ name: "Python", pts: "+4 pts" }, { name: "Docker", pts: "+3 pts" }, { name: "AWS", pts: "+2 pts" }];
  return (
    <div className="flex flex-col items-center justify-start h-full gap-3 px-5 pt-12">
      <div className="w-full bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Analysis Results</p>
        <div className="flex justify-center mb-4">
          <div className="flex flex-col items-center gap-1">
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw}/>
                <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#7c3aed" strokeWidth={sw} strokeLinecap="round"
                  strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct) }} transition={{ duration: 1.6, ease: "easeOut" }}/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[18px] font-black text-slate-800">82<span className="text-[11px]">%</span></span>
              </div>
            </div>
            <span className="text-[12px] font-semibold text-slate-500">Match Score</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Matched</p>
            {matched.map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.09 }}
                className="flex items-center gap-1.5 text-[11.5px] text-slate-700 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"/>{s}
              </motion.div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Missing</p>
            {missing.map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-[11.5px] text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-400 shrink-0"/>{s.name}
                </div>
                <span className="text-[10px] font-bold text-blue-600">{s.pts}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OptimizePreview() {
  const [phase, setPhase] = useState(0);
  const keywords = ["+ React", "+ TypeScript", "+ GraphQL"];
  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1100);
    const t3 = setTimeout(() => setPhase(3), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div className="flex flex-col items-center justify-start h-full px-6 pt-12">
      <div className="w-full bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="bg-[#1a2744] px-4 py-3 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resume Tailoring</p>
            <p className="text-[15px] font-bold text-white">Senior Frontend Engineer</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Match</p>
            <motion.p className="text-[18px] font-black text-amber-400" key={phase >= 3 ? "after" : "before"}
              initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
              {phase >= 3 ? "94%" : "82%"}
            </motion.p>
          </div>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2.5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Keywords Added</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <AnimatePresence key={kw}>
                  {phase >= 1 && (
                    <motion.span initial={{ opacity: 0, scale: 0.8, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: i * 0.12, duration: 0.3 }}
                      className="px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-semibold">{kw}</motion.span>
                  )}
                </AnimatePresence>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Summary Improved</p>
            <div className="flex flex-col gap-1.5">
              <AnimatePresence>
                {phase >= 2 && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100">
                    <span className="text-red-400 font-bold text-[13px] shrink-0">−</span>
                    <span className="text-[12px] text-slate-400 line-through">Frontend Developer</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {phase >= 2 && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                    className="flex items-start gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                    <span className="text-emerald-500 font-bold text-[13px] shrink-0 mt-0.5">+</span>
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">Senior Frontend Engineer</p>
                      <p className="text-[11px] text-slate-500">React &amp; Next.js Specialist</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <AnimatePresence>
            {phase >= 3 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Match Improvement</p>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-slate-400 line-through">82%</span>
                  <svg width="16" height="10" viewBox="0 0 20 10" fill="none"><path d="M0 5h18M13 1l5 4-5 4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <motion.span className="text-[22px] font-black text-amber-500" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 300 }}>94%</motion.span>
                  <span className="text-[11px] text-slate-400 font-medium">+12 pts improvement</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const STEPS = ["Upload Resume", "Paste Job Description", "Analyze & Get Results", "Optimize Resume"];
const PREVIEWS = [UploadPreview, JDPreview, AnalyzePreview, OptimizePreview];

// ── Hero Section ─────────────────────────────────────────────────────────────

const HeroSection: React.FC<HeroSectionProps> = ({ onAnalyzeClick }) => {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive(p => (p + 1) % STEPS.length), 4000);
  };

  useEffect(() => {
    setMounted(true);
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const PreviewComponent = PREVIEWS[active];

  return (
    <section className="relative overflow-hidden py-16 lg:py-20 xl:py-24"
      style={{ background: "linear-gradient(135deg, #f8fbff 0%, #eef6ff 48%, #eaf7f5 100%)" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle,rgba(148,163,184,0.18) 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center,rgba(37,87,167,0.04) 0%,rgba(37,87,167,0.02) 40%,transparent 70%)" }} />

      <div className="relative w-full px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-4 lg:gap-6 items-center">

          {/* LEFT */}
          <motion.div
            className="flex flex-col gap-7"
            style={{ paddingLeft: 60 }}
            initial={{ opacity: 0, y: 24 }} animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>

            {/* Badge */}
            <div className="flex items-center gap-2.5 bg-white text-[#2557a7] font-semibold text-xs px-4 py-2 rounded-full w-fit shadow-lg">
              <div className="w-5 h-5 rounded-full bg-[#2557a7] flex items-center justify-center shrink-0">
                <span style={{ fontSize: 10, color: "#fff" }}>✨</span>
              </div>
              AI-POWERED RESUME TAILORING
            </div>

            {/* Heading */}
            <h1 className="font-extrabold leading-[1.15] tracking-tight" style={{ fontSize: "3rem" }}>
              <span style={{ color: "#0f172a" }}>Turn Any Resume Into{" "}</span>
              <br className="hidden lg:block" />
              <span style={{ background: "linear-gradient(to right, #2557a7, #0f766e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>A Job-Winning Resume</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base lg:text-lg text-slate-500 leading-relaxed max-w-130">
              Upload your resume and paste a job description. Our AI rewrites, optimizes and tailors your resume to match recruiter expectations and ATS requirements.
            </p>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button onClick={onAnalyzeClick}
                className="bg-[#2557a7] hover:bg-[#1a3a8f] text-white font-bold px-9 py-4 rounded-full shadow-[0_4px_24px_rgba(37,87,167,0.35)] hover:shadow-[0_8px_32px_rgba(37,87,167,0.5)] hover:scale-105 active:scale-100 transition-all duration-300 text-base whitespace-nowrap inline-flex items-center gap-2">
                Tailor My Resume <ArrowRight size={15} />
              </button>
              <button onClick={onAnalyzeClick}
                className="inline-flex items-center gap-2 text-[#2557a7] font-bold text-sm px-6 py-3.5 rounded-full border border-[#c7d9f5] hover:bg-[#eef4ff] hover:border-[#2557a7] transition-all duration-200">
                Try it free
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} style={{ fill: "#f59e0b", color: "#f59e0b" }} />)}
                </div>
                <span className="text-slate-500 text-sm">Trusted by <span className="font-semibold text-[#0f172a]">50,000+</span> professionals</span>
              </div>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                {[{ value: "50K+", label: "Resumes Tailored" }, { value: "92%", label: "Match Accuracy" }, { value: "14s", label: "Avg Processing" }].map((m, i) => (
                  <React.Fragment key={m.label}>
                    {i > 0 && <span className="text-slate-200">•</span>}
                    <span><span className="font-bold text-[#0f172a]">{m.value}</span> {m.label}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>

          {/* RIGHT — browser mockup with step previews */}
          <motion.div style={{ display: "flex", justifyContent: "flex-end", position: "relative", paddingRight: 40 }}
            initial={{ opacity: 0, y: 28 }} animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 460, height: 460, background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none", borderRadius: "50%" }} />

            <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 480 }}>
              {/* Browser chrome */}
              <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 24px 60px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.04)", height: 460 }}>
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"/>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
                  <div className="flex-1 mx-4 h-6 bg-white rounded-md border border-slate-200 flex items-center px-3">
                    <span className="text-[10px] text-slate-400 font-mono">app.careerbot.ai / jobmatch</span>
                  </div>
                </div>

                {/* Step label */}
                <div className="absolute top-14 left-5 z-20">
                  <motion.span key={active} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5 bg-blue-600/10 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"/>
                    Step {String(active + 1).padStart(2, "0")} — {STEPS[active]}
                  </motion.span>
                </div>

                {/* Animated content */}
                <AnimatePresence mode="wait">
                  <motion.div key={active}
                    initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0 top-13 overflow-y-auto">
                    <PreviewComponent />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {STEPS.map((_, i) => (
                  <button key={i} onClick={() => { setActive(i); startTimer(); }}
                    className={`transition-all duration-300 rounded-full ${i === active ? "w-6 h-1.5 bg-blue-600" : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"}`} />
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
