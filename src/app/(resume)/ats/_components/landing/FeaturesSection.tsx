"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  CheckCircle2, ArrowRight, Zap, Brain, Upload, FileText,
  BarChart3, Wand2, Send, Star, TrendingUp, Users,
  CloudUpload, ScanLine, Target, ChevronDown, Check,
} from "lucide-react";

function useCounter(target: number, duration: number = 1200, start: boolean = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

const SCORE = 92;

const pageStats = [
  { icon: Users,     value: "50,000+", label: "resumes analyzed",      color: "#6366f1", bg: "#eef2ff" },
  { icon: Brain,     value: "17",      label: "scoring categories",     color: "#0ea5e9", bg: "#e0f2fe" },
  { icon: Star,      value: "4.8★",    label: "average rating",         color: "#f59e0b", bg: "#fefce8" },
  { icon: TrendingUp,value: "91%",     label: "avg score improvement",  color: "#10b981", bg: "#f0fdf4" },
];

const steps = [
  { icon: Upload,   num: "1", title: "Upload Resume",         desc: "Upload your PDF or DOCX resume in under 30 seconds.",                          color: "#6366f1", bg: "#eef2ff" },
  { icon: BarChart3,num: "2", title: "AI ATS Analysis",       desc: "Our AI scans 17 categories and finds what's hurting your score.",              color: "#0ea5e9", bg: "#e0f2fe" },
  { icon: Wand2,    num: "3", title: "Get Fix Plan",           desc: "See priority fixes and AI recommendations instantly.",                         color: "#7c3aed", bg: "#ede9fe" },
  { icon: Send,     num: "4", title: "Apply with Confidence",  desc: "Download your optimized resume and apply with higher ATS pass rates.",         color: "#f59e0b", bg: "#fefce8" },
];

const metrics = [
  { label: "Keyword Match",    value: 89, color: "#6366f1" },
  { label: "Experience Match", value: 94, color: "#10b981" },
  { label: "Format Score",     value: 97, color: "#f59e0b" },
];

const extraCategories = [
  { label: "Content Q…", pct: 88 },
  { label: "ATS Comp…",  pct: 95 },
  { label: "Skills Gap", pct: 76 },
];

const resumeSections = [
  {
    section: null,
    lines: [
      { text: "Jordan Mitchell",         highlight: false, type: "name"     },
      { text: "Senior Product Designer", highlight: false, type: "subtitle" },
    ],
  },
  {
    section: "Experience",
    lines: [
      { text: "Led cross-functional teams to ship 3 products", highlight: false, type: "line" },
      { text: "Increased user retention by 34% via redesign",  highlight: true,  type: "line" },
      { text: "Google · Meta · Stripe — past experience",      highlight: true,  type: "line" },
    ],
  },
  {
    section: "Skills",
    lines: [
      { text: "Figma · Design Systems · User Research", highlight: true,  type: "line" },
      { text: "React · TypeScript · Tailwind CSS",      highlight: true,  type: "line" },
      { text: "5+ years in enterprise SaaS platforms",  highlight: false, type: "line" },
    ],
  },
];

const topFindings = [
  { label: "Missing role-specific keywords", pts: "+12 pts", color: "#ef4444" },
  { label: "Weak summary impact",            pts: "+8 pts",  color: "#f59e0b" },
  { label: "Skills section incomplete",      pts: "+5 pts",  color: "#f59e0b" },
];

/* ── Inline visuals for each step ── */
function StepVisualUpload() {
  return (
    <motion.div className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease: "easeOut" }}>
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-3xl"
          style={{ background: "linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%)", backgroundImage: "linear-gradient(rgba(99,102,241,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.07) 1px,transparent 1px)", backgroundSize: "24px 24px,24px 24px" }} />
        <div className="absolute inset-5 bg-white rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center gap-2.5 shadow-lg">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <CloudUpload className="w-10 h-10 text-indigo-500" strokeWidth={1.5} />
          </motion.div>
          <p className="text-[12px] font-semibold text-indigo-600">Upload your resume</p>
          <div className="flex gap-1.5">
            {(["PDF", "DOCX", "TXT"] as const).map((fmt, i) => (
              <motion.span key={fmt} className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                style={{ background: i === 0 ? "#ef4444" : i === 1 ? "#374151" : "#14b8a6" }}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                {fmt}
              </motion.span>
            ))}
          </div>
        </div>
        <motion.div className="absolute bottom-1 right-1 w-16 h-20 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5"
          animate={{ rotate: [5, 7, 5], y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <div className="space-y-1">{[60, 80, 50, 70, 55].map((w, i) => <div key={i} className="h-1 rounded-full bg-slate-200" style={{ width: `${w}%` }} />)}</div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StepVisualReport() {
  return (
    <motion.div className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease: "easeOut" }}>
      <div className="w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">ATS Score</p>
            <p className="text-2xl font-black text-indigo-600">82<span className="text-sm text-slate-400">/100</span></p>
          </div>
          <motion.div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "conic-gradient(#6366f1 295deg, #e2e8f0 0deg)" }}
            animate={{ rotate: [0, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-indigo-500" />
            </div>
          </motion.div>
        </div>
        {[{ label: "Keyword Match", pct: 89, color: "#6366f1" }, { label: "Experience Match", pct: 94, color: "#10b981" }, { label: "Format Score", pct: 97, color: "#f59e0b" }].map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-bold" style={{ color: item.color }}>{item.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100">
              <motion.div className="h-1.5 rounded-full" style={{ background: item.color }}
                initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.12 }} />
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-2.5 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-[10px] text-green-700 font-semibold">Analysis complete · Top 8% of resumes</span>
        </div>
      </div>
    </motion.div>
  );
}

function StepVisualFix() {
  return (
    <motion.div className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease: "easeOut" }}>
      <div className="w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 space-y-2.5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Action Items</p>
        {[
          { text: "Add missing role keywords", pts: "+16 pts", color: "#ef4444", bg: "#fef2f2" },
          { text: "Quantify experience bullets", pts: "+12 pts", color: "#f59e0b", bg: "#fffbeb" },
          { text: "Improve summary section", pts: "+8 pts", color: "#f59e0b", bg: "#fffbeb" },
        ].map((item, i) => (
          <motion.div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: item.bg }}
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.1 }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[11px] text-slate-700 font-medium">{item.text}</span>
            </div>
            <span className="text-[10px] font-black" style={{ color: item.color }}>{item.pts}</span>
          </motion.div>
        ))}
        <div className="pt-1">
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">Potential Score Gain</p>
          <motion.p className="text-2xl font-black text-indigo-600"
            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>+25 pts</motion.p>
        </div>
      </div>
    </motion.div>
  );
}

function StepVisualApply() {
  return (
    <motion.div className="w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, ease: "easeOut" }}>
      <div className="w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex flex-col items-center gap-3">
        <motion.div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", boxShadow: "0 8px 28px rgba(99,102,241,0.35)" }}
          animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <Target className="w-8 h-8 text-white" strokeWidth={1.5} />
        </motion.div>
        <div className="text-center">
          <p className="text-[14px] font-bold text-[#0f172a]">Resume Ready!</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Optimized for ATS systems</p>
        </div>
        <div className="w-full space-y-1.5">
          {[
            { label: "ATS Compatibility", val: "98%" },
            { label: "Keyword Coverage", val: "High" },
            { label: "Format Quality", val: "Excellent" },
          ].map((item, i) => (
            <motion.div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-green-50 rounded-xl"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }}>
              <span className="text-[10px] text-slate-600 font-medium">{item.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-green-700">{item.val}</span>
                <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const stepVisuals = [<StepVisualUpload key="upload" />, <StepVisualReport key="report" />, <StepVisualFix key="fix" />, <StepVisualApply key="apply" />];

function ScanningMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [phase, setPhase] = useState<"upload" | "scanning" | "complete">("upload");
  const [scanPct, setScanPct] = useState(0);
  const [catCount, setCatCount] = useState(0);
  const scoreVal = useCounter(92, 1400, phase === "complete");

  useEffect(() => {
    if (!inView) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    let intervals: ReturnType<typeof setInterval>[] = [];
    const run = () => {
      setPhase("upload"); setScanPct(0); setCatCount(0);
      timers.push(setTimeout(() => {
        setPhase("scanning");
        let pct = 0;
        const iv = setInterval(() => { pct += 2; setScanPct(Math.min(pct, 100)); if (pct >= 100) clearInterval(iv); }, 60);
        intervals.push(iv);
        let cat = 0;
        const iv2 = setInterval(() => { cat++; setCatCount(cat); if (cat >= 17) clearInterval(iv2); }, 3000 / 17);
        intervals.push(iv2);
        timers.push(setTimeout(() => { setPhase("complete"); timers.push(setTimeout(run, 5000)); }, 3200));
      }, 2200));
    };
    run();
    return () => { timers.forEach(clearTimeout); intervals.forEach(clearInterval); };
  }, [inView]);

  return (
    <div ref={ref} className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-xl flex flex-col" style={{ background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)", height: "100%" }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100" style={{ background: "#f8fafc" }}>
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[10px] text-slate-400 font-mono tracking-wide">resume_v3.pdf — ATS Analysis · careerbot.ai</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={phase} className="flex-1 overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>

          {/* Phase 1: Upload */}
          {phase === "upload" && (
            <div className="flex flex-col items-center justify-center py-12 px-6" style={{ height: "100%" }}>
              <motion.div className="w-full max-w-xs rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 flex flex-col items-center justify-center py-8 px-6 mb-4"
                animate={{ borderColor: ["#c7d2fe", "#818cf8", "#c7d2fe"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <motion.div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-3"
                  animate={{ y: [0, -6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                  <Upload className="w-5 h-5 text-indigo-500" strokeWidth={1.8} />
                </motion.div>
                <p className="text-[13px] font-bold text-slate-700 mb-1">Drop your resume here</p>
                <p className="text-[11px] text-slate-400 mb-3">PDF or DOCX · Max 5MB</p>
                <div className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-[11px] font-bold">Browse File</div>
              </motion.div>
              <motion.div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 w-full max-w-xs"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.4 }}>
                <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-700">resume_v3.pdf</p>
                  <p className="text-[10px] text-slate-400">248 KB</p>
                </div>
                <motion.div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent"
                  animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
              </motion.div>
            </div>
          )}

          {/* Phase 2: Scanning */}
          {phase === "scanning" && (
            <div className="flex flex-col items-center justify-center py-12 px-6" style={{ height: "100%" }}>
              <div className="relative mb-5">
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e0e7ff" strokeWidth="7" />
                  <motion.circle cx="50" cy="50" r="42" fill="none" stroke="url(#scanGrad)" strokeWidth="7"
                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 42}
                    style={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - scanPct / 100) }} />
                  <defs>
                    <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[24px] font-black text-slate-800 leading-none tabular-nums">{scanPct}%</span>
                </div>
              </div>
              <p className="text-[14px] font-bold text-slate-800 mb-1">Analyzing your resume…</p>
              <p className="text-[11px] text-slate-400">Scanning {catCount} of 17 categories</p>
            </div>
          )}

          {/* Phase 3: Complete */}
          {phase === "complete" && (
            <div className="p-4" style={{ height: "100%" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap">ATS Analysis Complete</p>
                <motion.span className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ml-2"
                  initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> 17/17
                </motion.span>
              </div>
              {/* Score + bars */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative shrink-0">
                  <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 0 5px rgba(99,102,241,0.2))" }}>
                    <circle cx="32" cy="32" r="25" fill="none" stroke="#e8edf5" strokeWidth="5" />
                    <motion.circle cx="32" cy="32" r="25" fill="none" stroke="url(#scoreGrad2)" strokeWidth="5"
                      strokeLinecap="round" strokeDasharray={2 * Math.PI * 25}
                      initial={{ strokeDashoffset: 2 * Math.PI * 25 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 25 * (1 - 0.92) }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }} />
                    <defs>
                      <linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2557a7" /><stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[16px] font-black text-slate-900 leading-none tabular-nums">{scoreVal}</span>
                    <span className="text-[7px] text-slate-400 font-semibold">/100</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {[{ label: "Keyword Match", pct: 89, color: "#2557a7" }, { label: "Experience", pct: 94, color: "#10b981" }, { label: "Format Score", pct: 97, color: "#f59e0b" }].map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="text-slate-500 truncate mr-1">{m.label}</span>
                        <span className="font-bold shrink-0" style={{ color: m.color }}>{m.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <motion.div className="h-1.5 rounded-full" style={{ background: m.color }}
                          initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 0.8, delay: 0.3 + i * 0.12 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Action items */}
              <div className="space-y-1.5">
                {[
                  { label: "Add missing role keywords", pts: "+16 pts", color: "#ef4444", bg: "rgba(239,68,68,0.07)" },
                  { label: "Quantify experience bullets", pts: "+12 pts", color: "#f59e0b", bg: "rgba(245,158,11,0.07)" },
                  { label: "Improve summary section",    pts: "+8 pts",  color: "#f59e0b", bg: "rgba(245,158,11,0.07)" },
                ].map((item, i) => (
                  <motion.div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                    style={{ background: item.bg, border: `1px solid ${item.color}22` }}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.12 }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-[11px] text-slate-600 flex-1 truncate">{item.label}</span>
                    <span className="text-[10px] font-black shrink-0 ml-1" style={{ color: item.color }}>{item.pts}</span>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 mt-2" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] text-emerald-600 font-semibold truncate">Analysis complete · Top 8% of resumes</span>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <div>
      {/* Section header */}
      <motion.div className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
        <h2 className="text-3xl md:text-4xl font-black text-[#0f172a] mb-3 leading-tight">
          How CareerBot&apos;s ATS Checker Works
        </h2>
        <p className="text-[15px] text-slate-500 max-w-xl mx-auto leading-relaxed">
          Our free ATS score checker analyzes your resume&apos;s content and structure to verify ATS compatibility and provide actionable steps for improvement.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 lg:gap-12 items-start">

        {/* LEFT — Accordion steps (fixed width, no layout shift) */}
        <motion.div className="space-y-5"
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
          {steps.map((step, i) => {
            const isOpen = activeStep === i;
            return (
              <motion.div key={i}
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
                className="rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden"
                style={{
                  background: isOpen ? "#ffffff" : "#f8f9fa",
                  borderColor: "#e2e8f0",
                  boxShadow: isOpen ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
                }}
                onClick={() => setActiveStep(i)}>
                {/* Header — always same height */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-[14px] font-black"
                    style={{ background: "#2557a7", boxShadow: "0 3px 10px rgba(37,87,167,0.35)" }}>
                    {step.num}
                  </div>
                  <h4 className="flex-1 text-[15px] font-bold text-[#0f172a] leading-snug">{step.title}</h4>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </motion.div>
                </div>
                {/* Description — expands below, doesn't shift card width */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key="body"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }} className="overflow-hidden">
                      <p className="px-5 pb-5 text-[13.5px] text-slate-500 leading-relaxed">{step.desc}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* RIGHT — Fixed-size scanning mockup (never resizes) */}
        <motion.div
          className="hidden lg:block sticky top-24"
          style={{ width: 480, minWidth: 480 }}
          initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, ease: "easeOut" }}>
          {/* Background panel with grid — fixed height */}
          <div className="relative rounded-3xl p-5"
            style={{
              background: "#d8eef5",
              backgroundImage: "linear-gradient(rgba(37,87,167,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,87,167,0.08) 1px, transparent 1px)",
              backgroundSize: "28px 28px, 28px 28px",
              height: 420,
            }}>
            <div style={{ height: "100%" }}>
              <ScanningMockup />
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.05 });
  const score = useCounter(SCORE, 1400, isInView);

  const [phase, setPhase] = useState<"upload" | "scanning" | "complete">("upload");
  const [scanPct, setScanPct] = useState(0);
  const [catCount, setCatCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    let intervals: ReturnType<typeof setInterval>[] = [];

    const run = () => {
      setPhase("upload");
      setScanPct(0);
      setCatCount(0);

      timers.push(setTimeout(() => {
        setPhase("scanning");
        let pct = 0;
        const iv = setInterval(() => {
          pct += 2;
          setScanPct(Math.min(pct, 100));
          if (pct >= 100) clearInterval(iv);
        }, 60);
        intervals.push(iv);
        let cat = 0;
        const iv2 = setInterval(() => {
          cat++;
          setCatCount(cat);
          if (cat >= 17) clearInterval(iv2);
        }, 3000 / 17);
        intervals.push(iv2);
        timers.push(setTimeout(() => {
          setPhase("complete");
          timers.push(setTimeout(run, 5000));
        }, 3200));
      }, 2200));
    };

    run();
    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, [isInView]);

  return (
    <section
      ref={sectionRef}
      className="relative pt-6 pb-16 md:pt-8 md:pb-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f7faff 0%, #ffffff 40%)" }}
    >
      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">




        {/* ── How CareerBot Works ── */}
        <HowItWorksSection />

      </div>
    </section>
  );
}
