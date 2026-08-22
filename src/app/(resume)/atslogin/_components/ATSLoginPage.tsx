"use client";

import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, ArrowRight, Clock, X, UploadCloud, UserRound, Briefcase, GraduationCap, BadgeCheck, Tags, FileCheck2, BookOpenCheck, ShieldCheck, BarChart3, Target, FileWarning, Scissors, TrendingUp, Users, Star } from "lucide-react";
import { FaFilePdf, FaFileWord } from "react-icons/fa";
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
  { n: "02", label: "AI Analysis" },
  { n: "03", label: "Report"  },
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
  onAnalyze: () => void;
  canScan: boolean;
  buttonLabel: string;
}

interface LoadingOverlayProps {
  displayProgress: number;
  loadingPhase: AnalysisPhase | "";
}

// ─── Data ─────────────────────────────────────────────────────────────────────



// ─── Sub-components ───────────────────────────────────────────────────────────



// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyUploadZone({ isDragging, onDragOver, onDragLeave, onDrop, onAnalyze, canScan, buttonLabel }: UploadZoneProps) {
  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <label
        htmlFor="ats-file-upload"
        className={[
          "relative flex flex-col items-center justify-center gap-2.5 rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden",
          "min-h-[300px] border-[1.5px] border-dashed",
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
          <div className="relative grid h-[82px] w-[82px] place-items-center rounded-full bg-blue-50"
            style={{
              boxShadow: "0 0 0 1px rgba(37,87,167,0.12), 0 4px 12px rgba(37,87,167,0.12), 0 12px 32px rgba(37,87,167,0.08)",
            }}
          >
            <Sparkles className="absolute -left-5 top-2 h-4 w-4 text-blue-300" />
            <Sparkles className="absolute -right-5 top-5 h-4 w-4 text-blue-300" />
            <UploadCloud className="h-10 w-10 text-[#2557a7]" strokeWidth={1.8} />
          </div>
        </motion.div>

        <div className="relative z-10 text-center space-y-1">
          <p className="text-[17px] font-black text-slate-900">
            {isDragging ? "Release to upload" : "Drop your resume here"}
          </p>
          <p className="text-[13px] text-slate-500">
            or{" "}
            <span className="text-blue-600 font-semibold">browse files</span>
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[12px] text-slate-400">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-slate-700"><FaFilePdf className="h-4 w-4 text-red-500" />PDF</div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-slate-700"><FaFileWord className="h-4 w-4 text-[#2563d8]" />DOCX</div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-bold text-slate-700"><FaFileWord className="h-4 w-4 text-[#2563d8]" />DOC</div>
        </div>
        <span className="relative z-10 text-[11px] text-slate-500">Max file size: 10MB</span>
        <div className="hidden relative z-10 flex items-center gap-2 text-[12px] text-slate-400">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-600">PDF</span>
          <span>·</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-600">DOCX</span>
          <span>·</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-bold text-slate-600">DOC</span>
          <span>· Max 10MB</span>
        </div>

        <div className="hidden">
          {DROPZONE_INDICATORS.map(({ label, icon }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11.5px] text-slate-500 font-medium">
              <span className="text-slate-400">{icon}</span>
              {label}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAnalyze(); }}
          disabled={!canScan}
          className={`relative z-10 flex h-11 w-[82%] items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${canScan ? "bg-[#2563eb] text-white shadow-md shadow-blue-200" : "bg-blue-100 text-blue-300"}`}
        >
          <UploadCloud className="h-4 w-4" />
          {buttonLabel}
        </button>

        <div className="relative z-10 flex items-center gap-2 text-[10px] font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>End-to-end encrypted</span>
          <span>•</span>
          <span>Never stored</span>
          <span>•</span>
          <span>100% private</span>
        </div>
      </label>
    </div>
  );
}

function UploadZone({ isDragging, onDragOver, onDragLeave, onDrop }: UploadZoneProps) {
  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <label
        htmlFor="ats-file-upload"
        className={[
          "group flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition-all duration-200",
          isDragging
            ? "border-[#2557a7] bg-blue-50"
            : "border-blue-200 bg-white hover:border-[#2557a7] hover:bg-blue-50/30",
        ].join(" ")}
      >
        <motion.div
          animate={isDragging ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="grid h-24 w-24 place-items-center rounded-full border border-blue-100 bg-blue-50 text-[#2557a7] shadow-[0_12px_30px_rgba(37,87,167,0.12)]"
        >
          <UploadCloud className="h-11 w-11" strokeWidth={1.8} />
        </motion.div>

        <div className="mt-7 space-y-2">
          <p className="text-xl font-bold tracking-[-0.02em] text-slate-950 sm:text-2xl">
            {isDragging ? "Release to upload" : "Drop your resume here"}
          </p>
          <p className="text-sm text-slate-500">
            or <span className="font-semibold text-[#2557a7] underline decoration-blue-200 underline-offset-4">browse files</span>
          </p>
        </div>

        <div className="mt-7 inline-flex items-center rounded-xl bg-[#2557a7] px-7 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(37,87,167,0.22)] transition-transform group-hover:-translate-y-0.5">
          <UploadCloud className="mr-2.5 h-5 w-5" />
          Browse resume
        </div>
        <p className="mt-5 text-sm font-medium text-slate-500">PDF, DOCX or DOC</p>
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
    e.target.value = "";
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
    <div className="relative min-h-[calc(100vh-56px)] overflow-x-hidden bg-white py-8 sm:py-12 lg:flex lg:items-center lg:py-16">

      {/* ── Background layers ── */}
      {/* Dot grid */}
      <div className="hidden"
        style={{
          backgroundImage: "radial-gradient(circle,rgba(148,163,184,0.18) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Top bloom */}
      <div className="hidden"
        style={{
          width: 900, height: 480,
          transform: "translateX(-50%) translateY(-30%)",
          background: "radial-gradient(ellipse at center,rgba(37,87,167,0.09) 0%,rgba(37,87,167,0.07) 40%,transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      {/* Bottom-right accent */}
      <div className="hidden"
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
      <div className="relative mx-auto w-full max-w-[1380px] px-5 sm:px-8 lg:px-12">

        {/* ── Badge — above grid so heading aligns with card top ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="hidden"
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

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12 xl:gap-16">

          {/* ── LEFT: Hero content ── */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.36, ease: EASE }}
            className="flex flex-col gap-8"
          >
            {/* Heading */}
            <div>
              <h1 className="mb-4 text-3xl font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-4xl">
                AI Resume Analysis
              </h1>
              <p className="max-w-[300px] text-[15px] leading-7 text-slate-500">
                Upload your resume and get an instant AI-powered analysis with actionable insights.
              </p>
            </div>

            {/* Trusted-user proof */}
            <div className="hidden">
              <div className="flex -space-x-2" aria-hidden="true">
                {["A", "M", "R"].map((initial, index) => (
                  <span key={initial} className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[9px] font-bold text-white ${["bg-rose-400", "bg-slate-700", "bg-amber-500"][index]}`}>{initial}</span>
                ))}
              </div>
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="font-semibold">Trusted by 1M+ Job Seekers</span>
              <span className="text-blue-400">•</span>
              <span className="font-semibold text-[#2557a7]">2.5M+ Resumes Analyzed</span>
            </div>

            {/* What the analysis includes */}
            <div>
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {[
                  [FileCheck2, "Format Check", "Resume readability and structure."],
                  [BookOpenCheck, "Content Scan", "Key skills, experience, and achievements."],
                  [Target, "ATS Compatibility", "Match potential and optimization spots."],
                ].map(([Icon, title, detail]) => (
                  <div key={title as string} className="flex items-start gap-4 py-5">
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2557a7] text-white">
                      <Icon className="h-4 w-4" strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-5 text-slate-900">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden">
                <Sparkles className="h-4 w-4 text-[#2563eb]" />
                <p className="text-sm font-bold text-slate-800">What you’ll receive</p>
              </div>
              <div className="hidden">
                {[
                  [BarChart3, "bg-blue-600", "ATS Compatibility Score", "Know how ATS-friendly your resume is"],
                  [Target, "bg-emerald-500", "Keyword Match Analysis", "See how well you match the job description"],
                  [FileWarning, "bg-amber-500", "Missing Sections", "Identify important gaps in your resume"],
                  [Scissors, "bg-violet-500", "Formatting Review", "Check structure, style & readability"],
                  [Sparkles, "bg-rose-500", "AI Recommendations", "Get AI-powered improvement suggestions"],
                  [TrendingUp, "bg-teal-500", "Resume Improvement Plan", "Actionable steps to boost your score"],
                ].map(([Icon, color, title, detail]) => (
                  <div key={title as string} className="flex items-center gap-3">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${color} text-white`}><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1"><p className="text-[12px] font-bold leading-4 text-slate-800">{title}</p><p className="text-[10px] leading-4 text-slate-500">{detail}</p></div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </div>
                ))}
                <div className="hidden">
                {([
                  { n: "01", title: "Upload Your Resume",  desc: "PDF, DOCX or DOC · up to 10 MB"               },
                  { n: "02", title: "AI Scans Instantly",  desc: "Keywords, format & ATS compatibility checked"  },
                  { n: "03", title: "Get Your Report",     desc: "Score breakdown + prioritised action fixes"     },
                ] as const).map((step) => (
                  <div key={step.n} className="flex items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-600 text-white"><BarChart3 className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1"><p className="text-[12px] font-bold leading-4 text-slate-800">{step.title}</p><p className="text-[10px] leading-4 text-slate-500">{step.desc}</p></div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </div>
                ))}
              </div>
              </div>
            </div>

          </motion.div>

          {/* ── RIGHT: Upload card ── */}
          <div className="relative w-full self-start">
            <div className="hidden"
              style={{
                background: "radial-gradient(ellipse at 50% 60%,rgba(37,87,167,0.13) 0%,transparent 65%)",
                filter: "blur(20px)",
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: 0.06, ease: EASE }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.10)]"
              style={{
                background: "#ffffff",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg,transparent,rgba(37,87,167,0.3) 30%,rgba(37,87,167,0.4) 60%,transparent)" }}
              />

              <div className="flex flex-col gap-5 p-5 sm:p-7">

                {/* Stepper */}
                <div className="flex items-center">
                  {STEPS.map((step, i) => (
                    <Fragment key={step.n}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 tracking-wide"
                          style={i === 0 ? {
                            background: "#2557a7",
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
                        onAnalyze={handleScanResume}
                        canScan={canScan}
                        buttonLabel={!file ? "Analyze My Resume" : !agreed ? "Accept terms to continue" : "Analyze My Resume"}
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

                {file && (
                  <motion.button
                    type="button"
                    onClick={handleScanResume}
                    disabled={!canScan}
                    whileHover={canScan ? { y: -1 } : {}}
                    whileTap={canScan ? { scale: 0.99 } : {}}
                    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${canScan ? "bg-[#2563eb] text-white shadow-md shadow-blue-200" : "bg-blue-100 text-blue-300 cursor-not-allowed"}`}
                  >
                    <UploadCloud className="h-4 w-4" />
                    {!agreed ? "Accept terms to continue" : "Analyze My Resume"}
                  </motion.button>
                )}

                {/* Security note */}
                <div className="hidden">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>
                  </svg>
                  <span className="text-[11.5px] text-slate-400 font-medium">End-to-end encrypted · never stored · 100% private</span>
                </div>

              </div>

              <div className="grid gap-3 border-t border-slate-200 px-5 py-5 text-sm text-slate-500 sm:grid-cols-3 sm:px-7">
                <span className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 shrink-0 text-[#2557a7]" />PDF, DOCX, DOC</span>
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-[#2557a7]" />10MB maximum</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-[#2557a7]" />Encrypted &amp; private</span>
              </div>

              <div className="hidden">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold text-slate-600">Supported formats</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { label: "PDF", badge: "Preferred", Icon: FaFilePdf, color: "text-red-500" },
                      { label: "DOCX", badge: "Recommended", Icon: FaFileWord, color: "text-[#2563d8]" },
                      { label: "DOC", badge: "Supported", Icon: FaFileWord, color: "text-[#2563d8]" },
                    ].map(({ label, badge, Icon, color }) => (
                      <div key={label} className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-2 shadow-sm">
                        <Icon className={`h-7 w-7 ${color}`} aria-hidden="true" />
                        <span className="text-[10px] font-bold text-slate-700">{label}</span>
                        <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-semibold text-blue-600">{badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <ShieldCheck className="mt-0.5 h-9 w-9 shrink-0 text-emerald-600" strokeWidth={1.8} />
                  <div>
                    <p className="text-xs font-bold text-emerald-700">Your data is 100% secure</p>
                    <div className="mt-1 grid gap-1 text-[10px] leading-4 text-slate-500">
                      {["Bank-level encryption (AES-256)", "Files auto-deleted after analysis", "Never shared with anyone", "Private AI processing"].map((item) => (
                        <span key={item} className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0 text-emerald-600" strokeWidth={3} />{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

        </div>

        <div className="hidden">
          {[
            { Icon: Users, value: "2.5M+", label: "Resumes Analyzed", tone: "bg-blue-50 text-[#2563eb]" },
            { Icon: ShieldCheck, value: "98%", label: "ATS Accuracy", tone: "bg-emerald-50 text-emerald-600" },
            { Icon: Clock, value: "~30 Sec", label: "Average Analysis Time", tone: "bg-violet-50 text-violet-500" },
            { Icon: Star, value: "4.9/5", label: "User Rating", tone: "bg-amber-50 text-amber-500" },
          ].map(({ Icon, value, label, tone }) => (
            <div key={label} className="flex items-center gap-3 border-slate-100 sm:border-r sm:pr-4">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="h-4 w-4" /></div>
              <div><p className="text-base font-black text-slate-800">{value}</p><p className="text-[10px] text-slate-500">{label}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
