"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Upload Resume",
    description: "Drop your PDF or DOCX resume — our AI reads every section instantly.",
  },
  {
    number: "02",
    title: "Paste Job Description",
    description: "Copy any job posting from LinkedIn, Indeed, or any company site and paste it in.",
  },
  {
    number: "03",
    title: "Analyze & Get Results",
    description: "Click Analyze — get your match score, matched skills, and missing keywords instantly.",
  },
  {
    number: "04",
    title: "Optimize Resume",
    description: "Apply AI suggestions to fill gaps and boost your score before applying.",
  },
];

// ── Step 01: Upload Resume ───────────────────────────────────────────────────
function UploadPreview() {
  const [phase, setPhase] = useState<"idle" | "uploading" | "done">("idle");
  const parsed = ["Experience parsed", "Skills parsed", "Education parsed", "Projects parsed"];

  useEffect(() => {
    setPhase("idle");
    const t1 = setTimeout(() => setPhase("uploading"), 600);
    const t2 = setTimeout(() => setPhase("done"), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-start h-full gap-3 px-4 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-xs border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 p-5 flex flex-col items-center gap-2 relative overflow-hidden"
      >
        {/* Floating resume card */}
        <motion.div
          initial={{ y: -60, opacity: 0, rotate: -3 }}
          animate={phase !== "idle" ? { y: 0, opacity: 1, rotate: 0 } : { y: -60, opacity: 0, rotate: -3 }}
          transition={{ duration: 0.55, type: "spring", stiffness: 180 }}
          className="absolute top-3 right-4 bg-white rounded-xl shadow-lg px-3 py-1.5 flex items-center gap-2 border border-slate-100"
        >
          <div className="w-6 h-7 rounded bg-blue-600 flex items-center justify-center shrink-0">
            <svg width="10" height="12" viewBox="0 0 12 14" fill="none">
              <path d="M2 1h5.5L10 3.5V13H2V1z" fill="white" fillOpacity=".9"/>
              <path d="M7 1v3h3" stroke="white" strokeWidth="1.2"/>
            </svg>
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-xs bg-white rounded-xl border border-slate-100 shadow-sm p-4"
          >
            {phase === "uploading" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-semibold text-slate-600">Uploading Resume.pdf</span>
                  <span className="text-[11px] text-blue-600 font-medium">Analyzing…</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "70%" }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}
            {phase === "done" && (
              <div className="flex flex-col gap-1.5">
                {parsed.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex items-center gap-2 text-[12px] text-slate-700"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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

// ── Step 02: Paste Job Description ───────────────────────────────────────────
function JDPreview() {
  const [phase, setPhase] = useState<"idle" | "done">("idle");
  const url = "https://www.linkedin.com/jobs/senior-frontend-engineer-2...";

  useEffect(() => {
    setPhase("idle");
    const t = setTimeout(() => setPhase("done"), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start h-full px-4 pt-12">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5"
        >
              <p className="text-[14px] font-bold text-slate-800 mb-3">Paste a link or text for the job:</p>

              {/* URL input */}
              <div className="relative mb-1">
                <input
                  readOnly
                  value={phase === "done" ? url : ""}
                  placeholder="https://linkedin.com/jobs/..."
                  className="w-full text-[11.5px] text-slate-600 border-b-2 border-blue-500 bg-transparent pb-1.5 pr-7 outline-none placeholder:text-slate-300"
                  onChange={() => {}}
                />
                {phase === "done" && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-0 top-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mb-4">Example: https://www.linkedin.com/jobs/…</p>

              {/* Tabs: link / text */}
              <div className="flex gap-2 mb-4">
                <span className="text-[11px] font-semibold text-blue-600 border-b-2 border-blue-600 pb-0.5 cursor-pointer">Paste Link</span>
                <span className="text-[11px] font-semibold text-slate-400 pb-0.5 cursor-pointer">Paste Text</span>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600">Cancel</button>
                <button className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold shadow-sm">Continue</button>
              </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Step 03: Analyze ─────────────────────────────────────────────────────────
function CountUp({ to, duration = 1.4 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    setVal(0);
    const steps = 40;
    const step = to / steps;
    let cur = 0;
    const iv = setInterval(() => {
      cur = Math.min(cur + step, to);
      setVal(Math.round(cur));
      if (cur >= to) clearInterval(iv);
    }, (duration * 1000) / steps);
    return () => clearInterval(iv);
  }, [to, duration]);
  return <>{val}</>;
}

function CircleScore({ score, color, label }: { score: number; color: string; label: string }) {
  const size = 88;
  const strokeWidth = 7;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(score / 100), 200);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth}/>
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[18px] font-black text-slate-800">
            <CountUp to={score} /><span className="text-[11px]">%</span>
          </span>
        </div>
      </div>
      <span className="text-[12px] font-semibold text-slate-500">{label}</span>
    </div>
  );
}

function AnalyzePreview() {
  const matched = ["React", "TypeScript", "Next.js", "Node.js"];
  const missing = [{ name: "Python", pts: "+4 pts" }, { name: "Docker", pts: "+3 pts" }, { name: "AWS", pts: "+2 pts" }];

  return (
    <div className="flex flex-col items-center justify-start h-full gap-3 px-4 pt-12">
      <div className="w-full max-w-xs bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Analysis Results</p>

        {/* Match score centered */}
        <div className="flex justify-center mb-4">
          <CircleScore score={82} color="#7c3aed" label="Match Score" />
        </div>

        {/* Skills split */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Matched Skills</p>
            <div className="flex flex-col gap-1">
              {matched.map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.09 }}
                  className="flex items-center gap-1.5 text-[11.5px] text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"/>
                  {s}
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Missing Skills</p>
            <div className="flex flex-col gap-1">
              {missing.map((s, i) => (
                <motion.div key={s.name} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11.5px] text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-400 shrink-0"/>
                    {s.name}
                  </div>
                  <span className="text-[10px] font-bold text-blue-600">{s.pts}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 04: Optimize ────────────────────────────────────────────────────────
function OptimizePreview() {
  const [phase, setPhase] = useState(0);
  const keywords = ["+ React", "+ TypeScript", "+ GraphQL"];
  const improvements = ["Added Python", "Added Docker", "Added ATS Summary", "Added Missing Sections"];

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-start h-full px-4 pt-10">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">

        {/* Dark header */}
        <div className="bg-[#1a2744] px-5 py-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Resume Tailoring</p>
            <p className="text-[15px] font-bold text-white">Senior Frontend Engineer</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Match</p>
            <motion.p
              className="text-[18px] font-black text-amber-400"
              key={phase >= 3 ? "after" : "before"}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {phase >= 3 ? "94%" : "82%"}
            </motion.p>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Keywords added */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Keywords Added</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <AnimatePresence key={kw}>
                  {phase >= 1 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: i * 0.12, duration: 0.3 }}
                      className="px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-semibold"
                    >
                      {kw}
                    </motion.span>
                  )}
                </AnimatePresence>
              ))}
            </div>
          </div>

          {/* Summary improved */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Summary Improved</p>
            <div className="flex flex-col gap-1.5">
              <AnimatePresence>
                {phase >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100"
                  >
                    <span className="text-red-400 font-bold text-[13px] shrink-0">−</span>
                    <span className="text-[12px] text-slate-400 line-through">Frontend Developer</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {phase >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100"
                  >
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

          {/* Match improvement */}
          <AnimatePresence>
            {phase >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Match Improvement</p>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-slate-400 line-through">82%</span>
                  <svg width="16" height="10" viewBox="0 0 20 10" fill="none">
                    <path d="M0 5h18M13 1l5 4-5 4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <motion.span
                    className="text-[22px] font-black text-amber-500"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                  >
                    94%
                  </motion.span>
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

const PREVIEWS = [UploadPreview, JDPreview, AnalyzePreview, OptimizePreview];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % STEPS.length);
    }, 4000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSelect = (i: number) => {
    setActive(i);
    startTimer();
  };

  const PreviewComponent = PREVIEWS[active];

  return (
    <section
      id="how-it-works"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: "#ffffff", borderTop: "1px solid #f1f5f9" }}
    >
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block text-[11px] font-bold text-[#2557A7] uppercase tracking-widest bg-[#EEF4FF] border border-[#dde8f8] px-4 py-1.5 rounded-full mb-5">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight text-slate-900">
            From Resume to{" "}
            <span className="bg-gradient-to-r from-[#2557A7] to-[#7c3aed] bg-clip-text text-transparent">
              Interview Ready
            </span>{" "}
            in Minutes
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto leading-relaxed">
            Upload your resume, compare it against any job description, and improve your match score with AI-powered recommendations.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* Left: Step navigation */}
          <div className="w-full lg:w-90 shrink-0 flex flex-col gap-4">
              {STEPS.map((step, i) => {
                const isActive = active === i;
                return (
                  <motion.button
                    key={step.number}
                    onClick={() => handleSelect(i)}
                    className={`relative w-full flex items-center gap-4 px-5 py-5 rounded-2xl text-left transition-all duration-300 border ${
                      isActive
                        ? "bg-white shadow-md border-slate-200"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                    }`}
                    whileHover={{ x: isActive ? 0 : 3 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* Active left accent bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeAccent"
                        className="absolute left-0 top-3 bottom-3 w-0.75 bg-blue-600 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}

                    {/* Step circle */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-slate-200 text-slate-400"
                    }`}>
                      <span className="text-[11px] font-black">{step.number}</span>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13.5px] font-bold leading-tight transition-colors duration-300 ${
                        isActive ? "text-slate-900" : "text-slate-400"
                      }`}>
                        {step.title}
                      </p>
                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22 }}
                            className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed"
                          >
                            {step.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Right icon */}
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 animate-pulse" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M7 17L17 7M17 7H7M17 7v10"/>
                      </svg>
                    )}
                  </motion.button>
                );
              })}

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 px-1 mt-1">
              {STEPS.map((_, i) => (
                <button key={i} onClick={() => handleSelect(i)}
                  className={`transition-all duration-300 rounded-full ${i === active ? "w-6 h-1.5 bg-blue-600" : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Product preview */}
          <div className="flex-1 min-h-0 lg:-mt-10">
            <div
              className="relative bg-white rounded-3xl overflow-hidden"
              style={{
                height: "470px",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 24px 60px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)",
              }}
            >
              {/* Browser chrome */}
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
                <motion.span
                  key={active}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1.5 bg-blue-600/10 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"/>
                  Step {STEPS[active].number} — {STEPS[active].title}
                </motion.span>
              </div>

              {/* Animated content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
                  transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0 top-13 overflow-y-auto"
                >
                  <PreviewComponent />
                </motion.div>
              </AnimatePresence>

              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(ellipse at top right, rgba(37,87,167,0.05), transparent 70%)" }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mt-6"
            >
              <span className="inline-flex items-center gap-2 text-[12px] font-bold text-[#2557A7] bg-[#EEF4FF] border border-[#dde8f8] px-5 py-2.5 rounded-full shadow-sm">
                ⚡ Average analysis time: under 15 seconds
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
