"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, ArrowRight, Shield, Clock, X, UploadCloud, UserRound, Briefcase, GraduationCap, BadgeCheck, Tags, FileCheck2, BookOpenCheck } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { processResumeComplete } from "@/api/resumeatsapi";
import ErrorModal from "./ErrorModal";
import { validateResumeFile, formatFileSize } from "@/app/(resume)/ats/utils/helpers";
import { buildAtsReportRoute, normalizeResumeScanError } from "@/app/(resume)/ats/utils/scanFlow";

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

enum AnalysisPhase {
  Uploading = "Uploading",
  Analyzing = "Analyzing",
  Complete  = "Complete",
}

const SLIDES = [
  "Improve Your Resume with AI Auto-Customization",
  "Calculating Your ATS Compatibility Score",
  "Generating Your Personalized Action Plan",
] as const;

const STEPS = [
  { n: "01", label: "Upload"  },
  { n: "02", label: "Analyze" },
  { n: "03", label: "Report"  },
] as const;

const FEATURE_PILLS = [
  { label: "ATS-compatible",         Icon: Shield   },
  { label: "AI-powered scanning",    Icon: Sparkles },
  { label: "Results in ~30 seconds", Icon: Clock    },
] as const;

const DROPZONE_INDICATORS = [
  {
    label: "ATS Compatible",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>
      </svg>
    ),
  },
  {
    label: "Keywords parsed",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
    ),
  },
  {
    label: "Format checked",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
] as const;

const LIVE_MESSAGES = [
  "Analyzing work experience...",
  "Checking ATS compatibility...",
  "Finding missing keywords...",
  "Evaluating resume structure...",
  "Calculating recruiter readability...",
] as const;

const ANALYSIS_CHECKLIST = [
  { label: "Resume Uploaded", start: 0, Icon: UploadCloud },
  { label: "Contact Information", start: 15, Icon: UserRound },
  { label: "Experience Analysis", start: 35, Icon: Briefcase },
  { label: "Education Review", start: 45, Icon: GraduationCap },
  { label: "Skills Validation", start: 55, Icon: BadgeCheck },
  { label: "Keyword Optimization", start: 70, Icon: Tags },
  { label: "ATS Formatting Check", start: 82, Icon: FileCheck2 },
  { label: "Readability Analysis", start: 92, Icon: BookOpenCheck },
] as const;


const WORKFLOW = [
  { id: "upload",  label: "Upload",  icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg> },
  { id: "analyze", label: "Analyze", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> },
  { id: "report",  label: "Report",  icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
];

// ─── Types ────────────────────────────────────────────────────────────────────


interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  agreed: boolean;
  onAgree: (v: boolean) => void;
}

interface UploadZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

interface LoadingOverlayProps {
  displayProgress: number;
  loadingPhase: AnalysisPhase | "";
}

// ─── Data ─────────────────────────────────────────────────────────────────────



// ─── Sub-components ───────────────────────────────────────────────────────────



function UploadZone({ isDragging, onDragOver, onDragLeave, onDrop }: UploadZoneProps) {
  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <label
        htmlFor="ats-file-upload"
        className={[
          "relative flex flex-col items-center justify-center gap-4 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden",
          "min-h-70 border-[1.5px] border-dashed",
          isDragging
            ? "border-blue-500 bg-blue-50/70"
            : "border-slate-200 bg-slate-50/60 hover:border-blue-400/70 hover:bg-blue-50/30",
        ].join(" ")}
      >
        {/* Subtle center radial */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: isDragging
            ? "radial-gradient(ellipse 70% 60% at 50% 50%,rgba(37,87,167,0.10) 0%,transparent 70%)"
            : "radial-gradient(ellipse 70% 60% at 50% 50%,rgba(37,87,167,0.05) 0%,transparent 70%)"
          }}
        />

        <motion.div
          animate={isDragging ? { scale: 1.12, y: -6 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="relative z-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-white grid place-items-center"
            style={{
              boxShadow: "0 0 0 1px rgba(37,87,167,0.12), 0 4px 12px rgba(37,87,167,0.12), 0 12px 32px rgba(37,87,167,0.08)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2557a7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </div>
        </motion.div>

        <div className="relative z-10 text-center space-y-1">
          <p className="text-[15px] font-semibold text-slate-800">
            {isDragging ? "Release to upload" : "Drop your resume here"}
          </p>
          <p className="text-[13px] text-slate-400">
            or{" "}
            <span className="text-blue-600 font-semibold">browse files</span>
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 text-[12px] text-slate-400">
          <span className="font-semibold text-slate-500">PDF</span>
          <span>·</span>
          <span className="font-semibold text-slate-500">DOCX</span>
          <span>·</span>
          <span className="font-semibold text-slate-500">DOC</span>
          <span>· Max 10MB</span>
        </div>

        <div className="relative z-10 flex items-center gap-5">
          {DROPZONE_INDICATORS.map(({ label, icon }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium">
              <span className="text-slate-400">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </label>
    </div>
  );
}

function FilePreview({ file, onRemove, agreed, onAgree }: FilePreviewProps) {
  const ext      = file.name.split(".").pop()?.toUpperCase() ?? "";
  const sizeKB   = formatFileSize(file.size);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 px-4 py-4 rounded-xl bg-blue-50/60 border border-blue-100"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}
      >
        <div className="relative shrink-0 w-10 h-12 rounded-lg bg-white border border-slate-200 flex flex-col justify-center gap-1 px-1.5"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
        >
          <div className="h-0.5 rounded-full bg-slate-200" />
          <div className="h-0.5 rounded-full bg-slate-200 w-3/4" />
          <div className="h-0.5 rounded-full bg-slate-200" />
          <span className="absolute -bottom-1.5 -right-1.5 text-[7px] font-black text-white bg-blue-600 px-1 py-0.5 rounded leading-none">
            {ext}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-slate-900 truncate">{file.name}</p>
          <p className="text-[12px] text-slate-400 mt-0.5">{sizeKB} · {ext}</p>
          <p className="text-[12px] text-emerald-600 mt-1.5 flex items-center gap-1.5 font-semibold">
            <Check className="w-3 h-3" strokeWidth={3} /> Ready to scan
          </p>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-lg transition-all shrink-0"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer px-0.5">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgree(e.target.checked)}
          className="w-3.5 h-3.5 mt-0.5 accent-blue-600 shrink-0 cursor-pointer"
        />
        <span className="text-[12px] text-slate-500 leading-relaxed">
          I agree to CareerBot&apos;s{" "}
          <span className="text-blue-600 underline cursor-pointer font-medium">Terms of Service</span> and confirm this
          resume is processed for analysis only and{" "}
          <strong className="text-slate-800 font-semibold">never stored</strong>.
        </span>
      </label>
    </div>
  );
}

function LoadingOverlay({ displayProgress, loadingPhase }: LoadingOverlayProps) {
  const isComplete = loadingPhase === AnalysisPhase.Complete;
  const reduceMotion = useReducedMotion();
  const [liveMsg, setLiveMsg] = useState(0);

  useEffect(() => {
    if (isComplete || reduceMotion) return;
    const id = setInterval(() => setLiveMsg((m) => (m + 1) % LIVE_MESSAGES.length), 3000);
    return () => clearInterval(id);
  }, [isComplete, reduceMotion]);

  const ringSize = 155;
  const center = ringSize / 2;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, displayProgress));
  const progressLabel = Math.round(clampedProgress);
  const remainingSeconds = Math.max(0, Math.ceil((100 - clampedProgress) * 18 / 28));

  return (
    <motion.div
      key="loading-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 18 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 48%,#EEF6FF 100%)",
          boxShadow: "0 0 0 1px rgba(226,232,240,0.95), 0 24px 60px rgba(15,23,42,0.30), 0 8px 20px rgba(15,23,42,0.10)",
        }}
      >
        <div className="relative z-10 px-4 py-3 flex flex-col items-center gap-2">
          {!isComplete ? (
            <>
              {/* Ring card */}
              <div className="w-full rounded-2xl border border-[#E8EEF7] bg-linear-to-b from-white to-[#F0F6FF] px-4 py-3 flex flex-col items-center gap-2"
                style={{ boxShadow: "0 4px 24px rgba(37,99,235,0.08)" }}>

                <p className="text-[15px] font-bold text-[#2563EB]">Premium ATS Scan</p>

                {/* Ring */}
                <div className="relative grid place-items-center" style={{ width: ringSize, height: ringSize }}>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", filter: "blur(8px)" }} />

                  <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} overflow="visible">
                    <defs>
                      <linearGradient id="atsRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1D4ED8" />
                        <stop offset="100%" stopColor="#60A5FA" />
                      </linearGradient>
                    </defs>
                    {/* Track */}
                    <circle cx={center} cy={center} r={radius} fill="white" stroke="#DBEAFE" strokeWidth="16" />
                    {/* Progress arc */}
                    <motion.circle
                      cx={center} cy={center} r={radius}
                      fill="none" stroke="url(#atsRingGrad)" strokeWidth="16" strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: circumference * (1 - clampedProgress / 100) }}
                      transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
                      style={{ transform: "rotate(-90deg)", transformOrigin: `${center}px ${center}px`, filter: "drop-shadow(0 0 6px rgba(37,99,235,0.5))" }}
                    />
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[34px] font-black text-[#101828] leading-none tabular-nums">{progressLabel}%</span>
                    <span className="text-[12px] font-medium text-[#6B7280]">{remainingSeconds} sec left</span>
                  </div>
                </div>

                {/* Live message */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={liveMsg}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[14px] font-bold text-[#2563EB] text-center"
                  >
                    {LIVE_MESSAGES[liveMsg]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Checklist */}
              <div className="w-full rounded-[8px] border border-[#E6EAF0] overflow-hidden bg-white">
                {ANALYSIS_CHECKLIST.map((item, index) => {
                  const next = ANALYSIS_CHECKLIST[index + 1]?.start ?? 101;
                  const done = clampedProgress >= next;
                  const scanning = !done && clampedProgress >= item.start;
                  return (
                    <div key={item.label} className="flex h-8 items-center gap-3 border-b border-[#F1F5F9] px-4 last:border-b-0">
                      <span className="grid h-3 w-3 shrink-0 place-items-center rounded-full" style={{ background: done ? "#ECFDF3" : scanning ? "#FFFBEB" : "#F1F5F9", color: done ? "#22C55E" : scanning ? "#F59E0B" : "#94A3B8" }}>
                        {done ? <Check className="h-2 w-2" strokeWidth={3} /> : scanning ? (
                          <motion.span animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }} className="block h-2.5 w-2.5 rounded-full border border-current border-t-transparent" />
                        ) : <span className="h-1 w-1 rounded-full bg-current" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#101828]">{item.label}</span>
                      <span className="text-[12px] font-bold" style={{ color: done ? "#16A34A" : scanning ? "#F59E0B" : "#94A3B8" }}>
                        {done ? "Done" : scanning ? "Scanning" : "Queued"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
              </div>
              <p className="text-[13px] font-bold text-slate-900">Analysis Complete</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Redirecting...</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyLoadingOverlay({ displayProgress, displaySlide, loadingPhase }: { displayProgress: number; displaySlide: number; loadingPhase: AnalysisPhase | "" }) {
  const isComplete = loadingPhase === AnalysisPhase.Complete;
  const [liveMsg, setLiveMsg] = useState(0);

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setLiveMsg((m) => (m + 1) % LIVE_MESSAGES.length), 1800);
    return () => clearInterval(id);
  }, [isComplete]);

  const workflowActive =
    displayProgress < 18 ? 0 :
    displayProgress < 40 ? 1 :
    displayProgress < 65 ? 2 :
    displayProgress < 88 ? 3 : 4;

  return (
    <motion.div
      key="loading-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(8px)" }}
    >
      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 18 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "#F8F9FF",
          boxShadow: "0 0 0 1px rgba(226,232,240,0.9), 0 32px 80px rgba(15,23,42,0.35), 0 8px 24px rgba(15,23,42,0.12)",
        }}
      >
        {/* Inner glow + dot grid */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div style={{ position:"absolute", top:"-20%", left:"5%", width:380, height:280,
            background:"radial-gradient(ellipse,rgba(37,87,167,0.07) 0%,transparent 60%)", filter:"blur(40px)" }}/>
          <div style={{ position:"absolute", bottom:"-15%", right:"-5%", width:280, height:240,
            background:"radial-gradient(ellipse,rgba(13,148,136,0.05) 0%,transparent 60%)", filter:"blur(35px)" }}/>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle,rgba(148,163,184,0.09) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}/>

        {/* Card content */}
        <div className="relative z-10 px-8 pt-8 pb-6 flex flex-col items-center">
          {!isComplete ? (
            <>
              {/* ── GAUGE WITH GLOWING TIP DOT ── */}
              <div className="relative mb-5" style={{ width:172, height:172 }}>

                {/* Ambient halo */}
                <motion.div
                  animate={{ opacity:[0.28,0.55,0.28], scale:[1,1.09,1] }}
                  transition={{ duration:3.2, repeat:Infinity, ease:"easeInOut" }}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset:"-16%",
                    background:"radial-gradient(circle,rgba(37,87,167,0.13) 0%,rgba(6,182,212,0.05) 50%,transparent 70%)",
                    filter:"blur(20px)",
                  }}
                />

                <svg width="172" height="172" viewBox="0 0 172 172" style={{ position:"relative", zIndex:2 }}>
                  <defs>
                    <linearGradient id="atsLoginArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2557a7"/>
                      <stop offset="55%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#06b6d4"/>
                    </linearGradient>
                    <filter id="tipGlow" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur stdDeviation="4" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Outer decorative tick marks */}
                  {Array.from({ length: 36 }, (_, i) => {
                    const a = ((i / 36) * 360 - 90) * (Math.PI / 180);
                    const r1 = 82, r2 = i % 3 === 0 ? 77 : 79;
                    return (
                      <line key={i}
                        x1={86 + r1 * Math.cos(a)} y1={86 + r1 * Math.sin(a)}
                        x2={86 + r2 * Math.cos(a)} y2={86 + r2 * Math.sin(a)}
                        stroke={i % 3 === 0 ? "rgba(37,87,167,0.22)" : "rgba(37,87,167,0.10)"}
                        strokeWidth={i % 3 === 0 ? 1.5 : 1} strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Track ring */}
                  <circle cx="86" cy="86" r="66" fill="none"
                    stroke="rgba(226,232,240,0.7)" strokeWidth="9"
                    style={{ transform:"rotate(-90deg)", transformOrigin:"86px 86px" }}
                  />

                  {/* Progress arc */}
                  <motion.circle
                    cx="86" cy="86" r="66"
                    fill="none" stroke="url(#atsLoginArcGrad)" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 66}
                    initial={{ strokeDashoffset: 2 * Math.PI * 66 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 66 * (1 - displayProgress / 100) }}
                    transition={{ duration:0.55, ease:"easeOut" }}
                    style={{
                      transform:"rotate(-90deg)", transformOrigin:"86px 86px",
                      filter:"drop-shadow(0 0 5px rgba(37,87,167,0.45))",
                    }}
                  />

                  {/* Glowing tip dot that travels with progress */}
                  {(() => {
                    const angle = (-90 + (displayProgress / 100) * 360) * (Math.PI / 180);
                    const x = 86 + 66 * Math.cos(angle);
                    const y = 86 + 66 * Math.sin(angle);
                    return (
                      <g filter="url(#tipGlow)">
                        <circle cx={x} cy={y} r="8"  fill="white" opacity="0.6"/>
                        <circle cx={x} cy={y} r="5.5" fill="#2557a7"/>
                        <circle cx={x} cy={y} r="2.5" fill="white" opacity="0.95"/>
                      </g>
                    );
                  })()}
                </svg>

                {/* Center % */}
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex:3 }}>
                  <motion.div
                    animate={{ scale:[1,1.22,1], opacity:[0.14,0.28,0.14] }}
                    transition={{ duration:2.6, repeat:Infinity, ease:"easeInOut" }}
                    className="absolute rounded-full pointer-events-none"
                    style={{ width:72, height:72, background:"radial-gradient(circle,rgba(37,87,167,0.55) 0%,transparent 70%)" }}
                  />
                  <span className="relative font-black text-slate-900 leading-none"
                    style={{ fontSize:40, letterSpacing:"-0.04em", zIndex:1 }}>
                    {Math.round(displayProgress)}
                  </span>
                  <span className="relative text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase mt-0.5" style={{ zIndex:1 }}>
                    %
                  </span>
                </div>
              </div>

            {/* Live rotating AI message */}
            <AnimatePresence mode="wait">
              <motion.div
                key={liveMsg}
                initial={{ opacity:0, y:5 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-5 }}
                transition={{ duration:0.22, ease:EASE }}
                className="flex items-center gap-2 mb-2.5 h-5"
              >
                <motion.span
                  animate={{ opacity:[1,0.3,1] }}
                  transition={{ duration:1.2, repeat:Infinity }}
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background:"linear-gradient(135deg,#2557a7,#3b82f6)" }}
                />
                <span className="text-[11.5px] text-slate-500 font-medium">{LIVE_MESSAGES[liveMsg]}</span>
              </motion.div>
            </AnimatePresence>

            {/* Slide heading */}
            <AnimatePresence mode="wait">
              <motion.div
                key={displaySlide}
                initial={{ opacity:0, y:8 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.3, ease:EASE }}
                className="text-center mb-4"
              >
                <h2 className="font-bold text-slate-900 leading-snug"
                  style={{ fontSize:17, letterSpacing:"-0.025em" }}>
                  {SLIDES[displaySlide]}
                </h2>
              </motion.div>
            </AnimatePresence>

            {/* Slide dots */}
            <div className="flex items-center gap-2 mb-6">
              {SLIDES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === displaySlide ? 20 : 6,
                    background: i === displaySlide ? "#2557a7" : "#CBD5E1",
                  }}
                  transition={{ duration:0.3 }}
                  className="h-1.5 rounded-full"
                />
              ))}
            </div>

            {/* Animated workflow timeline */}
            <div className="flex items-start w-full">
              {WORKFLOW.map((step, idx) => {
                const isDone   = workflowActive > idx;
                const isActive = workflowActive === idx;
                return (
                  <Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-1.5">
                      <motion.div
                        animate={isActive ? {
                          boxShadow:[
                            "0 0 0 0px rgba(37,87,167,0.35)",
                            "0 0 0 8px rgba(37,87,167,0.0)",
                          ],
                        } : {}}
                        transition={{ duration:1.6, repeat:Infinity }}
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={
                          isDone
                            ? { background:"linear-gradient(135deg,#2557a7,#3b82f6)", color:"white", boxShadow:"0 2px 8px rgba(37,87,167,0.3)" }
                            : isActive
                            ? { background:"linear-gradient(135deg,#1a3a5c,#2557a7)", color:"white", boxShadow:"0 4px 14px rgba(37,87,167,0.45)" }
                            : { background:"#F1F5F9", color:"#94A3B8" }
                        }
                      >
                        {isDone ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        ) : (
                          step.icon
                        )}
                      </motion.div>
                      <span className={`text-[10.5px] font-semibold tracking-wide ${isDone || isActive ? "text-slate-700" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < WORKFLOW.length - 1 && (
                      <div className="flex-1 mx-1.5 overflow-hidden rounded-full mb-5 mt-4"
                        style={{ height:2, minWidth:20, background:"rgba(226,232,240,0.8)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background:"linear-gradient(90deg,#2557a7,#3b82f6)" }}
                          initial={{ width:"0%" }}
                          animate={{ width: workflowActive > idx ? "100%" : workflowActive === idx ? "55%" : "0%" }}
                          transition={{ duration:0.7, ease:EASE }}
                        />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>

          </>
        ) : (
          <motion.div
            initial={{ opacity:0, scale:0.92 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ duration:0.3, ease:EASE }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale:0.4, opacity:0 }}
              animate={{ scale:1, opacity:1 }}
              transition={{ type:"spring", stiffness:260, damping:18 }}
              className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5"
              style={{ boxShadow:"0 0 0 8px rgba(16,185,129,0.08), 0 8px 24px rgba(16,185,129,0.24)" }}
            >
              <Check className="w-8 h-8 text-emerald-600" strokeWidth={2.5}/>
            </motion.div>
            <p className="text-[20px] font-bold text-slate-900 mb-1.5">Scan Complete!</p>
            <p className="text-[14px] text-slate-500">Redirecting to your report…</p>
            <div className="flex gap-1.5 mt-6">
              {[0, 140, 280].map((d) => (
                <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background:"#2557a7", animationDelay:`${d}ms` }}/>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom security note */}
      <div className="relative z-10 py-5 flex items-center justify-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>
        </svg>
        <span className="text-[11.5px] text-slate-400">Your resume is never stored · TLS encrypted · SOC 2</span>
      </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ATSLoginPage() {
  const router = useRouter();

  const [file,            setFile]            = useState<File | null>(null);
  const [isDragging,      setIsDragging]      = useState(false);
  const [agreed,          setAgreed]          = useState(false);
  const [error,           setError]           = useState("");
  const [isLoading,       setIsLoading]       = useState(false);
  const [loadingPhase,    setLoadingPhase]    = useState<AnalysisPhase | "">("");
  const [progress,        setProgress]        = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  const canScan = Boolean(file && agreed);

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };
  const handleRemoveFile = () => { setFile(null); setError(""); setAgreed(false); };

  const validateAndSetFile = (f: File) => {
    setError("");
    const err = validateResumeFile(f, { allowDoc: true, checkSize: true });
    if (err) { setError(err); return; }
    setFile(f);
  };

  const handleScanResume = async () => {
    if (!file) return;
    setError("");
    setIsLoading(true);
    setProgress(0);
    try {
      setLoadingPhase(AnalysisPhase.Uploading);
      setProgress(30);
      const result = await processResumeComplete(file);
      setProgress(70);
      setLoadingPhase(AnalysisPhase.Analyzing);
      if (!result.success) {
        throw new Error(normalizeResumeScanError(result, "Upload failed"));
      }
      setProgress(100);
      setLoadingPhase(AnalysisPhase.Complete);
      const resumeId = typeof result.resume_id === "string" ? result.resume_id : "";
      setTimeout(() => router.push(buildAtsReportRoute(resumeId)), 600);
    } catch (err: unknown) {
      setError(normalizeResumeScanError(err, "Unable to process your resume. Please try again."));
      setIsLoading(false);
      setProgress(0);
      setLoadingPhase("");
    }
  };

  useEffect(() => {
    if (!isLoading) { setDisplayProgress(0); return; }
    const ceiling = progress >= 100 ? 100 : progress >= 70 ? 95 : 68;
    const id = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= ceiling) return prev;
        return Math.min(prev + (prev < progress ? 2 : 0.4), ceiling);
      });
    }, 120);
    return () => clearInterval(id);
  }, [isLoading, progress]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-x-hidden flex flex-col justify-center pt-6 sm:pt-10 lg:pt-12 pb-12 lg:pb-20" style={{ backgroundColor: "#FAFBFF" }}>

      {/* ── Background layers ── */}
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle,rgba(148,163,184,0.18) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Top bloom */}
      <div className="absolute top-0 left-1/2 pointer-events-none"
        style={{
          width: 900, height: 480,
          transform: "translateX(-50%) translateY(-30%)",
          background: "radial-gradient(ellipse at center,rgba(37,87,167,0.09) 0%,rgba(37,87,167,0.07) 40%,transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      {/* Bottom-right accent */}
      <div className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: 500, height: 400,
          background: "radial-gradient(ellipse at bottom right,rgba(16,185,129,0.05) 0%,transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      <ErrorModal
        error={error || null}
        onClose={() => setError("")}
        onRetry={handleScanResume}
      />

      <AnimatePresence>
        {isLoading && (
          <LoadingOverlay
            displayProgress={displayProgress}
            loadingPhase={loadingPhase}
          />
        )}
      </AnimatePresence>

      {/* ── Main workspace ── */}
      <div className="relative w-full max-w-full xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">

        {/* ── Badge — above grid so heading aligns with card top ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pb-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{ background: "white", boxShadow: "0 0 0 1px rgba(37,87,167,0.2), 0 2px 8px rgba(37,87,167,0.10)" }}
          >
            <div className="w-4 h-4 rounded-full grid place-items-center"
              style={{ background: "linear-gradient(135deg,#2557a7,#1a3a8f)" }}
            >
              <Sparkles className="w-2.5 h-2.5 text-white"/>
            </div>
            <span className="text-[11px] font-bold tracking-widest uppercase"
              style={{ background: "linear-gradient(90deg,#2557a7,#1a3a8f)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              AI Resume Analysis
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-[clamp(24px,4vw,72px)] items-start py-4">

          {/* ── LEFT: Hero content ── */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.36, ease: EASE }}
            className="flex flex-col gap-7"
          >
            {/* Heading */}
            <div>
              <h1 className="font-black leading-none tracking-[-0.05em] mb-4"
                style={{ fontSize: "clamp(40px,4.5vw,68px)" }}
              >
                <span className="text-slate-950">ATS </span>
                <span style={{
                  background: "linear-gradient(135deg,#2557a7 0%,#2557a7 50%,#1a3a8f 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Scanner
                </span>
              </h1>
              <p className="text-slate-500 leading-relaxed"
                style={{ fontSize: "clamp(14px,1.1vw,16px)", maxWidth: 440 }}
              >
                Upload your resume and get an instant ATS compatibility report with actionable fixes.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center gap-y-3">
              {FEATURE_PILLS.map(({ label, Icon }, i) => (
                <Fragment key={label}>
                  <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                    <Icon className="w-3.5 h-3.5 text-slate-400"/>
                    <span className="font-medium">{label}</span>
                  </div>
                  {i < FEATURE_PILLS.length - 1 && (
                    <div className="h-3 w-px bg-slate-200 mx-4"/>
                  )}
                </Fragment>
              ))}
            </div>

            {/* How it works */}
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mb-4">How it works</p>
              <div className="flex flex-col gap-[clamp(14px,1.5vw,20px)]">
                {([
                  { n: "01", title: "Upload Your Resume",  desc: "PDF, DOCX or DOC · up to 10 MB"               },
                  { n: "02", title: "AI Scans Instantly",  desc: "Keywords, format & ATS compatibility checked"  },
                  { n: "03", title: "Get Your Report",     desc: "Score breakdown + prioritised action fixes"     },
                ] as const).map((step) => (
                  <div key={step.n} className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5"
                      style={{ background: "linear-gradient(135deg,#2557a7,#1a3a8f)", color: "white", boxShadow: "0 2px 8px rgba(37,87,167,0.28)" }}
                    >
                      {step.n}
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-slate-800">{step.title}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>

          {/* ── RIGHT: Upload card ── */}
          <div className="relative pt-2">
            <div className="absolute -inset-x-6 -inset-y-4 pointer-events-none rounded-[2.5rem]"
              style={{
                background: "radial-gradient(ellipse at 50% 60%,rgba(37,87,167,0.13) 0%,transparent 65%)",
                filter: "blur(20px)",
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: 0.06, ease: EASE }}
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 0 0 1px rgba(203,213,225,0.9), 0 8px 32px rgba(15,23,42,0.10), 0 32px 80px rgba(15,23,42,0.13), 0 2px 4px rgba(37,87,167,0.04)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg,transparent,rgba(37,87,167,0.3) 30%,rgba(37,87,167,0.4) 60%,transparent)" }}
              />

              <div className="p-5 flex flex-col gap-4">

                {/* Stepper */}
                <div className="flex items-center">
                  {STEPS.map((step, i) => (
                    <Fragment key={step.n}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 tracking-wide"
                          style={i === 0 ? {
                            background: "linear-gradient(135deg,#1a3a5c,#2557a7)",
                            color: "white",
                            boxShadow: "0 3px 8px rgba(37,87,167,0.35)",
                          } : {
                            background: "#F1F5F9",
                            color: "#94A3B8",
                          }}
                        >
                          {step.n}
                        </div>
                        <span className={`text-[13px] font-semibold ${i === 0 ? "text-slate-800" : "text-slate-400"}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 mx-3" style={{ height: 1, background: "linear-gradient(90deg,rgba(226,232,240,0.8),rgba(226,232,240,0.3))" }}/>
                      )}
                    </Fragment>
                  ))}
                  <div className="flex items-center gap-1.5 ml-4 shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                    <span className="text-[11px] font-bold text-emerald-700">Live</span>
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  id="ats-file-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                />

                {/* Dropzone / FilePreview */}
                <AnimatePresence mode="wait">
                  {!file ? (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                      <UploadZone
                        isDragging={isDragging}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="ready" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                      <FilePreview
                        file={file}
                        onRemove={handleRemoveFile}
                        agreed={agreed}
                        onAgree={setAgreed}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <motion.button
                  onClick={handleScanResume}
                  disabled={!canScan}
                  whileHover={canScan ? { y: -2 } : {}}
                  whileTap={canScan ? { scale: 0.988 } : {}}
                  transition={{ duration: 0.12 }}
                  className={[
                    "w-full flex items-center justify-center gap-2.5 rounded-2xl font-semibold text-[15px] tracking-[0.01em] transition-all",
                    canScan ? "text-white cursor-pointer" : "text-slate-400 cursor-not-allowed",
                  ].join(" ")}
                  style={
                    canScan
                      ? {
                          height: 52,
                          background: "linear-gradient(135deg,#1a3a5c 0%,#2557a7 45%,#2557a7 100%)",
                          boxShadow: "0 0 0 1px rgba(37,87,167,0.3), 0 4px 20px rgba(37,87,167,0.40), 0 1px 0 rgba(255,255,255,0.10) inset",
                        }
                      : {
                          height: 52,
                          background: "#F1F5F9",
                        }
                  }
                >
                  <Sparkles className="w-4 h-4"/>
                  {!file ? "Drop your resume to begin" : !agreed ? "Accept terms to continue" : "Upload & Scan Resume"}
                  {canScan && <ArrowRight className="w-4 h-4"/>}
                </motion.button>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 -mt-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>
                  </svg>
                  <span className="text-[11.5px] text-slate-400 font-medium">End-to-end encrypted · never stored · 100% private</span>
                </div>

              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
